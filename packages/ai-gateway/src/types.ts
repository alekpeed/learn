/**
 * AI tutor gateway types (doc 10, doc 08 AI Tutor Gateway).
 *
 * The tutor is isolated from verified state (DEC-005): everything here is
 * read-only context in and text out. This package depends on @learn/domain only
 * — it has no access to persistence or the learning engine's write paths, so it
 * structurally cannot alter answers, mastery, review dates, or curriculum.
 */

/** Response modes (doc 10 §5). */
export type TutorMode = 'explain' | 'guide' | 'compare' | 'diagnose' | 'extend';

/**
 * The ONLY context the tutor may receive (doc 10 §4). Assembled and filtered by
 * buildTutorContext; never includes secrets or system instructions.
 */
export interface TutorContext {
  skill_id: string;
  skill_title: string;
  objective?: string;
  /** A verified excerpt from the lesson — never invented content. */
  lesson_excerpt?: string;
  problem_prompt?: string;
  /** The deterministic validator's answer/result, when relevant. */
  correct_answer?: string;
  /** A deterministically detected misconception description. */
  detected_misconception?: string;
  prerequisite_titles?: string[];
  recent_attempts?: { correct: boolean }[];
  learner_level?: string;
}

export interface TutorRequest {
  mode: TutorMode;
  context: TutorContext;
  /** Optional free-text follow-up from the learner. */
  question?: string;
}

export type TutorStatus = 'ok' | 'fallback' | 'unavailable';

export interface TutorResult {
  mode: TutorMode;
  text: string;
  status: TutorStatus;
  provider: string;
  /** IDs of the verified context this response drew on (for traceability). */
  verified_context_ids: string[];
}

/** What a raw provider returns before gateway validation. */
export interface ProviderResponse {
  text: string;
}

/** Provider-neutral interface (AI-001, doc 08 §9 replaceability). */
export interface TutorProvider {
  readonly name: string;
  isAvailable(): boolean;
  generate(request: TutorRequest): Promise<ProviderResponse>;
}
