import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const route of ['/', '/products', '/products/aster-novabook-14', '/contact', '/login']) {
  test(`accessibility smoke check: ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.locator('main').waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
