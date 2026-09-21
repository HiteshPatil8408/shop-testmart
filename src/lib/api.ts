import type { ApiFailure, ApiSuccess } from '../../shared/types';

export class ApiError extends Error {
  code: string;
  status: number;
  fieldErrors: Record<string, string>;

  constructor(status: number, body: ApiFailure) {
    super(body.error.message);
    this.name = 'ApiError';
    this.code = body.error.code;
    this.status = status;
    this.fieldErrors = body.error.fieldErrors ?? {};
  }
}

export interface QaClientConfig {
  latency: 0 | 500 | 1500 | 3000;
  forceStatus: number | null;
  emptySearch: boolean;
  lowStock: boolean;
  paymentDecline: boolean;
  sessionExpiry: boolean;
  offline: boolean;
}

let qa: QaClientConfig = {
  latency: 0,
  forceStatus: null,
  emptySearch: false,
  lowStock: false,
  paymentDecline: false,
  sessionExpiry: false,
  offline: false,
};

export function setQaClientConfig(value: QaClientConfig) {
  qa = value;
}

export async function apiEnvelope<T>(path: string, init: RequestInit = {}): Promise<ApiSuccess<T>> {
  if (import.meta.env.VITE_STATIC_PREVIEW === 'true') {
    const { staticPreviewApi } = await import('../preview/api');
    return staticPreviewApi<T>(path, init);
  }
  if (qa.offline)
    throw new ApiError(503, {
      error: { code: 'OFFLINE', message: 'QA Lab is simulating an offline connection.' },
      meta: { requestId: 'qa-offline' },
    });
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (qa.latency) headers.set('X-QA-Latency', String(qa.latency));
  if (qa.forceStatus) {
    headers.set('X-QA-Force-Status', String(qa.forceStatus));
    qa = { ...qa, forceStatus: null };
    window.dispatchEvent(new Event('testmart:qa-force-consumed'));
  }
  if (qa.emptySearch) headers.set('X-QA-Empty-Search', '1');
  if (qa.lowStock) headers.set('X-QA-Low-Stock', '1');
  if (qa.paymentDecline) headers.set('X-QA-Payment-Decline', '1');
  if (qa.sessionExpiry) headers.set('X-QA-Session-Expiry', '1');
  const response = await fetch(`/api/v1${path}`, { credentials: 'same-origin', ...init, headers });
  const body = (await response.json()) as ApiSuccess<T> | ApiFailure;
  if (!response.ok || 'error' in body) throw new ApiError(response.status, body as ApiFailure);
  return body;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await apiEnvelope<T>(path, init)).data;
}

export function jsonBody(value: unknown) {
  return JSON.stringify(value);
}
