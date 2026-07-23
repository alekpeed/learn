/**
 * Context assembly (AI-002, doc 10 §4). Builds a TutorContext from raw inputs,
 * keeping ONLY the approved fields and stripping anything that could leak
 * secrets or system instructions. This is the tutor's entire view of the world.
 */
import type { TutorContext } from './types.js';

export interface TutorContextInput {
  skill_id: string;
  skill_title: string;
  objective?: string;
  lesson_excerpt?: string;
  problem_prompt?: string;
  correct_answer?: string;
  detected_misconception?: string;
  prerequisite_titles?: string[];
  recent_attempts?: { correct: boolean }[];
  learner_level?: string;
}

/** Patterns that must never survive into tutor context. */
const REDACT_PATTERNS: RegExp[] = [
  /api[_-]?key/gi,
  /secret/gi,
  /password/gi,
  /system prompt/gi,
  /ignore (all )?previous instructions/gi,
];

function scrub(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  let out = value;
  for (const p of REDACT_PATTERNS) out = out.replace(p, '[redacted]');
  return out;
}

export function buildTutorContext(input: TutorContextInput): TutorContext {
  return {
    skill_id: input.skill_id,
    skill_title: input.skill_title,
    objective: scrub(input.objective),
    lesson_excerpt: scrub(input.lesson_excerpt),
    problem_prompt: scrub(input.problem_prompt),
    correct_answer: input.correct_answer,
    detected_misconception: scrub(input.detected_misconception),
    prerequisite_titles: input.prerequisite_titles,
    recent_attempts: input.recent_attempts?.map((a) => ({ correct: a.correct })),
    learner_level: input.learner_level,
  };
}

/** The verified context ids a response can cite, given what was provided. */
export function verifiedContextIds(context: TutorContext): string[] {
  const ids: string[] = [`skill:${context.skill_id}`];
  if (context.lesson_excerpt) ids.push('lesson_excerpt');
  if (context.correct_answer !== undefined) ids.push('validator_result');
  if (context.detected_misconception) ids.push('misconception');
  return ids;
}
