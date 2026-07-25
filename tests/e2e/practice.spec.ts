import { test, expect } from '@playwright/test';

// Practice rotates questions, so these pin the exact item they assert on
// with the ?q= deep link. Without it the test would depend on which
// question rotation happened to serve first.

test.describe('practice and validation (Phase 3)', () => {
  test('grades an equivalent answer as correct and persists the attempt', async ({ page }) => {
    // A local profile is needed so attempts are recorded.
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    await page.goto(
      '/practice?skill=math.number_foundations.place_value&q=math.number_foundations.place_value.q1',
    );
    await expect(page.getByRole('heading', { name: /^practice$/i })).toBeVisible();

    // 50 is correct for "value of the 5 in 356".
    await page.getByLabel(/your answer/i).fill('50');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText(/correct/i)).toBeVisible();
  });

  test('shows a hint and specific feedback on a wrong answer', async ({ page }) => {
    await page.goto(
      '/practice?skill=math.number_foundations.place_value&q=math.number_foundations.place_value.q1',
    );
    await page.getByRole('button', { name: /show a hint/i }).click();
    // A hint is revealed (content-agnostic: the hints list appears).
    await expect(page.getByRole('region', { name: /hints/i })).toBeVisible();

    // Answering "5" (the digit) instead of 50 is the face-value misconception,
    // which the author tagged - so since Phase 17 the feedback names the actual
    // mistake and how to fix it, rather than the generic place-value rule.
    await page.getByLabel(/your answer/i).fill('5');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByRole('alert')).toContainText(/common mistake/i);
    await expect(page.getByRole('alert')).toContainText(/tens column/i);
  });
});
