import { Hono } from 'hono';
import { calculateTotals } from '../../shared/lib/money';
import { APP_CONFIG } from '../../shared/config';
import { orderSchema } from '../../shared/schemas';
import { newId, sha256 } from '../lib/crypto';
import { fail, ok, zodFieldErrors } from '../lib/response';
import { ensureCart, readCart } from '../repositories/cart';
import type { AppBindings } from '../types';

export const ordersApi = new Hono<AppBindings>();

async function mapOrder(db: D1Database, row: any) {
  const items = await db
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at')
    .bind(row.id)
    .all<any>();
  return {
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    deliveryMethod: row.delivery_method,
    address: JSON.parse(row.delivery_address_json),
    subtotalPaise: row.subtotal_paise,
    shippingPaise: row.shipping_paise,
    taxPaise: row.tax_paise,
    totalPaise: row.total_paise,
    createdAt: row.created_at,
    deliveryDate: row.delivery_date,
    deliveryTimeSlot: row.delivery_time_slot,
    items: items.results.map((item) => ({
      id: item.id,
      productName: item.product_name,
      productSlug: item.product_slug,
      variantColour: item.variant_colour,
      quantity: item.quantity,
      unitPricePaise: item.unit_price_paise,
      image: item.image_url,
    })),
  };
}

ordersApi.post('/checkout/preview', async (c) => {
  const input = (await c.req.json().catch(() => ({}))) as { deliveryMethod?: string };
  const deliveryMethod = ['standard', 'express', 'pickup'].includes(input.deliveryMethod ?? '')
    ? (input.deliveryMethod as 'standard' | 'express' | 'pickup')
    : 'standard';
  const cartId = await ensureCart(c, c.get('user'));
  const cart = await readCart(c.env.DB, cartId);
  if (!cart.items.length)
    return fail(c, 409, 'EMPTY_CART', 'Add at least one product before checkout.');
  const unavailable = cart.items.find((item) => item.quantity > item.variant.stock);
  if (unavailable)
    return fail(c, 409, 'OUT_OF_STOCK', `${unavailable.product.name} no longer has enough stock.`);
  const totals = calculateTotals(
    cart.items.map((item) => ({ pricePaise: item.product.pricePaise, quantity: item.quantity })),
    deliveryMethod,
  );
  return ok(c, { cart, deliveryMethod, totals });
});

