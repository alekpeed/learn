import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadCoursePackage } from '../src/loader.js';
import type { RawCoursePackage } from '../src/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '..', '..', '..', 'content', 'mvp');

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(join(contentDir, rel), 'utf8'));
}

const UNIT_FILES = [
  'units/number_foundations.json',
  'units/add_sub.json',
  'units/mult_div.json',
  'units/fractions.json',
  'units/decimals_percents.json',
  'units/algebra.json',
  'units/science_thinking.json',
  'units/science_measurement.json',
];

interface UnitFile {
  skills: unknown[];
  lessons: unknown[];
  questions: unknown[];
}

function loadMvp(): RawCoursePackage {
  const units = UNIT_FILES.map((f) => readJson(f) as UnitFile);
  return {
    manifest: readJson('manifest.json'),
    courses: readJson('courses.json') as unknown[],
    skills: units.flatMap((u) => u.skills),
    lessons: units.flatMap((u) => u.lessons),
    questions: units.flatMap((u) => u.questions),
  };
}

describe('MVP math package (Phase 6 exit criteria)', () => {
  it('loads the full math slice with no missing prerequisite references', () => {
    const result = loadCoursePackage(loadMvp());
    expect(result.ok, result.ok ? '' : result.errors.join('\n')).toBe(true);
    if (!result.ok) return;

    // Full path present: number foundations through one-step equations, plus
    // the scientific reasoning + measurement course (cross-thread deps resolve).
    const ids = new Set(result.package.skills.map((s) => s.skill_id));
    expect(ids.has('math.number_foundations.counting_and_quantity')).toBe(true);
    expect(ids.has('math.algebra.one_step_equations')).toBe(true);
    expect(ids.has('science.thinking.observation')).toBe(true);
    expect(ids.has('science.measurement.accuracy_precision')).toBe(true);
    expect(result.package.skills.length).toBeGreaterThanOrEqual(40);
  });

  it('every skill has lesson and practice content (doc 11 curriculum acceptance)', () => {
    const result = loadCoursePackage(loadMvp());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const skill of result.package.skills) {
      expect(result.package.lessonBySkill.has(skill.skill_id), `${skill.skill_id} lesson`).toBe(
        true,
      );
      expect(
        (result.package.questionsBySkill.get(skill.skill_id) ?? []).length,
        `${skill.skill_id} questions`,
      ).toBeGreaterThan(0);
    }
  });

  it('unit-validator questions in the measurement course work', () => {
    const result = loadCoursePackage(loadMvp());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const unitQuestions = result.package.questions.filter((q) => q.validator === 'unit');
    expect(unitQuestions.length).toBeGreaterThan(0);
  });

  it('topologically orders the whole graph (no cycles)', () => {
    const result = loadCoursePackage(loadMvp());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const pos = (id: string) => result.package.order.indexOf(id);
    // A capstone comes after one of its prerequisites.
    expect(pos('math.algebra.equality')).toBeLessThan(pos('math.algebra.one_step_equations'));
    // Decimals & Percentages unit: percent-of-a-number follows the meaning of percent,
    // which itself follows fraction/decimal equivalence.
    expect(pos('math.decimals_percents.fraction_decimal_equivalence')).toBeLessThan(
      pos('math.decimals_percents.percent_meaning'),
    );
    expect(pos('math.decimals_percents.percent_meaning')).toBeLessThan(
      pos('math.decimals_percents.percent_of_number'),
    );
  });

  it('every skill with questions has a validator on each question', () => {
    const result = loadCoursePackage(loadMvp());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const q of result.package.questions) {
      expect(q.validator, `${q.question_id} missing validator`).toBeTruthy();
    }
  });
});

describe('loadCoursePackage — invalid packages produce clear errors', () => {
  it('rejects an unknown prerequisite reference', () => {
    const raw = loadMvp();
    (raw.skills as { prerequisites: { prerequisite_skill_id: string }[] }[])[0]!.prerequisites = [
      { prerequisite_skill_id: 'math.number_foundations.ghost' },
    ];
    const result = loadCoursePackage(raw);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.join(' ')).toMatch(/unknown skill: math\.number_foundations\.ghost/);
  });

  it('rejects a schema-invalid skill', () => {
    const raw = loadMvp();
    delete (raw.skills as Record<string, unknown>[])[0]!.mastery_thresholds;
    const result = loadCoursePackage(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/skill\[0\]/);
  });

  it('rejects an incompatible schema_version', () => {
    const raw = loadMvp();
    (raw.manifest as Record<string, unknown>).schema_version = '2.0.0';
    const result = loadCoursePackage(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/incompatible/);
  });
});
