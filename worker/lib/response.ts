import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppBindings } from '../types';

export function ok<T>(c: Context<AppBindings>, data: T, meta: Record<string, unknown> = {}) {
  return c.json({ data, meta: { requestId: c.get('requestId'), ...meta } });
}

export function fail(
  c: Context<AppBindings>,
  status: ContentfulStatusCode,
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
) {
  return c.json(
    {
      error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) },
      meta: { requestId: c.get('requestId') },
    },
    status,
  );
}

export function zodFieldErrors(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return Object.fromEntries(
    issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]),
  );
}
