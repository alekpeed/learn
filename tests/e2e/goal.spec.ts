import { test, expect } from '@playwright/test';

/**
 * Goal Selection sits between Welcome and the Dashboard (doc 07 §1). These
 * check the flow a learner actually walks, and that a chosen subject survives
 * a reload - the choice is an event, so nothing about it is session state.
 */
test.describe('goal selection', () => {
  test('a new profile is taken to goal selection, and can skip it', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();

    await expect(page.getByRole('heading', { name: /goal selection/i })).toBeVisible();
    await page.getByRole('button', { name: /skip for now/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('choices are saved and shown back on a return visit', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();

    await page
      .getByLabel(/what do you want to work on/i)
      .selectOption({ label: 'Core Mathematics' });
    await page.getByLabel(/how long is a sitting/i).selectOption('30');
    await page.getByLabel(/days per week/i).selectOption('3');
    await page.getByLabel(/working towards/i).fill('finish algebra by autumn');
    await page.getByRole('button', { name: /save and start/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Reload, then reopen: everything is projected back out of the event log.
    await page.reload();
    await page.goto('/goal');
    await expect(page.getByLabel(/how long is a sitting/i)).toHaveValue('30');
    await expect(page.getByLabel(/days per week/i)).toHaveValue('3');
    await expect(page.getByLabel(/working towards/i)).toHaveValue('finish algebra by autumn');
  });

  test('choosing the diagnostic as a starting point goes there', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();

    await page.getByRole('radio', { name: /take a short diagnostic/i }).check();
    await page.getByRole('button', { name: /save and take the diagnostic/i }).click();
    await expect(page.getByRole('heading', { name: /diagnostic/i })).toBeVisible();
  });

  test('is reachable again from Settings', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();
    await page.getByRole('button', { name: /skip for now/i }).click();

    await page.goto('/settings');
    await page.getByRole('link', { name: /change your subject/i }).click();
    await expect(page.getByRole('heading', { name: /goal selection/i })).toBeVisible();
  });
});
