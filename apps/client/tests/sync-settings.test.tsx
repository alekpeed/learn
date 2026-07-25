/**
 * Optional sync in the UI (Phase 20): off by default, credentials never in the
 * event log, and a failure that leaves local progress alone.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  InMemoryEventStore,
  InMemorySyncBackend,
  exportEvents,
  type SyncBackend,
} from '@learn/persistence';
import type { LearningEvent } from '@learn/domain';
import { SyncSettings } from '../src/components/SyncSettings.js';
import { clearSyncSettings, getSyncSettings } from '../src/data/syncConfig.js';

function event(id: string, seq: number, learnerId = 'l1'): LearningEvent {
  return {
    event_id: id,
    type: 'answer_submitted',
    learner_id: learnerId,
    created_at: `2026-07-25T00:00:0${seq}.000Z`,
    seq,
    payload: { skill_id: 'math.a.b', correct: true },
  };
}

beforeEach(() => {
  clearSyncSettings();
});

async function enableSync(endpoint = 'https://example.test/api'): Promise<void> {
  await userEvent.click(screen.getByRole('checkbox', { name: /sync progress between/i }));
  await userEvent.type(await screen.findByLabelText(/sync endpoint/i), endpoint);
}

describe('sync settings (Phase 20)', () => {
  it('is off by default and shows no configuration', () => {
    render(<SyncSettings learnerId="l1" store={new InMemoryEventStore()} />);
    expect(screen.getByRole('checkbox', { name: /sync progress between/i })).not.toBeChecked();
    expect(screen.queryByLabelText(/sync endpoint/i)).toBeNull();
  });

  it('will not sync until an endpoint is supplied', async () => {
    render(<SyncSettings learnerId="l1" store={new InMemoryEventStore()} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /sync progress between/i }));
    expect(await screen.findByRole('button', { name: /sync now/i })).toBeDisabled();
  });

  it('pushes local progress and reports what moved', async () => {
    const store = new InMemoryEventStore();
    await store.append(event('a', 1));
    const backend = new InMemorySyncBackend();

    render(<SyncSettings learnerId="l1" store={store} backendFor={() => backend} />);
    await enableSync();
    await userEvent.click(screen.getByRole('button', { name: /sync now/i }));

    expect(await screen.findByText(/received 0, sent 1/i)).toBeVisible();
    expect(backend.size()).toBe(1);
  });

  it('brings down progress made on another device', async () => {
    const store = new InMemoryEventStore();
    const backend = new InMemorySyncBackend();
    await backend.push('l1', [event('from-phone', 1)]);

    render(<SyncSettings learnerId="l1" store={store} backendFor={() => backend} />);
    await enableSync();
    await userEvent.click(screen.getByRole('button', { name: /sync now/i }));

    await waitFor(async () => {
      expect(await store.getByLearner('l1')).toHaveLength(1);
    });
    expect(await screen.findByText(/received 1, sent 0/i)).toBeVisible();
  });

  it('says so plainly when the remote cannot be reached, and keeps local data', async () => {
    const store = new InMemoryEventStore();
    await store.append(event('a', 1));
    const failing: SyncBackend = {
      name: 'broken',
      pull: async () => {
        throw new Error('network down');
      },
      push: async () => {},
    };

    render(<SyncSettings learnerId="l1" store={store} backendFor={() => failing} />);
    await enableSync();
    await userEvent.click(screen.getByRole('button', { name: /sync now/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/network down/i);
    expect(alert).toHaveTextContent(/unchanged/i);
    expect(await store.getByLearner('l1')).toHaveLength(1);
  });

  it('reports an already-synced device rather than inventing activity', async () => {
    const store = new InMemoryEventStore();
    const backend = new InMemorySyncBackend();

    render(<SyncSettings learnerId="l1" store={store} backendFor={() => backend} />);
    await enableSync();
    await userEvent.click(screen.getByRole('button', { name: /sync now/i }));

    expect(await screen.findByText(/already up to date/i)).toBeVisible();
  });

  it('keeps the endpoint and token out of the exported progress log', async () => {
    const store = new InMemoryEventStore();
    await store.append(event('a', 1));

    render(
      <SyncSettings learnerId="l1" store={store} backendFor={() => new InMemorySyncBackend()} />,
    );
    await enableSync('https://secret.example/api');
    await userEvent.type(await screen.findByLabelText(/access token/i), 'super-secret-token');

    // Stored on the device...
    await waitFor(() => {
      expect(getSyncSettings().token).toBe('super-secret-token');
    });
    // ...and nowhere near the log a learner might share (DEC-015).
    const exported = await exportEvents(store);
    expect(exported).not.toContain('super-secret-token');
    expect(exported).not.toContain('secret.example');
  });
});
