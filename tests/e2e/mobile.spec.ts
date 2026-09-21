import { expect, test } from '@playwright/test';

test('mobile navigation is usable at 390px', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const drawer = page.getByRole('dialog', { name: 'Navigation' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('link', { name: 'Tablets' }).click();
  await expect(page).toHaveURL(/category\/tablets/);
  await expect(page.getByRole('heading', { name: 'Tablets' })).toBeVisible();
});
