/**
 * Which profile this device is currently using (Phase 25 multi-learner).
 *
 * Deliberately localStorage rather than the event log, for the same reason the
 * BYOK keys and sync config live there: "which profile is open on this laptop"
 * is a fact about the device, not about anyone's learning. Putting it in the
 * log would mean one device's choice syncing across to another and switching
 * the profile out from under a second learner, and it would travel in a
 * progress export where it means nothing.
 *
 * If the stored id names a profile that no longer exists, the repository falls
 * back to the most recently created one, so a stale value is harmless.
 */
const ACTIVE = 'learn.learner.active';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function getActiveLearnerId(): string | null {
  return storage()?.getItem(ACTIVE) ?? null;
}

export function setActiveLearnerId(learnerId: string | null): void {
  const s = storage();
  if (!s) return;
  if (learnerId) s.setItem(ACTIVE, learnerId);
  else s.removeItem(ACTIVE);
}
