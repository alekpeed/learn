/**
 * Sync configuration (Phase 20, DEC-015).
 *
 * Sync is OFF unless the learner turns it on and supplies an endpoint. The
 * config - including any token - lives in localStorage next to the BYOK keys,
 * deliberately NOT in the event log, so exporting progress to share it never
 * carries a credential, and so a synced log never contains the secret used to
 * sync it.
 *
 * Security note, same as BYOK: a token stored here is readable by anything
 * running in this origin. Do not use on a shared device.
 */
const ENABLED = 'learn.sync.enabled';
const ENDPOINT = 'learn.sync.endpoint';
const TOKEN = 'learn.sync.token';
const LAST_SYNC = 'learn.sync.last';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export interface SyncSettings {
  enabled: boolean;
  endpoint: string;
  token: string;
}

export function getSyncSettings(): SyncSettings {
  const s = storage();
  return {
    enabled: s?.getItem(ENABLED) === 'true',
    endpoint: s?.getItem(ENDPOINT) ?? '',
    token: s?.getItem(TOKEN) ?? '',
  };
}

export function setSyncSettings(settings: Partial<SyncSettings>): void {
  const s = storage();
  if (!s) return;
  if (settings.enabled !== undefined) s.setItem(ENABLED, String(settings.enabled));
  if (settings.endpoint !== undefined) s.setItem(ENDPOINT, settings.endpoint);
  if (settings.token !== undefined) s.setItem(TOKEN, settings.token);
}

/** Sync can only run with both the switch on and somewhere to sync to. */
export function isSyncConfigured(settings: SyncSettings = getSyncSettings()): boolean {
  return settings.enabled && settings.endpoint.trim().length > 0;
}

export function getLastSync(): string | null {
  return storage()?.getItem(LAST_SYNC) ?? null;
}

export function setLastSync(iso: string): void {
  storage()?.setItem(LAST_SYNC, iso);
}

export function clearSyncSettings(): void {
  const s = storage();
  if (!s) return;
  for (const key of [ENABLED, ENDPOINT, TOKEN, LAST_SYNC]) s.removeItem(key);
}
