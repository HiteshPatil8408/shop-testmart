import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { APP_CONFIG } from '../../shared/config';
import {
  addressSchema,
  changePasswordSchema,
  updateSecurityQuestionSchema,
} from '../../shared/schemas';
import { hashPassword, newId, normalizeSecurityAnswer, verifyPassword } from '../lib/crypto';
import { fail, ok, zodFieldErrors } from '../lib/response';
import { COOKIE_NAME } from '../middleware/auth';
import type { AppBindings } from '../types';

export const accountApi = new Hono<AppBindings>();
const passwordAttempts = new Map<string, number[]>();

function passwordChangeRateLimited(key: string) {
  const now = Date.now();
  const recent = (passwordAttempts.get(key) ?? []).filter((time) => now - time < 60_000);
  recent.push(now);
  passwordAttempts.set(key, recent);
  return recent.length > 8;
}

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/),
  marketingOptIn: z.boolean(),
});

function mapAddress(row: any) {
  return {
    id: row.id,
    label: row.label,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    street: row.street,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: Boolean(row.is_default),
  };
}

accountApi.get('/profile', (c) => ok(c, c.get('user')));

accountApi.patch('/profile', async (c) => {
  const parsed = profileSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check your profile.',
      zodFieldErrors(parsed.error.issues),
    );
  const value = parsed.data;
  await c.env.DB.prepare(
    'UPDATE users SET first_name = ?, last_name = ?, phone = ?, marketing_opt_in = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  )
    .bind(
      value.firstName,
      value.lastName,
      value.phone,
      value.marketingOptIn ? 1 : 0,
      c.get('user')!.id,
    )
    .run();
  return ok(c, { ...c.get('user')!, ...value });
});

accountApi.post('/account/password', async (c) => {
  const user = c.get('user')!;
  const ip = c.req.header('CF-Connecting-IP') ?? 'local';
  if (passwordChangeRateLimited(`${user.id}:${ip}`))
    return fail(c, 429, 'RATE_LIMITED', 'Please wait before trying again.');
  if (user.email.toLowerCase() === APP_CONFIG.demoEmail.toLowerCase())
    return fail(
      c,
      403,
      'DEMO_PASSWORD_IMMUTABLE',
      'The public demo account password cannot be changed.',
    );
  const parsed = changePasswordSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check the password fields.',
      zodFieldErrors(parsed.error.issues),
    );
  const credentials = await c.env.DB.prepare(
    'SELECT password_hash, password_salt FROM users WHERE id = ?',
  )
    .bind(user.id)
    .first<{ password_hash: string; password_salt: string }>();
  if (
    !credentials ||
    !(await verifyPassword(
      parsed.data.currentPassword,
      credentials.password_salt,
      credentials.password_hash,
    ))
  )
    return fail(c, 400, 'CURRENT_PASSWORD_INCORRECT', 'The current password is incorrect.', {
      currentPassword: 'The current password is incorrect.',
    });

  const next = await hashPassword(parsed.data.password);
  const cookie = getCookie(c, COOKIE_NAME);
  const separator = cookie?.lastIndexOf('.') ?? -1;
  const currentSessionId = separator > 0 ? cookie!.slice(0, separator) : '';
  await c.env.DB.batch([
    c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).bind(next.hash, next.salt, user.id),
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?').bind(
      user.id,
      currentSessionId,
    ),
  ]);
  return ok(c, { changed: true });
});

