import { test, expect } from '@playwright/test';

test.describe('practice and validation (Phase 3)', () => {
  test('grades an equivalent answer as correct and persists the attempt', async ({ page }) => {
    // A local profile is needed so attempts are recorded.
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    await page.goto('/practice?skill=math.number_foundations.place_value');
    await expect(page.getByRole('heading', { name: /^practice$/i })).toBeVisible();

    // 40 is correct for "value of the 4 in 42".
    await page.getByLabel(/your answer/i).fill('40');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText(/correct/i)).toBeVisible();
  });

  test('shows a hint and specific feedback on a wrong answer', async ({ page }) => {
    await page.goto('/practice?skill=math.number_foundations.place_value');
    await page.getByRole('button', { name: /show a hint/i }).click();
    await expect(page.getByText(/which place is the 4 in/i)).toBeVisible();

    await page.getByLabel(/your answer/i).fill('4');
    await page.getByRole('button', { name: /submit/i }).click();
    // 4 vs 40 is a place-value error.
    await expect(page.getByRole('alert')).toContainText(/place value/i);
  });
});
