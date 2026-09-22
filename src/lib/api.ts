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
  uploadFailure: boolean;
  slowUpload: boolean;
  reviewSubmissionFailure: boolean;
  duplicateSubmission: boolean;
  serverValidation: boolean;
  orderEventDelay: boolean;
  orderEventDisconnection: boolean;
  optimisticUpdateRejection: boolean;
  emptyTable: boolean;
  largeDataset: boolean;
  expiredCart: boolean;
  priceChanged: boolean;
  stockChanged: boolean;
  dateSlotUnavailable: boolean;
  failureMode: 'once' | 'persistent';
}

let qa: QaClientConfig = {
  latency: 0,
  forceStatus: null,
  emptySearch: false,
  lowStock: false,
  paymentDecline: false,
  sessionExpiry: false,
  offline: false,
  uploadFailure: false,
  slowUpload: false,
  reviewSubmissionFailure: false,
  duplicateSubmission: false,
  serverValidation: false,
  orderEventDelay: false,
  orderEventDisconnection: false,
  optimisticUpdateRejection: false,
  emptyTable: false,
  largeDataset: false,
  expiredCart: false,
  priceChanged: false,
  stockChanged: false,
  dateSlotUnavailable: false,
  failureMode: 'once',
};

const consumedSimulations = new Set<keyof QaClientConfig>();

export function setQaClientConfig(value: QaClientConfig) {
  for (const key of consumedSimulations) if (!value[key]) consumedSimulations.delete(key);
  qa = value;
}

export function consumeQaSimulation(key: keyof QaClientConfig) {
  if (!qa[key]) return false;
  if (qa.failureMode === 'persistent') return true;
  if (consumedSimulations.has(key)) return false;
  consumedSimulations.add(key);
  return true;
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
  const method = (init.method ?? 'GET').toUpperCase();
  const mutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
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
  if (qa.serverValidation && mutation && consumeQaSimulation('serverValidation'))
    headers.set('X-QA-Server-Validation', '1');
  if (
    qa.duplicateSubmission &&
    method === 'POST' &&
    path.includes('/reviews') &&
    consumeQaSimulation('duplicateSubmission')
  )
    headers.set('X-QA-Duplicate-Submission', '1');
  if (
    qa.reviewSubmissionFailure &&
    ['POST', 'PATCH'].includes(method) &&
    path.includes('/reviews') &&
    consumeQaSimulation('reviewSubmissionFailure')
  )
    headers.set('X-QA-Review-Failure', '1');
  if (
    qa.optimisticUpdateRejection &&
    mutation &&
    path.startsWith('/admin/orders') &&
    consumeQaSimulation('optimisticUpdateRejection')
  )
    headers.set('X-QA-Optimistic-Reject', '1');
  if (qa.emptyTable) headers.set('X-QA-Empty-Table', '1');
  if (qa.largeDataset) headers.set('X-QA-Large-Dataset', '1');
  if (qa.expiredCart) headers.set('X-QA-Expired-Cart', '1');
  if (qa.priceChanged) headers.set('X-QA-Price-Changed', '1');
  if (qa.stockChanged) headers.set('X-QA-Stock-Changed', '1');
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
