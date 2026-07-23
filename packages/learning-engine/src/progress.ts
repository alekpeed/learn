/**
 * Progress projection: fold the append-only event log into per-skill
 * SkillProgress (DEC-006). Deterministic and reproducible — replaying the same
 * events yields identical progress. This is the integration point where
 * validated attempts and reviews drive mastery, state, and scheduling.
 */
import type { LearningEvent, MasteryScores, SkillProgress } from '@learn/domain';
import { emptySkillProgress, DEFAULT_MASTERY_THRESHOLDS } from '@learn/domain';
import {
  scoreAttempt,
  updateRetention,
  meetsImmediateThresholds,
  type AttemptEvidence,
} from './scoring.js';
import { deriveState } from './state.js';
import { initialSchedule, reschedule } from './scheduler.js';
import { REVIEW_SUCCESS_GATE, DELAYED_CONFIRM_DAYS } from './config.js';

export type ThresholdLookup = (skillId: string) => MasteryScores;

const defaultThresholds: ThresholdLookup = () => DEFAULT_MASTERY_THRESHOLDS;

interface AttemptPayload extends AttemptEvidence {
  skill_id: string;
}

interface ReviewPayload {
  skill_id: string;
  success: boolean;
  quality: number;
  difficulty: number;
  interval_days_at_review: number;
  overdue_days: number;
}

function ensure(map: Map<string, SkillProgress>, skillId: string): SkillProgress {
  let p = map.get(skillId);
  if (!p) {
    p = emptySkillProgress(skillId);
    map.set(skillId, p);
  }
  return p;
}

export function projectProgress(
  events: LearningEvent[],
  thresholds: ThresholdLookup = defaultThresholds,
): Map<string, SkillProgress> {
  const progress = new Map<string, SkillProgress>();

  for (const event of events) {
    if (event.type === 'answer_submitted') {
      const payload = event.payload as unknown as AttemptPayload;
      const p = ensure(progress, payload.skill_id);
      p.scores = scoreAttempt(p.scores, payload);
      p.attempt_count += 1;
      p.last_practiced_at = event.created_at;
      const th = thresholds(payload.skill_id);
      p.state = deriveState(p.scores, th, p.attempt_count, p.delayed_review_confirmed);
      // Schedule the first review once the skill becomes provisionally mastered.
      if (p.review_index < 0 && meetsImmediateThresholds(p.scores, th)) {
        const s = initialSchedule(event.created_at);
        p.review_index = s.ladder_index;
        p.next_review_at = s.next_review_at;
        p.last_interval_days = s.last_interval_days;
      }
    } else if (event.type === 'review_completed') {
      const payload = event.payload as unknown as ReviewPayload;
      const p = ensure(progress, payload.skill_id);
      const success = payload.success && payload.quality >= REVIEW_SUCCESS_GATE;
      p.scores = updateRetention(p.scores, payload);
      p.last_practiced_at = event.created_at;
      const s = reschedule(Math.max(0, p.review_index), success, event.created_at);
      p.review_index = s.ladder_index;
      p.next_review_at = s.next_review_at;
      p.last_interval_days = s.last_interval_days;
      if (success && payload.interval_days_at_review >= DELAYED_CONFIRM_DAYS) {
        p.delayed_review_confirmed = true;
      }
      const th = thresholds(payload.skill_id);
      p.state = deriveState(p.scores, th, p.attempt_count, p.delayed_review_confirmed);
    }
  }

  return progress;
}
