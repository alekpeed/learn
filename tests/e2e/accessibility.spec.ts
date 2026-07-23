import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');

interface AxeViolation {
  id: string;
  impact?: string;
  nodes: unknown[];
}

async function analyze(page: import('@playwright/test').Page): Promise<AxeViolation[]> {
  await page.addScriptTag({ path: axePath });
  const result = (await page.evaluate(async () => {
    // @ts-expect-error axe is injected onto window by the script tag above.
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });
  })) as { violations: AxeViolation[] };
  return result.violations;
}

async function auditNoSeriousViolations(
  page: import('@playwright/test').Page,
  name: string,
): Promise<void> {
  await page.getByRole('heading').first().waitFor();
  const violations = await analyze(page);
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious, `${name}: ${JSON.stringify(serious.map((v) => v.id))}`).toEqual([]);
}

test('welcome screen has no serious/critical violations', async ({ page }) => {
  await page.goto('/');
  await auditNoSeriousViolations(page, 'welcome');
});

// Accessibility audit (REL-003) across every core screen, with a profile so the
// full controls render.
test('all core screens pass the accessibility audit', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/your name/i).fill('Ada');
  await page.getByRole('button', { name: /start learning/i }).click();
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

  for (const path of [
    '/dashboard',
    '/map',
    '/practice',
    '/progress',
    '/review',
    '/diagnostic',
    '/settings',
  ]) {
    await page.goto(path);
    await auditNoSeriousViolations(page, path);
  }
});
