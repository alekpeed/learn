import { test, expect } from '@playwright/test';
import { createProfile } from './helpers.js';

/**
 * Bare /practice used to serve pkg.questions - every question in the curriculum
 * in one flat rotation - so it offered items from locked skills and from
 * subjects the learner had not chosen. Doc 02 requires the system to prevent
 * advancement past unstable prerequisites, so that fallback was a defect, not a
 * preference. It is now a sectioned index. These pin the replacement.
 */
test.describe('practice entry point', () => {
  test('lands on sections, not on a flat run of every question', async ({ page }) => {
    await createProfile(page);
    await page.goto('/practice');

    // No question is served until a skill is named.
    await expect(page.locator('.question-prompt')).toHaveCount(0);
    await expect(page.getByText(/question \d+ of \d+/i)).toHaveCount(0);

    // Units are the sections, and there are many of them.
    const sections = page.locator('.unit-section');
    expect(await sections.count()).toBeGreaterThan(5);
    await expect(sections.first()).toContainText(/\d+ skills, \d+ questions/);
  });

  test('offers the next skill in one click, and practising it stays in that skill', async ({
    page,
  }) => {
    await createProfile(page);
    await page.goto('/practice');

    await page
      .getByRole('link', { name: /^practise /i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/practice\?skill=/);

    // A single skill's pool, not the ~1,900-question curriculum.
    const counter = page.getByText(/question \d+ of \d+/i);
    await expect(counter).toBeVisible();
    const total = Number(/of (\d+)/.exec((await counter.textContent()) ?? '')?.[1] ?? '0');
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(40);
  });

  test('opens the section the learner is actually in', async ({ page }) => {
    await createProfile(page);
    await page.goto('/practice');
    // Nothing learned yet, so the frontier is the start of the course and that
    // section is the one expanded.
    const open = page.locator('.unit-section[open]');
    await expect(open).toHaveCount(1);
    await expect(open).toContainText(/number foundations/i);
  });

  test('lists locked skills but does not let them be practised', async ({ page }) => {
    await createProfile(page);
    await page.goto('/practice');

    const locked = page.locator('.skill-node[data-locked="true"]').first();
    await expect(locked).toBeVisible();
    // Named, with its prerequisites shown, but not a link.
    await expect(locked).toContainText(/unlock by mastering:/i);
    await expect(locked.locator('a')).toHaveCount(0);
  });

  async function chooseSubject(page: import('@playwright/test').Page, label: string) {
    await page.goto('/');
    await page.getByLabel(/your name/i).fill('Ada');
    await page.getByRole('button', { name: /start learning/i }).click();
    await page.getByLabel(/what do you want to work on/i).selectOption({ label });
    await page.getByRole('button', { name: /save and start/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  }

  test('the chosen subject decides which sections are listed', async ({ page }) => {
    await chooseSubject(page, 'Scientific Reasoning and Measurement');
    await page.goto('/practice');

    await expect(page.locator('.unit-section')).toContainText([/scientific thinking/i]);
    await expect(page.getByText(/trigonometry/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^practise /i }).first()).toBeVisible();
  });

  /*
   * Gating outranks the subject. Every biology skill sits behind scientific
   * observation and evidence, so at a standing start nothing in that subject is
   * open - the sections still show biology, because seeing what is there and
   * what it waits on is the point, but the one-click offer points at the
   * curriculum frontier rather than at a locked skill.
   */
  test('falls back past the subject rather than dead-ending on locked skills', async ({ page }) => {
    await chooseSubject(page, 'Introductory Biology');
    await page.goto('/practice');

    await expect(page.locator('.unit-section')).toContainText([/cells, genetics and ecosystems/i]);
    const offer = page.getByRole('link', { name: /^practise /i }).first();
    await expect(offer).toBeVisible();
    await offer.click();
    await expect(page).toHaveURL(/\/practice\?skill=/);
    await expect(page).not.toHaveURL(/skill=biology\./);
  });
});
