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

// Accessibility smoke: no serious/critical WCAG A/AA violations on core screens.
for (const { name, path } of [
  { name: 'welcome', path: '/' },
  { name: 'dashboard', path: '/dashboard' },
]) {
  test(`accessibility: ${name} has no serious/critical violations`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole('heading').first().waitFor();
    const violations = await analyze(page);
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
  });
}
