/**
 * Learner repository (FND-003): create/load a local learner and update settings,
 * all expressed as append-only events projected back into a Learner.
 */
import type {
  Learner,
  LearnerPreferences,
  AccessibilitySettings,
  LearningEvent,
  LearningEventType,
} from '@learn/domain';
import type { EventStore } from './event-store.js';
import { projectLearner } from './projections.js';
import { newId } from './id.js';
import { systemClock, type Clock } from './clock.js';

export class LearnerRepository {
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

  async load(learnerId: string): Promise<Learner | null> {
    return projectLearner(await this.store.getByLearner(learnerId));
  }

  /**
   * Every profile on this device, oldest first (Phase 25 multi-learner).
   *
   * Each learner is projected from their own events only, so one profile can
   * never pick up another's settings. Grouping by `learner_id` is enough
   * because every event has carried it since Phase 1 - the storage layer was
   * multi-learner from the start, and only the UI assumed a single profile.
   */
  async listLearners(): Promise<Learner[]> {
    const all = await this.store.getAll();
    const byLearner = new Map<string, LearningEvent[]>();
    for (const event of all) {
      const list = byLearner.get(event.learner_id) ?? [];
      list.push(event);
      byLearner.set(event.learner_id, list);
    }
    const learners: Learner[] = [];
    for (const events of byLearner.values()) {
      const learner = projectLearner(events);
      if (learner) learners.push(learner);
    }
    learners.sort((a, b) =>
      a.created_at === b.created_at
        ? a.learner_id.localeCompare(b.learner_id)
        : a.created_at.localeCompare(b.created_at),
    );
    return learners;
  }

  /**
   * Load the active profile. `preferredId` names the profile the device last
   * selected; if it is missing or no longer exists, the most recently created
   * profile is used, which is what a single-profile device has always done.
   */
  async loadCurrent(preferredId?: string | null): Promise<Learner | null> {
    const learners = await this.listLearners();
    if (learners.length === 0) return null;
    if (preferredId) {
      const match = learners.find((l) => l.learner_id === preferredId);
      if (match) return match;
    }
    return learners[learners.length - 1] ?? null;
  }

  async createProfile(displayName: string): Promise<Learner> {
    const learnerId = newId();
    await this.record(learnerId, 'profile_created', {
      learner_id: learnerId,
      display_name: displayName,
    });
    const learner = await this.load(learnerId);
    if (!learner) throw new Error('profile projection failed after creation');
    return learner;
  }

  async updateSettings(
    learnerId: string,
    changes: {
      preferences?: Partial<LearnerPreferences>;
      accessibility_settings?: Partial<AccessibilitySettings>;
    },
  ): Promise<Learner> {
    await this.record(learnerId, 'settings_changed', changes);
    const learner = await this.load(learnerId);
    if (!learner) throw new Error('cannot update settings before profile exists');
    return learner;
  }

  /** Reset all local data. Callers MUST confirm with the user first (FND-003). */
  async resetAll(): Promise<void> {
    await this.store.clear();
  }

  /**
   * Delete one profile and everything it recorded, leaving other profiles
   * untouched. Callers MUST confirm with the user first.
   */
  async deleteLearner(learnerId: string): Promise<void> {
    await this.store.deleteLearner(learnerId);
  }
}
