import { test, expect } from '@playwright/test';
import { createProfile } from './helpers.js';

test.describe('learner notes (Version 1)', () => {
  test('a note saved on a lesson persists across a reload', async ({ page }) => {
    await createProfile(page);

    await page.goto('/lesson?skill=math.number_foundations.counting_and_quantity');
    await page.getByLabel(/notes for this skill/i).fill('the last number counted is the total');
    await page.getByRole('button', { name: /save note/i }).click();
    await expect(page.getByText(/^saved\.$/i)).toBeVisible();

    // Reload — the note is loaded back from local storage.
    await page.goto('/lesson?skill=math.number_foundations.counting_and_quantity');
    await expect(page.getByLabel(/notes for this skill/i)).toHaveValue(/the last number counted/i);
  });
});
