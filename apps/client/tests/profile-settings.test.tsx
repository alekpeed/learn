import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InMemoryEventStore, LearnerRepository } from '@learn/persistence';
import { LearnerProvider, applyAccessibility } from '../src/state/LearnerContext.js';
import { CurriculumProvider } from '../src/state/CurriculumContext.js';
import { ProgressProvider } from '../src/state/ProgressContext.js';
import { Welcome } from '../src/screens/Welcome.js';
import { Settings } from '../src/screens/Settings.js';
import { Dashboard } from '../src/screens/Dashboard.js';
import { GoalSelection } from '../src/screens/GoalSelection.js';

function renderApp(repo: LearnerRepository, path = '/') {
  return render(
    <LearnerProvider repository={repo}>
      <CurriculumProvider>
        <ProgressProvider progressOverride={new Map()}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/goal" element={<GoalSelection />} />
              <Route path="/diagnostic" element={<h1>Diagnostic</h1>} />
            </Routes>
          </MemoryRouter>
        </ProgressProvider>
      </CurriculumProvider>
    </LearnerProvider>,
  );
}

beforeEach(() => {
  applyAccessibility(undefined);
});

describe('local learner profile (FND-003)', () => {
  it('creates a profile and goes on to goal selection, then the dashboard', async () => {
    const store = new InMemoryEventStore();
    const repo = new LearnerRepository(store, () => '2026-07-23T00:00:00.000Z');
    renderApp(repo);

    await screen.findByRole('heading', { name: /^welcome$/i });
    await userEvent.type(screen.getByLabelText(/your name/i), 'Ada');
    await userEvent.click(screen.getByRole('button', { name: /start learning/i }));

    // Doc 07 §1: Welcome -> Profile -> Goal Selection -> Dashboard. Goal
    // selection is skippable, so the defaults stand if the learner walks past.
    expect(await screen.findByRole('heading', { name: /goal selection/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /skip for now/i }));

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

/**
 * Goal Selection collects the five things doc 07 lists. Each is asserted by
 * reading it back out of the event log, because a control that renders but
 * writes nothing looks identical on screen to one that works.
 */
describe('goal selection (doc 07)', () => {
  async function openGoalScreen() {
    const store = new InMemoryEventStore();
    const clock = () => '2026-07-23T00:00:00.000Z';
    const repo = new LearnerRepository(store, clock);
    const learner = await repo.createProfile('Ada');
    renderApp(new LearnerRepository(store, clock), '/goal');
    await screen.findByRole('heading', { name: /goal selection/i });
    return { store, clock, learnerId: learner.learner_id };
  }

  it('collects all five things the spec asks for and records them', async () => {
    const { store, clock, learnerId } = await openGoalScreen();

    await userEvent.selectOptions(screen.getByLabelText(/how long is a sitting/i), '30');
    await userEvent.selectOptions(screen.getByLabelText(/days per week/i), '3');
    await userEvent.type(screen.getByLabelText(/working towards/i), 'pass a placement test');
    await userEvent.click(screen.getByRole('button', { name: /save and start/i }));

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();

    const saved = await new LearnerRepository(store, clock).load(learnerId);
    expect(saved?.preferences.session_duration).toBe(30);
    expect(saved?.preferences.study_days_per_week).toBe(3);
    expect(saved?.preferences.learning_goal).toBe('pass a placement test');
    expect(saved?.preferences.starting_point).toBe('beginning');
  });

  it('routes to the diagnostic when that is the chosen starting point', async () => {
    const { store, clock, learnerId } = await openGoalScreen();

    await userEvent.click(screen.getByRole('radio', { name: /take a short diagnostic/i }));
    await userEvent.click(screen.getByRole('button', { name: /save and take the diagnostic/i }));

    expect(await screen.findByRole('heading', { name: /diagnostic/i })).toBeInTheDocument();
    const saved = await new LearnerRepository(store, clock).load(learnerId);
    expect(saved?.preferences.starting_point).toBe('diagnostic');
  });

  it('leaves the defaults alone when skipped', async () => {
    const { store, clock, learnerId } = await openGoalScreen();

    await userEvent.click(screen.getByRole('button', { name: /skip for now/i }));
    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();

    const saved = await new LearnerRepository(store, clock).load(learnerId);
    expect(saved?.preferences.study_days_per_week).toBe(5);
    expect(saved?.preferences.learning_goal).toBeUndefined();
    expect(saved?.current_course_id).toBeUndefined();
  });

  it('asks for a number of minutes only when the sitting length is custom', async () => {
    await openGoalScreen();
    expect(screen.queryByLabelText(/minutes per sitting/i)).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText(/how long is a sitting/i), 'custom');
    expect(screen.getByLabelText(/minutes per sitting/i)).toBeInTheDocument();
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

  it('applies the theme choice to the document root and persists it', async () => {
    const store = new InMemoryEventStore();
    const clock = () => '2026-07-23T00:00:00.000Z';
    await new LearnerRepository(store, clock).createProfile('Nia');

    renderApp(new LearnerRepository(store, clock), '/settings');
    const select = (await screen.findByLabelText(/theme/i)) as HTMLSelectElement;
    // Nobody has chosen yet, so the app defers to the OS rather than picking one.
    expect(select.value).toBe('system');

    await userEvent.selectOptions(select, 'dark');
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    applyAccessibility(undefined);
    renderApp(new LearnerRepository(store, clock), '/settings');
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
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
