/**
 * BYOK API-key storage (DEC-015). Keys live in localStorage, keyed per provider,
 * and are DELIBERATELY kept out of the event log — so exporting/importing
 * progress never carries the key. This is the standard bring-your-own-key model
 * for a local-first app with no backend.
 *
 * Security note: a key stored here is readable by anything running in this
 * origin and is sent directly to the provider. Do not use on a shared device.
 */
const PREFIX = 'learn.ai_key.';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function getApiKey(provider: string): string {
  return storage()?.getItem(PREFIX + provider) ?? '';
}

export function setApiKey(provider: string, key: string): void {
  storage()?.setItem(PREFIX + provider, key);
}

export function clearApiKey(provider: string): void {
  storage()?.removeItem(PREFIX + provider);
}

export function hasApiKey(provider: string): boolean {
  return getApiKey(provider).length > 0;
}
