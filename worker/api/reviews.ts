import { Hono } from 'hono';
import { reviewSchema } from '../../shared/schemas';
import type { ProductReview, ReviewSummary } from '../../shared/types';
import { newId } from '../lib/crypto';
import { fail, ok, zodFieldErrors } from '../lib/response';
import type { AppBindings } from '../types';

export const reviewsApi = new Hono<AppBindings>();

function mapReview(row: Record<string, unknown>, userId?: string): ProductReview {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    authorName: String(row.author_name),
    rating: Number(row.rating),
    title: String(row.title),
    message: String(row.message),
    helpfulCount: Number(row.helpful_count ?? 0),
    helpfulByMe: Boolean(row.helpful_by_me),
    isOwn: Boolean(userId && row.user_id === userId),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

reviewsApi.get('/products/:productId/reviews', async (c) => {
  const product = await c.env.DB.prepare('SELECT id FROM products WHERE id = ?')
    .bind(c.req.param('productId'))
    .first();
  if (!product) return fail(c, 404, 'PRODUCT_NOT_FOUND', 'That product could not be found.');
  const page = Math.max(1, Number(c.req.query('page')) || 1);
  const pageSize = 3;
  const rating = Number(c.req.query('rating')) || 0;
  const sort = c.req.query('sort') ?? 'newest';
  const order: Record<string, string> = {
    newest: 'r.created_at DESC, r.id',
    oldest: 'r.created_at ASC, r.id',
    highest: 'r.rating DESC, r.created_at DESC',
    lowest: 'r.rating ASC, r.created_at DESC',
    helpful: 'helpful_count DESC, r.created_at DESC',
  };
  const where = rating ? 'AND r.rating = ?' : '';
  const bindings: unknown[] = [c.req.param('productId')];
  if (rating) bindings.push(rating);
  const userId = c.get('user')?.id;
  const [rows, aggregate] = await Promise.all([
    c.env.DB.prepare(
      `SELECT r.*,
        (SELECT count(*) FROM review_helpful_votes h WHERE h.review_id = r.id) helpful_count,
        ${userId ? 'EXISTS(SELECT 1 FROM review_helpful_votes mine WHERE mine.review_id = r.id AND mine.user_id = ?) ' : '0 '} helpful_by_me
       FROM product_reviews r WHERE r.product_id = ? ${where}
       ORDER BY ${order[sort] ?? order.newest} LIMIT ? OFFSET ?`,
    )
      .bind(...(userId ? [userId, ...bindings] : bindings), pageSize, (page - 1) * pageSize)
      .all<Record<string, unknown>>(),
    c.env.DB.prepare(
      `SELECT count(*) total, coalesce(avg(rating), 0) average,
       sum(CASE WHEN rating = 1 THEN 1 ELSE 0 END) one,
       sum(CASE WHEN rating = 2 THEN 1 ELSE 0 END) two,
       sum(CASE WHEN rating = 3 THEN 1 ELSE 0 END) three,
       sum(CASE WHEN rating = 4 THEN 1 ELSE 0 END) four,
       sum(CASE WHEN rating = 5 THEN 1 ELSE 0 END) five
       FROM product_reviews WHERE product_id = ?`,
    )
      .bind(c.req.param('productId'))
      .first<Record<string, number>>(),
  ]);
  const totalForFilter = await c.env.DB.prepare(
    `SELECT count(*) total FROM product_reviews r WHERE r.product_id = ? ${where}`,
  )
    .bind(...bindings)
    .first<{ total: number }>();
  const summary: ReviewSummary = {
    average: Number(aggregate?.average ?? 0),
    total: Number(aggregate?.total ?? 0),
    byRating: {
      1: Number(aggregate?.one ?? 0),
      2: Number(aggregate?.two ?? 0),
      3: Number(aggregate?.three ?? 0),
      4: Number(aggregate?.four ?? 0),
      5: Number(aggregate?.five ?? 0),
    },
  };
  return ok(
    c,
    { reviews: rows.results.map((row) => mapReview(row, userId)), summary },
    {
      pagination: {
        page,
        pageSize,
        total: totalForFilter?.total ?? 0,
        pages: Math.ceil((totalForFilter?.total ?? 0) / pageSize),
      },
    },
  );
});

reviewsApi.post('/products/:productId/reviews', async (c) => {
  const user = c.get('user');
  if (!user) return fail(c, 401, 'AUTH_REQUIRED', 'Sign in to write a review.');
  if (c.req.header('X-QA-Review-Failure') === '1')
    return fail(
      c,
      500,
      'REVIEW_SUBMISSION_FAILED',
      'QA Lab simulated a review submission failure.',
    );
  if (c.req.header('X-QA-Duplicate-Submission') === '1')
    return fail(c, 409, 'DUPLICATE_SUBMISSION', 'QA Lab simulated a duplicate review.');
  const parsed = reviewSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check your review.',
      zodFieldErrors(parsed.error.issues),
    );
  const product = await c.env.DB.prepare('SELECT id FROM products WHERE id = ?')
    .bind(c.req.param('productId'))
    .first();
  if (!product) return fail(c, 404, 'PRODUCT_NOT_FOUND', 'That product could not be found.');
  const existing = await c.env.DB.prepare(
    'SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?',
  )
    .bind(c.req.param('productId'), user.id)
    .first();
  if (existing) return fail(c, 409, 'REVIEW_EXISTS', 'You already reviewed this product.');
  const id = newId();
  await c.env.DB.prepare(
    `INSERT INTO product_reviews (id, product_id, user_id, author_name, rating, title, message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      c.req.param('productId'),
      user.id,
      `${user.firstName} ${user.lastName.slice(0, 1)}.`,
      parsed.data.rating,
      parsed.data.title,
      parsed.data.message,
    )
    .run();
  return ok(c, { id, created: true });
});

reviewsApi.patch('/reviews/:id', async (c) => {
  const user = c.get('user');
  if (!user) return fail(c, 401, 'AUTH_REQUIRED', 'Sign in to edit a review.');
  if (c.req.header('X-QA-Review-Failure') === '1')
    return fail(
      c,
      500,
      'REVIEW_SUBMISSION_FAILED',
      'QA Lab simulated a review submission failure.',
    );
  const parsed = reviewSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check your review.',
      zodFieldErrors(parsed.error.issues),
    );
  const result = await c.env.DB.prepare(
    `UPDATE product_reviews SET rating = ?, title = ?, message = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
  )
    .bind(parsed.data.rating, parsed.data.title, parsed.data.message, c.req.param('id'), user.id)
    .run();
  if (!result.meta.changes)
    return fail(c, 404, 'REVIEW_NOT_FOUND', 'That review could not be edited.');
  return ok(c, { updated: true });
});

