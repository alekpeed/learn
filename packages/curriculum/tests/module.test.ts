import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadCoursePackage } from '../src/loader.js';
import {
  parseCourseModule,
  serializeCourseModule,
  summarizeModule,
  MODULE_FORMAT,
} from '../src/module.js';
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
  'units/algebra2.json',
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

function bundledModuleJson(): string {
  const loaded = loadCoursePackage(loadMvp());
  if (!loaded.ok) throw new Error(loaded.errors.join('\n'));
  return serializeCourseModule(loaded.package, 'Ground-Up Learning');
}

describe('course modules (Phase 18)', () => {
  it('round-trips the whole bundled curriculum through a module file', () => {
    const parsed = parseCourseModule(bundledModuleJson());
    expect(parsed.ok, parsed.ok ? '' : parsed.errors.join('\n')).toBe(true);
    if (!parsed.ok) return;

    const original = loadCoursePackage(loadMvp());
    if (!original.ok) return;
    expect(parsed.package.skills).toHaveLength(original.package.skills.length);
    expect(parsed.package.questions).toHaveLength(original.package.questions.length);
    expect(parsed.package.misconceptions).toHaveLength(original.package.misconceptions.length);
    expect(parsed.package.order).toEqual(original.package.order);
  });

  it('serializing what it parsed produces the same module again', () => {
    const first = bundledModuleJson();
    const parsed = parseCourseModule(first);
    if (!parsed.ok) throw new Error(parsed.errors.join('\n'));
    expect(serializeCourseModule(parsed.package, parsed.module.name)).toBe(first);
  });

  it('summarizes a module without installing it', () => {
    const parsed = parseCourseModule(bundledModuleJson());
    if (!parsed.ok) throw new Error(parsed.errors.join('\n'));
    const summary = summarizeModule(parsed.module, parsed.package);
    expect(summary.skills).toBe(parsed.package.skills.length);
    expect(summary.questions).toBe(parsed.package.questions.length);
    expect(summary.units).toBeGreaterThan(0);
    // The shipped course teaches and practises every skill.
    expect(summary.skillsWithoutLesson).toEqual([]);
    expect(summary.skillsWithoutQuestions).toEqual([]);
  });

  it('rejects text that is not JSON', () => {
    const parsed = parseCourseModule('{ not json');
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.join(' ')).toMatch(/not valid JSON/);
  });

  it('rejects an incompatible module format', () => {
    const module = JSON.parse(bundledModuleJson()) as Record<string, unknown>;
    module.module_format = '9.0.0';
    const parsed = parseCourseModule(JSON.stringify(module));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.join(' ')).toMatch(/not compatible/);
  });

  it('accepts a newer patch of the same major format', () => {
    const module = JSON.parse(bundledModuleJson()) as Record<string, unknown>;
    module.module_format = `${MODULE_FORMAT.split('.')[0]}.9.9`;
    expect(parseCourseModule(JSON.stringify(module)).ok).toBe(true);
  });

  it('reports a missing envelope field instead of a confusing loader error', () => {
    const module = JSON.parse(bundledModuleJson()) as Record<string, unknown>;
    delete module.name;
    delete module.skills;
    const parsed = parseCourseModule(JSON.stringify(module));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errors).toContain('name is required');
      expect(parsed.errors).toContain('skills must be an array');
    }
  });

  it('applies the full loader, so a broken graph is caught on import', () => {
    const module = JSON.parse(bundledModuleJson()) as Record<string, unknown>;
    (module.skills as { prerequisites: unknown[] }[])[0]!.prerequisites = [
      { prerequisite_skill_id: 'math.number_foundations.ghost' },
    ];
    const parsed = parseCourseModule(JSON.stringify(module));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.join(' ')).toMatch(/unknown skill/);
  });

  it('reports every problem at once rather than only the first', () => {
    const module = JSON.parse(bundledModuleJson()) as Record<string, unknown>;
    delete (module.skills as Record<string, unknown>[])[0]!.mastery_thresholds;
    delete (module.skills as Record<string, unknown>[])[1]!.title;
    const parsed = parseCourseModule(JSON.stringify(module));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.length).toBeGreaterThan(1);
  });

  it('rejects a module whose questions reference an uncatalogued misconception', () => {
    const module = JSON.parse(bundledModuleJson()) as Record<string, unknown>;
    module.misconceptions = [];
    const parsed = parseCourseModule(JSON.stringify(module));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.join(' ')).toMatch(/unknown misconception/);
  });

  it('accepts a module with no misconceptions at all', () => {
    // A course whose questions tag nothing is valid; only dangling refs are not.
    const module = JSON.parse(bundledModuleJson()) as Record<string, unknown>;
    module.misconceptions = [];
    for (const q of module.questions as Record<string, unknown>[]) {
      delete q.common_wrong_answers;
    }
    expect(parseCourseModule(JSON.stringify(module)).ok).toBe(true);
  });
});
