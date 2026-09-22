import { expect, test, type Page } from '@playwright/test';

const demo = { email: 'tester@testmart.demo', password: 'Test@12345' };

async function signInAndReset(page: Page) {
  expect(await page.request.post('/api/v1/auth/login', { data: demo })).toBeOK();
  expect(await page.request.post('/api/v1/qa/reset')).toBeOK();
}

async function addNovaBook(page: Page) {
  const response = await page.request.get('/api/v1/products/aster-novabook-14');
  const product = (await response.json()).data.product;
  expect(
    await page.request.post('/api/v1/cart/items', {
      data: { productId: product.id, variantId: product.variants[0].id, quantity: 1 },
    }),
  ).toBeOK();
}

async function createOrder(page: Page) {
  await signInAndReset(page);
  await addNovaBook(page);
  const response = await page.request.post('/api/v1/orders', {
    headers: { 'Idempotency-Key': `advanced-${Date.now()}` },
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
  expect(response).toBeOK();
  return (await response.json()).data.orderNumber as string;
}

test('signed-in shoppers can create, edit, vote on and delete a review', async ({ page }) => {
  await signInAndReset(page);
  await page.goto('/products/aster-novabook-14');
  await expect(page.getByLabel('Review summary')).toContainText('3 reviews');

  await page.getByLabel('4 stars').check();
  await page.getByLabel('Review title').fill('Reliable automation laptop');
  await page
    .locator('.review-form-card textarea')
    .fill(
      'This fictional review provides enough detail to validate the complete browser workflow.',
    );
  await page.getByRole('button', { name: 'Submit review' }).click();
  await expect(page.getByText('Your review was published.')).toBeVisible();

  const ownReview = page.locator('.review-list article').filter({
    hasText: 'Reliable automation laptop',
  });
  await expect(ownReview).toBeVisible();
  await ownReview.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Review title').fill('Updated automation laptop');
  await page.getByRole('button', { name: 'Update review' }).click();
  await expect(page.getByText('Your review was updated.')).toBeVisible();
  await expect(page.getByText('Updated automation laptop')).toBeVisible();

  const seededReview = page
    .locator('.review-list article')
    .filter({ hasText: 'Dependable all-day' });
  await seededReview.getByRole('button', { name: /Helpful/ }).click();
  await expect(seededReview.getByRole('button', { name: /Helpful/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const updatedReview = page.locator('.review-list article').filter({
    hasText: 'Updated automation laptop',
  });
  await updatedReview.getByRole('button', { name: 'Delete' }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete your review?' });
  await expect(dialog.getByRole('button', { name: 'Delete review' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Delete review' }).click();
  await expect(dialog.getByRole('status')).toContainText('deleted');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('Updated automation laptop')).toHaveCount(0);
});

test('returns combine async multi-select, validation, upload retry and unsaved warning', async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('tm_qa', JSON.stringify({ uploadFailure: true, failureMode: 'once' }));
  });
  await signInAndReset(page);
  await page.goto('/returns');

  const products = page.getByRole('combobox', { name: 'Products to return' });
  await products.fill('Nova');
  await expect(page.getByRole('option', { name: /NovaBook 14/ })).toBeVisible();
  await products.press('ArrowDown');
  await products.press('Enter');
  await expect(page.getByLabel('Selected products')).toContainText('NovaBook 14');

  const chooser = page.getByLabel('Choose return attachments');
  await chooser.setInputFiles({
    name: 'unsupported.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('fictional attachment'),
  });
  await expect(page.getByRole('alert')).toContainText('use JPG, PNG, or PDF');
  await chooser.setInputFiles({
    name: 'damaged-package.png',
    mimeType: 'image/png',
    buffer: Buffer.from('fictional png fixture'),
  });
  await expect(page.getByText('damaged-package.png')).toBeVisible();
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(page.getByText('QA Lab simulated a failed upload.')).toBeVisible();
  await page.getByRole('button', { name: 'Retry upload' }).click();
  await expect(page.getByText('All attachments uploaded to this browser-only demo.')).toBeVisible();

  await page.getByLabel('Additional notes').fill('A fictional damaged-package return scenario.');
  const back = page.getByRole('button', { name: 'Back to orders' });
  await back.click();
  const warning = page.getByRole('dialog', { name: 'Discard this return request?' });
  await expect(warning).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(warning).toBeHidden();
  await expect(back).toBeFocused();

  await page.getByRole('button', { name: 'Submit demo return' }).click();
  await expect(page.getByRole('heading', { name: 'Return request simulated' })).toBeVisible();
});

test('admin orders support URL filters, expansion, pagination, export, bulk actions and board moves', async ({
  page,
}) => {
  await signInAndReset(page);
  await page.goto('/admin/orders');
  await expect(page.getByRole('table', { name: 'Demo orders' })).toBeVisible();

  await page.getByLabel('Global search').fill('Aarav');
  await expect(page).toHaveURL(/q=Aarav/);
  await expect(page.getByRole('status').first()).toContainText('1 orders');
  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await expect(page).toHaveURL(/\/admin\/orders$/);

  await page.getByLabel('Rows per page').selectOption('5');
  await expect(page.getByText('Page 1 of 5')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.locator('.admin-toolbar select').first().selectOption('confirmed');
  await expect(page).toHaveURL(/status=confirmed/);
  await page.goBack();
  await expect(page).toHaveURL(/page=2/);
  await expect(page).not.toHaveURL(/status=/);
  await page.goForward();
  await expect(page).toHaveURL(/status=confirmed/);

  const firstRow = page.getByRole('table', { name: 'Demo orders' }).locator('tbody > tr').first();
  await firstRow.getByRole('button', { name: 'Details' }).click();
  await expect(page.getByText('Expanded order details')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('testmart-orders.csv');

  await page.getByLabel('Select all visible orders').check();
  await page.getByLabel('Bulk status').selectOption('packed');
  await page.getByRole('button', { name: 'Update selected' }).click();
  await expect(page.getByRole('status').first()).toContainText('0 selected');

  await page.getByRole('button', { name: 'Status board' }).click();
  const packed = page.locator('[data-status="packed"]');
  const orderCard = packed.locator('article').first();
  const orderNumber = await orderCard.locator('strong').innerText();
  await orderCard.getByLabel('Move order').selectOption('shipped');
  await expect(
    page.locator('[data-status="shipped"] article').filter({ hasText: orderNumber }),
  ).toBeVisible();
});

test('an optimistic board rejection restores the original order column', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'tm_qa',
      JSON.stringify({ optimisticUpdateRejection: true, failureMode: 'once' }),
    );
  });
  await signInAndReset(page);
  await page.goto('/admin/orders');
  await page.getByRole('button', { name: 'Status board' }).click();
  const confirmed = page.locator('[data-status="confirmed"]');
  const orderCard = confirmed.locator('article').first();
  const orderNumber = await orderCard.locator('strong').innerText();
  await orderCard.getByLabel('Move order').selectOption('packed');
  await expect(
    page.locator('p.sr-only').filter({ hasText: 'rejected the optimistic update' }),
  ).toContainText('restored to confirmed');
  await expect(confirmed.locator('article').filter({ hasText: orderNumber })).toBeVisible();
  await expect(
    page.locator('[data-status="packed"] article').filter({ hasText: orderNumber }),
  ).toHaveCount(0);
});

test('checkout calendar stores an available date and time-slot selection', async ({ page }) => {
  await signInAndReset(page);
  await addNovaBook(page);
  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Use this address' }).click();

  const dateTrigger = page.getByRole('button', { name: 'Delivery date' });
  await dateTrigger.click();
  const calendar = page.getByRole('dialog', { name: 'Choose delivery date' });
  await expect(calendar).toBeVisible();
  await calendar
    .locator('[role="gridcell"]:not([disabled]):not([aria-selected="true"])')
    .first()
    .click();
  await page.getByLabel('12:00 PM – 3:00 PM').check();
  const stored = await page.evaluate(() => ({
    date: sessionStorage.getItem('tm_checkout_date'),
    slot: sessionStorage.getItem('tm_checkout_slot'),
  }));
  expect(stored.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(stored.slot).toBe('12:00-15:00');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Simulated payment' })).toBeVisible();
});

test('tracking reconnects, de-duplicates ordered events, and cancellation uses confirmation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'tm_qa',
      JSON.stringify({
        orderEventDelay: true,
        orderEventDisconnection: true,
        failureMode: 'once',
      }),
    );
  });
  const orderNumber = await createOrder(page);
  await page.goto(`/orders/${orderNumber}`);
  await expect(page.getByRole('heading', { name: 'Live simulated tracking' })).toBeVisible();
  await expect(page.getByText('disconnected', { exact: true })).toBeVisible({ timeout: 8_000 });
  await page.getByRole('button', { name: 'Retry connection' }).click();
  const nextEvent = page.getByRole('button', { name: 'Deliver next test event' });
  await expect(nextEvent).toBeVisible();
  for (let index = 0; index < 5; index += 1) await nextEvent.click();
  await expect(page.locator('.tracking-timeline .is-complete')).toHaveCount(5);
  await expect(page.getByText('complete', { exact: true })).toBeVisible({ timeout: 5_000 });

  await page.getByRole('button', { name: 'Cancel demo order' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cancel this demo order?' });
  await dialog.getByRole('button', { name: 'Cancel order' }).click();
  await expect(dialog.getByRole('status')).toContainText('cancelled');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('.badge--large')).toHaveText('cancelled');
});

test('UI Lab exposes keyboard-friendly overlays, tabs, dialogs, shortcuts and downloads', async ({
  page,
}) => {
  await page.goto('/ui-lab');
  await expect(page.getByRole('heading', { name: 'UI Laboratory' })).toBeVisible();

  const tooltipTrigger = page.getByRole('button', { name: 'Focus for help' });
  await tooltipTrigger.focus();
  await expect(page.getByRole('tooltip')).toHaveText('Deterministic tooltip text');

  const overview = page.getByRole('tab', { name: 'Overview' });
  await overview.focus();
  await overview.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Activity' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('Activity');

  const modalTrigger = page.getByRole('button', { name: 'Open modal' });
  await modalTrigger.click();
  const dialog = page.getByRole('dialog', { name: 'UI Lab modal' });
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(modalTrigger).toBeFocused();

  await page.keyboard.press('Control+k');
  await expect(page.getByText('Shortcut activated 1 times.')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download text file' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('testmart-note.txt');
});

test('QA Lab applies one-time failures, empty states and session reset', async ({ page }) => {
  await signInAndReset(page);
  await page.goto('/products/aster-novabook-14');
  await page.getByRole('button', { name: /QA Lab/ }).click();
  const qa = page.getByTestId('qa-controls');
  await qa.getByLabel('Review submission failure').check();
  await qa.getByRole('button', { name: 'Close QA Lab' }).click();

  await page.getByLabel('Review title').fill('One-time failure review');
  await page
    .locator('.review-form-card textarea')
    .fill('The first submission fails deterministically and the retry remains fully recoverable.');
  await page.getByRole('button', { name: 'Submit review' }).click();
  await expect(page.locator('.review-form-card').getByRole('alert')).toContainText(
    'simulated a review submission failure',
  );
  await expect(page.getByRole('button', { name: 'Submit review' })).toBeEnabled();
  await page.getByRole('button', { name: 'Submit review' }).click();
  await expect(page.getByText('Your review was published.')).toBeVisible();

  await page.getByRole('button', { name: /QA Lab/ }).click();
  await qa.getByLabel('Empty order table').check();
  await qa.getByRole('button', { name: 'Close QA Lab' }).click();
  await page.goto('/admin/orders');
  await expect(page.getByRole('heading', { name: 'No demo orders available' })).toBeVisible();
  await page.getByRole('button', { name: /QA Lab/ }).click();
  await page.getByRole('button', { name: 'Clear simulations' }).click();
  await page.reload();
  await expect(page.getByRole('table', { name: 'Demo orders' })).toBeVisible();
});

test('advanced routes refresh directly without application console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await signInAndReset(page);
  await page.setViewportSize({ width: 768, height: 900 });
  for (const route of ['/ui-lab', '/returns', '/admin/orders']) {
    await page.goto(route);
    await page.locator('main').waitFor();
    await page.reload();
    await page.locator('main').waitFor();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      768,
    );
  }
  expect(errors).toEqual([]);
});
