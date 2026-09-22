import { Hono } from 'hono';
import { APP_CONFIG } from '../../shared/config';
import { loginSchema, registrationSchema, resetPasswordSchema } from '../../shared/schemas';
import { hashPassword, newId, normalizeSecurityAnswer, verifyPassword } from '../lib/crypto';
import { fail, ok, zodFieldErrors } from '../lib/response';
import { createSession, destroySession } from '../middleware/auth';
import { mergeGuestCart } from '../repositories/cart';
import type { AppBindings } from '../types';

export const authApi = new Hono<AppBindings>();
const attempts = new Map<string, number[]>();
const INVALID_RECOVERY_MESSAGE =
  'The account details or security answer are incorrect. Check them and try again.';
const DUMMY_SECURITY_SALT = 'AAAAAAAAAAAAAAAAAAAAAA==';
const DUMMY_SECURITY_HASH = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

function rateLimited(key: string, maximum = 12) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < 60_000);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length > maximum;
}

function failedLoginLimited(key: string, maximum = 12) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < 60_000);
  attempts.set(key, recent);
  return recent.length >= maximum;
}

function recordFailedLogin(key: string) {
  attempts.set(key, [...(attempts.get(key) ?? []), Date.now()]);
}

authApi.post('/register', async (c) => {
  if (rateLimited(`register:${c.req.header('CF-Connecting-IP') ?? 'local'}`, 6))
    return fail(c, 429, 'RATE_LIMITED', 'Please wait before trying again.');
  const parsed = registrationSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check the highlighted fields.',
      zodFieldErrors(parsed.error.issues),
    );
  const value = parsed.data;
  const duplicate = await c.env.DB.prepare(
    'SELECT username, email FROM users WHERE lower(username) = lower(?) OR lower(email) = lower(?)',
  )
    .bind(value.username, value.email)
    .first<any>();
  if (duplicate) {
    const fields: Record<string, string> = {};
    if (duplicate.username.toLowerCase() === value.username.toLowerCase())
      fields.username = 'That username is already in use.';
    if (duplicate.email.toLowerCase() === value.email.toLowerCase())
      fields.email = 'That email is already registered.';
    return fail(c, 409, 'ACCOUNT_EXISTS', 'An account already uses those details.', fields);
  }
  const userId = newId();
  const [{ hash, salt }, securityAnswer] = await Promise.all([
    hashPassword(value.password),
    hashPassword(normalizeSecurityAnswer(value.securityAnswer)),
  ]);
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO users (
         id, username, email, password_hash, password_salt, first_name, last_name, phone,
         marketing_opt_in, security_question_id, security_answer_hash, security_answer_salt
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      userId,
      value.username,
      value.email,
      hash,
      salt,
      value.firstName,
      value.lastName,
      value.phone,
      value.marketingOptIn ? 1 : 0,
      value.securityQuestionId,
      securityAnswer.hash,
      securityAnswer.salt,
    ),
    c.env.DB.prepare(
      `INSERT INTO addresses (id, user_id, label, first_name, last_name, phone, street, city, state, postal_code, country, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    ).bind(
      newId(),
      userId,
      value.label,
      value.firstName,
      value.lastName,
      value.phone,
      value.street,
      value.city,
      value.state,
      value.postalCode,
      value.country,
    ),
  ]);
  await mergeGuestCart(c, userId);
  await createSession(c, userId);
  return ok(c, {
    user: {
      id: userId,
      username: value.username,
      email: value.email,
      firstName: value.firstName,
      lastName: value.lastName,
      phone: value.phone,
      marketingOptIn: value.marketingOptIn,
    },
  });
});

authApi.post('/login', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'local';
  const attemptKey = `login:${ip}`;
  if (failedLoginLimited(attemptKey))
    return fail(c, 429, 'RATE_LIMITED', 'Please wait before trying again.');
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Enter a valid email and password.',
      zodFieldErrors(parsed.error.issues),
    );
  const row = await c.env.DB.prepare('SELECT * FROM users WHERE lower(email) = lower(?)')
    .bind(parsed.data.email)
    .first<any>();
  if (!row || !(await verifyPassword(parsed.data.password, row.password_salt, row.password_hash))) {
    recordFailedLogin(attemptKey);
    return fail(c, 401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
  }
  attempts.delete(attemptKey);
  await mergeGuestCart(c, row.id);
  await createSession(c, row.id);
  return ok(c, {
    user: {
      id: row.id,
      username: row.username,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      marketingOptIn: Boolean(row.marketing_opt_in),
    },
  });
});

authApi.post('/logout', async (c) => {
  await destroySession(c);
  return ok(c, { signedOut: true });
});

authApi.get('/session', (c) => ok(c, { user: c.get('user') }));

authApi.post('/reset-password', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'local';
  if (rateLimited(`reset:${ip}`, 8))
    return fail(c, 429, 'RATE_LIMITED', 'Please wait before trying again.');
  const parsed = resetPasswordSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check the recovery and password fields.',
      zodFieldErrors(parsed.error.issues),
    );
  const value = parsed.data;
  const user = await c.env.DB.prepare(
    `SELECT id, password_hash, password_salt, security_question_id,
            security_answer_hash, security_answer_salt, last_password_reset_at
     FROM users
     WHERE lower(email) = lower(?) AND lower(email) <> lower(?)
     LIMIT 1`,
  )
    .bind(value.email, APP_CONFIG.demoEmail)
    .first<{
      id: string;
      password_hash: string;
      password_salt: string;
      security_question_id: string | null;
      security_answer_hash: string | null;
      security_answer_salt: string | null;
      last_password_reset_at: string | null;
    }>();
  const answerMatches = await verifyPassword(
    normalizeSecurityAnswer(value.securityAnswer),
    user?.security_answer_salt ?? DUMMY_SECURITY_SALT,
    user?.security_answer_hash ?? DUMMY_SECURITY_HASH,
  );
  if (!user || user.security_question_id !== value.securityQuestionId || !answerMatches)
    return fail(c, 400, 'RECOVERY_DETAILS_INCORRECT', INVALID_RECOVERY_MESSAGE);
  if (await verifyPassword(value.password, user.password_salt, user.password_hash))
    return fail(c, 400, 'PASSWORD_REUSED', 'Choose a password different from your current one.', {
      password: 'Choose a password different from your current one.',
    });

  const next = await hashPassword(value.password);
  const updated = await c.env.DB.prepare(
    `UPDATE users
     SET password_hash = ?, password_salt = ?, last_password_reset_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?
       AND (last_password_reset_at IS NULL OR last_password_reset_at <= datetime('now', '-24 hours'))`,
  )
    .bind(next.hash, next.salt, user.id)
    .run();
  if (!updated.meta.changes)
    return fail(
      c,
      429,
      'PASSWORD_RESET_LIMITED',
      'A password can be reset only once every 24 hours. Try again later.',
    );
  await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
  return ok(c, {
    reset: true,
    message: 'Password updated. You can now sign in with your new password.',
  });
});
