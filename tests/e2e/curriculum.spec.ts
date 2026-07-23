import { test, expect } from '@playwright/test';

test.describe('curriculum platform (Phase 2)', () => {
  test('curriculum map shows skills and prerequisite relationships', async ({ page }) => {
    await page.goto('/map');
    await expect(page.getByRole('heading', { name: /curriculum map/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /number foundations/i })).toBeVisible();
    await expect(page.getByText(/builds on: counting and quantity/i).first()).toBeVisible();
  });

  test('opening a skill shows its lesson', async ({ page }) => {
    await page.goto('/map');
    await page.getByRole('link', { name: /comparing numbers/i }).click();
    await expect(page.getByRole('article', { name: /lesson: comparing numbers/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /worked example/i })).toBeVisible();
  });
});
