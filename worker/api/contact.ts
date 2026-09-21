import { Hono } from 'hono';
import { contactSchema } from '../../shared/schemas';
import { newId } from '../lib/crypto';
import { fail, ok, zodFieldErrors } from '../lib/response';
import type { AppBindings } from '../types';

export const contactApi = new Hono<AppBindings>();

contactApi.post('/contact', async (c) => {
  const parsed = contactSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check the contact form.',
      zodFieldErrors(parsed.error.issues),
    );
  const value = parsed.data;
  const category = await c.env.DB.prepare('SELECT id FROM categories WHERE id = ?')
    .bind(value.categoryId)
    .first();
  if (!category) return fail(c, 400, 'INVALID_CATEGORY', 'Select a valid category.');
  if (value.productId) {
    const product = await c.env.DB.prepare(
      'SELECT id FROM products WHERE id = ? AND category_id = ?',
    )
      .bind(value.productId, value.categoryId)
      .first();
    if (!product)
      return fail(c, 400, 'INVALID_PRODUCT', 'Select a product from the chosen category.');
  }
  const id = newId();
  await c.env.DB.prepare(
    'INSERT INTO contact_messages (id, category_id, product_id, email, subject, message) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, value.categoryId, value.productId || null, value.email, value.subject, value.message)
    .run();
  return ok(c, { id, message: 'Thanks — your demo message has been saved.' });
});
