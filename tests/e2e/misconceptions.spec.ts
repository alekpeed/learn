/**
 * Misconception diagnosis and remediation (Phase 17).
 *
 * The value of tagging wrong answers in content only shows up end to end: an
 * authored wrong answer has to be matched by the deterministic diagnoser, the
 * catalog's correction has to reach the screen, and a repeat has to survive a
 * reload as a sticking point - which it can only do if the misconception was
 * written to the event log.
 */
import { test, expect } from '@playwright/test';

async function createProfile(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel(/your name/i).fill('Ada');
  await page.getByRole('button', { name: /start learning/i }).click();
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
}

const SKILL = 'math.fractions.add_like_denominators';
/** The classic slip: add numerators and denominators, so 1/5 + 2/5 -> 3/10. */
const WRONG = '3/10';

async function answerWrongly(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`/practice?skill=${SKILL}`);
  await page.getByLabel(/your answer/i).fill(WRONG);
  await page.getByRole('button', { name: /submit/i }).click();
  // Wait for the feedback before any caller navigates away, so the attempt has
  // reached the event store rather than being lost to the next page load.
  await expect(page.getByRole('alert')).toBeVisible();
}

test('an authored wrong answer gets the catalog correction, not a generic message', async ({
  page,
}) => {
  await createProfile(page);
  await answerWrongly(page);

  await expect(page.getByRole('alert')).toContainText(/common mistake/i);
  await expect(page.getByRole('alert')).toContainText(
    /add the numerators and keep the denominator/i,
  );
});

test('a repeated misconception becomes a sticking point that survives a reload', async ({
  page,
}) => {
  await createProfile(page);
  await answerWrongly(page);
  await answerWrongly(page);

  // Second time round the remediation escalates.
  await expect(page.getByRole('heading', { name: /this one keeps coming up/i })).toBeVisible();

  // Recorded in the event log, so it is still there after a restart.
  await page.goto('/progress');
  await page.reload();
  await expect(page.getByRole('heading', { name: /sticking points/i })).toBeVisible();
  await expect(page.getByText(/adds numerators and denominators separately/i)).toBeVisible();
});

test('a one-off slip is not listed as a sticking point', async ({ page }) => {
  await createProfile(page);
  await answerWrongly(page);

  await page.goto('/progress');
  await expect(page.getByRole('heading', { name: /sticking points/i })).toBeVisible();
  await expect(page.getByText(/nothing recurring right now/i)).toBeVisible();
});
