/**
 * Draft practice questions (Phase 19, DEC-005/010).
 *
 * The tutor may PROPOSE practice items. It may not create them. This module
 * only builds the prompt and parses what came back into candidate objects - it
 * deliberately does no judging of whether a candidate is any good, because this
 * package depends on @learn/domain alone and has no access to the schemas, the
 * validators, or the curriculum. Screening happens outside, deterministically,
 * and a human still has to approve. Nothing here can reach a learner.
 */
import type { TutorContext } from './types.js';

export interface DraftRequest {
  context: TutorContext;
  /** How many candidates to ask for. The screener may reject all of them. */
  count: number;
}

/** A candidate as parsed from model output. Untrusted until screened. */
export interface DraftCandidate {
  prompt?: unknown;
  validator?: unknown;
  answer_spec?: unknown;
  hints?: unknown;
  explanation?: unknown;
  difficulty?: unknown;
  type?: unknown;
  dimensions?: unknown;
  parameters?: unknown;
  [key: string]: unknown;
}

export function buildDraftPrompt(request: DraftRequest): string {
  const { context, count } = request;
  const lines = [
    `Propose ${count} practice questions for the skill "${context.skill_title}".`,
    'Return ONLY a JSON array. No prose, no code fences.',
    'Each element must have: prompt (string), validator (one of numeric, fraction,',
    'decimal, percentage, unit, exact_choice, multi_select, ordering, point),',
    'answer_spec (object with correct_answer), hints (array of {level, text}),',
    'explanation (string), difficulty (integer 1-5), dimensions (array).',
    'For exact_choice include parameters.options containing the correct answer.',
    'The answer must not appear in the prompt or in any hint.',
  ];
  if (context.objective) lines.push(`Objective: ${context.objective}`);
  if (context.lesson_excerpt) lines.push(`Lesson context: ${context.lesson_excerpt}`);
  return lines.join('\n');
}

/**
 * Pull candidates out of model output. Tolerates a code fence or surrounding
 * prose, because that is a formatting slip rather than a reason to discard
 * otherwise-usable work - but never tolerates anything that is not an array of
 * objects.
 */
export function parseDraftCandidates(text: string): DraftCandidate[] {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const body = fenced?.[1] ?? text;
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(body.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (item): item is DraftCandidate =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
  );
}
