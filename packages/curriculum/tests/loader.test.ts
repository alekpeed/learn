import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadCoursePackage } from '../src/loader.js';
import type { RawCoursePackage } from '../src/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const sampleDir = join(here, '..', '..', '..', 'content', 'sample');

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(join(sampleDir, file), 'utf8'));
}

function loadSample(): RawCoursePackage {
  return {
    manifest: readJson('manifest.json'),
    courses: readJson('courses.json') as unknown[],
    skills: readJson('skills.json') as unknown[],
    lessons: readJson('lessons.json') as unknown[],
    questions: readJson('questions.json') as unknown[],
  };
}

describe('loadCoursePackage — valid sample (Phase 2 exit)', () => {
  it('loads the sample package and topologically orders skills', () => {
    const result = loadCoursePackage(loadSample());
    expect(result.ok, result.ok ? '' : result.errors.join('\n')).toBe(true);
    if (!result.ok) return;

    const { order, lessonBySkill } = result.package;
    expect(result.package.skills).toHaveLength(4);
    const pos = (id: string) => order.indexOf(id);
    expect(pos('math.number_foundations.counting_and_quantity')).toBeLessThan(
      pos('math.number_foundations.comparing_numbers'),
    );
    expect(pos('math.number_foundations.comparing_numbers')).toBeLessThan(
      pos('math.number_foundations.place_value'),
    );
    expect(lessonBySkill.has('math.number_foundations.comparing_numbers')).toBe(true);
  });
});

describe('loadCoursePackage — invalid packages produce clear errors', () => {
  it('rejects an unknown prerequisite reference', () => {
    const raw = loadSample();
    (raw.skills as { prerequisites: { prerequisite_skill_id: string }[] }[])[0]!.prerequisites = [
      { prerequisite_skill_id: 'math.number_foundations.ghost' },
    ];
    const result = loadCoursePackage(raw);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.join(' ')).toMatch(/unknown skill: math\.number_foundations\.ghost/);
  });

  it('rejects a schema-invalid skill', () => {
    const raw = loadSample();
    delete (raw.skills as Record<string, unknown>[])[0]!.mastery_thresholds;
    const result = loadCoursePackage(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/skill\[0\]/);
  });

  it('rejects an incompatible schema_version', () => {
    const raw = loadSample();
    (raw.manifest as Record<string, unknown>).schema_version = '2.0.0';
    const result = loadCoursePackage(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/incompatible/);
  });

  it('detects a cycle', () => {
    const raw = loadSample();
    const skills = raw.skills as {
      skill_id: string;
      prerequisites: { prerequisite_skill_id: string }[];
    }[];
    // Make counting depend on place_value, closing a loop.
    skills[0]!.prerequisites = [{ prerequisite_skill_id: 'math.number_foundations.place_value' }];
    const result = loadCoursePackage(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/cycle detected/);
  });
});
