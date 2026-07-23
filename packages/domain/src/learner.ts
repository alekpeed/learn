/**
 * Local learner profile and settings (docs 09 §1, 07 §2 Settings).
 */

export type TextSize = 'small' | 'medium' | 'large' | 'x-large';
export type Contrast = 'normal' | 'high';
export type SessionDuration = 5 | 15 | 30 | 60 | 'custom';

export interface AccessibilitySettings {
  text_size: TextSize;
  contrast: Contrast;
  reduced_motion: boolean;
}

export interface LearnerPreferences {
  sound: boolean;
  session_duration: SessionDuration;
  custom_duration_minutes?: number;
  /** AI tutor is OFF by default in the MVP (DEC-010, doc 15 §10). */
  ai_tutor_enabled: boolean;
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
};

export const DEFAULT_PREFERENCES: LearnerPreferences = {
  sound: true,
  session_duration: 15,
  ai_tutor_enabled: false,
};
