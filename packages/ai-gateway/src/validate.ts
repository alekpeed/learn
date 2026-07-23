/**
 * Output validation (AI-005, doc 10 §§3,6; doc 11 AI Tutor acceptance).
 * Rejects unsafe or malformed model output before it reaches the learner.
 * The gateway replaces rejected output with a safe fallback.
 */
import type { TutorRequest } from './types.js';

const MAX_LENGTH = 2000;

/**
 * Claims that would imply the tutor changed verified state, or leaked secrets /
 * system instructions. A real provider must never produce these; if it does, we
 * reject the whole response.
 */
const FORBIDDEN_PATTERNS: RegExp[] = [
  /updated? your (mastery|score|progress|grade)/i,
  /marked (it|this|that) (as )?(correct|mastered|complete)/i,
  /changed your (answer|grade|score|mastery)/i,
  /i have (recorded|saved|set) your/i,
  /api[_-]?key/i,
  /system prompt/i,
  /ignore (all )?previous instructions/i,
];

export interface OutputCheck {
  ok: boolean;
  reason?: string;
}

export function validateTutorOutput(text: string, request: TutorRequest): OutputCheck {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { ok: false, reason: 'empty response' };
  if (trimmed.length > MAX_LENGTH) return { ok: false, reason: 'response too long' };

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) return { ok: false, reason: `forbidden content: ${pattern}` };
  }

  // Hint restraint (doc 10 §6): guided mode must not hand over the answer.
  if (request.mode === 'guide' && request.context.correct_answer) {
    const answer = request.context.correct_answer.trim();
    if (answer.length > 0 && trimmed.toLowerCase().includes(answer.toLowerCase())) {
      return { ok: false, reason: 'guided response revealed the answer' };
    }
  }

  return { ok: true };
}
