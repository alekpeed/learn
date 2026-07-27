import { test, expect } from '@playwright/test';
import { createProfile } from './helpers.js';

/**
 * Bare /practice used to serve pkg.questions - every question in the curriculum
 * in one flat rotation - so it offered items from locked skills and from
 * subjects the learner had not chosen. Doc 02 requires the system to prevent
 * advancement past unstable prerequisites, so that fallback was a defect, not a
 * preference. These pin the replacement.
 */
test.describe('practice entry point', () => {
  test('sends a new learner to a single unlocked skill, not the whole curriculum', async ({
    page,
  }) => {
    await createProfile(page);
    await page.goto('/practice');

    // Redirected to a named skill, so a reload and a bookmark behave the same.
    await expect(page).toHaveURL(/\/practice\?skill=/);

    // The counter is a single skill's pool, not the ~1,900-question curriculum.
    const counter = page.getByText(/question \d+ of \d+/i);
    await expect(counter).toBeVisible();
    const total = Number(/of (\d+)/.exec((await counter.textContent()) ?? '')?.[1] ?? '0');
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(40);
  });

  test('opens at the very first skill, not somewhere in the middle', async ({ page }) => {
    await createProfile(page);
    await page.goto('/practice');
    // Nothing has been learned yet, so the frontier is the start of the course.
    await expect(page).toHaveURL(/skill=math\.number_foundations\./);
  });

  test('never serves a question from a locked skill', async ({ page }) => {
    await createProfile(page);
    await page.goto('/practice');
    await expect(page).toHaveURL(/\/practice\?skill=/);

    const skill = new URL(page.url()).searchParams.get('skill') ?? '';
    // The map is the authority on lock state; the skill we landed on must not
    // be shown as locked there.
    await page.goto('/map');
    const node = page.locator(`.skill-node`).filter({ hasText: skill.split('.').pop() ?? '' });
    if (await node.count()) {
      await expect(node.first()).toHaveAttribute('data-locked', 'false');
    }
  });

  async function chooseSubject(page: import('@playwright/test').Page, label: string) {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();
    await page.getByLabel(/what do you want to work on/i).selectOption({ label });
    await page.getByRole('button', { name: /save and start/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  }

  test('the chosen subject decides which skill practice opens on', async ({ page }) => {
    await chooseSubject(page, 'Scientific Reasoning and Measurement');
    await page.goto('/practice');
    await expect(page).toHaveURL(/skill=science\./);
  });

  /*
   * Gating outranks the subject. Every biology skill sits behind scientific
   * observation and evidence, so at a standing start nothing in that subject is
   * open - and the learner is sent to the frontier of the curriculum rather
   * than to a locked skill or a dead end.
   */
  test('falls back past the subject rather than dead-ending on locked skills', async ({ page }) => {
    await chooseSubject(page, 'Introductory Biology');
    await page.goto('/practice');
    await expect(page).toHaveURL(/\/practice\?skill=/);
    await expect(page).not.toHaveURL(/skill=biology\./);
  });
});
