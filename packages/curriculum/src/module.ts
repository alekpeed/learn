/**
 * Downloadable course modules (Phase 18).
 *
 * A course package is already just data, so a "module" is that data in a
 * versioned envelope: one JSON file holding a manifest, courses, skills,
 * lessons, questions, and misconceptions. Nothing here knows about storage or
 * UI - parsing a module runs it through exactly the same loader the bundled
 * curriculum goes through, so an imported module cannot be less valid than the
 * one that ships with the app.
 */
import { loadCoursePackage, type CoursePackage } from './loader.js';
import type { RawCoursePackage } from './types.js';

/** Envelope version. Bump the major when the envelope shape changes. */
export const MODULE_FORMAT = '1.0.0';

export interface CourseModule {
  module_format: string;
  /** Human-facing name, so a learner can tell installed modules apart. */
  name: string;
  manifest: unknown;
  courses: unknown[];
  skills: unknown[];
  lessons: unknown[];
  questions: unknown[];
  misconceptions: unknown[];
}

export type ParseResult =
  { ok: true; module: CourseModule; package: CoursePackage } | { ok: false; errors: string[] };

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** Major version must match; a newer minor/patch is accepted. */
function formatCompatible(declared: unknown): boolean {
  if (typeof declared !== 'string') return false;
  return declared.split('.')[0] === MODULE_FORMAT.split('.')[0];
}

/**
 * Validate a module from its JSON text. Returns either the parsed module and
 * the loaded package, or every error found - never a partially-valid module.
 */
export function parseCourseModule(json: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (error) {
    return { ok: false, errors: [`not valid JSON: ${(error as Error).message}`] };
  }

  if (typeof raw !== 'object' || raw === null || isArray(raw)) {
    return { ok: false, errors: ['a course module must be a JSON object'] };
  }

  const candidate = raw as Record<string, unknown>;
  const errors: string[] = [];

  if (!formatCompatible(candidate.module_format)) {
    errors.push(
      `module_format ${String(candidate.module_format)} is not compatible with ${MODULE_FORMAT}`,
    );
  }
  if (typeof candidate.name !== 'string' || candidate.name.trim().length === 0) {
    errors.push('name is required');
  }
  for (const key of ['courses', 'skills', 'lessons', 'questions'] as const) {
    if (!isArray(candidate[key])) errors.push(`${key} must be an array`);
  }
  if (candidate.misconceptions !== undefined && !isArray(candidate.misconceptions)) {
    errors.push('misconceptions must be an array');
  }
  if (candidate.manifest === undefined) errors.push('manifest is required');

  // Stop here: the loader would report confusing errors on a malformed envelope.
  if (errors.length > 0) return { ok: false, errors };

  const rawPackage: RawCoursePackage = {
    manifest: candidate.manifest,
    courses: candidate.courses as unknown[],
    skills: candidate.skills as unknown[],
    lessons: candidate.lessons as unknown[],
    questions: candidate.questions as unknown[],
    misconceptions: (candidate.misconceptions ?? []) as unknown[],
  };

  const loaded = loadCoursePackage(rawPackage);
  if (!loaded.ok) return { ok: false, errors: loaded.errors };

  return {
    ok: true,
    module: {
      module_format: candidate.module_format as string,
      name: candidate.name as string,
      manifest: candidate.manifest,
      courses: rawPackage.courses,
      skills: rawPackage.skills,
      lessons: rawPackage.lessons,
      questions: rawPackage.questions,
      misconceptions: rawPackage.misconceptions ?? [],
    },
    package: loaded.package,
  };
}

/** Write a loaded package back out as a module file. Round-trips through parse. */
export function serializeCourseModule(pkg: CoursePackage, name: string): string {
  const module: CourseModule = {
    module_format: MODULE_FORMAT,
    name,
    manifest: pkg.manifest,
    courses: pkg.courses,
    skills: pkg.skills,
    lessons: pkg.lessons,
    questions: pkg.questions,
    misconceptions: pkg.misconceptions,
  };
  return `${JSON.stringify(module, null, 2)}\n`;
}

/** A one-line-per-entity count, for previewing a module before installing it. */
export interface ModuleSummary {
  name: string;
  courses: number;
  units: number;
  skills: number;
  lessons: number;
  questions: number;
  misconceptions: number;
  /** Skills with no lesson, which practise but cannot be taught. */
  skillsWithoutLesson: string[];
  /** Skills with no questions, which can be read but never practised. */
  skillsWithoutQuestions: string[];
}

export function summarizeModule(module: CourseModule, pkg: CoursePackage): ModuleSummary {
  return {
    name: module.name,
    courses: pkg.courses.length,
    units: pkg.courses.reduce((n, c) => n + c.units.length, 0),
    skills: pkg.skills.length,
    lessons: pkg.lessons.length,
    questions: pkg.questions.length,
    misconceptions: pkg.misconceptions.length,
    skillsWithoutLesson: pkg.skills
      .map((s) => s.skill_id)
      .filter((id) => !pkg.lessonBySkill.has(id)),
    skillsWithoutQuestions: pkg.skills
      .map((s) => s.skill_id)
      .filter((id) => (pkg.questionsBySkill.get(id) ?? []).length === 0),
  };
}
