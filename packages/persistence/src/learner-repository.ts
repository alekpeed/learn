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

/** Injectable clock so projections/tests stay deterministic (no hidden wall-clock). */
export type Clock = () => string;
const systemClock: Clock = () => new Date().toISOString();

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

  /** Load the single local learner, if any exists (MVP is single-profile). */
  async loadCurrent(): Promise<Learner | null> {
    const all = await this.store.getAll();
    return projectLearner(all);
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
}
