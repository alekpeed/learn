import { expect, type Page } from '@playwright/test';

/**
 * Create a local profile and land on the dashboard.
 *
 * The real flow is Welcome -> Goal Selection -> Dashboard (doc 07 §1), and
 * Goal Selection is skippable, so this takes the skip. Tests that care about
 * goal selection itself drive it directly rather than through here.
 */
export async function createProfile(page: Page, name = 'Ada'): Promise<void> {
  await page.goto('/');
  await page.getByLabel(/your name/i).fill(name);
  await page.getByRole('button', { name: /start learning/i }).click();
  await page.getByRole('button', { name: /skip for now/i }).click();
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
}
