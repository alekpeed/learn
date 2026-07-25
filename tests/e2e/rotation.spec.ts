import { test, expect, type Page } from '@playwright/test';

/**
 * Practice used to walk a skill's questions in authored order from index 0 on
 * every visit, and review always served question 0, so a skill on the spaced
 * ladder showed one question seven times over three months. These check the
 * learner actually meets different questions.
 */
const SKILL = 'math.number_foundations.place_value';

async function signIn(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel(/your name/i).fill('Ada');
  await page.getByRole('button', { name: /start learning/i }).click();
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
}

async function openPractice(page: Page): Promise<string> {
  await page.goto(`/practice?skill=${SKILL}`);
  const prompt = page.locator('.question-prompt');
  await expect(prompt).toBeVisible();
  return (await prompt.textContent()) ?? '';
}

/**
 * Submit something for whatever question type is on screen. Correctness does
 * not matter here - any graded attempt records the exposure that rotation
 * reads.
 */
async function answerAnything(page: Page): Promise<void> {
  const text = page.locator('#answer-input');
  const radio = page.locator('input[type="radio"]');
  const check = page.locator('input[type="checkbox"]');
  if (await text.count()) await text.fill('1');
  else if (await radio.count()) await radio.first().check();
  else if (await check.count()) await check.first().check();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('.feedback')).toBeVisible();
}

test.describe('question rotation', () => {
  test('a second visit to a skill does not reopen on the same question', async ({ page }) => {
    await signIn(page);
    const first = await openPractice(page);
    await answerAnything(page);
    expect(await openPractice(page)).not.toBe(first);
  });

  test('the order is stable within a single visit', async ({ page }) => {
    await signIn(page);
    await openPractice(page);
    const shown = page.locator('.question-prompt');
    const before = await shown.textContent();
    // Reading a hint re-renders without changing which question is asked.
    await page.getByRole('button', { name: /show a hint/i }).click();
    await expect(shown).toHaveText(before ?? '');
  });

  test('an answered question is not re-served while unseen ones remain', async ({ page }) => {
    await signIn(page);
    const seen: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const prompt = await openPractice(page);
      expect(seen, `visit ${i + 1} repeated a question`).not.toContain(prompt);
      seen.push(prompt);
      await answerAnything(page);
    }
    expect(new Set(seen).size).toBe(4);
  });
});
