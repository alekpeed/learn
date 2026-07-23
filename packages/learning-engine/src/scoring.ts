/**
 * Mastery scoring (LRN-002) — implements docs/spec-derived/MASTERY_SCORING.md.
 * Pure functions: (scores, evidence) -> scores. No wall-clock, no AI (DEC-003/006).
 */
import type { MasteryScores, MasteryDimension } from '@learn/domain';
import { clampScore } from '@learn/domain';
import { SCORING } from './config.js';

export interface AttemptEvidence {
  correct: boolean;
  difficulty: number;
  hints_used: number;
  attempt_number: number;
  dimensions: string[];
  is_transfer: boolean;
}

export interface ReviewEvidence {
  success: boolean;
  quality: number;
  difficulty: number;
  interval_days_at_review: number;
  overdue_days: number;
}

export function hintFactor(hints: number): number {
  return Math.max(0, 1 - 0.15 * hints);
}

export function attemptFactor(attemptNumber: number): number {
  return Math.max(0, 1 - 0.25 * (attemptNumber - 1));
}

/** Per-event quality q in [0,1] (MASTERY_SCORING §3). */
export function quality(ev: {
  correct: boolean;
  hints_used: number;
  attempt_number: number;
}): number {
  if (!ev.correct) return 0;
  return hintFactor(ev.hints_used) * attemptFactor(ev.attempt_number);
}

function moveUp(score: number, target: number): number {
  return target > score ? clampScore(score + SCORING.alpha * (target - score)) : score;
}

function moveDownOnFailure(score: number, difficulty: number): number {
  return clampScore(score - SCORING.alpha * SCORING.penalty(difficulty));
}

/**
 * Update the four attempt-driven dimensions (Understanding, Accuracy,
 * Independence, Transfer). Retention updates only on review (updateRetention).
 */
export function scoreAttempt(scores: MasteryScores, ev: AttemptEvidence): MasteryScores {
  const ceiling = SCORING.ceiling(ev.difficulty);
  const q = quality(ev);
  const next: MasteryScores = { ...scores };

  // Accuracy: driven by correctness, independent of hints.
  next.accuracy = ev.correct
    ? moveUp(next.accuracy, ceiling * 1)
    : moveDownOnFailure(next.accuracy, ev.difficulty);

  // Independence: correctness gated by hint usage.
  next.independence = ev.correct
    ? moveUp(next.independence, ceiling * hintFactor(ev.hints_used))
    : moveDownOnFailure(next.independence, ev.difficulty);

  // Understanding: only items tagged for it.
  if (ev.dimensions.includes('understanding')) {
    next.understanding =
      q > 0
        ? moveUp(next.understanding, ceiling * q)
        : moveDownOnFailure(next.understanding, ev.difficulty);
  }

  // Transfer: only transfer items.
  if (ev.is_transfer || ev.dimensions.includes('transfer')) {
    next.transfer =
      q > 0 ? moveUp(next.transfer, ceiling * q) : moveDownOnFailure(next.transfer, ev.difficulty);
  }

  return next;
}

/** Retention update from a delayed review (MASTERY_SCORING §6). */
export function updateRetention(scores: MasteryScores, ev: ReviewEvidence): MasteryScores {
  const ceiling = SCORING.ceiling(ev.difficulty);
  const next: MasteryScores = { ...scores };
  if (ev.success) {
    const target = Math.min(
      100,
      ceiling * ev.quality * SCORING.intervalBonus(ev.interval_days_at_review),
    );
    next.retention = moveUp(next.retention, target);
  } else {
    next.retention = clampScore(
      next.retention - SCORING.alpha * SCORING.retentionFailPenalty(ev.overdue_days),
    );
  }
  return next;
}

/** All five dimensions meet or exceed the given thresholds. */
export function meetsAllThresholds(scores: MasteryScores, thresholds: MasteryScores): boolean {
  return (Object.keys(thresholds) as MasteryDimension[]).every((d) => scores[d] >= thresholds[d]);
}

/**
 * The four *immediate* dimensions (Understanding, Accuracy, Independence,
 * Transfer) meet thresholds. Retention is excluded because it can only be earned
 * through later delayed review — it gates full mastery, not provisional mastery
 * (doc 04 §14, MASTERY_SCORING §7).
 */
const IMMEDIATE_DIMENSIONS: MasteryDimension[] = [
  'understanding',
  'accuracy',
  'independence',
  'transfer',
];

export function meetsImmediateThresholds(
  scores: MasteryScores,
  thresholds: MasteryScores,
): boolean {
  return IMMEDIATE_DIMENSIONS.every((d) => scores[d] >= thresholds[d]);
}
