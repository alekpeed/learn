import { test, expect } from '@playwright/test';

test.describe('learning engine (Phase 4)', () => {
  test('a correct attempt shows up as skill-level progress', async ({ page }) => {
    // Local profile so attempts are recorded and projected.
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    await page.goto('/practice?skill=math.number_foundations.place_value');
    await page.getByLabel(/your answer/i).fill('50');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText(/correct/i)).toBeVisible();
    await page.getByRole('button', { name: /finish|next/i }).click();

    await page.goto('/progress');
    await expect(page.getByRole('heading', { name: /place value/i })).toBeVisible();
    // Five mastery dimensions are shown, not one course percentage.
    await expect(page.getByText('Understanding')).toBeVisible();
    await expect(page.getByText('Retention')).toBeVisible();
  });

  test('review queue is empty until something is scheduled', async ({ page }) => {
    await page.goto('/review');
    await expect(page.getByRole('heading', { name: /review queue/i })).toBeVisible();
    await expect(page.getByText(/nothing is due for review/i)).toBeVisible();
  });
});
