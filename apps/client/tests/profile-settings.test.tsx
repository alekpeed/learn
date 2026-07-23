import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InMemoryEventStore, LearnerRepository } from '@learn/persistence';
import { LearnerProvider, applyAccessibility } from '../src/state/LearnerContext.js';
import { Welcome } from '../src/screens/Welcome.js';
import { Settings } from '../src/screens/Settings.js';
import { Dashboard } from '../src/screens/Dashboard.js';

function renderApp(repo: LearnerRepository, path = '/') {
  return render(
    <LearnerProvider repository={repo}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    </LearnerProvider>,
  );
}

beforeEach(() => {
  applyAccessibility(undefined);
});

describe('local learner profile (FND-003)', () => {
  it('creates a profile and lands on the dashboard', async () => {
    const store = new InMemoryEventStore();
    const repo = new LearnerRepository(store, () => '2026-07-23T00:00:00.000Z');
    renderApp(repo);

    await screen.findByRole('heading', { name: /^welcome$/i });
    await userEvent.type(screen.getByLabelText(/your name/i), 'Ada');
    await userEvent.click(screen.getByRole('button', { name: /start learning/i }));

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/hello, ada/i)).toBeInTheDocument();
  });

  it('persists the profile across a fresh provider (restart)', async () => {
    const store = new InMemoryEventStore();
    const clock = () => '2026-07-23T00:00:00.000Z';
    await new LearnerRepository(store, clock).createProfile('Grace');

    // New repository instance over the same store == app restart.
    renderApp(new LearnerRepository(store, clock));
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByText(/grace/i)).toBeInTheDocument();
  });
});

describe('settings + accessibility (P1-5)', () => {
  it('applies text size to the document root and persists it', async () => {
    const store = new InMemoryEventStore();
    const clock = () => '2026-07-23T00:00:00.000Z';
    await new LearnerRepository(store, clock).createProfile('Kit');

    renderApp(new LearnerRepository(store, clock), '/settings');
    const select = await screen.findByLabelText(/text size/i);
    await userEvent.selectOptions(select, 'large');

    await waitFor(() => {
      expect(document.documentElement.dataset.textSize).toBe('large');
    });

    // Persisted: a fresh provider reads it back from the event log.
    applyAccessibility(undefined);
    renderApp(new LearnerRepository(store, clock), '/settings');
    await waitFor(() => {
      expect(document.documentElement.dataset.textSize).toBe('large');
    });
  });

  it('requires confirmation before resetting local data', async () => {
    const store = new InMemoryEventStore();
    const clock = () => '2026-07-23T00:00:00.000Z';
    await new LearnerRepository(store, clock).createProfile('Temp');

    renderApp(new LearnerRepository(store, clock), '/settings');
    await userEvent.click(await screen.findByRole('button', { name: /reset local data/i }));
    // Confirmation dialog appears; nothing deleted yet.
    expect(screen.getByRole('alertdialog', { name: /confirm reset/i })).toBeInTheDocument();
    expect(await store.getAll()).not.toHaveLength(0);
  });
});
