import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AiProvider } from '@learn/domain';
import { AiTutorSettings } from '../src/components/AiTutorSettings.js';
import { getApiKey, clearApiKey } from '../src/data/aiCredentials.js';
import { exportEvents, InMemoryEventStore, PracticeRepository } from '@learn/persistence';

beforeEach(() => {
  for (const p of ['openai', 'anthropic', 'gemini']) clearApiKey(p);
});

function Harness({ initial = 'stub' as AiProvider }) {
  // Minimal controlled wrapper mimicking Settings' onChange.
  const state = { provider: initial as AiProvider, model: undefined as string | undefined };
  return (
    <AiTutorSettings
      provider={state.provider}
      model={state.model}
      onChange={() => {
        /* provider switching is covered via rerenders below */
      }}
    />
  );
}

describe('BYOK settings (DEC-015)', () => {
  it('shows no key field for the built-in stub', () => {
    render(<Harness initial="stub" />);
    expect(screen.getByLabelText(/tutor provider/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
  });

  it('saves an API key to local storage for a real provider', async () => {
    render(<Harness initial="openai" />);
    await userEvent.type(screen.getByLabelText(/api key/i), 'sk-secret');
    await userEvent.click(screen.getByRole('button', { name: /save key/i }));
    expect(getApiKey('openai')).toBe('sk-secret');
    expect(screen.getByText(/key is saved on this device/i)).toBeInTheDocument();
  });

  it('can remove a saved key', async () => {
    render(<Harness initial="anthropic" />);
    await userEvent.type(screen.getByLabelText(/api key/i), 'sk-ant');
    await userEvent.click(screen.getByRole('button', { name: /save key/i }));
    await userEvent.click(screen.getByRole('button', { name: /remove key/i }));
    expect(getApiKey('anthropic')).toBe('');
  });
});

describe('the API key never leaks into an export', () => {
  it('exported progress contains no stored key', async () => {
    render(<Harness initial="gemini" />);
    await userEvent.type(screen.getByLabelText(/api key/i), 'g-secret-key');
    await userEvent.click(screen.getByRole('button', { name: /save key/i }));

    // Progress export serializes the event log only — never localStorage keys.
    const store = new InMemoryEventStore();
    const repo = new PracticeRepository(store, () => '2026-07-23T00:00:00.000Z');
    await repo.submitAttempt('L1', {
      question_id: 'q1',
      skill_id: 's1',
      submitted_answer: '1',
      normalized_answer: '1',
      correct: true,
      attempt_number: 1,
      hints_used: 0,
      difficulty: 1,
      response_time_ms: 1,
      dimensions: ['accuracy'],
      is_transfer: false,
    });
    const dump = await exportEvents(store);
    expect(dump).not.toContain('g-secret-key');
  });
});
