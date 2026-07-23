/**
 * Append-only learning events (docs 08 §4, 09 §2).
 * The event log is the source of truth; all progress is a projection of these (DEC-006).
 *
 * Every event carries a stable `event_id` so replay/sync is idempotent
 * (doc 11: "duplicate events do not duplicate credit").
 */
import type { SkillState } from './skill-state.js';

export const LEARNING_EVENT_TYPES = [
  'lesson_started',
  'lesson_completed',
  'question_presented',
  'answer_submitted',
  'hint_requested',
  'explanation_viewed',
  'mastery_check_started',
  'mastery_check_completed',
  'review_completed',
  'skill_state_changed',
  'diagnostic_answered',
  'profile_created',
  'settings_changed',
  'note_saved',
] as const;

export type LearningEventType = (typeof LEARNING_EVENT_TYPES)[number];

export interface BaseLearningEvent {
  /** Stable, unique ID. Deduplication key for idempotent projection/sync. */
  event_id: string;
  type: LearningEventType;
  learner_id: string;
  /** ISO-8601 UTC timestamp (doc 09 §4: consistent timestamp standard). */
  created_at: string;
  /** Monotonic per-learner sequence number for deterministic ordering. */
  seq: number;
  payload: Record<string, unknown>;
}

export interface AnswerSubmittedPayload extends Record<string, unknown> {
  question_id: string;
  skill_id: string;
  submitted_answer: string;
  normalized_answer: string;
  correct: boolean;
  attempt_number: number;
  hints_used: number;
  difficulty: number;
  response_time_ms: number;
  /** Mastery dimensions this item feeds (DEC-009) — needed to score from events alone. */
  dimensions: string[];
  is_transfer: boolean;
}

export interface ReviewCompletedPayload extends Record<string, unknown> {
  skill_id: string;
  success: boolean;
  /** Per-event quality in [0,1] from the review answer (see MASTERY_SCORING §3). */
  quality: number;
  difficulty: number;
  /** The scheduled interval (days) the learner just recalled across. */
  interval_days_at_review: number;
  /** Days late the review was completed (0 if on time or early). */
  overdue_days: number;
}

export interface SkillStateChangedPayload extends Record<string, unknown> {
  skill_id: string;
  from: SkillState;
  to: SkillState;
  reason: string;
}

export type LearningEvent = BaseLearningEvent;

export function isLearningEventType(value: unknown): value is LearningEventType {
  return typeof value === 'string' && (LEARNING_EVENT_TYPES as readonly string[]).includes(value);
}
