import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  InMemoryEventStore,
  PracticeRepository,
  exportEvents,
  type EventStore,
} from '@learn/persistence';
import { DataSettings } from '../src/components/DataSettings.js';

async function seededStore(): Promise<EventStore> {
  const store = new InMemoryEventStore();
  const repo = new PracticeRepository(store, () => '2026-07-23T00:00:00.000Z');
  await repo.submitAttempt('L1', {
    question_id: 'q1',
    skill_id: 's1',
    submitted_answer: '3/5',
    normalized_answer: '3/5',
    correct: true,
    attempt_number: 1,
    hints_used: 0,
    difficulty: 2,
    response_time_ms: 100,
    dimensions: ['accuracy'],
    is_transfer: false,
  });
  return store;
}

describe('DataSettings import (REL-002)', () => {
  it('imports events from a file and reports the count', async () => {
    const source = await seededStore();
    const dump = await exportEvents(source);

    const target = new InMemoryEventStore();
    let imported = false;
    render(
      <DataSettings
        store={target}
        onImported={() => {
          imported = true;
        }}
      />,
    );

    const file = new File([dump], 'progress.json', { type: 'application/json' });
    await userEvent.upload(screen.getByLabelText(/import progress from a file/i), file);

    expect(await screen.findByText(/imported 1 new event/i)).toBeInTheDocument();
    expect(await target.getAll()).toHaveLength(1);
    expect(imported).toBe(true);
  });

  it('re-importing the same file adds nothing (idempotent)', async () => {
    const source = await seededStore();
    const dump = await exportEvents(source);
    const target = new InMemoryEventStore();
    render(<DataSettings store={target} />);

    const input = screen.getByLabelText(/import progress from a file/i);
    const file = new File([dump], 'progress.json', { type: 'application/json' });
    await userEvent.upload(input, file);
    await screen.findByText(/imported 1 new event/i);
    await userEvent.upload(input, file);
    expect(await screen.findByText(/imported 0 new events/i)).toBeInTheDocument();
    expect(await target.getAll()).toHaveLength(1);
  });

  it('reports a friendly error for an unreadable file without losing data', async () => {
    const target = await seededStore();
    render(<DataSettings store={target} />);
    const file = new File(['not json'], 'bad.json', { type: 'application/json' });
    await userEvent.upload(screen.getByLabelText(/import progress from a file/i), file);
    expect(await screen.findByText(/could not be imported/i)).toBeInTheDocument();
    expect(await target.getAll()).toHaveLength(1); // unchanged
  });
});
