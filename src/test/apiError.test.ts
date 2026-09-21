import { describe, expect, it } from 'vitest';
import { ApiError } from '../lib/api';

describe('API error mapping', () => {
  it('preserves status, code, message and field errors', () => {
    const error = new ApiError(409, {
      error: {
        code: 'ACCOUNT_EXISTS',
        message: 'Already used.',
        fieldErrors: { email: 'Duplicate email.' },
      },
      meta: { requestId: 'request-1' },
    });
    expect(error).toMatchObject({
      status: 409,
      code: 'ACCOUNT_EXISTS',
      message: 'Already used.',
      fieldErrors: { email: 'Duplicate email.' },
    });
  });
});
