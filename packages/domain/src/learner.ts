/**
 * Local learner profile and settings (docs 09 §1, 07 §2 Settings).
 */

export type TextSize = 'small' | 'medium' | 'large' | 'x-large';
export type Contrast = 'normal' | 'high';
/** Colour theme. `system` follows the operating system's light/dark setting. */
export type Theme = 'system' | 'light' | 'dark';
export type SessionDuration = 5 | 15 | 30 | 60 | 'custom';

/** Which tutor provider to use. `stub` is the built-in, offline, key-free tutor. */
export type AiProvider = 'stub' | 'openai' | 'anthropic' | 'gemini';

export interface AccessibilitySettings {
  text_size: TextSize;
  contrast: Contrast;
  reduced_motion: boolean;
  theme: Theme;
}

export interface LearnerPreferences {
  sound: boolean;
  session_duration: SessionDuration;
  custom_duration_minutes?: number;
  /** AI tutor is OFF by default in the MVP (DEC-010, doc 15 §10). */
  ai_tutor_enabled: boolean;
  /** Which provider the tutor uses. Defaults to the built-in stub (DEC-015). */
  ai_provider: AiProvider;
  /** Optional model override for the selected provider. */
  ai_model?: string;
  /** Daily goal: number of questions to answer per day (Version 1 study plans). */
  daily_goal_questions: number;
}

export interface Learner {
  learner_id: string;
  display_name: string;
  created_at: string;
  preferences: LearnerPreferences;
  accessibility_settings: AccessibilitySettings;
  current_course_id?: string;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  text_size: 'medium',
  contrast: 'normal',
  reduced_motion: false,
  theme: 'system',
};

export const DEFAULT_PREFERENCES: LearnerPreferences = {
  sound: true,
  session_duration: 15,
  ai_tutor_enabled: false,
  ai_provider: 'stub',
  daily_goal_questions: 10,
};
