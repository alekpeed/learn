import { test, expect } from '@playwright/test';

test.describe('AI tutor (Phase 8)', () => {
  test('is off by default and the app works without it', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();

    await page.goto('/lesson?skill=math.number_foundations.counting_and_quantity');
    await expect(page.getByRole('complementary', { name: /ai tutor/i })).toContainText(
      /the ai tutor is off/i,
    );
    // The lesson itself still renders fully without the tutor.
    await expect(page.getByRole('article', { name: /lesson:/i })).toBeVisible();
  });

  test('can be enabled in settings and then gives grounded help', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Grace');
    await page.getByRole('button', { name: /start learning/i }).click();

    await page.goto('/settings');
    await page.getByLabel(/ai tutor/i).check();

    await page.goto('/lesson?skill=math.number_foundations.counting_and_quantity');
    await page.getByRole('button', { name: /explain differently/i }).click();
    await expect(page.getByRole('region', { name: /tutor response/i })).toContainText(
      /Counting and Quantity/i,
    );
  });
});
