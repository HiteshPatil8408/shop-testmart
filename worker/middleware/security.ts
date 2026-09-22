import type { MiddlewareHandler } from 'hono';
import type { AppBindings } from '../types';
import { fail } from '../lib/response';

export const requestContext: MiddlewareHandler<AppBindings> = async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  c.header('X-Request-Id', c.get('requestId'));
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'",
  );
  await next();
};

export const protectMutations: MiddlewareHandler<AppBindings> = async (c, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) return next();
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) {
    return fail(c, 403, 'CROSS_SITE_REQUEST', 'Cross-site state changes are not allowed.');
  }
  const length = Number(c.req.header('Content-Length') ?? 0);
  if (length > 64_000) return fail(c, 413, 'REQUEST_TOO_LARGE', 'Request body is too large.');
  return next();
};

export const qaSimulation: MiddlewareHandler<AppBindings> = async (c, next) => {
  const latency = Number(c.req.header('X-QA-Latency') ?? 0);
  if ([500, 1500, 3000].includes(latency)) {
    await new Promise((resolve) => setTimeout(resolve, latency));
  }
  if (
    c.req.header('X-QA-Session-Expiry') === '1' &&
    !c.req.path.includes('/auth/session') &&
    !c.req.path.includes('/auth/login')
  )
    return fail(c, 401, 'SESSION_EXPIRED', 'QA Lab simulated an expired session.');
  if (
    c.req.header('X-QA-Expired-Cart') === '1' &&
    (c.req.path.endsWith('/cart') || c.req.path.includes('/checkout'))
  )
    return fail(c, 409, 'CART_EXPIRED', 'QA Lab simulated an expired cart.');
  if (
    c.req.header('X-QA-Server-Validation') === '1' &&
    ['POST', 'PUT', 'PATCH'].includes(c.req.method)
  )
    return fail(c, 422, 'SERVER_VALIDATION', 'QA Lab simulated a server validation response.', {
      form: 'Review this deterministic server validation error.',
    });
  const forced = Number(c.req.header('X-QA-Force-Status'));
  if ([400, 401, 403, 404, 409, 429, 500].includes(forced)) {
    return fail(c, forced as 400, `QA_FORCED_${forced}`, `QA Lab forced a ${forced} response.`);
  }
  return next();
};
