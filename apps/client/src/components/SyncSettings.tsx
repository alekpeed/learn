/**
 * Optional sync (Phase 20). Off by default, and the app is complete without it -
 * this only exists so the same learner can carry progress between devices.
 *
 * Merging is a set union over the append-only log, so there is nothing to
 * choose between and nothing to lose: two devices that both practised offline
 * end up with both sets of events. A failed sync leaves local data untouched.
 */
import { useState, type FormEvent } from 'react';
import { syncEvents, HttpSyncBackend, type EventStore, type SyncBackend } from '@learn/persistence';
import {
  getSyncSettings,
  setSyncSettings,
  isSyncConfigured,
  getLastSync,
  setLastSync,
} from '../data/syncConfig.js';
import { eventStore as defaultStore } from '../data/repository.js';

export function SyncSettings({
  learnerId,
  store = defaultStore,
  onSynced,
  backendFor,
}: {
  learnerId: string | null;
  store?: EventStore;
  onSynced?: () => void | Promise<void>;
  /** Test seam: build a backend from the saved settings. */
  backendFor?: (endpoint: string, token: string) => SyncBackend;
}): JSX.Element {
  const [settings, setLocal] = useState(getSyncSettings);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastSync, setLast] = useState(getLastSync);

  function update(changes: Partial<typeof settings>): void {
    const next = { ...settings, ...changes };
    setLocal(next);
    setSyncSettings(changes);
  }

  async function onSyncNow(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!learnerId || !isSyncConfigured(settings)) return;
    setBusy(true);
    setStatus(null);
    setError(null);

    const backend = backendFor
      ? backendFor(settings.endpoint, settings.token)
      : new HttpSyncBackend({ endpoint: settings.endpoint, token: settings.token || undefined });

    const result = await syncEvents(store, backend, learnerId);
    setBusy(false);

    if (result.status === 'failed') {
      setError(
        `Sync did not finish: ${result.error ?? 'unknown error'}. Your progress on this device is unchanged.`,
      );
      if (result.pulled > 0) setStatus(`${result.pulled} received before it stopped.`);
      return;
    }

    const when = new Date().toISOString();
    setLastSync(when);
    setLast(when);
    setStatus(
      result.pulled === 0 && result.pushed === 0
        ? 'Already up to date.'
        : `Received ${result.pulled}, sent ${result.pushed}.`,
    );
    await onSynced?.();
  }

  return (
    <div className="sync-settings">
      <label>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
        />
        Sync progress between my devices (optional)
      </label>

      {settings.enabled && (
        <form onSubmit={onSyncNow}>
          <label htmlFor="sync-endpoint">Sync endpoint</label>
          <input
            id="sync-endpoint"
            type="url"
            placeholder="https://example.com/api"
            value={settings.endpoint}
            onChange={(e) => update({ endpoint: e.target.value })}
          />

          <label htmlFor="sync-token">Access token (optional)</label>
          <input
            id="sync-token"
            type="password"
            value={settings.token}
            onChange={(e) => update({ token: e.target.value })}
          />
          <p className="card-note">
            The endpoint and token are stored on this device only. They are never written to your
            progress log, so an exported file never contains them.
          </p>

          <button type="submit" disabled={!learnerId || !isSyncConfigured(settings) || busy}>
            {busy ? 'Syncing...' : 'Sync now'}
          </button>

          {lastSync && (
            <p className="card-note">Last synced {new Date(lastSync).toLocaleString()}.</p>
          )}
          {status && (
            <p className="feedback" role="status" data-status="success">
              {status}
            </p>
          )}
          {error && (
            <p className="feedback" role="alert" data-status="error">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
