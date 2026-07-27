/**
 * Learner state: loads the local profile from the event log, exposes profile
 * creation, settings updates, and reset. Applies accessibility settings to the
 * document root so text size / contrast / reduced motion / theme take effect
 * app-wide.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Learner, LearnerPreferences, AccessibilitySettings } from '@learn/domain';
import { toAppError, type AppError } from '@learn/domain';
import { LearnerRepository } from '@learn/persistence';
import { learnerRepository as defaultRepo } from '../data/repository.js';
import { getActiveLearnerId, setActiveLearnerId } from '../data/activeLearner.js';

export type LoadStatus = 'loading' | 'ready' | 'error';

interface LearnerContextValue {
  status: LoadStatus;
  learner: Learner | null;
  /** Every profile on this device, oldest first (Phase 25). */
  learners: Learner[];
  error: AppError | null;
  createProfile: (displayName: string) => Promise<void>;
  updateSettings: (changes: {
    preferences?: Partial<LearnerPreferences>;
    accessibility_settings?: Partial<AccessibilitySettings>;
    /** Subject chosen at Goal Selection (doc 07). */
    current_course_id?: string;
  }) => Promise<void>;
  /** Switch the device to another profile. */
  switchTo: (learnerId: string) => Promise<void>;
  /** Delete one profile and everything it recorded. Confirm before calling. */
  deleteLearner: (learnerId: string) => Promise<void>;
  resetAll: () => Promise<void>;
  /** Re-read the learner from storage (e.g. after importing progress). */
  reload: () => Promise<void>;
}

const LearnerContext = createContext<LearnerContextValue | null>(null);

export function applyAccessibility(settings: AccessibilitySettings | undefined): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.textSize = settings?.text_size ?? 'medium';
  root.dataset.contrast = settings?.contrast ?? 'normal';
  root.dataset.reducedMotion = String(settings?.reduced_motion ?? false);
  // 'system' is the default and is resolved by CSS, not here, so a learner who
  // never opens Settings still gets the OS palette with no flash of the wrong one.
  root.dataset.theme = settings?.theme ?? 'system';
}

export function LearnerProvider({
  children,
  repository = defaultRepo,
}: {
  children: ReactNode;
  repository?: LearnerRepository;
}): JSX.Element {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [learner, setLearner] = useState<Learner | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([repository.loadCurrent(getActiveLearnerId()), repository.listLearners()])
      .then(([l, all]) => {
        if (cancelled) return;
        setLearner(l);
        setLearners(all);
        applyAccessibility(l?.accessibility_settings);
        setStatus('ready');
      })
      .catch((e) => {
        if (cancelled) return;
        setError(toAppError(e));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const value = useMemo<LearnerContextValue>(
    () => ({
      status,
      learner,
      learners,
      error,
      async createProfile(displayName) {
        const l = await repository.createProfile(displayName);
        // A new profile becomes the active one, so creating it from the
        // Learners screen switches to it rather than silently adding it.
        setActiveLearnerId(l.learner_id);
        setLearner(l);
        setLearners(await repository.listLearners());
        applyAccessibility(l.accessibility_settings);
      },
      async updateSettings(changes) {
        if (!learner) return;
        const l = await repository.updateSettings(learner.learner_id, changes);
        setLearner(l);
        setLearners(await repository.listLearners());
        applyAccessibility(l.accessibility_settings);
      },
      async switchTo(learnerId) {
        const l = await repository.load(learnerId);
        if (!l) return;
        setActiveLearnerId(learnerId);
        setLearner(l);
        // Each profile carries its own accessibility settings, so switching
        // must re-apply them or the previous learner's theme would persist.
        applyAccessibility(l.accessibility_settings);
      },
      async deleteLearner(learnerId) {
        await repository.deleteLearner(learnerId);
        const remaining = await repository.listLearners();
        setLearners(remaining);
        if (learner?.learner_id === learnerId) {
          const next = remaining[remaining.length - 1] ?? null;
          setActiveLearnerId(next?.learner_id ?? null);
          setLearner(next);
          applyAccessibility(next?.accessibility_settings);
        }
      },
      async resetAll() {
        await repository.resetAll();
        setActiveLearnerId(null);
        setLearner(null);
        setLearners([]);
        applyAccessibility(undefined);
      },
      async reload() {
        const [l, all] = await Promise.all([
          repository.loadCurrent(getActiveLearnerId()),
          repository.listLearners(),
        ]);
        setLearner(l);
        setLearners(all);
        applyAccessibility(l?.accessibility_settings);
        setStatus('ready');
      },
    }),
    [status, learner, learners, error, repository],
  );

  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>;
}

export function useLearner(): LearnerContextValue {
  const ctx = useContext(LearnerContext);
  if (!ctx) throw new Error('useLearner must be used within a LearnerProvider');
  return ctx;
}

/** Like useLearner but returns null instead of throwing when no provider is present. */
export function useOptionalLearner(): LearnerContextValue | null {
  return useContext(LearnerContext);
}
