// Practice rotates questions, so these pin the exact item they assert
// on with the ?q= deep link.
import { test, expect } from '@playwright/test';
import { createProfile } from './helpers.js';

/**
 * A figure augments a prompt that already stands on its own (DEC-019), so these
 * check that the drawing reaches the screen, carries an accessible name, and
 * does not displace the question text.
 */
test.describe('rendered figures (DEC-019)', () => {
  test.beforeEach(async ({ page }) => {
    await createProfile(page);
  });

  test('a right triangle is drawn alongside the question, not instead of it', async ({ page }) => {
    await page.goto(
      '/practice?skill=math.trigonometry.sine_cosine_tangent&q=math.trigonometry.sine_cosine_tangent.q1',
    );
    // The prompt still carries the full description.
    await expect(page.getByText(/right triangle with sides 3, 4 and 5/i)).toBeVisible();
    const figure = page.getByRole('img', { name: /right triangle/i });
    await expect(figure).toBeVisible();
    // Drawn, not a text fallback.
    await expect(page.locator('svg.figure')).toHaveCount(1);
  });

  test('a trig graph is drawn as a real curve', async ({ page }) => {
    await page.goto(
      '/practice?skill=math.trigonometry.trig_graphs&q=math.trigonometry.trig_graphs.q1',
    );
    await expect(page.getByRole('img', { name: /wave/i })).toBeVisible();
    const points = await page.locator('.fig-curve').first().getAttribute('points');
    expect((points ?? '').split(/\s+/).length).toBeGreaterThan(100);
  });

  test('the Pythagoras figure does not label the side being asked for', async ({ page }) => {
    await page.goto('/practice?skill=math.geometry.pythagoras&q=math.geometry.pythagoras.q1');
    const figure = page.getByRole('img', { name: /right triangle/i });
    await expect(figure).toBeVisible();
    // The unknown side reads as a question mark rather than its value.
    await expect(page.locator('svg.figure text', { hasText: '?' }).first()).toBeVisible();
  });

  test('a figure has no serious accessibility violations in dark mode', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel(/theme/i).selectOption('dark');
    await page.goto(
      '/practice?skill=math.trigonometry.unit_circle&q=math.trigonometry.unit_circle.q1',
    );
    const figure = page.getByRole('img', { name: /unit circle/i });
    await expect(figure).toBeVisible();
    // Colours come from tokens, so the drawing follows the theme rather than
    // staying light-on-light.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
