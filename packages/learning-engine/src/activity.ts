/**
 * Study activity (Version 1 study plans): daily counts and streaks derived from
 * the event log. Time is passed in as ISO strings so these stay pure/replayable.
 */
import type { LearningEvent } from '@learn/domain';

/** UTC calendar day key, e.g. "2026-07-23". */
export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function activeDays(events: LearningEvent[]): Set<string> {
  const days = new Set<string>();
  for (const e of events) {
    if (e.type === 'answer_submitted') days.add(dayKey(e.created_at));
  }
  return days;
}

/** Number of graded answers submitted on the given day. */
export function answeredOn(events: LearningEvent[], iso: string): number {
  const key = dayKey(iso);
  return events.filter((e) => e.type === 'answer_submitted' && dayKey(e.created_at) === key).length;
}

function shiftDay(key: string, deltaDays: number): string {
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Current streak: consecutive days with activity, ending today. An unfinished
 * today does not break the streak — if today has no activity yet, the run is
 * measured from yesterday.
 */
export function currentStreak(events: LearningEvent[], nowIso: string): number {
  const days = activeDays(events);
  const today = dayKey(nowIso);
  let cursor = days.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}
