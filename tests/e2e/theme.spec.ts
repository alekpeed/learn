/**
 * Dark mode (doc 11 sec 4).
 *
 * The theme is pure CSS: LearnerContext writes data-theme onto <html> and the
 * stylesheet resolves it, with 'system' deferring to prefers-color-scheme. These
 * tests assert on computed colours rather than on the attribute, so a palette
 * that stops being wired up fails here even though the attribute still flips.
 */
import { test, expect } from '@playwright/test';

/** Perceived lightness of a computed `rgb(...)` colour, 0 (black) to 1 (white). */
async function rootLightness(page: import('@playwright/test').Page): Promise<number> {
  const color = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
  const [r, g, b] = (/rgba?\(([^)]+)\)/.exec(color)?.[1] ?? '0,0,0')
    .split(',')
    .map((part) => Number(part.trim()) / 255);
  return 0.2126 * (r as number) + 0.7152 * (g as number) + 0.0722 * (b as number);
}

async function createProfile(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel(/your name/i).fill('Ada');
  await page.getByRole('button', { name: /start learning/i }).click();
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
}

test('a chosen dark theme darkens the app and survives a reload', async ({ page }) => {
  await createProfile(page);
  expect(await rootLightness(page)).toBeGreaterThan(0.8);

  await page.goto('/settings');
  await page.getByLabel(/theme/i).selectOption('dark');
  await expect.poll(() => rootLightness(page)).toBeLessThan(0.2);

  // Persisted in the event log, so a restart comes back dark.
  await page.reload();
  await expect(page.getByLabel(/theme/i)).toHaveValue('dark');
  expect(await rootLightness(page)).toBeLessThan(0.2);
});

test('the default theme follows the operating system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await createProfile(page);
  expect(await rootLightness(page)).toBeLessThan(0.2);

  await page.emulateMedia({ colorScheme: 'light' });
  expect(await rootLightness(page)).toBeGreaterThan(0.8);
});

test('an explicit choice overrides the operating system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await createProfile(page);

  await page.goto('/settings');
  await page.getByLabel(/theme/i).selectOption('light');
  await expect.poll(() => rootLightness(page)).toBeGreaterThan(0.8);
});

test('body text keeps a readable contrast ratio in dark mode', async ({ page }) => {
  await createProfile(page);
  await page.goto('/settings');
  await page.getByLabel(/theme/i).selectOption('dark');
  await expect.poll(() => rootLightness(page)).toBeLessThan(0.2);

  const ratio = await page.evaluate(() => {
    const channel = (c: number): number =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const luminance = (css: string): number => {
      const parts = (/rgba?\(([^)]+)\)/.exec(css)?.[1] ?? '0,0,0')
        .split(',')
        .map((p) => channel(Number(p.trim()) / 255));
      return 0.2126 * (parts[0] ?? 0) + 0.7152 * (parts[1] ?? 0) + 0.0722 * (parts[2] ?? 0);
    };
    const style = getComputedStyle(document.body);
    const rootStyle = getComputedStyle(document.documentElement);
    const a = luminance(style.color);
    const b = luminance(rootStyle.backgroundColor);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  // WCAG AA for body text.
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