ordersApi.post('/orders', async (c) => {
  const idempotencyKey = c.req.header('Idempotency-Key');
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128)
    return fail(c, 400, 'IDEMPOTENCY_KEY_REQUIRED', 'A valid Idempotency-Key header is required.');
  const parsed = orderSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check the checkout details.',
      zodFieldErrors(parsed.error.issues),
    );
  const user = c.get('user')!;
  const requestHash = await sha256(JSON.stringify(parsed.data));
  const existing = await c.env.DB.prepare(
    `SELECT i.request_hash, i.response_json FROM idempotency_keys i WHERE i.id = ? AND i.user_id = ?`,
  )
    .bind(idempotencyKey, user.id)
    .first<any>();
  if (existing) {
    if (existing.request_hash !== requestHash)
      return fail(
        c,
        409,
        'IDEMPOTENCY_CONFLICT',
        'That idempotency key was used for a different checkout.',
      );
    return ok(c, JSON.parse(existing.response_json), { duplicate: true });
  }
  const cartId = await ensureCart(c, user);
  const cart = await readCart(c.env.DB, cartId);
  if (!cart.items.length) return fail(c, 409, 'EMPTY_CART', 'Your cart is empty.');
  const unavailable = cart.items.find((item) => item.quantity > item.variant.stock);
  if (unavailable)
    return fail(c, 409, 'OUT_OF_STOCK', `${unavailable.product.name} no longer has enough stock.`);
  const { address, deliveryMethod, deliveryDate, deliveryTimeSlot, payment } = parsed.data;
  if (Boolean(deliveryDate) !== Boolean(deliveryTimeSlot))
    return fail(
      c,
      400,
      'DELIVERY_SELECTION_INCOMPLETE',
      'Choose both a delivery date and time slot.',
    );
  if (deliveryDate && deliveryTimeSlot) {
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const selectedUtc = Date.parse(`${deliveryDate}T00:00:00Z`);
    const minimumUtc = todayUtc + 2 * 86_400_000;
    const offset = Math.round((selectedUtc - minimumUtc) / 86_400_000);
    const day = new Date(selectedUtc).getUTCDay();
    if (
      selectedUtc < minimumUtc ||
      selectedUtc > minimumUtc + 30 * 86_400_000 ||
      day === 0 ||
      offset === 4 ||
      offset === 11
    )
      return fail(
        c,
        409,
        'DELIVERY_SLOT_UNAVAILABLE',
        'That delivery date is unavailable. Choose another date.',
      );
  }
  if (payment.type === 'card') {
    const now = new Date();
    if (payment.expiryYear === now.getUTCFullYear() && payment.expiryMonth < now.getUTCMonth() + 1)
      return fail(c, 400, 'CARD_EXPIRED', 'Use a future test-card expiry date.');
    if (payment.cardNumber === '4000000000000002' || c.req.header('X-QA-Payment-Decline') === '1')
      return fail(c, 402, 'PAYMENT_DECLINED', 'The simulated test-card payment was declined.');
  }
  const totals = calculateTotals(
    cart.items.map((item) => ({ pricePaise: item.product.pricePaise, quantity: item.quantity })),
    deliveryMethod,
  );
  const orderId = newId();
  const keyFragment = idempotencyKey
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()
    .padEnd(8, '0');
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const orderNumber = `${APP_CONFIG.shortName}-${date}-${keyFragment}`;
  const paymentStatus = payment.type === 'cod' ? 'pending' : 'paid';
  const transactionReference = `SIM-${date}-${keyFragment}`;
  const result = { orderNumber, status: 'confirmed', paymentStatus, totals };
  const operations: D1PreparedStatement[] = [
    c.env.DB.prepare(
      `INSERT INTO orders (id, order_number, user_id, status, payment_status, delivery_method, delivery_address_json,
       subtotal_paise, shipping_paise, tax_paise, total_paise, delivery_date, delivery_time_slot)
       VALUES (?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      orderId,
      orderNumber,
      user.id,
      paymentStatus,
      deliveryMethod,
      JSON.stringify(address),
      totals.subtotalPaise,
      totals.shippingPaise,
      totals.taxPaise,
      totals.totalPaise,
      deliveryDate ?? null,
      deliveryTimeSlot ?? null,
    ),
  ];
  cart.items.forEach((item) => {
    operations.push(
      c.env.DB.prepare(
        `INSERT INTO order_items (id, order_id, product_id, product_slug, product_name, variant_id, variant_colour, quantity, unit_price_paise, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        newId(),
        orderId,
        item.product.id,
        item.product.slug,
        item.product.name,
        item.variant.id,
        item.variant.colour,
        item.quantity,
        item.product.pricePaise,
        item.variant.images[0] ?? item.product.images[0],
      ),
      c.env.DB.prepare(
        'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
      ).bind(item.quantity, item.variant.id),
      c.env.DB.prepare(
        'UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ).bind(item.quantity, item.product.id),
    );
  });
  operations.push(
    c.env.DB.prepare(
      `INSERT INTO payments (id, order_id, payment_type, card_brand, last_four, transaction_reference, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      newId(),
      orderId,
      payment.type,
      payment.type === 'card' ? 'Visa test' : null,
      payment.type === 'card' ? payment.cardNumber.slice(-4) : null,
      transactionReference,
      paymentStatus,
    ),
    c.env.DB.prepare('DELETE FROM cart_items WHERE cart_id = ?').bind(cartId),
    c.env.DB.prepare(
      'INSERT INTO idempotency_keys (id, user_id, order_id, request_hash, response_json) VALUES (?, ?, ?, ?, ?)',
    ).bind(idempotencyKey, user.id, orderId, requestHash, JSON.stringify(result)),
  );
  try {
    await c.env.DB.batch(operations);
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('check constraint'))
      return fail(
        c,
        409,
        'OUT_OF_STOCK',
        'Stock changed while the order was being created. Review your cart and try again.',
      );
    throw error;
  }
  return ok(c, result);
});

ordersApi.get('/orders', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
  )
    .bind(c.get('user')!.id)
    .all<any>();
  return ok(c, await Promise.all(rows.results.map((row) => mapOrder(c.env.DB, row))));
});

ordersApi.get('/orders/:orderNumber', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?')
    .bind(c.req.param('orderNumber'), c.get('user')!.id)
    .first<any>();
  if (!row) return fail(c, 404, 'ORDER_NOT_FOUND', 'That order could not be found.');
  return ok(c, await mapOrder(c.env.DB, row));
});

ordersApi.post('/orders/:orderNumber/cancel', async (c) => {
  const result = await c.env.DB.prepare(
    `UPDATE orders SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE order_number = ? AND user_id = ? AND status IN ('confirmed', 'packed')`,
  )
    .bind(c.req.param('orderNumber'), c.get('user')!.id)
    .run();
  if (!result.meta.changes)
    return fail(
      c,
      409,
      'ORDER_NOT_CANCELLABLE',
      'Only confirmed or packed demo orders can be cancelled.',
    );
  return ok(c, { orderNumber: c.req.param('orderNumber'), status: 'cancelled' });
});

ordersApi.get('/orders/:orderNumber/tracking', async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT id, created_at FROM orders WHERE order_number = ? AND user_id = ?',
  )
    .bind(c.req.param('orderNumber'), c.get('user')!.id)
    .first<{ id: string; created_at: string }>();
  if (!row) return fail(c, 404, 'ORDER_NOT_FOUND', 'That order could not be found.');
  const statuses = [
    ['confirmed', 'Order confirmed'],
    ['packed', 'Packed at demo warehouse'],
    ['shipped', 'Shipped with demo courier'],
    ['out_for_delivery', 'Out for delivery'],
    ['delivered', 'Delivered'],
  ] as const;
  const base = new Date(row.created_at).getTime();
  const events = statuses.map(([status, label], index) => ({
    id: `${row.id}-${index + 1}`,
    sequence: index + 1,
    status,
    label,
    occurredAt: new Date(base + index * 3_600_000).toISOString(),
  }));
  return ok(c, {
    // The intentionally shuffled and duplicated delivery lets clients prove idempotent ordering.
    events: [events[0], events[2], events[1], events[2], events[3], events[4]],
  });
});