reviewsApi.delete('/reviews/:id', async (c) => {
  const user = c.get('user');
  if (!user) return fail(c, 401, 'AUTH_REQUIRED', 'Sign in to delete a review.');
  const result = await c.env.DB.prepare('DELETE FROM product_reviews WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.id)
    .run();
  if (!result.meta.changes)
    return fail(c, 404, 'REVIEW_NOT_FOUND', 'That review could not be deleted.');
  return ok(c, { deleted: true });
});

reviewsApi.post('/reviews/:id/helpful', async (c) => {
  const user = c.get('user');
  if (!user) return fail(c, 401, 'AUTH_REQUIRED', 'Sign in to mark a review helpful.');
  const review = await c.env.DB.prepare('SELECT id FROM product_reviews WHERE id = ?')
    .bind(c.req.param('id'))
    .first();
  if (!review) return fail(c, 404, 'REVIEW_NOT_FOUND', 'That review could not be found.');
  const existing = await c.env.DB.prepare(
    'SELECT review_id FROM review_helpful_votes WHERE review_id = ? AND user_id = ?',
  )
    .bind(c.req.param('id'), user.id)
    .first();
  if (existing)
    await c.env.DB.prepare('DELETE FROM review_helpful_votes WHERE review_id = ? AND user_id = ?')
      .bind(c.req.param('id'), user.id)
      .run();
  else
    await c.env.DB.prepare('INSERT INTO review_helpful_votes (review_id, user_id) VALUES (?, ?)')
      .bind(c.req.param('id'), user.id)
      .run();
  return ok(c, { helpful: !existing });
});
