import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { User } from '../../shared/types';
import { sign, verifySignature } from '../lib/crypto';
import { fail } from '../lib/response';
import type { AppBindings } from '../types';

export const COOKIE_NAME = 'tm_session';
const DEMO_LOCAL_SECRET = 'testmart-local-development-secret-change-me';

export function securitySecret(c: Context<AppBindings>) {
  if (c.env.SESSION_SECRET) return c.env.SESSION_SECRET;
  const isSecureProduction =
    c.env.APP_ENV === 'production' && new URL(c.req.url).protocol === 'https:';
  if (isSecureProduction) throw new Error('SESSION_SECRET is required in production.');
  return DEMO_LOCAL_SECRET;
}

export async function currentUser(c: Context<AppBindings>): Promise<User | null> {
  const cookie = getCookie(c, COOKIE_NAME);
  if (!cookie) return null;
  const separator = cookie.lastIndexOf('.');
  if (separator < 1) return null;
  const sessionId = cookie.slice(0, separator);
  const signature = cookie.slice(separator + 1);
  if (!(await verifySignature(sessionId, signature, securitySecret(c)))) return null;
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.marketing_opt_in
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
  )
    .bind(sessionId)
    .first<any>();
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    marketingOptIn: Boolean(row.marketing_opt_in),
  };
}

export async function createSession(c: Context<AppBindings>, userId: string) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, userId, expiresAt)
    .run();
  const signature = await sign(sessionId, securitySecret(c));
  setCookie(c, COOKIE_NAME, `${sessionId}.${signature}`, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: c.env.APP_ENV === 'production' && new URL(c.req.url).protocol === 'https:',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function destroySession(c: Context<AppBindings>) {
  const cookie = getCookie(c, COOKIE_NAME);
  const sessionId = cookie?.slice(0, cookie.lastIndexOf('.'));
  if (sessionId) await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  deleteCookie(c, COOKIE_NAME, { path: '/' });
}

export const loadUser: MiddlewareHandler<AppBindings> = async (c, next) => {
  c.set('user', await currentUser(c));
  await next();
};

export const requireUser: MiddlewareHandler<AppBindings> = async (c, next) => {
  if (!c.get('user')) return fail(c, 401, 'AUTH_REQUIRED', 'Sign in to continue.');
  await next();
};
