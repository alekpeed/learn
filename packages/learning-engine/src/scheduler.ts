/**
 * Review scheduling (LRN-006) — implements docs/spec-derived/REVIEW_SCHEDULING.md.
 * Pure: interval math only. Time arrives as inputs so it is replayable (DEC-006).
 */
import { LADDER_DAYS, PROMOTE_STEP, DEMOTE_STEP } from './config.js';

export interface ReviewSchedule {
  ladder_index: number;
  next_review_at: string;
  last_interval_days: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(isoTime: string, days: number): string {
  return new Date(new Date(isoTime).getTime() + days * DAY_MS).toISOString();
}

export function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / DAY_MS;
}

/** Initial schedule for a newly learned skill: short interval (index 0). */
export function initialSchedule(reviewTime: string): ReviewSchedule {
  return {
    ladder_index: 0,
    next_review_at: addDays(reviewTime, LADDER_DAYS[0]),
    last_interval_days: LADDER_DAYS[0],
  };
}

/**
 * Reschedule after a completed review. Success promotes one rung; failure drops
 * two rungs (shortens more than one interval). Index stays within [0, 6].
 */
export function reschedule(
  currentIndex: number,
  success: boolean,
  reviewTime: string,
): ReviewSchedule {
  const max = LADDER_DAYS.length - 1;
  const newIndex = success
    ? Math.min(max, currentIndex + PROMOTE_STEP)
    : Math.max(0, currentIndex - DEMOTE_STEP);
  const interval = LADDER_DAYS[newIndex] as number;
  return {
    ladder_index: newIndex,
    next_review_at: addDays(reviewTime, interval),
    last_interval_days: interval,
  };
}
