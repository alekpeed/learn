/**
 * Course package loader (CUR-002). Validates a raw package against the content
 * schemas, then checks graph integrity: missing prerequisite references and
 * cycles. Fails explicitly with clear, aggregated errors (doc 14 §1, doc 11).
 */
import { validateContent, isSchemaVersionCompatible, SCHEMA_VERSION } from '@learn/schemas';
import type {
  RawCoursePackage,
  Skill,
  Lesson,
  Question,
  Course,
  Manifest,
  Misconception,
} from './types.js';
import {
  buildGraph,
  findMissingReferences,
  findCycle,
  topologicalOrder,
  type SkillGraph,
} from './graph.js';

export interface CoursePackage {
  manifest: Manifest;
  courses: Course[];
  skills: Skill[];
  lessons: Lesson[];
  questions: Question[];
  misconceptions: Misconception[];
  graph: SkillGraph;
  /** Topologically ordered skill IDs (prerequisites first). */
  order: string[];
  lessonBySkill: Map<string, Lesson>;
  questionsBySkill: Map<string, Question[]>;
  misconceptionById: Map<string, Misconception>;
}

export type LoadResult = { ok: true; package: CoursePackage } | { ok: false; errors: string[] };

function validateAll(
  kind: 'skill' | 'lesson' | 'question' | 'misconception' | 'course' | 'manifest',
  items: unknown[],
  errors: string[],
): void {
  items.forEach((item, i) => {
    const result = validateContent(kind, item);
    if (!result.valid) {
      errors.push(`${kind}[${i}]: ${result.errors.join('; ')}`);
    }
  });
}

export function loadCoursePackage(raw: RawCoursePackage): LoadResult {
  const errors: string[] = [];

  // 1. Manifest + version compatibility.
  const manifestResult = validateContent('manifest', raw.manifest);
  if (!manifestResult.valid) {
    errors.push(`manifest: ${manifestResult.errors.join('; ')}`);
  } else {
    const declared = (raw.manifest as Manifest).schema_version;
    if (!isSchemaVersionCompatible(declared)) {
      errors.push(
        `manifest: schema_version ${declared} is incompatible with supported ${SCHEMA_VERSION}`,
      );
    }
  }

  // 2. Entity schema validation.
  validateAll('course', raw.courses, errors);
  validateAll('skill', raw.skills, errors);
  validateAll('lesson', raw.lessons, errors);
  validateAll('question', raw.questions, errors);
  validateAll('misconception', raw.misconceptions ?? [], errors);

  // Stop before graph checks if any entity is structurally invalid.
  if (errors.length > 0) return { ok: false, errors };

  const skills = raw.skills as Skill[];
  const lessons = raw.lessons as Lesson[];
  const questions = raw.questions as Question[];
  const misconceptions = (raw.misconceptions ?? []) as Misconception[];

  // 3. Graph integrity.
  const graph = buildGraph(skills);

  const missing = findMissingReferences(graph);
  for (const ref of missing) {
    errors.push(`prerequisite references unknown skill: ${ref}`);
  }

  const cycle = findCycle(graph);
  if (cycle) {
    errors.push(`prerequisite cycle detected: ${cycle.join(' -> ')}`);
  }

  // 4. Lessons/questions must reference known skills.
  for (const lesson of lessons) {
    if (!graph.skills.has(lesson.skill_id)) {
      errors.push(`lesson ${lesson.lesson_id} references unknown skill ${lesson.skill_id}`);
    }
  }
  for (const question of questions) {
    if (!graph.skills.has(question.skill_id)) {
      errors.push(`question ${question.question_id} references unknown skill ${question.skill_id}`);
    }
  }

  // 5. Misconception integrity. A question that names a misconception with no
  // catalog entry can be diagnosed but never remediated, so treat it as a
  // content error rather than letting it fail silently at practice time.
  const misconceptionById = new Map<string, Misconception>();
  for (const m of misconceptions) {
    if (misconceptionById.has(m.misconception_id)) {
      errors.push(`duplicate misconception ${m.misconception_id}`);
    }
    misconceptionById.set(m.misconception_id, m);
  }
  for (const m of misconceptions) {
    const prereq = m.recommended_prerequisite_check;
    if (prereq !== undefined && !graph.skills.has(prereq)) {
      errors.push(`misconception ${m.misconception_id} recommends unknown skill ${prereq}`);
    }
  }
  for (const question of questions) {
    for (const cwa of question.common_wrong_answers ?? []) {
      if (!misconceptionById.has(cwa.misconception_id)) {
        errors.push(
          `question ${question.question_id} references unknown misconception ${cwa.misconception_id}`,
        );
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const order = topologicalOrder(graph);
  if (!order) {
    return { ok: false, errors: ['topological ordering failed (unresolved cycle)'] };
  }

  const lessonBySkill = new Map<string, Lesson>();
  for (const lesson of lessons) lessonBySkill.set(lesson.skill_id, lesson);

  const questionsBySkill = new Map<string, Question[]>();
  for (const question of questions) {
    const list = questionsBySkill.get(question.skill_id) ?? [];
    list.push(question);
    questionsBySkill.set(question.skill_id, list);
  }

  return {
    ok: true,
    package: {
      manifest: raw.manifest as Manifest,
      courses: raw.courses as Course[],
      skills,
      lessons,
      questions,
      misconceptions,
      graph,
      order,
      lessonBySkill,
      questionsBySkill,
      misconceptionById,
    },
  };
}
