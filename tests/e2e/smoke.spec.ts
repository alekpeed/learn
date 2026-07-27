import { test, expect } from '@playwright/test';
import { createProfile } from './helpers.js';

test.describe('app smoke (Phase 1 exit: app opens, navigates, profile persists)', () => {
  test('opens on the welcome screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  });

  test('creates a local profile and reaches the dashboard', async ({ page }) => {
    await createProfile(page);
    await expect(page.getByText(/hello, ada/i)).toBeVisible();
  });

  test('profile persists across reload (local-first)', async ({ page }) => {
    await createProfile(page, 'Grace');

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText(/grace/i)).toBeVisible();
  });

  test('unknown route shows a recovery page', async ({ page }) => {
    await page.goto('/nowhere');
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
  });

  test('is keyboard navigable: skip link focuses first', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeFocused();
  });
});
