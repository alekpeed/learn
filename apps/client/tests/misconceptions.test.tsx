/**
 * Phase 17 end-to-end through the client: an authored wrong answer is diagnosed,
 * recorded on the event, surfaced as a correction, and - once repeated - listed
 * as a sticking point.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InMemoryEventStore, LearnerRepository, PracticeRepository } from '@learn/persistence';
import { projectMisconceptions } from '@learn/learning-engine';
import { LearnerProvider } from '../src/state/LearnerContext.js';
import { CurriculumProvider } from '../src/state/CurriculumContext.js';
import { ProgressProvider } from '../src/state/ProgressContext.js';
import { QuestionView } from '../src/components/QuestionView.js';
import { Progress } from '../src/screens/Progress.js';
import { loadSampleCurriculum } from '../src/data/curriculum.js';

const CLOCK = () => '2026-07-23T00:00:00.000Z';

/** The fractions item whose authored wrong answer is "add both parts". */
function taggedQuestion() {
  const loaded = loadSampleCurriculum();
  if (!loaded.ok) throw new Error(loaded.errors.join('\n'));
  const q = loaded.package.questions.find(
    (item) =>
      item.validator === 'fraction' &&
      (item.common_wrong_answers ?? []).some(
        (c) => c.misconception_id === 'mc.math.fractions.add_numerators_and_denominators',
      ),
  );
  if (!q) throw new Error('expected a fractions question tagged with the add-both-parts slip');
  const wrong = q.common_wrong_answers!.find(
    (c) => c.misconception_id === 'mc.math.fractions.add_numerators_and_denominators',
  )!;
  return { question: q, wrong: String(wrong.value) };
}

function renderQuestion(store: InMemoryEventStore, learnerId: string) {
  const { question, wrong } = taggedQuestion();
  render(
    <LearnerProvider repository={new LearnerRepository(store, CLOCK)}>
      <CurriculumProvider>
        <ProgressProvider loadEvents={(id) => store.getByLearner(id)}>
          <MemoryRouter>
            <QuestionView
              question={question}
              learnerId={learnerId}
              repository={new PracticeRepository(store, CLOCK)}
            />
          </MemoryRouter>
        </ProgressProvider>
      </CurriculumProvider>
    </LearnerProvider>,
  );
  return { question, wrong };
}

describe('misconception diagnosis and remediation (Phase 17)', () => {
  it('shows the authored correction and records the misconception on the event', async () => {
    const store = new InMemoryEventStore();
    const learner = await new LearnerRepository(store, CLOCK).createProfile('Ada');
    const { wrong } = renderQuestion(store, learner.learner_id);

    await userEvent.type(await screen.findByLabelText(/your answer/i), wrong);
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    // The catalog's corrective explanation, not the generic "not quite".
    expect(await screen.findByText(/add the numerators and keep the denominator/i)).toBeVisible();

    const events = await store.getByLearner(learner.learner_id);
    const attempt = events.find((e) => e.type === 'answer_submitted');
    expect(attempt?.payload.misconception_id).toBe(
      'mc.math.fractions.add_numerators_and_denominators',
    );
    expect(attempt?.payload.diagnosis_category).toBe('conceptual_misunderstanding');
  });

  it('escalates the heading once the same slip repeats', async () => {
    const store = new InMemoryEventStore();
    const learner = await new LearnerRepository(store, CLOCK).createProfile('Ada');
    const { question, wrong } = taggedQuestion();

    // A prior session already showed this misconception twice.
    const practice = new PracticeRepository(store, CLOCK);
    for (let i = 0; i < 2; i += 1) {
      await practice.submitAttempt(learner.learner_id, {
        question_id: question.question_id,
        skill_id: question.skill_id,
        submitted_answer: wrong,
        normalized_answer: wrong,
        correct: false,
        attempt_number: i + 1,
        hints_used: 0,
        difficulty: question.difficulty,
        response_time_ms: 1000,
        dimensions: question.dimensions,
        is_transfer: false,
        diagnosis_category: 'conceptual_misunderstanding',
        misconception_id: 'mc.math.fractions.add_numerators_and_denominators',
      });
    }

    renderQuestion(store, learner.learner_id);
    await userEvent.type(await screen.findByLabelText(/your answer/i), wrong);
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/this one keeps coming up/i)).toBeVisible();
  });

  it('lists a recurring slip as a sticking point on the progress screen', async () => {
    const store = new InMemoryEventStore();
    const learner = await new LearnerRepository(store, CLOCK).createProfile('Ada');
    const { question, wrong } = taggedQuestion();
    const practice = new PracticeRepository(store, CLOCK);
    for (let i = 0; i < 2; i += 1) {
      await practice.submitAttempt(learner.learner_id, {
        question_id: question.question_id,
        skill_id: question.skill_id,
        submitted_answer: wrong,
        normalized_answer: wrong,
        correct: false,
        attempt_number: i + 1,
        hints_used: 0,
        difficulty: question.difficulty,
        response_time_ms: 1000,
        dimensions: question.dimensions,
        is_transfer: false,
        diagnosis_category: 'conceptual_misunderstanding',
        misconception_id: 'mc.math.fractions.add_numerators_and_denominators',
      });
    }

    render(
      <LearnerProvider repository={new LearnerRepository(store, CLOCK)}>
        <CurriculumProvider>
          <ProgressProvider loadEvents={(id) => store.getByLearner(id)}>
            <MemoryRouter>
              <Routes>
                <Route path="/" element={<Progress />} />
              </Routes>
            </MemoryRouter>
          </ProgressProvider>
        </CurriculumProvider>
      </LearnerProvider>,
    );

    // The screen re-renders from loading to loaded, so query fresh each poll
    // rather than holding on to a node that gets replaced.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sticking points/i })).toBeInTheDocument();
      expect(screen.getByText(/adds numerators and denominators separately/i)).toBeInTheDocument();
    });

    // And the projection agrees it is active.
    const active = projectMisconceptions(await store.getByLearner(learner.learner_id));
    expect(active[0]?.active).toBe(true);
  });
});
