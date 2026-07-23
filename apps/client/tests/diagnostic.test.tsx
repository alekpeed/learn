import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CurriculumProvider } from '../src/state/CurriculumContext.js';
import { DiagnosticScreen } from '../src/screens/DiagnosticScreen.js';
import { DiagnosticResults } from '../src/screens/DiagnosticResults.js';

function renderDiagnostic() {
  return render(
    <CurriculumProvider>
      <MemoryRouter initialEntries={['/diagnostic']}>
        <Routes>
          <Route path="/diagnostic" element={<DiagnosticScreen />} />
          <Route path="/diagnostic/results" element={<DiagnosticResults />} />
          <Route path="/lesson" element={<div>Lesson screen</div>} />
          <Route path="/practice" element={<div>Practice screen</div>} />
        </Routes>
      </MemoryRouter>
    </CurriculumProvider>,
  );
}

describe('Diagnostic flow (Phase 5)', () => {
  it('presents one question at a time and reaches a results recommendation', async () => {
    renderDiagnostic();

    // First probe is a real question with a submit and a skip.
    expect(await screen.findByRole('heading', { name: /^diagnostic$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();

    // Answer probes until the diagnostic completes and routes to results.
    // The sample has few probeable skills, so a couple of submits suffice.
    for (let i = 0; i < 4; i++) {
      const results = screen.queryByRole('heading', { name: /diagnostic results/i });
      if (results) break;
      const text = screen.queryByLabelText(/your answer/i);
      if (text) {
        await userEvent.clear(text);
        await userEvent.type(text, '0');
      } else {
        // choice question
        const radios = screen.queryAllByRole('radio');
        if (radios[0]) await userEvent.click(radios[0]);
      }
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    }

    expect(await screen.findByRole('heading', { name: /diagnostic results/i })).toBeInTheDocument();
    expect(screen.getByText(/recommended starting point/i)).toBeInTheDocument();
  });

  it('results screen offers an override starting point', () => {
    render(
      <CurriculumProvider>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/diagnostic/results',
              state: {
                strong: [],
                weak: ['math.number_foundations.place_value'],
                untestedRemainUnknown: true,
                recommendedSkillId: 'math.number_foundations.place_value',
                explanation: 'test',
              },
            },
          ]}
        >
          <Routes>
            <Route path="/diagnostic/results" element={<DiagnosticResults />} />
          </Routes>
        </MemoryRouter>
      </CurriculumProvider>,
    );
    expect(screen.getByRole('heading', { name: /diagnostic results/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/choose a starting skill/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start here instead/i })).toBeInTheDocument();
  });
});
