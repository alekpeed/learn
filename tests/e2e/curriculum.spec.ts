import { test, expect } from '@playwright/test';

test.describe('curriculum platform (Phase 2)', () => {
  test('curriculum map shows skills and prerequisite gating', async ({ page }) => {
    await page.goto('/map');
    await expect(page.getByRole('heading', { name: /curriculum map/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /number foundations/i })).toBeVisible();
    // A dependent skill is locked until its prerequisite is mastered.
    await expect(
      page.getByText(/unlock by mastering: counting and quantity/i).first(),
    ).toBeVisible();
  });

  test('opening an unlocked skill shows its lesson', async ({ page }) => {
    await page.goto('/map');
    await page.getByRole('link', { name: 'Counting and Quantity', exact: true }).click();
    await expect(
      page.getByRole('article', { name: /lesson: counting and quantity/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /worked example/i })).toBeVisible();
  });
});
