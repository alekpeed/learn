import { test, expect, type Page } from '@playwright/test';
import { createProfile } from './helpers.js';

/**
 * Mastery check end to end (doc 07 "Mastery Check"). The five requirements are
 * asserted where a learner would see them: an explicit start, no hint button,
 * no per-question verdict, an immediate result, and a named next action.
 *
 * The run here answers wrongly on purpose. A passing run would need six correct
 * answers to whichever items rotation happens to serve, which would pin this
 * test to particular content; the pass path is covered deterministically in
 * packages/learning-engine/tests/mastery-check.test.ts.
 */
const SKILL = 'math.number_foundations.place_value';

/** Answer whatever input the current item uses, wrongly. */
async function answerWrongly(page: Page): Promise<void> {
  const text = page.locator('#answer-input');
  const radio = page.locator('input[type="radio"]');
  const check = page.locator('input[type="checkbox"]');
  if (await text.count()) await text.fill('-99999');
  else if (await radio.count()) await radio.last().check();
  else if (await check.count()) await check.first().check();
  await page.getByRole('button', { name: 'Submit' }).click();
}

test.describe('mastery check', () => {
  test('runs from an explicit start to an immediate verdict', async ({ page }) => {
    await createProfile(page);
    await page.goto(`/mastery-check?skill=${SKILL}`);

    // Clear start: nothing is asked until the learner says go.
    const start = page.getByRole('button', { name: /start the check/i });
    await expect(start).toBeVisible();
    await expect(page.locator('.question-prompt')).toHaveCount(0);
    await start.click();

    const counter = page.getByText(/question 1 of/i);
    await expect(counter).toBeVisible();
    const total = Number(/of (\d+)/.exec((await counter.textContent()) ?? '')?.[1] ?? '0');
    expect(total).toBeGreaterThan(1);

    for (let i = 0; i < total; i += 1) {
      // No ordinary hints, and no verdict per item.
      await expect(page.getByRole('button', { name: /show a hint/i })).toHaveCount(0);
      await expect(page.locator('.feedback')).toHaveCount(0);
      await answerWrongly(page);
      if (i < total - 1) {
        await expect(page.getByText(/answer recorded/i)).toBeVisible();
        await page.getByRole('button', { name: /next question/i }).click();
      }
    }

    // Clear finish, immediate result, specific recommendation.
    const panel = page.locator('.check-panel[data-outcome]');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-outcome', 'not_yet');
    await expect(panel).toContainText(new RegExp(`0 of ${total} correctly`, 'i'));
    await expect(panel).toContainText(/retake|practis|misunderstanding/i);
    await expect(page.getByRole('button', { name: /take it again/i })).toBeVisible();
  });

  test('asks for a skill when opened without one', async ({ page }) => {
    await createProfile(page);
    await page.goto('/mastery-check');
    await expect(page.getByText(/choose a skill/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open the curriculum map' })).toBeVisible();
  });

  test('is reachable from a skill on the curriculum map', async ({ page }) => {
    await createProfile(page);
    await page.goto('/map');
    // Scoped to the skill list: the primary nav also has a "Mastery check"
    // link, and that one carries no skill.
    await page
      .locator('.skill-actions')
      .getByRole('link', { name: /mastery check/i })
      .first()
      .click();
    await expect(page.getByRole('button', { name: /start the check/i })).toBeVisible();
  });
});
