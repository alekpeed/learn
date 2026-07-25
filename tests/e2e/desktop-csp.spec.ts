/**
 * Regression guard for the desktop shell (DEC-017).
 *
 * The Tauri build serves the app under the Content-Security-Policy declared in
 * apps/desktop/src-tauri/tauri.conf.json, but the browser build has no CSP at
 * all. That gap once shipped a desktop app that opened to a blank window: Ajv
 * compiles JSON Schemas into functions at runtime, which needs 'unsafe-eval',
 * and the policy was blocking it - so the curriculum loader threw before React
 * could mount, and nothing else in the suite noticed.
 *
 * This test replays the real production CSP over the built bundle so any future
 * tightening that breaks startup fails here instead of in a downloaded
 * installer.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const conf = JSON.parse(
  readFileSync(join(here, '..', '..', 'apps', 'desktop', 'src-tauri', 'tauri.conf.json'), 'utf8'),
) as { app: { security: { csp: string } } };
const CSP = conf.app.security.csp;

test.describe('desktop shell CSP (DEC-017)', () => {
  test('the app still starts under the packaged Content-Security-Policy', async ({ page }) => {
    // Serve every response with the CSP the desktop build actually applies.
    await page.route('**/*', async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), 'content-security-policy': CSP },
      });
    });

    const violations: string[] = [];
    page.on('pageerror', (error) => violations.push(error.message));

    await page.goto('/');

    // React mounted and the shell rendered, rather than a blank document.
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    expect(violations, violations.join('\n')).toEqual([]);
  });

  test('the policy grants no network access beyond the tutor providers', () => {
    const connectSrc = /connect-src ([^;]+)/.exec(CSP)?.[1] ?? '';
    const remote = connectSrc
      .split(/\s+/)
      .filter((source) => source.startsWith('https://'))
      .sort();
    // Only the three BYOK tutor endpoints may be reached from the packaged app.
    expect(remote).toEqual([
      'https://api.anthropic.com',
      'https://api.openai.com',
      'https://generativelanguage.googleapis.com',
    ]);
  });
});
