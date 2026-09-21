import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { calculateTotals } from '../../shared/lib/money';
import type { Cart, User } from '../../shared/types';
import { newId } from '../lib/crypto';
import type { AppBindings } from '../types';
import { getProductsByIds } from './catalogue';

const GUEST_COOKIE = 'tm_guest';

export async function ensureCart(c: Context<AppBindings>, user: User | null) {
  if (user) {
    const existing = await c.env.DB.prepare('SELECT id FROM carts WHERE user_id = ?')
      .bind(user.id)
      .first<{ id: string }>();
    if (existing) return existing.id;
    const id = newId();
    await c.env.DB.prepare('INSERT INTO carts (id, user_id) VALUES (?, ?)').bind(id, user.id).run();
    return id;
  }
  let token = getCookie(c, GUEST_COOKIE);
  if (token) {
    const existing = await c.env.DB.prepare('SELECT id FROM carts WHERE guest_token = ?')
      .bind(token)
      .first<{ id: string }>();
    if (existing) return existing.id;
  }
  token = newId();
  const id = newId();
  await c.env.DB.prepare('INSERT INTO carts (id, guest_token) VALUES (?, ?)').bind(id, token).run();
  setCookie(c, GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: c.env.APP_ENV === 'production' && new URL(c.req.url).protocol === 'https:',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return id;
}

export async function readCart(db: D1Database, cartId: string): Promise<Cart> {
  const rows = await db
    .prepare(
      `SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity
       FROM cart_items ci WHERE ci.cart_id = ? ORDER BY ci.created_at`,
    )
    .bind(cartId)
    .all<any>();
  const products = await getProductsByIds(db, [
    ...new Set(rows.results.map((row) => String(row.product_id))),
  ]);
  const productMap = new Map(products.map((product) => [product.id, product]));
  const items = rows.results.flatMap((row) => {
    const product = productMap.get(row.product_id);
    const variant = product?.variants.find((item) => item.id === row.variant_id);
    return product && variant
      ? [
          {
            id: row.id,
            productId: row.product_id,
            variantId: row.variant_id,
            quantity: row.quantity,
            product,
            variant,
          },
        ]
      : [];
  });
  return {
    id: cartId,
    items,
    totals: calculateTotals(
      items.map((item) => ({ pricePaise: item.product.pricePaise, quantity: item.quantity })),
    ),
  };
}

export async function mergeGuestCart(c: Context<AppBindings>, userId: string) {
  const token = getCookie(c, GUEST_COOKIE);
  if (!token) return;
  const guestCart = await c.env.DB.prepare('SELECT id FROM carts WHERE guest_token = ?')
    .bind(token)
    .first<{ id: string }>();
  if (!guestCart) return;
  let userCart = await c.env.DB.prepare('SELECT id FROM carts WHERE user_id = ?')
    .bind(userId)
    .first<{ id: string }>();
  if (!userCart) {
    userCart = { id: newId() };
    await c.env.DB.prepare('INSERT INTO carts (id, user_id) VALUES (?, ?)')
      .bind(userCart.id, userId)
      .run();
  }
  const lines = await c.env.DB.prepare('SELECT * FROM cart_items WHERE cart_id = ?')
    .bind(guestCart.id)
    .all<any>();
  const operations = lines.results.map((line) =>
    c.env.DB.prepare(
      `INSERT INTO cart_items (id, cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(cart_id, product_id, variant_id) DO UPDATE SET quantity = min(20, quantity + excluded.quantity), updated_at = CURRENT_TIMESTAMP`,
    ).bind(newId(), userCart!.id, line.product_id, line.variant_id, line.quantity),
  );
  operations.push(c.env.DB.prepare('DELETE FROM carts WHERE id = ?').bind(guestCart.id));
  await c.env.DB.batch(operations);
  deleteCookie(c, GUEST_COOKIE, { path: '/' });
}
