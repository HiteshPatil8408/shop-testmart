import { expect, test, type Page } from '@playwright/test';

const demo = { email: 'tester@testmart.demo', password: 'Test@12345' };

async function prepareCheckout(page: Page) {
  await page.request.post('/api/v1/auth/login', { data: demo });
  await page.request.post('/api/v1/qa/reset');
  const product = (await (await page.request.get('/api/v1/products/aster-novabook-14')).json()).data
    .product;
  await page.request.post('/api/v1/cart/items', {
    data: { productId: product.id, variantId: product.variants[0].id, quantity: 1 },
  });
}

test('mobile navigation is usable at 390px', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const drawer = page.getByRole('dialog', { name: 'Navigation' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('link', { name: 'Tablets' }).click();
  await expect(page).toHaveURL(/category\/tablets/);
  await expect(page.getByRole('heading', { name: 'Tablets' })).toBeVisible();
});

test('mobile filters stage changes until Apply and restore on Cancel', async ({ page }) => {
  await page.goto('/category/laptops');
  const trigger = page.getByRole('button', { name: /^Filters/ });
  await trigger.click();
  let drawer = page.getByRole('dialog', { name: 'Product filters' });
  await drawer.getByLabel('Deep Navy').check();
  await drawer.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).not.toHaveURL(/colour=/);

  await trigger.click();
  drawer = page.getByRole('dialog', { name: 'Product filters' });
  await drawer.getByLabel('Deep Navy').check();
  await drawer.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL(/colour=Deep\+Navy/);
  await expect(page.getByRole('button', { name: 'Filters (1)' })).toBeVisible();
  await expect(page.getByRole('button', { name: /colour: Deep Navy/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('mobile calendar and confirmation dialog stay within the viewport', async ({ page }) => {
  await prepareCheckout(page);
  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Use this address' }).click();
  await page.getByRole('button', { name: 'Delivery date' }).click();
  const calendar = page.getByRole('dialog', { name: 'Choose delivery date' });
  const calendarBox = await calendar.boundingBox();
  expect(calendarBox).not.toBeNull();
  expect(calendarBox!.x).toBeGreaterThanOrEqual(0);
  expect(calendarBox!.x + calendarBox!.width).toBeLessThanOrEqual(390);

  await page.request.delete('/api/v1/cart');
  await page.goto('/returns');
  await page.getByLabel('Additional notes').fill('Unsaved mobile draft');
  await page.getByRole('button', { name: 'Back to orders' }).click();
  const warning = page.getByRole('dialog', { name: 'Discard this return request?' });
  const warningBox = await warning.boundingBox();
  expect(warningBox).not.toBeNull();
  expect(warningBox!.x).toBeGreaterThanOrEqual(0);
  expect(warningBox!.x + warningBox!.width).toBeLessThanOrEqual(390);
  await warning.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page).toHaveURL('/returns');
});

test('admin order table uses mobile cards without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.request.post('/api/v1/auth/login', { data: demo });
  await page.goto('/admin/orders');
  await expect(page.locator('.order-mobile-list article').first()).toBeVisible();
  await expect(page.getByRole('table', { name: 'Demo orders' })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
