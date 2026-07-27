/**
 * Practice repository (PRC-006): records question, attempt, and hint events to
 * the append-only log and projects attempt history. Progress is reproducible
 * from these validated events (DEC-006); duplicate events never double-count.
 */
import type { LearningEvent, LearningEventType } from '@learn/domain';
import type { EventStore } from './event-store.js';
import { newId } from './id.js';
import { systemClock, type Clock } from './clock.js';

export interface AttemptInput {
  question_id: string;
  skill_id: string;
  submitted_answer: string;
  normalized_answer: string;
  correct: boolean;
  attempt_number: number;
  hints_used: number;
  difficulty: number;
  response_time_ms: number;
  dimensions: string[];
  is_transfer: boolean;
  /** Deterministic diagnosis of a wrong answer; absent when correct (Phase 17). */
  diagnosis_category?: string;
  misconception_id?: string;
}

export interface AttemptRecord extends AttemptInput {
  event_id: string;
  created_at: string;
}

/** Recorded when a mastery check begins (doc 07: clear start and finish). */
export interface MasteryCheckStartInput {
  skill_id: string;
  question_ids: string[];
}

/** Recorded when a mastery check finishes, with its verdict. */
export interface MasteryCheckCompleteInput {
  skill_id: string;
  outcome: 'passed' | 'not_yet';
  correct: number;
  total: number;
}

export interface ReviewInput {
  skill_id: string;
  success: boolean;
  quality: number;
  difficulty: number;
  interval_days_at_review: number;
  overdue_days: number;
}

export class PracticeRepository {
  constructor(
    private readonly store: EventStore,
    private readonly clock: Clock = systemClock,
  ) {}

  private async record(
    learnerId: string,
    type: LearningEventType,
    payload: Record<string, unknown>,
  ): Promise<LearningEvent> {
    const seq = await this.store.nextSeq(learnerId);
    const event: LearningEvent = {
      event_id: newId(),
      type,
      learner_id: learnerId,
      created_at: this.clock(),
      seq,
      payload,
    };
    await this.store.append(event);
    return event;
  }

  presentQuestion(learnerId: string, questionId: string, skillId: string): Promise<LearningEvent> {
    return this.record(learnerId, 'question_presented', {
      question_id: questionId,
      skill_id: skillId,
    });
  }

  requestHint(learnerId: string, questionId: string, hintLevel: number): Promise<LearningEvent> {
    return this.record(learnerId, 'hint_requested', {
      question_id: questionId,
      hint_level: hintLevel,
    });
  }

  submitAttempt(learnerId: string, attempt: AttemptInput): Promise<LearningEvent> {
    return this.record(learnerId, 'answer_submitted', { ...attempt });
  }

  submitReview(learnerId: string, review: ReviewInput): Promise<LearningEvent> {
    return this.record(learnerId, 'review_completed', { ...review });
  }

  /**
   * Mastery-check bookends. The individual answers are recorded as ordinary
   * `answer_submitted` events, so these two carry no score of their own - they
   * mark the boundaries of a check and its verdict, which is what makes a check
   * distinguishable from ordinary practice when reading the log back.
   *
   * Both event types have existed in the domain since Phase 1 and had no writer
   * until the screen was built.
   */
  startMasteryCheck(learnerId: string, input: MasteryCheckStartInput): Promise<LearningEvent> {
    return this.record(learnerId, 'mastery_check_started', { ...input });
  }

  completeMasteryCheck(
    learnerId: string,
    input: MasteryCheckCompleteInput,
  ): Promise<LearningEvent> {
    return this.record(learnerId, 'mastery_check_completed', { ...input });
  }

  /** Project all recorded attempts for a learner (optionally one question), in order. */
  async getAttempts(learnerId: string, questionId?: string): Promise<AttemptRecord[]> {
    const events = await this.store.getByLearner(learnerId);
    return events
      .filter((e) => e.type === 'answer_submitted')
      .map((e) => ({
        event_id: e.event_id,
        created_at: e.created_at,
        ...(e.payload as unknown as AttemptInput),
      }))
      .filter((a) => (questionId ? a.question_id === questionId : true));
  }

  /** Count hints requested for a question (drives independence evidence later). */
  async countHints(learnerId: string, questionId: string): Promise<number> {
    const events = await this.store.getByLearner(learnerId);
    return events.filter(
      (e) =>
        e.type === 'hint_requested' &&
        (e.payload as { question_id?: string }).question_id === questionId,
    ).length;
  }
}
