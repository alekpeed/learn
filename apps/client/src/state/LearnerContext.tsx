/**
 * Learner state: loads the local profile from the event log, exposes profile
 * creation, settings updates, and reset. Applies accessibility settings to the
 * document root so text size / contrast / reduced motion take effect app-wide.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Learner, LearnerPreferences, AccessibilitySettings } from '@learn/domain';
import { toAppError, type AppError } from '@learn/domain';
import { LearnerRepository } from '@learn/persistence';
import { learnerRepository as defaultRepo } from '../data/repository.js';

export type LoadStatus = 'loading' | 'ready' | 'error';

interface LearnerContextValue {
  status: LoadStatus;
  learner: Learner | null;
  error: AppError | null;
  createProfile: (displayName: string) => Promise<void>;
  updateSettings: (changes: {
    preferences?: Partial<LearnerPreferences>;
    accessibility_settings?: Partial<AccessibilitySettings>;
  }) => Promise<void>;
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
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    let cancelled = false;
    repository
      .loadCurrent()
      .then((l) => {
        if (cancelled) return;
        setLearner(l);
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
      error,
      async createProfile(displayName) {
        const l = await repository.createProfile(displayName);
        setLearner(l);
        applyAccessibility(l.accessibility_settings);
      },
      async updateSettings(changes) {
        if (!learner) return;
        const l = await repository.updateSettings(learner.learner_id, changes);
        setLearner(l);
        applyAccessibility(l.accessibility_settings);
      },
      async resetAll() {
        await repository.resetAll();
        setLearner(null);
        applyAccessibility(undefined);
      },
      async reload() {
        const l = await repository.loadCurrent();
        setLearner(l);
        applyAccessibility(l?.accessibility_settings);
        setStatus('ready');
      },
    }),
    [status, learner, error, repository],
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
