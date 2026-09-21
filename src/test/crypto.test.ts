// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  hashPassword,
  normalizeSecurityAnswer,
  PASSWORD_HASH_ITERATIONS,
  sign,
  verifyPassword,
  verifySignature,
} from '../../worker/lib/crypto';

const demoSalt = 'dGVzdG1hcnQtZGVtby1zYWx0LTE=';
const demoHash = 'BaBxTbqsCHALgCJMRjS94VYvca9aEDMTSC+fxwGKgv4=';

describe('password hashing', () => {
  it('stays within the Cloudflare Workers PBKDF2 limit', () => {
    expect(PASSWORD_HASH_ITERATIONS).toBe(100_000);
  });

  it('matches and verifies the deterministic demo credential', async () => {
    await expect(hashPassword('Test@12345', demoSalt)).resolves.toEqual({
      hash: demoHash,
      salt: demoSalt,
    });
    await expect(verifyPassword('Test@12345', demoSalt, demoHash)).resolves.toBe(true);
    await expect(verifyPassword('Wrong@12345', demoSalt, demoHash)).resolves.toBe(false);
  });

  it('normalizes security answers consistently', () => {
    expect(normalizeSecurityAnswer('  Copper   COMET ')).toBe('copper comet');
  });

  it('authenticates signed material without accepting a changed value', async () => {
    const signature = await sign('session-record:123456', 'test-secret');
    await expect(verifySignature('session-record:123456', signature, 'test-secret')).resolves.toBe(
      true,
    );
    await expect(verifySignature('session-record:654321', signature, 'test-secret')).resolves.toBe(
      false,
    );
  });
});
