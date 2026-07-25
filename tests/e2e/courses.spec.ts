/**
 * Downloadable course modules (Phase 18) through the real browser: exporting the
 * active course produces a file, and an installed course actually replaces what
 * the rest of the app teaches - and survives a restart.
 */
import { test, expect } from '@playwright/test';

/** A complete, valid one-skill course as a module file. */
const TINY_COURSE = JSON.stringify({
  module_format: '1.0.0',
  name: 'Tiny Course',
  manifest: {
    schema_version: '1.0.0',
    content_version: '1.0.0',
    courses: ['math.tiny'],
    generated_at: '2026-07-25T00:00:00Z',
  },
  courses: [
    {
      course_id: 'math.tiny',
      subject_id: 'math',
      title: 'Tiny',
      version: '1.0.0',
      status: 'published',
      units: [{ unit_id: 'math.basics', title: 'Basics', order: 1 }],
    },
  ],
  skills: [
    {
      skill_id: 'math.basics.counting',
      unit_id: 'math.basics',
      title: 'Counting Things',
      summary: 'Count things.',
      objectives: ['Count a small group.'],
      prerequisites: [],
      mastery_thresholds: {
        understanding: 80,
        accuracy: 85,
        independence: 80,
        retention: 75,
        transfer: 70,
      },
      content_version: '1.0.0',
    },
  ],
  lessons: [
    {
      lesson_id: 'math.basics.counting.lesson',
      skill_id: 'math.basics.counting',
      title: 'Counting',
      components: [{ type: 'intuitive_explanation', body: 'Count one at a time.' }],
      content_version: '1.0.0',
    },
  ],
  questions: [
    {
      question_id: 'math.basics.counting.q1',
      skill_id: 'math.basics.counting',
      type: 'numeric',
      difficulty: 1,
      prompt: 'How many is 2 and 1 more?',
      answer_spec: { correct_answer: 3 },
      validator: 'numeric',
      hints: [{ level: 1, text: 'Count on by one.' }],
      dimensions: ['accuracy'],
      explanation: 'Two and one more is three.',
      content_version: '1.0.0',
    },
  ],
  misconceptions: [],
});

async function createProfile(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel(/your name/i).fill('Ada');
  await page.getByRole('button', { name: /start learning/i }).click();
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
}

async function installTinyCourse(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/courses');
  await page.getByLabel(/course module file/i).setInputFiles({
    name: 'tiny-course.json',
    mimeType: 'application/json',
    buffer: Buffer.from(TINY_COURSE),
  });
  await expect(page.getByRole('heading', { name: /tiny course/i })).toBeVisible();
  await page.getByRole('button', { name: /install and use/i }).click();
  await expect(page.getByText(/is now the active course/i)).toBeVisible();
}

test('exports the active course as a downloadable module file', async ({ page }) => {
  await createProfile(page);
  await page.goto('/courses');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /export this course/i }).click();
  expect((await download).suggestedFilename()).toBe('course-module.json');
});

test('an installed course replaces what the app teaches, across a restart', async ({ page }) => {
  await createProfile(page);
  await installTinyCourse(page);

  // The curriculum map now shows the installed course, not the bundled one.
  await page.goto('/map');
  await expect(page.getByText(/counting things/i).first()).toBeVisible();
  await expect(page.getByText(/place value/i)).toHaveCount(0);

  // Persisted: still active after a reload.
  await page.reload();
  await expect(page.getByText(/counting things/i).first()).toBeVisible();
});

test('a course with problems is rejected with the reasons, and nothing installs', async ({
  page,
}) => {
  await createProfile(page);
  await page.goto('/courses');

  const broken = JSON.parse(TINY_COURSE) as Record<string, unknown>;
  (broken.skills as { prerequisites: unknown[] }[])[0]!.prerequisites = [
    { prerequisite_skill_id: 'math.basics.ghost' },
  ];

  await page.getByLabel(/course module file/i).setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(broken)),
  });

  await expect(page.getByRole('alert')).toContainText(/was not installed/i);
  await expect(page.getByRole('alert')).toContainText(/math\.basics\.ghost/);
  await expect(page.getByText(/no installed courses/i)).toBeVisible();
});

test('switching back to the built-in course restores the full curriculum', async ({ page }) => {
  await createProfile(page);
  await installTinyCourse(page);

  await page.getByRole('button', { name: /use the built-in course/i }).click();
  await expect(page.getByText(/switched back to the built-in course/i)).toBeVisible();

  await page.goto('/map');
  await expect(page.getByText(/place value/i).first()).toBeVisible();
});
