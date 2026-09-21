import { Hono } from 'hono';
import { ensureCart } from '../repositories/cart';
import { ok } from '../lib/response';
import type { AppBindings } from '../types';

export const qaApi = new Hono<AppBindings>();

qaApi.post('/reset', async (c) => {
  const user = c.get('user');
  const cartId = await ensureCart(c, user);
  const operations: D1PreparedStatement[] = [
    c.env.DB.prepare('DELETE FROM cart_items WHERE cart_id = ?').bind(cartId),
  ];
  if (user) {
    const items = await c.env.DB.prepare(
      `SELECT oi.variant_id, oi.product_id, sum(oi.quantity) quantity FROM order_items oi
       JOIN orders o ON o.id = oi.order_id WHERE o.user_id = ? GROUP BY oi.variant_id, oi.product_id`,
    )
      .bind(user.id)
      .all<any>();
    items.results.forEach((item) => {
      operations.push(
        c.env.DB.prepare(
          'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
        ).bind(item.quantity, item.variant_id),
        c.env.DB.prepare(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        ).bind(item.quantity, item.product_id),
      );
    });
    operations.push(
      c.env.DB.prepare('DELETE FROM idempotency_keys WHERE user_id = ?').bind(user.id),
      c.env.DB.prepare('DELETE FROM orders WHERE user_id = ?').bind(user.id),
    );
  }
  await c.env.DB.batch(operations);
  return ok(c, { reset: true });
});
