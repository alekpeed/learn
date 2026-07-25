import { test, expect } from '@playwright/test';

test.describe('AI tutor (Phase 8)', () => {
  test('is off by default and the app works without it', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();

    await page.goto('/lesson?skill=math.number_foundations.counting_and_quantity');
    await expect(page.getByRole('complementary', { name: /ai tutor/i })).toContainText(
      /the ai tutor is off/i,
    );
    // The lesson itself still renders fully without the tutor.
    await expect(page.getByRole('article', { name: /lesson:/i })).toBeVisible();
  });

  test('can be enabled in settings and then gives grounded help', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Grace');
    await page.getByRole('button', { name: /start learning/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    await page.goto('/settings');
    // The checkbox is async-controlled; click once (check() would auto-retry).
    await page.getByLabel(/ai tutor/i).click();
    // The provider picker only renders once the setting has been written to the
    // event log and read back, so this is the signal that it is safe to navigate.
    // Without it the next goto can outrun the write and the tutor stays off.
    await expect(page.getByLabel(/provider/i)).toBeVisible();

    await page.goto('/lesson?skill=math.number_foundations.counting_and_quantity');
    await page.getByRole('button', { name: /explain differently/i }).click();
    await expect(page.getByRole('region', { name: /tutor response/i })).toContainText(
      /Counting and Quantity/i,
    );
  });
});

test.describe('offline + data (Phase 9)', () => {
  test('offline banner appears and in-app navigation still works', async ({ page, context }) => {
    await page.goto('/dashboard');
    await context.setOffline(true);
    // Trigger the offline event and verify the banner.
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText(/you are offline/i)).toBeVisible();
    // Client-side navigation of the already-loaded app works offline (bundled
    // content, no network needed). A full page reload would need a service
    // worker, which is a post-MVP enhancement.
    await page.getByRole('link', { name: 'Curriculum map' }).click();
    await expect(page.getByRole('heading', { name: /curriculum map/i })).toBeVisible();
    await context.setOffline(false);
  });

  test('settings exposes progress export and import', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: /export progress/i })).toBeVisible();
    await expect(page.getByLabel(/import progress from a file/i)).toBeVisible();
  });
});

test.describe('BYOK provider selection (DEC-015)', () => {
  test('lets the learner choose a provider and save a key', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    await page.goto('/settings');
    await page.getByLabel(/ai tutor/i).click();
    await page.getByLabel(/tutor provider/i).selectOption('openai');
    await page.getByLabel(/api key/i).fill('sk-test-key');
    await page.getByRole('button', { name: /save key/i }).click();
    await expect(page.getByText(/key is saved on this device/i)).toBeVisible();
  });
});
