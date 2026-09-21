const origin = process.env.PRODUCTION_URL;

if (!origin) throw new Error('PRODUCTION_URL is required.');

const base = new URL(origin);
const request = (path, init) =>
  fetch(new URL(path, base), { signal: AbortSignal.timeout(15_000), ...init });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForDeployment() {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await request('/api/v1/categories');
      lastStatus = response.status;
      if (response.ok) return;
    } catch (error) {
      if (attempt === 6) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error(`Catalogue health check returned HTTP ${lastStatus}.`);
}

await waitForDeployment();

const home = await request('/');
assert(home.ok, `Homepage returned HTTP ${home.status}.`);
assert((await home.text()).includes('/favicon.svg'), 'Homepage does not link the favicon.');

const openapi = await request('/api/openapi.json');
assert(openapi.ok, `OpenAPI document returned HTTP ${openapi.status}.`);
const specification = await openapi.json();
assert(specification.paths?.['/auth/reset-password'], 'Password-recovery API is missing.');
assert(
  !specification.paths?.['/auth/forgot-password'],
  'Obsolete email recovery is still exposed.',
);

const login = await request('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'tester@testmart.demo', password: 'Test@12345' }),
});
assert(login.ok, `Demo login returned HTTP ${login.status}.`);
const cookie = login.headers.get('set-cookie')?.split(';')[0];
assert(cookie, 'Demo login did not create a session cookie.');

const session = await request('/api/v1/auth/session', { headers: { cookie } });
assert(session.ok, `Session check returned HTTP ${session.status}.`);
const sessionBody = await session.json();
assert(sessionBody.data?.user?.email === 'tester@testmart.demo', 'Session user is incorrect.');

const logout = await request('/api/v1/auth/logout', {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie },
  body: '{}',
});
assert(logout.ok, `Demo logout returned HTTP ${logout.status}.`);

console.log(`Production smoke test passed for ${base.origin}.`);
