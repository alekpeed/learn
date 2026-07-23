/**
 * Adaptive diagnostic (DIA-001..004, doc 04 §12).
 *
 * Samples skills rather than testing every one: a binary search over the
 * topological skill order. It begins near the middle, moves up after strong
 * answers and down after weak ones, confirms the boundary, marks untested
 * skills as `unknown` (never `weak`), and recommends the lowest unstable point
 * as the starting skill.
 */

export type ProbeResult = 'strong' | 'weak';

export interface DiagnosticState {
  /** Probeable skills (those with questions) in topological order. */
  order: string[];
  low: number;
  high: number;
  /** Index currently being probed, or null when the diagnostic is complete. */
  currentIndex: number | null;
  results: Record<string, ProbeResult>;
  history: { skill_id: string; result: ProbeResult | 'skipped' }[];
}

export interface DiagnosticSummary {
  strong: string[];
  weak: string[];
  /** Skills that were never probed remain unknown (doc 04 §12). */
  untestedRemainUnknown: true;
  /** Recommended starting skill (lowest unstable point), or null if none probeable. */
  recommendedSkillId: string | null;
  explanation: string;
}

function mid(low: number, high: number): number {
  return Math.floor((low + high) / 2);
}

export function startDiagnostic(order: string[]): DiagnosticState {
  const high = order.length - 1;
  return {
    order,
    low: 0,
    high,
    currentIndex: order.length === 0 ? null : mid(0, high),
    results: {},
    history: [],
  };
}

export function currentSkill(state: DiagnosticState): string | null {
  return state.currentIndex === null ? null : (state.order[state.currentIndex] ?? null);
}

export function isComplete(state: DiagnosticState): boolean {
  return state.currentIndex === null;
}

/** Estimated probes remaining (for a progress indicator). */
export function estimatedRemaining(state: DiagnosticState): number {
  if (state.currentIndex === null) return 0;
  const span = state.high - state.low + 1;
  return Math.max(1, Math.ceil(Math.log2(span + 1)));
}

function advance(state: DiagnosticState, low: number, high: number): DiagnosticState {
  const done = low > high;
  return { ...state, low, high, currentIndex: done ? null : mid(low, high) };
}

/** Record a graded probe. Correct → search upward; incorrect → search downward. */
export function recordResult(state: DiagnosticState, correct: boolean): DiagnosticState {
  if (state.currentIndex === null) return state;
  const skill = state.order[state.currentIndex]!;
  const result: ProbeResult = correct ? 'strong' : 'weak';
  const next: DiagnosticState = {
    ...state,
    results: { ...state.results, [skill]: result },
    history: [...state.history, { skill_id: skill, result }],
  };
  return correct
    ? advance(next, state.currentIndex + 1, state.high)
    : advance(next, state.low, state.currentIndex - 1);
}

/**
 * Skip the current skill without judging it (doc 07 Diagnostic: skip allowed,
 * no penalty framing). Treated as "unsure" — search downward toward
 * prerequisites, and the skill stays unknown.
 */
export function skipCurrent(state: DiagnosticState): DiagnosticState {
  if (state.currentIndex === null) return state;
  const skill = state.order[state.currentIndex]!;
  const next: DiagnosticState = {
    ...state,
    history: [...state.history, { skill_id: skill, result: 'skipped' }],
  };
  return advance(next, state.low, state.currentIndex - 1);
}

export function summarize(state: DiagnosticState): DiagnosticSummary {
  const strong: string[] = [];
  const weak: string[] = [];
  for (const skill of state.order) {
    const r = state.results[skill];
    if (r === 'strong') strong.push(skill);
    else if (r === 'weak') weak.push(skill);
  }

  // `low` is the boundary: the lowest index the learner did not clear. That is
  // the lowest unstable point and so the recommended starting skill.
  let recommendedSkillId: string | null = null;
  let explanation: string;

  if (state.order.length === 0) {
    explanation = 'No skills were available to test. Start from the beginning.';
  } else if (state.low >= state.order.length) {
    // Cleared everything probed — recommend the most advanced tested skill.
    recommendedSkillId = state.order[state.order.length - 1] ?? null;
    explanation =
      'You answered everything we tried correctly. You can start at the most advanced tested skill.';
  } else {
    recommendedSkillId = state.order[state.low] ?? null;
    explanation =
      strong.length > 0
        ? 'You were solid on the earlier skills and had trouble higher up, so we recommend starting where the gap begins.'
        : 'We recommend starting from the beginning of this path.';
  }

  return { strong, weak, untestedRemainUnknown: true, recommendedSkillId, explanation };
}