accountApi.post('/account/security-question', async (c) => {
  const user = c.get('user')!;
  const ip = c.req.header('CF-Connecting-IP') ?? 'local';
  if (passwordChangeRateLimited(`security-question:${user.id}:${ip}`))
    return fail(c, 429, 'RATE_LIMITED', 'Please wait before trying again.');
  if (user.email.toLowerCase() === APP_CONFIG.demoEmail.toLowerCase())
    return fail(
      c,
      403,
      'DEMO_SECURITY_IMMUTABLE',
      'The public demo account security settings cannot be changed.',
    );
  const parsed = updateSecurityQuestionSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check the security-question fields.',
      zodFieldErrors(parsed.error.issues),
    );
  const credentials = await c.env.DB.prepare(
    'SELECT password_hash, password_salt FROM users WHERE id = ?',
  )
    .bind(user.id)
    .first<{ password_hash: string; password_salt: string }>();
  if (
    !credentials ||
    !(await verifyPassword(
      parsed.data.currentPassword,
      credentials.password_salt,
      credentials.password_hash,
    ))
  )
    return fail(c, 400, 'CURRENT_PASSWORD_INCORRECT', 'The current password is incorrect.', {
      currentPassword: 'The current password is incorrect.',
    });

  const answer = await hashPassword(normalizeSecurityAnswer(parsed.data.securityAnswer));
  await c.env.DB.prepare(
    `UPDATE users
     SET security_question_id = ?, security_answer_hash = ?, security_answer_salt = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
  )
    .bind(parsed.data.securityQuestionId, answer.hash, answer.salt, user.id)
    .run();
  return ok(c, { updated: true });
});

accountApi.get('/addresses', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at',
  )
    .bind(c.get('user')!.id)
    .all<any>();
  return ok(c, rows.results.map(mapAddress));
});

accountApi.post('/addresses', async (c) => {
  const parsed = addressSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check the address.',
      zodFieldErrors(parsed.error.issues),
    );
  const id = newId();
  const v = parsed.data;
  const operations = [];
  if (v.isDefault)
    operations.push(
      c.env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').bind(
        c.get('user')!.id,
      ),
    );
  operations.push(
    c.env.DB.prepare(
      `INSERT INTO addresses (id, user_id, label, first_name, last_name, phone, street, city, state, postal_code, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      c.get('user')!.id,
      v.label,
      v.firstName,
      v.lastName,
      v.phone,
      v.street,
      v.city,
      v.state,
      v.postalCode,
      v.country,
      v.isDefault ? 1 : 0,
    ),
  );
  await c.env.DB.batch(operations);
  return ok(c, { id, ...v });
});

accountApi.patch('/addresses/:id', async (c) => {
  const parsed = addressSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check the address.',
      zodFieldErrors(parsed.error.issues),
    );
  const existing = await c.env.DB.prepare('SELECT id FROM addresses WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), c.get('user')!.id)
    .first();
  if (!existing) return fail(c, 404, 'ADDRESS_NOT_FOUND', 'That address could not be found.');
  const v = parsed.data;
  const operations = [];
  if (v.isDefault)
    operations.push(
      c.env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').bind(
        c.get('user')!.id,
      ),
    );
  operations.push(
    c.env.DB.prepare(
      `UPDATE addresses SET label=?, first_name=?, last_name=?, phone=?, street=?, city=?, state=?, postal_code=?, country=?, is_default=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=? AND user_id=?`,
    ).bind(
      v.label,
      v.firstName,
      v.lastName,
      v.phone,
      v.street,
      v.city,
      v.state,
      v.postalCode,
      v.country,
      v.isDefault ? 1 : 0,
      c.req.param('id'),
      c.get('user')!.id,
    ),
  );
  await c.env.DB.batch(operations);
  return ok(c, { id: c.req.param('id'), ...v });
});

accountApi.delete('/addresses/:id', async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT is_default FROM addresses WHERE id = ? AND user_id = ?',
  )
    .bind(c.req.param('id'), c.get('user')!.id)
    .first<any>();
  if (!row) return fail(c, 404, 'ADDRESS_NOT_FOUND', 'That address could not be found.');
  const count = await c.env.DB.prepare('SELECT count(*) count FROM addresses WHERE user_id = ?')
    .bind(c.get('user')!.id)
    .first<any>();
  if (count.count <= 1) return fail(c, 409, 'LAST_ADDRESS', 'Keep at least one delivery address.');
  await c.env.DB.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), c.get('user')!.id)
    .run();
  if (row.is_default)
    await c.env.DB.prepare(
      'UPDATE addresses SET is_default = 1 WHERE user_id = ? AND id = (SELECT id FROM addresses WHERE user_id = ? ORDER BY created_at LIMIT 1)',
    )
      .bind(c.get('user')!.id, c.get('user')!.id)
      .run();
  return ok(c, { deleted: true });
});
