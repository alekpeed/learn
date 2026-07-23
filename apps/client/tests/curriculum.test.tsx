import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CurriculumProvider } from '../src/state/CurriculumContext.js';
import { CurriculumMap } from '../src/screens/CurriculumMap.js';
import { LessonScreen } from '../src/screens/LessonScreen.js';
import { LessonView } from '../src/components/LessonView.js';
import type { Lesson } from '@learn/curriculum';

function renderWithCurriculum(
  ui: ReactNode,
  path = '/',
  result?: Parameters<typeof CurriculumProvider>[0]['result'],
) {
  return render(
    <CurriculumProvider result={result}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/map" element={<CurriculumMap />} />
          <Route path="/lesson" element={<LessonScreen />} />
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </CurriculumProvider>,
  );
}

describe('curriculum map (Phase 2 exit: relationships display)', () => {
  it('renders units and shows each skill with its prerequisites', () => {
    renderWithCurriculum(<CurriculumMap />, '/x');
    expect(screen.getByRole('heading', { name: /curriculum map/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /number foundations/i })).toBeInTheDocument();

    // Comparing Numbers and Addition both build on Counting and Quantity.
    expect(screen.getAllByText(/builds on: counting and quantity/i).length).toBeGreaterThanOrEqual(
      1,
    );
    // A root skill (no prerequisites) is shown as available with a lesson link absent/present.
    expect(screen.getByText('Counting and Quantity')).toBeInTheDocument();
  });

  it('links skills that have a lesson', () => {
    renderWithCurriculum(<CurriculumMap />, '/x');
    const link = screen.getByRole('link', { name: 'Comparing Numbers' });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('skill=math.number_foundations.comparing_numbers'),
    );
  });
});

describe('lesson screen', () => {
  it('renders the selected lesson with component sections', () => {
    renderWithCurriculum(<div />, '/lesson?skill=math.number_foundations.comparing_numbers');
    const article = screen.getByRole('article', { name: /lesson: comparing numbers/i });
    expect(
      within(article).getByRole('heading', { name: /learning objective/i }),
    ).toBeInTheDocument();
    expect(within(article).getByRole('heading', { name: /worked example/i })).toBeInTheDocument();
  });
});

describe('lesson renderer (CUR-003)', () => {
  it('does not break when optional components are absent', () => {
    const minimal: Lesson = {
      lesson_id: 'math.u.s.lesson',
      skill_id: 'math.u.s',
      title: 'Minimal',
      components: [{ type: 'summary', body: 'Just a summary.' }],
      content_version: '0.1.0',
    };
    render(<LessonView lesson={minimal} />);
    expect(screen.getByRole('heading', { name: /^minimal$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /summary/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /worked example/i })).not.toBeInTheDocument();
  });
});

describe('curriculum load failure', () => {
  it('shows an error state instead of crashing', () => {
    renderWithCurriculum(<CurriculumMap />, '/x', { ok: false, errors: ['boom'] });
    expect(screen.getByRole('alert')).toHaveTextContent(/curriculum failed to load: boom/i);
  });
});
