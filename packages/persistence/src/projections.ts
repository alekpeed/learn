/**
 * Projections: pure functions that fold the append-only event log into
 * current state (DEC-006). Identical event sequences always yield identical
 * state (reproducible progress — doc 11).
 */
import type {
  LearningEvent,
  Learner,
  LearnerPreferences,
  AccessibilitySettings,
} from '@learn/domain';
import { DEFAULT_PREFERENCES, DEFAULT_ACCESSIBILITY_SETTINGS } from '@learn/domain';

interface ProfileCreatedPayload {
  learner_id: string;
  display_name: string;
}

/**
 * Reconstruct the local learner from events. Returns null if no profile has
 * been created. The most recent `profile_created` wins; `settings_changed`
 * events are applied in sequence order.
 */
export function projectLearner(events: LearningEvent[]): Learner | null {
  let learner: Learner | null = null;

  for (const event of events) {
    if (event.type === 'profile_created') {
      const p = event.payload as unknown as ProfileCreatedPayload;
      learner = {
        learner_id: p.learner_id,
        display_name: p.display_name,
        created_at: event.created_at,
        preferences: { ...DEFAULT_PREFERENCES },
        accessibility_settings: { ...DEFAULT_ACCESSIBILITY_SETTINGS },
      };
    } else if (event.type === 'settings_changed' && learner) {
      const p = event.payload as {
        preferences?: Partial<LearnerPreferences>;
        accessibility_settings?: Partial<AccessibilitySettings>;
        current_course_id?: string;
      };
      if (p.current_course_id !== undefined) {
        learner.current_course_id = p.current_course_id;
      }
      if (p.preferences) {
        learner.preferences = { ...learner.preferences, ...p.preferences };
      }
      if (p.accessibility_settings) {
        learner.accessibility_settings = {
          ...learner.accessibility_settings,
          ...p.accessibility_settings,
        };
      }
    }
  }

  return learner;
}
