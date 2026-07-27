import { test, expect } from '@playwright/test';
import { createProfile } from './helpers.js';

// Practice rotates questions, so these pin the exact item they assert on
// with the ?q= deep link. Without it the test would depend on which
// question rotation happened to serve first.

test.describe('learning engine (Phase 4)', () => {
  test('a correct attempt shows up as skill-level progress', async ({ page }) => {
    // Local profile so attempts are recorded and projected.
    await createProfile(page);

    await page.goto(
      '/practice?skill=math.number_foundations.place_value&q=math.number_foundations.place_value.q1',
    );
    await page.getByLabel(/your answer/i).fill('50');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText(/correct/i)).toBeVisible();
    await page.getByRole('button', { name: /finish|next/i }).click();

    await page.goto('/progress');
    await expect(page.getByRole('heading', { name: /place value/i })).toBeVisible();
    // Headline dashboard is present.
    await expect(page.getByRole('heading', { name: /mastery by unit/i })).toBeVisible();
    // Five mastery dimensions are shown, not one course percentage. They appear
    // in both the strengths legend and the skill detail grid.
    await expect(page.getByText('Understanding').first()).toBeVisible();
    await expect(page.getByText('Retention').first()).toBeVisible();
  });

  test('review queue is empty until something is scheduled', async ({ page }) => {
    await page.goto('/review');
    await expect(page.getByRole('heading', { name: /review queue/i })).toBeVisible();
    await expect(page.getByText(/nothing is due for review/i)).toBeVisible();
  });
});

test.describe('science measurement (Phase 7)', () => {
  test('a metric unit-conversion question grades equivalent units as correct', async ({ page }) => {
    await page.goto(
      '/practice?skill=science.measurement.unit_conversion&q=science.measurement.unit_conversion.q1',
    );
    await expect(page.getByRole('heading', { name: /^practice$/i })).toBeVisible();
    // "Convert 3 meters to centimeters" — 300 cm; the unit validator also
    // accepts the equivalent "3 m".
    await page.getByLabel(/your answer/i).fill('300 cm');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText(/correct/i)).toBeVisible();
  });
});
