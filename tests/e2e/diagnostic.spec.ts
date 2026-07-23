import { test, expect } from '@playwright/test';

test.describe('diagnostic (Phase 5)', () => {
  test('runs the adaptive diagnostic and recommends a starting point', async ({ page }) => {
    await page.goto('/diagnostic');
    await expect(page.getByRole('heading', { name: /^diagnostic$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /skip/i })).toBeVisible();

    // Answer probes until results appear (binary search over the full graph).
    for (let i = 0; i < 12; i++) {
      const done = await page
        .getByRole('heading', { name: /diagnostic results/i })
        .isVisible()
        .catch(() => false);
      if (done) break;

      const textInput = page.getByLabel(/your answer/i);
      if (await textInput.isVisible().catch(() => false)) {
        await textInput.fill('40');
      } else {
        const radio = page.getByRole('radio').first();
        if (await radio.isVisible().catch(() => false)) {
          await radio.check();
        } else {
          break;
        }
      }
      await page.getByRole('button', { name: /submit/i }).click();
    }

    await expect(page.getByRole('heading', { name: /diagnostic results/i })).toBeVisible();
    await expect(page.getByText(/recommended starting point/i)).toBeVisible();
    await expect(page.getByLabel(/choose a starting skill/i)).toBeVisible();
  });

  test('diagnostic can be skipped without penalty framing', async ({ page }) => {
    await page.goto('/diagnostic');
    await expect(page.getByText(/there is no penalty/i)).toBeVisible();
  });
});
