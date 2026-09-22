import { expect, test } from '@playwright/test';

const demo = { email: 'tester@testmart.demo', password: 'Test@12345' };

test('homepage and navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Build your best setups' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Shop by category' })).toBeVisible();
  await page.getByRole('link', { name: 'Laptops', exact: true }).first().click();
  await expect(page).toHaveURL(/category\/laptops/);
  await expect(page.getByRole('heading', { name: 'Laptops' })).toBeVisible();
});

test('account and cart menus close outside, on Escape, and when switching', async ({ page }) => {
  await page.goto('/');
  const account = page.getByRole('button', { name: 'Account menu' });
  const cart = page.getByRole('button', { name: /Cart with \d+ items/ });

  await account.click();
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  await page.getByRole('heading', { name: 'Build your best setups' }).click();
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeHidden();
  await expect(account).toHaveAttribute('aria-expanded', 'false');

  await cart.click();
  await expect(page.getByRole('heading', { name: 'Your cart' })).toBeVisible();
  await account.click();
  await expect(page.getByRole('heading', { name: 'Your cart' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeHidden();
  await expect(account).toBeFocused();
});

test('search with keyboard-navigable suggestions', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('combobox', { name: 'Search products' }).first();
  await search.fill('Nova');
  await expect(page.getByRole('option', { name: /NovaBook 14/ })).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page).toHaveURL(/products\/aster-novabook-14/);
  await expect(page.getByRole('heading', { name: 'NovaBook 14' })).toBeVisible();
});

test('filter and sort products with bookmarkable URL state', async ({ page }) => {
  await page.goto('/category/laptops');
  await page.getByLabel('Sort').selectOption('price_desc');
  await page.getByLabel('In stock only').click();
  await page.getByLabel('Deep Navy').click();
  await expect(page).toHaveURL(/sort=price_desc/);
  await expect(page).toHaveURL(/inStock=1/);
  await expect(page).toHaveURL(/colour=Deep\+Navy/);
  await expect(page.getByRole('button', { name: /colour: Deep Navy/ })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Deep Navy')).toBeChecked();
  await page.goBack();
  await expect(page.getByLabel('Deep Navy')).not.toBeChecked();
  await page.goForward();
  await expect(page.getByLabel('Deep Navy')).toBeChecked();
  await page.getByRole('button', { name: /colour: Deep Navy/ }).click();
  await expect(page).not.toHaveURL(/colour=/);
  await expect(page.getByTestId('product-grid').getByRole('article')).toHaveCount(6);
});

test('guest cart survives refresh and clear-cart confirmation returns focus', async ({ page }) => {
  await page.request.delete('/api/v1/cart');
  const product = (await (await page.request.get('/api/v1/products/aster-novabook-14')).json()).data
    .product;
  await page.request.post('/api/v1/cart/items', {
    data: { productId: product.id, variantId: product.variants[0].id, quantity: 1 },
  });
  await page.goto('/cart');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'NovaBook 14' })).toBeVisible();

  const clear = page.getByRole('button', { name: 'Clear cart', exact: true });
  await clear.click();
  const dialog = page.getByRole('dialog', { name: 'Clear your cart?' });
  await expect(dialog.getByRole('button', { name: 'Clear cart' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(clear).toBeFocused();
  await clear.click();
  await dialog.getByRole('button', { name: 'Clear cart' }).click();
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
});

test('open a product, change colour and add it to the cart', async ({ page }) => {
  await page.request.delete('/api/v1/cart');
  await page.goto('/products/aster-novabook-14');

  const galleryImage = page.locator('.gallery__main img');
  await expect(galleryImage).toHaveAttribute('src', /aster-novabook-14-deep-navy-01\.jpg$/);
  await page.getByRole('tab', { name: 'View 2' }).click();
  await expect(galleryImage).toHaveAttribute('src', /aster-novabook-14-deep-navy-02\.jpg$/);
  await page.getByLabel('Warm Silver').check();
  await expect(galleryImage).toHaveAttribute('src', /aster-novabook-14-warm-silver-01\.jpg$/);
  await expect(galleryImage).toHaveAttribute('alt', 'NovaBook 14 in Warm Silver, view 1');
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByRole('status')).toContainText('added to your cart');
  await expect(page.getByTestId('cart-badge')).toHaveText('2');

  await page.getByRole('button', { name: /Cart with 2 items/ }).click();
  await expect(
    page.getByRole('img', { name: 'NovaBook 14 in Warm Silver', exact: true }),
  ).toHaveAttribute('src', /aster-novabook-14-warm-silver-01\.jpg$/);
});

test('update and remove cart lines', async ({ page }) => {
  await page.request.delete('/api/v1/cart');
  const product = (await (await page.request.get('/api/v1/products/aster-novabook-14')).json()).data
    .product;
  await page.request.post('/api/v1/cart/items', {
    data: { productId: product.id, variantId: product.variants[0].id, quantity: 1 },
  });
  await page.goto('/cart');
  await expect(page.getByRole('img', { name: 'NovaBook 14 in Deep Navy' })).toHaveAttribute(
    'src',
    /aster-novabook-14-deep-navy-01\.jpg$/,
  );
  await page.getByLabel('Colour').selectOption({ label: 'Warm Silver' });
  await expect(page.getByRole('img', { name: 'NovaBook 14 in Warm Silver' })).toHaveAttribute(
    'src',
    /aster-novabook-14-warm-silver-01\.jpg$/,
  );
  await page.getByRole('button', { name: /Increase NovaBook 14 quantity/ }).click();
  await expect(page.getByLabel('Quantity for NovaBook 14')).toHaveValue('2');
  await page.getByRole('button', { name: 'Remove NovaBook 14' }).click();
  const removeDialog = page.getByRole('dialog', { name: 'Remove NovaBook 14?' });
  await expect(removeDialog).toBeVisible();
  await removeDialog.getByRole('button', { name: 'Remove item' }).click();
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
});

test('registration shows authoritative field validation', async ({ page }) => {
  await page.goto('/register');
  await page.getByRole('button', { name: 'Create demo account' }).click();
  await expect(page.getByRole('alert')).toContainText('Check the highlighted fields');
  await expect(
    page.getByText('Demo application — do not enter real personal or payment information.'),
  ).toBeVisible();
});

test('login and logout with the public demo account', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Fill demo credentials' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Demo Tester' })).toBeVisible();
  await page.getByText('Hi, Demo').click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Account', { exact: true })).toBeVisible();
});

