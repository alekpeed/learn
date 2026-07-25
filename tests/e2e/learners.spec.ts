import { test, expect, type Page } from '@playwright/test';

/**
 * Create the device's first profile and wait for it to land. The wait matters:
 * the profile is an IndexedDB write, and navigating away before it completes
 * loses it.
 */
async function firstProfile(page: Page, name: string): Promise<void> {
  await page.goto('/');
  await page.getByLabel(/your name/i).fill(name);
  await page.getByRole('button', { name: /start learning/i }).click();
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
}

async function addProfile(page: Page, name: string): Promise<void> {
  await page.goto('/learners');
  await page.getByLabel(/^name$/i).fill(name);
  await page.getByRole('button', { name: /add learner/i }).click();
  // Creating a profile switches to it, so wait for that before continuing.
  await expect(page.getByRole('rowheader', { name: new RegExp(name) })).toContainText(/in use/i);
}

/** Badges earned by whoever is currently active. */
function earnedBadges(page: Page) {
  return page.locator('.achievement[data-earned="true"]');
}

test.describe('multiple learners on one device (Phase 25)', () => {
  test('each profile keeps its own progress', async ({ page }) => {
    await firstProfile(page, 'Ada');

    // Ada earns a badge that Grace must not inherit.
    await page.goto('/practice?skill=math.number_foundations.place_value');
    await page.getByLabel(/your answer/i).fill('50');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText('Correct!')).toBeVisible();

    await page.goto('/progress');
    await expect(earnedBadges(page)).not.toHaveCount(0);

    await addProfile(page, 'Grace');

    // Grace starts from nothing: same screen, no earned badges.
    await page.goto('/progress');
    await expect(page.getByRole('region', { name: /achievements/i })).toBeVisible();
    await expect(earnedBadges(page)).toHaveCount(0);

    // Switching back restores Ada's.
    await page.goto('/learners');
    await page.getByRole('button', { name: /switch to Ada/i }).click();
    await expect(page.getByRole('rowheader', { name: /Ada/ })).toContainText(/in use/i);
    await page.goto('/progress');
    await expect(earnedBadges(page)).not.toHaveCount(0);
  });

  test('the active profile survives a reload', async ({ page }) => {
    await firstProfile(page, 'Ada');
    await addProfile(page, 'Grace');

    await page.reload();
    await expect(page.getByRole('rowheader', { name: /Grace/ })).toContainText(/in use/i);
    await expect(page.getByRole('rowheader', { name: /Ada/ })).not.toContainText(/in use/i);
  });

  test('deleting a profile asks first and leaves the other intact', async ({ page }) => {
    await firstProfile(page, 'Ada');
    await addProfile(page, 'Grace');
    await expect(page.getByRole('rowheader', { name: /Ada/ })).toBeVisible();

    // Deleting takes two steps; the first only asks.
    await page.getByRole('button', { name: /delete Ada/i }).click();
    await expect(page.getByRole('alert')).toContainText(/cannot be undone/i);
    await expect(page.getByRole('rowheader', { name: /Ada/ })).toBeVisible();

    await page.getByRole('button', { name: /confirm delete/i }).click();
    await expect(page.getByRole('rowheader', { name: /Ada/ })).toHaveCount(0);
    await expect(page.getByRole('rowheader', { name: /Grace/ })).toBeVisible();
  });
});

test.describe('achievements (Phase 25)', () => {
  test('a badge is earned by practising and survives a reload', async ({ page }) => {
    await firstProfile(page, 'Ada');

    await page.goto('/practice?skill=math.number_foundations.place_value');
    await page.getByLabel(/your answer/i).fill('50');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText('Correct!')).toBeVisible();

    await page.goto('/progress');
    const card = page.getByRole('region', { name: /achievements/i });
    await expect(card).toContainText(/first answer right/i);
    await expect(earnedBadges(page)).not.toHaveCount(0);

    // Achievements are a projection, so a reload recomputes the same badge
    // rather than reading anything stored.
    await page.reload();
    await expect(page.getByRole('region', { name: /achievements/i })).toContainText(
      /first answer right/i,
    );
    await expect(earnedBadges(page)).not.toHaveCount(0);
  });
});
