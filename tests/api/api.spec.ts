import { expect, test, type APIRequestContext } from '@playwright/test';

const demo = { email: 'tester@testmart.demo', password: 'Test@12345' };

async function login(request: APIRequestContext) {
  const response = await request.post('/api/v1/auth/login', { data: demo });
  expect(response).toBeOK();
}

async function productFixture(request: APIRequestContext) {
  const response = await request.get('/api/v1/products/aster-novabook-14');
  expect(response).toBeOK();
  return (await response.json()).data.product;
}

test.describe('TestMart REST API', () => {
  test('successful registration, duplicate username and duplicate email', async ({ request }) => {
    const suffix = Date.now().toString().slice(-8);
    const account = {
      username: `api_${suffix}`,
      email: `api_${suffix}@example.test`,
      password: 'Valid@12345',
      confirmPassword: 'Valid@12345',
      securityQuestionId: 'childhood-book',
      securityAnswer: 'Copper Comet',
      firstName: 'API',
      lastName: 'Tester',
      phone: '+91 90000 00000',
      country: 'India',
      city: 'Pune',
      street: '101 Contract Lane',
      state: 'Maharashtra',
      postalCode: '411001',
      label: 'Home',
      isDefault: true,
      marketingOptIn: false,
      termsAccepted: true,
    };
    const registered = await request.post('/api/v1/auth/register', { data: account });
    expect(registered).toBeOK();
    expect((await registered.json()).data.user.email).toBe(account.email);
    const changedPassword = 'Changed@12345';
    const changed = await request.post('/api/v1/account/password', {
      data: {
        currentPassword: account.password,
        password: changedPassword,
        confirmPassword: changedPassword,
      },
    });
    expect(changed).toBeOK();
    await request.post('/api/v1/auth/logout');
    const relogin = await request.post('/api/v1/auth/login', {
      data: { email: account.email, password: changedPassword },
    });
    expect(relogin).toBeOK();
    await request.post('/api/v1/auth/logout');
    const wrongAnswer = await request.post('/api/v1/auth/reset-password', {
      data: {
        email: account.email,
        securityQuestionId: account.securityQuestionId,
        securityAnswer: 'Wrong answer',
        password: 'Recovered@12345',
        confirmPassword: 'Recovered@12345',
      },
    });
    expect(wrongAnswer.status()).toBe(400);
    expect((await wrongAnswer.json()).error.code).toBe('RECOVERY_DETAILS_INCORRECT');
    const recoveredPassword = 'Recovered@12345';
    const recovered = await request.post('/api/v1/auth/reset-password', {
      data: {
        email: account.email,
        securityQuestionId: account.securityQuestionId,
        securityAnswer: '  COPPER   comet ',
        password: recoveredPassword,
        confirmPassword: recoveredPassword,
      },
    });
    expect(recovered).toBeOK();
    const limited = await request.post('/api/v1/auth/reset-password', {
      data: {
        email: account.email,
        securityQuestionId: account.securityQuestionId,
        securityAnswer: account.securityAnswer,
        password: 'Another@12345',
        confirmPassword: 'Another@12345',
      },
    });
    expect(limited.status()).toBe(429);
    expect((await limited.json()).error.code).toBe('PASSWORD_RESET_LIMITED');
    const recoveryLogin = await request.post('/api/v1/auth/login', {
      data: { email: account.email, password: recoveredPassword },
    });
    expect(recoveryLogin).toBeOK();
    const updatedQuestion = await request.post('/api/v1/account/security-question', {
      data: {
        currentPassword: recoveredPassword,
        securityQuestionId: 'first-teacher',
        securityAnswer: 'Ms Rowan',
      },
    });
    expect(updatedQuestion).toBeOK();
    const duplicate = await request.post('/api/v1/auth/register', { data: account });
    expect(duplicate.status()).toBe(409);
    expect((await duplicate.json()).error.fieldErrors).toMatchObject({
      username: expect.any(String),
      email: expect.any(String),
    });
  });

  test('login success, login failure and session access', async ({ request }) => {
    const failed = await request.post('/api/v1/auth/login', {
      data: { email: demo.email, password: 'wrong-password' },
    });
    expect(failed.status()).toBe(401);
    await login(request);
    const session = await request.get('/api/v1/auth/session');
    expect(session).toBeOK();
    expect((await session.json()).data.user.email).toBe(demo.email);
    const reset = await request.post('/api/v1/auth/reset-password', {
      data: {
        email: demo.email,
        securityQuestionId: 'childhood-book',
        securityAnswer: 'Anything private',
        password: 'Changed@12345',
        confirmPassword: 'Changed@12345',
      },
    });
    expect(reset.status()).toBe(400);
    expect((await reset.json()).error.code).toBe('RECOVERY_DETAILS_INCORRECT');
    const demoChange = await request.post('/api/v1/account/password', {
      data: {
        currentPassword: demo.password,
        password: 'Changed@12345',
        confirmPassword: 'Changed@12345',
      },
    });
    expect(demoChange.status()).toBe(403);
    expect((await demoChange.json()).error.code).toBe('DEMO_PASSWORD_IMMUTABLE');
    const demoSecurityQuestion = await request.post('/api/v1/account/security-question', {
      data: {
        currentPassword: demo.password,
        securityQuestionId: 'first-teacher',
        securityAnswer: 'Not allowed',
      },
    });
    expect(demoSecurityQuestion.status()).toBe(403);
    expect((await demoSecurityQuestion.json()).error.code).toBe('DEMO_SECURITY_IMMUTABLE');
  });

  test('profile access and saved-address lifecycle', async ({ request }) => {
    await login(request);
    const profile = await request.get('/api/v1/profile');
    expect(profile).toBeOK();
    expect((await profile.json()).data.username).toBe('testmart_tester');
    const value = {
      label: 'API address',
      firstName: 'Demo',
      lastName: 'Tester',
      phone: '+91 90000 00000',
      street: '202 Contract Road',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411002',
      country: 'India',
      isDefault: false,
    };
    const created = await request.post('/api/v1/addresses', { data: value });
    expect(created).toBeOK();
    const id = (await created.json()).data.id;
    const updated = await request.patch(`/api/v1/addresses/${id}`, {
      data: { ...value, label: 'Updated API address' },
    });
    expect((await updated.json()).data.label).toBe('Updated API address');
    expect(await request.delete(`/api/v1/addresses/${id}`)).toBeOK();
  });

  test('catalogue filtering and search suggestions', async ({ request }) => {
    const response = await request.get('/api/v1/products?category=laptops&rating=4&sort=price_asc');
    expect(response).toBeOK();
    const body = await response.json();
    expect(body.data).toHaveLength(6);
    expect(
      body.data.every(
        (product: { category: string; rating: number }) =>
          product.category === 'laptops' && product.rating >= 4,
      ),
    ).toBeTruthy();
    expect(body.data[0].pricePaise).toBeLessThanOrEqual(body.data[1].pricePaise);
    const suggestions = await request.get('/api/v1/search/suggestions?q=Nova');
    expect((await suggestions.json()).data[0].name).toContain('Nova');
  });

  test('every colour variant has a distinct local two-image gallery', async ({ request }) => {
    const firstPage = await request.get('/api/v1/products?pageSize=24');
    const secondPage = await request.get('/api/v1/products?page=2&pageSize=24');
    expect(firstPage).toBeOK();
    expect(secondPage).toBeOK();

    const products = [
      ...(await firstPage.json()).data,
      ...(await secondPage.json()).data,
    ] as Array<{ images: string[]; variants: Array<{ colour: string; images: string[] }> }>;
    const imageUrls = products.flatMap((product) =>
      product.variants.flatMap((variant) => variant.images),
    );

    expect(products).toHaveLength(30);
    expect(products.every((product) => product.images.length === 2)).toBeTruthy();
    expect(
      products.every(
        (product) =>
          product.variants.length === 2 &&
          product.variants.every((variant) => variant.images.length === 2) &&
          product.images.every((url, index) => url === product.variants[0].images[index]),
      ),
    ).toBeTruthy();
    expect(new Set(imageUrls).size).toBe(120);
    expect(
      imageUrls.every((url) =>
        /^\/images\/products\/[a-z0-9-]+-(?:deep-navy|warm-silver|lagoon-teal|sunset-coral|night-navy|harbour-blue|terracotta|graphite|mist-silver)-0[12]\.jpg$/.test(
          url,
        ),
      ),
    ).toBe(true);

    for (const url of imageUrls) {
      const image = await request.get(url);
      expect(image, `${url} should load`).toBeOK();
      expect(image.headers()['content-type']).toContain('image/jpeg');
    }
  });

  test('cart creation, merge, updates, removal and stock validation', async ({ request }) => {
    await login(request);
    await request.post('/api/v1/qa/reset');
    const product = await productFixture(request);
    const variant = product.variants[0];
    const added = await request.post('/api/v1/cart/items', {
      data: { productId: product.id, variantId: variant.id, quantity: 1 },
    });
    expect(added).toBeOK();
    const item = (await added.json()).data.items[0];
    const merged = await request.post('/api/v1/cart/items', {
      data: { productId: product.id, variantId: variant.id, quantity: 1 },
    });
    expect((await merged.json()).data.items[0].quantity).toBe(2);
    const updated = await request.patch(`/api/v1/cart/items/${item.id}`, { data: { quantity: 3 } });
    expect((await updated.json()).data.items[0].quantity).toBe(3);
    const unavailable = await request.patch(`/api/v1/cart/items/${item.id}`, {
      data: { quantity: Math.min(20, variant.stock + 1) },
    });
    expect(unavailable.status()).toBe(409);
    const removed = await request.delete(`/api/v1/cart/items/${item.id}`);
    expect((await removed.json()).data.items).toHaveLength(0);
  });

  test('checkout preview, successful order and duplicate idempotency key', async ({ request }) => {
    await login(request);
    await request.post('/api/v1/qa/reset');
    const product = await productFixture(request);
    await request.post('/api/v1/cart/items', {
      data: { productId: product.id, variantId: product.variants[0].id, quantity: 1 },
    });
    const preview = await request.post('/api/v1/checkout/preview', {
      data: { deliveryMethod: 'express' },
    });
    expect(preview).toBeOK();
    expect((await preview.json()).data.totals.shippingPaise).toBe(24_900);
    const payload = {
      address: {
        label: 'Home',
        firstName: 'Demo',
        lastName: 'Tester',
        phone: '+91 90000 00000',
        street: '101 Learning Lane',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411001',
        country: 'India',
        isDefault: true,
      },
      deliveryMethod: 'standard',
      payment: {
        type: 'card',
        cardholderName: 'Demo Tester',
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: new Date().getFullYear() + 2,
      },
    };
    const headers = { 'Idempotency-Key': `api-order-${Date.now()}` };
    const placed = await request.post('/api/v1/orders', { data: payload, headers });
    expect(placed).toBeOK();
    const first = await placed.json();
    expect(first.data.orderNumber).toMatch(/^TM-\d{8}-/);
    const duplicate = await request.post('/api/v1/orders', { data: payload, headers });
    expect(duplicate).toBeOK();
    expect((await duplicate.json()).data.orderNumber).toBe(first.data.orderNumber);
    expect((await duplicate.json()).meta.duplicate).toBe(true);
  });

  test('prevents unauthorized order access', async ({ request }) => {
    const response = await request.get('/api/v1/orders/TM-20260101-UNKNOWN');
    expect(response.status()).toBe(401);
    expect((await response.json()).error.code).toBe('AUTH_REQUIRED');
  });

  test('contact form validation and persistence', async ({ request }) => {
    const invalid = await request.post('/api/v1/contact', {
      data: { categoryId: 'bad', email: 'bad', subject: 'x', message: 'short' },
    });
    expect(invalid.status()).toBe(400);
    const categories = (await (await request.get('/api/v1/categories')).json()).data;
    const valid = await request.post('/api/v1/contact', {
      data: {
        categoryId: categories[0].id,
        productId: '',
        email: 'qa@example.test',
        subject: 'Automation practice question',
        message: 'This is a fictional message with enough detail for validation.',
      },
    });
    expect(valid).toBeOK();
    expect((await valid.json()).data.id).toBeTruthy();
  });

  test('QA reset clears the current cart and restores account test data', async ({ request }) => {
    await login(request);
    const response = await request.post('/api/v1/qa/reset');
    expect(response).toBeOK();
    const cart = await request.get('/api/v1/cart');
    expect((await cart.json()).data.items).toHaveLength(0);
  });
});