test('demo account cannot access password changes or security-question recovery', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Fill demo credentials' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.goto('/account');
  await expect(page.getByRole('button', { name: 'Password & security' })).toHaveCount(0);

  await page.goto('/forgot-password');
  await page.getByLabel('Email address').fill(demo.email);
  await page.getByLabel('Security question').selectOption('childhood-book');
  await page.getByLabel('Security answer').fill('Anything private');
  await page.getByLabel(/^New password/).fill('Changed@12345');
  await page.getByLabel(/^Confirm new password/).fill('Changed@12345');
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'The account details or security answer are incorrect',
  );
});

test('guest cart merges after login', async ({ page }) => {
  await page.request.post('/api/v1/auth/login', { data: demo });
  await page.request.post('/api/v1/qa/reset');
  await page.request.post('/api/v1/auth/logout');
  const product = (await (await page.request.get('/api/v1/products/aster-novabook-14')).json()).data
    .product;
  await page.request.post('/api/v1/cart/items', {
    data: { productId: product.id, variantId: product.variants[0].id, quantity: 1 },
  });
  await page.goto('/login?returnTo=/cart');
  await page.getByLabel('Email address').fill(demo.email);
  await page.getByLabel('Password').fill(demo.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Your cart' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'NovaBook 14' })).toBeVisible();
});

test('contact form submission', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Email address').fill('qa@example.test');
  await page.getByLabel('Subject').fill('Automated contact scenario');
  await page
    .getByLabel('Message')
    .fill('This fictional message is long enough to exercise server validation safely.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('status')).toContainText('saved');
});

test('protected routes redirect to sign in', async ({ page }) => {
  await page.goto('/account');
  await expect(page).toHaveURL(/login\?returnTo=%2Faccount/);
});

test('nested product routes survive direct refresh', async ({ page }) => {
  await page.goto('/products/aster-novabook-14');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'NovaBook 14' })).toBeVisible();
  await expect(page).toHaveURL(/products\/aster-novabook-14/);
});

test('keyboard-only critical search flow', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.getByRole('combobox', { name: 'Search products' }).first().focus();
  await page.keyboard.type('Travel Dot');
  await expect(page.getByRole('option', { name: /^Travel Dot/ })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Travel Dot' })).toBeVisible();
});
