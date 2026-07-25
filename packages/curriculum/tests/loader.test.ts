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
  'units/numerical_structure.json',
  'units/integers.json',
  'units/fractions.json',
  'units/decimals_percents.json',
  'units/ratios.json',
  'units/measurement.json',
  'units/algebra.json',
  'units/functions.json',
  'units/geometry.json',
  'units/science_thinking.json',
  'units/science_experiments.json',
  'units/science_measurement.json',
  'units/science_data.json',
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
    misconceptions: (readJson('misconceptions.json') as { misconceptions: unknown[] })
      .misconceptions,
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
    // Numerical Structure: primes come after factors; GCF after factors.
    expect(pos('math.numerical_structure.factors')).toBeLessThan(
      pos('math.numerical_structure.prime_composite'),
    );
    // Integers: subtracting builds on adding; dividing on multiplying.
    expect(pos('math.integers.adding_integers')).toBeLessThan(
      pos('math.integers.subtracting_integers'),
    );
    expect(pos('math.integers.multiplying_integers')).toBeLessThan(
      pos('math.integers.dividing_integers'),
    );
    // Ratios: proportions build on equivalent ratios; scale builds on proportions.
    expect(pos('math.ratios.equivalent_ratios')).toBeLessThan(pos('math.ratios.proportions'));
    expect(pos('math.ratios.proportions')).toBeLessThan(pos('math.ratios.scale'));
    // Measurement: volume builds on area; unit conversion on length.
    expect(pos('math.measurement.area')).toBeLessThan(pos('math.measurement.volume'));
    expect(pos('math.measurement.length')).toBeLessThan(pos('math.measurement.unit_conversion'));
    // Phase 13 completions: two-step equations follow one-step; dividing fractions
    // follows multiplying; distributive follows combining like terms.
    expect(pos('math.algebra.one_step_equations')).toBeLessThan(
      pos('math.algebra.two_step_equations'),
    );
    expect(pos('math.algebra.combining_like_terms')).toBeLessThan(
      pos('math.algebra.distributive_property'),
    );
    expect(pos('math.fractions.multiplying_fractions')).toBeLessThan(
      pos('math.fractions.dividing_fractions'),
    );
    // Functions: ordered pairs build on the coordinate plane; linear relationships
    // build on function machines and rate of change.
    expect(pos('math.functions.coordinate_plane')).toBeLessThan(
      pos('math.functions.ordered_pairs'),
    );
    expect(pos('math.functions.rate_of_change')).toBeLessThan(
      pos('math.functions.linear_relationships'),
    );
    // Experiments: the variable chain, then control groups and error analysis.
    expect(pos('science.experiments.independent_variables')).toBeLessThan(
      pos('science.experiments.dependent_variables'),
    );
    expect(pos('science.experiments.controlled_variables')).toBeLessThan(
      pos('science.experiments.control_groups'),
    );
    // Data: axes precede the graph types; trends precede outliers and conclusions.
    expect(pos('science.data.reading_axes')).toBeLessThan(pos('science.data.bar_graphs'));
    expect(pos('science.data.trends')).toBeLessThan(pos('science.data.outliers'));
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

  it('rejects a misconception reference with no catalog entry', () => {
    const raw = loadMvp();
    raw.misconceptions = [];
    const result = loadCoursePackage(raw);
    // Every tagged wrong answer would be diagnosable but never remediable.
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/unknown misconception mc\./);
  });

  it('rejects a misconception recommending a skill that does not exist', () => {
    const raw = loadMvp();
    (raw.misconceptions as Record<string, unknown>[])[0]!.recommended_prerequisite_check =
      'math.number_foundations.ghost';
    const result = loadCoursePackage(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/recommends unknown skill/);
  });
});

describe('misconception catalog (Phase 17)', () => {
  it('gives every tagged wrong answer a corrective explanation', () => {
    const result = loadCoursePackage(loadMvp());
    expect(result.ok, result.ok ? '' : result.errors.join('\n')).toBe(true);
    if (!result.ok) return;

    const tagged = result.package.questions.flatMap((q) => q.common_wrong_answers ?? []);
    expect(tagged.length).toBeGreaterThan(0);
    for (const cwa of tagged) {
      const record = result.package.misconceptionById.get(cwa.misconception_id);
      expect(record, `no catalog record for ${cwa.misconception_id}`).toBeDefined();
      expect(record?.corrective_explanation.length).toBeGreaterThan(0);
    }
  });

  it('carries no catalog record that no question references', () => {
    const result = loadCoursePackage(loadMvp());
    if (!result.ok) return;
    const referenced = new Set(
      result.package.questions.flatMap((q) =>
        (q.common_wrong_answers ?? []).map((c) => c.misconception_id),
      ),
    );
    const orphans = result.package.misconceptions
      .map((m) => m.misconception_id)
      .filter((id) => !referenced.has(id));
    expect(orphans).toEqual([]);
  });

  it('never tags the correct answer as a common wrong answer', () => {
    const result = loadCoursePackage(loadMvp());
    if (!result.ok) return;
    // A tag on the right answer can never fire, because diagnosis only runs on
    // wrong ones - so it is a silent content bug rather than a harmless one.
    const unreachable = result.package.questions
      .filter((q) =>
        (q.common_wrong_answers ?? []).some(
          (c) => String(c.value) === String(q.answer_spec.correct_answer),
        ),
      )
      .map((q) => q.question_id);
    expect(unreachable).toEqual([]);
  });
});
