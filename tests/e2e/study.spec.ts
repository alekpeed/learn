import { test, expect } from '@playwright/test';
import { createProfile } from './helpers.js';

// Practice rotates questions, so these pin the exact item they assert on
// with the ?q= deep link. Without it the test would depend on which
// question rotation happened to serve first.

test.describe('study plans & daily goals (Version 1)', () => {
  test('the Today panel tracks the daily goal and streak after practice', async ({ page }) => {
    await createProfile(page);

    // Before practice: goal shows 0 of 10.
    await expect(page.getByRole('region', { name: /today's plan/i })).toContainText(
      /0 of 10 questions/i,
    );

    // Answer one question.
    await page.goto(
      '/practice?skill=math.number_foundations.place_value&q=math.number_foundations.place_value.q1',
    );
    await page.getByLabel(/your answer/i).fill('50');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText('Correct!')).toBeVisible();

    // Dashboard now shows 1 of 10 and a streak.
    await page.goto('/dashboard');
    const today = page.getByRole('region', { name: /today's plan/i });
    await expect(today).toContainText(/1 of 10 questions/i);
    await expect(today).toContainText(/1-day streak/i);
  });

  test('the daily goal can be changed in settings', async ({ page }) => {
    await createProfile(page, 'Grace');

    await page.goto('/settings');
    await page.getByLabel(/daily goal/i).fill('5');
    await page.goto('/dashboard');
    await expect(page.getByRole('region', { name: /today's plan/i })).toContainText(
      /0 of 5 questions/i,
    );
  });
});
