import { expect, test, type Page } from '@playwright/test';

const demo = { email: 'tester@testmart.demo', password: 'Test@12345' };

async function prepareCart(page: Page) {
  await page.request.post('/api/v1/auth/login', { data: demo });
  await page.request.post('/api/v1/qa/reset');
  const product = (await (await page.request.get('/api/v1/products/aster-novabook-14')).json()).data
    .product;
  await page.request.post('/api/v1/cart/items', {
    data: { productId: product.id, variantId: product.variants[1].id, quantity: 1 },
  });
}

async function reachPayment(page: Page) {
  await page.goto('/checkout');
  await expect(page.getByRole('img', { name: 'NovaBook 14 in Warm Silver' })).toHaveAttribute(
    'src',
    /aster-novabook-14-warm-silver-01\.jpg$/,
  );
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Use this address' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Simulated payment' })).toBeVisible();
}

test('successful checkout using a simulated card', async ({ page }) => {
  await prepareCart(page);
  await reachPayment(page);
  await page.getByRole('button', { name: 'Review order' }).click();
  await expect(page.getByRole('img', { name: 'NovaBook 14 in Warm Silver' })).toHaveAttribute(
    'src',
    /aster-novabook-14-warm-silver-01\.jpg$/,
  );
  await page.getByRole('button', { name: 'Place simulated order' }).click();
  await expect(page.getByRole('heading', { name: 'Order confirmed' })).toBeVisible();
  await expect(page.getByTestId('order-number')).toHaveText(/^TM-/);
  await expect(page.getByRole('img', { name: 'NovaBook 14 in Warm Silver' })).toHaveAttribute(
    'src',
    /aster-novabook-14-warm-silver-01\.jpg$/,
  );
});

test('payment decline handling keeps the order review recoverable', async ({ page }) => {
  await prepareCart(page);
  await reachPayment(page);
  await page.getByLabel('Test card number').fill('4000000000000002');
  await page.getByRole('button', { name: 'Review order' }).click();
  await page.getByRole('button', { name: 'Place simulated order' }).click();
  await expect(page.getByRole('alert')).toContainText('declined');
  await expect(page.getByRole('heading', { name: 'Review and place order' })).toBeVisible();
});

test('created order appears in order history', async ({ page }) => {
  await prepareCart(page);
  const cart = (await (await page.request.get('/api/v1/cart')).json()).data;
  const key = `history-${Date.now()}`;
  const placed = await page.request.post('/api/v1/orders', {
    headers: { 'Idempotency-Key': key },
    data: {
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
      payment: { type: 'wallet' },
    },
  });
  expect(placed).toBeOK();
  const orderNumber = (await placed.json()).data.orderNumber;
  expect(cart.items).toHaveLength(1);
  await page.goto('/orders');
  await expect(page.getByText(orderNumber, { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'NovaBook 14 in Warm Silver' })).toHaveAttribute(
    'src',
    /aster-novabook-14-warm-silver-01\.jpg$/,
  );
  await page.getByRole('link', { name: 'View details' }).first().click();
  await expect(page.getByTestId('order-number')).toHaveText(orderNumber);
  await expect(page.getByRole('img', { name: 'NovaBook 14 in Warm Silver' })).toHaveAttribute(
    'src',
    /aster-novabook-14-warm-silver-01\.jpg$/,
  );
});
