/**
 * Runtime content types (mirrors the JSON Schemas in @learn/schemas).
 * These describe already-parsed content; validation is performed by the loader.
 */
import type { MasteryScores } from '@learn/domain';

export interface SkillPrerequisite {
  prerequisite_skill_id: string;
  minimum_threshold?: number;
  relationship_type?: 'required' | 'recommended';
}

export interface Skill {
  skill_id: string;
  unit_id: string;
  title: string;
  summary: string;
  objectives: string[];
  vocabulary?: { term: string; definition: string }[];
  prerequisites: SkillPrerequisite[];
  successors?: string[];
  difficulty_band?: number;
  mastery_thresholds: MasteryScores;
  content_version: string;
}

export type LessonComponentType =
  | 'learning_objective'
  | 'prerequisite_reminder'
  | 'intuitive_explanation'
  | 'representation'
  | 'formal_terminology'
  | 'worked_example'
  | 'guided_practice'
  | 'independent_practice'
  | 'transfer_problem'
  | 'common_mistakes'
  | 'summary'
  | 'review_prompt';

export interface LessonComponent {
  type: LessonComponentType;
  body: string;
  accessible_text?: string;
  media_ref?: string;
}

export interface Lesson {
  lesson_id: string;
  skill_id: string;
  title: string;
  components: LessonComponent[];
  content_version: string;
}

export interface Question {
  question_id: string;
  skill_id: string;
  type: string;
  difficulty: number;
  prompt: string;
  parameters?: Record<string, unknown>;
  answer_spec: { correct_answer: unknown; accepted_equivalents?: unknown[]; unit?: string };
  validator: string;
  hints: { level: number; text: string }[];
  /**
   * Wrong answers the author expects, each naming the misconception it reveals.
   * The deterministic diagnoser matches against these first (doc 04 §8).
   */
  common_wrong_answers?: { value: unknown; misconception_id: string }[];
  dimensions: string[];
  explanation: string;
  transfer_flag?: boolean;
  content_version: string;
}

/**
 * A named misconception and how to correct it (doc 06 §8). Questions point at
 * these by ID; the catalog is what turns a detected slip into remediation the
 * learner can act on, with no AI involved.
 */
export interface Misconception {
  misconception_id: string;
  description: string;
  detection_rule: {
    kind: 'equals_value' | 'matches_pattern' | 'sign_flip' | 'off_by_place_value' | 'custom';
    value?: unknown;
    pattern?: string;
  };
  example_wrong_answer?: unknown;
  corrective_explanation: string;
  /** A prerequisite worth re-checking when this misconception keeps recurring. */
  recommended_prerequisite_check?: string;
  follow_up_question_id?: string;
  content_version: string;
}

export interface Unit {
  unit_id: string;
  title: string;
  order: number;
}

export interface Course {
  course_id: string;
  subject_id: string;
  title: string;
  version: string;
  status: 'draft' | 'published' | 'retired';
  units: Unit[];
}

export interface Manifest {
  schema_version: string;
  content_version: string;
  courses: string[];
  generated_at: string;
  change_summary?: string;
}

/** The raw, unvalidated shape a package is loaded from. */
export interface RawCoursePackage {
  manifest: unknown;
  courses: unknown[];
  skills: unknown[];
  lessons: unknown[];
  questions: unknown[];
  misconceptions?: unknown[];
}
