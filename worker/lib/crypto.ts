const encoder = new TextEncoder();
export const PASSWORD_HASH_ITERATIONS = 100_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

export async function hashPassword(password: string, saltBase64?: string) {
  const salt = saltBase64 ? base64ToBytes(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: new Uint8Array(salt).buffer,
      // Cloudflare Workers Web Crypto currently accepts at most 100,000 PBKDF2 iterations.
      iterations: PASSWORD_HASH_ITERATIONS,
    },
    material,
    256,
  );
  return { hash: bytesToBase64(new Uint8Array(bits)), salt: bytesToBase64(salt) };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const { hash } = await hashPassword(password, salt);
  if (hash.length !== expectedHash.length) return false;
  let difference = 0;
  for (let index = 0; index < hash.length; index += 1) {
    difference |= hash.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  }
  return difference === 0;
}

export function normalizeSecurityAnswer(answer: string) {
  return answer.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

export async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return bytesToBase64(new Uint8Array(signature)).replaceAll('+', '-').replaceAll('/', '_');
}

export async function verifySignature(value: string, signature: string, secret: string) {
  const expected = await sign(value, secret);
  if (expected.length !== signature.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return difference === 0;
}

export function newId() {
  return crypto.randomUUID();
}
