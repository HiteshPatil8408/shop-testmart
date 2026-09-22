import { Hono } from 'hono';
import { cartItemSchema, cartUpdateSchema } from '../../shared/schemas';
import { ensureCart, readCart } from '../repositories/cart';
import { fail, ok, zodFieldErrors } from '../lib/response';
import { newId } from '../lib/crypto';
import type { AppBindings } from '../types';

export const cartApi = new Hono<AppBindings>();

cartApi.get('/', async (c) => {
  const cartId = await ensureCart(c, c.get('user'));
  const cart = await readCart(c.env.DB, cartId);
  if (c.req.header('X-QA-Price-Changed') === '1')
    cart.items.forEach((item) => {
      item.product.pricePaise += 25_000;
    });
  if (c.req.header('X-QA-Stock-Changed') === '1')
    cart.items.forEach((item) => {
      item.variant.stock = Math.max(0, item.quantity - 1);
    });
  return ok(c, cart);
});

cartApi.post('/items', async (c) => {
  const parsed = cartItemSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check the cart item.',
      zodFieldErrors(parsed.error.issues),
    );
  const variant = await c.env.DB.prepare(
    `SELECT v.id, v.stock_quantity, v.product_id FROM product_variants v
     JOIN products p ON p.id = v.product_id WHERE v.id = ? AND p.id = ?`,
  )
    .bind(parsed.data.variantId, parsed.data.productId)
    .first<any>();
  if (!variant) return fail(c, 404, 'VARIANT_NOT_FOUND', 'Select an available product colour.');
  if (c.req.header('X-QA-Low-Stock') === '1')
    variant.stock_quantity = Math.min(1, variant.stock_quantity);
  if (parsed.data.quantity > variant.stock_quantity)
    return fail(c, 409, 'OUT_OF_STOCK', 'The requested quantity is unavailable.');
  const cartId = await ensureCart(c, c.get('user'));
  const existing = await c.env.DB.prepare(
    'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ?',
  )
    .bind(cartId, parsed.data.productId, parsed.data.variantId)
    .first<any>();
  const nextQuantity = (existing?.quantity ?? 0) + parsed.data.quantity;
  if (nextQuantity > variant.stock_quantity || nextQuantity > 20)
    return fail(c, 409, 'OUT_OF_STOCK', 'The requested quantity is unavailable.');
  if (existing) {
    await c.env.DB.prepare(
      'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    )
      .bind(nextQuantity, existing.id)
      .run();
  } else {
    await c.env.DB.prepare(
      'INSERT INTO cart_items (id, cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(newId(), cartId, parsed.data.productId, parsed.data.variantId, parsed.data.quantity)
      .run();
  }
  return ok(c, await readCart(c.env.DB, cartId));
});

cartApi.patch('/items/:itemId', async (c) => {
  const parsed = cartUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check the cart update.',
      zodFieldErrors(parsed.error.issues),
    );
  const cartId = await ensureCart(c, c.get('user'));
  const line = await c.env.DB.prepare('SELECT * FROM cart_items WHERE id = ? AND cart_id = ?')
    .bind(c.req.param('itemId'), cartId)
    .first<any>();
  if (!line) return fail(c, 404, 'CART_ITEM_NOT_FOUND', 'That cart item could not be found.');
  const variantId = parsed.data.variantId ?? line.variant_id;
  const quantity = parsed.data.quantity ?? line.quantity;
  const variant = await c.env.DB.prepare(
    'SELECT id, stock_quantity FROM product_variants WHERE id = ? AND product_id = ?',
  )
    .bind(variantId, line.product_id)
    .first<any>();
  if (!variant) return fail(c, 400, 'INVALID_VARIANT', 'Select a valid colour.');
  if (quantity > variant.stock_quantity)
    return fail(c, 409, 'OUT_OF_STOCK', 'The requested quantity is unavailable.');
  const duplicate = await c.env.DB.prepare(
    'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ? AND id != ?',
  )
    .bind(cartId, line.product_id, variantId, line.id)
    .first<any>();
  if (duplicate) {
    const mergedQuantity = duplicate.quantity + quantity;
    if (mergedQuantity > variant.stock_quantity || mergedQuantity > 20)
      return fail(c, 409, 'OUT_OF_STOCK', 'The merged quantity is unavailable.');
    await c.env.DB.batch([
      c.env.DB.prepare(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ).bind(mergedQuantity, duplicate.id),
      c.env.DB.prepare('DELETE FROM cart_items WHERE id = ?').bind(line.id),
    ]);
  } else {
    await c.env.DB.prepare(
      'UPDATE cart_items SET variant_id = ?, quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    )
      .bind(variantId, quantity, line.id)
      .run();
  }
  return ok(c, await readCart(c.env.DB, cartId));
});

cartApi.delete('/items/:itemId', async (c) => {
  const cartId = await ensureCart(c, c.get('user'));
  const result = await c.env.DB.prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?')
    .bind(c.req.param('itemId'), cartId)
    .run();
  if (!result.meta.changes)
    return fail(c, 404, 'CART_ITEM_NOT_FOUND', 'That cart item could not be found.');
  return ok(c, await readCart(c.env.DB, cartId));
});

cartApi.delete('/', async (c) => {
  const cartId = await ensureCart(c, c.get('user'));
  await c.env.DB.prepare('DELETE FROM cart_items WHERE cart_id = ?').bind(cartId).run();
  return ok(c, await readCart(c.env.DB, cartId));
});
