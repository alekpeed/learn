import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { SkillProgress } from '@learn/domain';
import { emptySkillProgress } from '@learn/domain';
import { LearnerProvider } from '../src/state/LearnerContext.js';
import { CurriculumProvider } from '../src/state/CurriculumContext.js';
import { ProgressProvider } from '../src/state/ProgressContext.js';
import { CurriculumMap } from '../src/screens/CurriculumMap.js';
import { LessonScreen } from '../src/screens/LessonScreen.js';
import { LessonView } from '../src/components/LessonView.js';
import type { Lesson } from '@learn/curriculum';

function renderWithCurriculum(
  ui: ReactNode,
  path = '/',
  result?: Parameters<typeof CurriculumProvider>[0]['result'],
  progress: Map<string, SkillProgress> = new Map(),
) {
  return render(
    <LearnerProvider>
      <CurriculumProvider result={result}>
        <ProgressProvider progressOverride={progress}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/map" element={<CurriculumMap />} />
              <Route path="/lesson" element={<LessonScreen />} />
              <Route path="*" element={ui} />
            </Routes>
          </MemoryRouter>
        </ProgressProvider>
      </CurriculumProvider>
    </LearnerProvider>,
  );
}

function mastered(skillId: string): SkillProgress {
  return { ...emptySkillProgress(skillId), state: 'mastered' };
}

describe('curriculum map (relationships + gating)', () => {
  it('renders units and shows what a locked skill must unlock', () => {
    renderWithCurriculum(<CurriculumMap />, '/x');
    expect(screen.getByRole('heading', { name: /curriculum map/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /number foundations/i })).toBeInTheDocument();
    // Comparing Numbers is locked until Counting and Quantity is mastered.
    expect(
      screen.getAllByText(/unlock by mastering: counting and quantity/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('unlocks a dependent skill once its prerequisite is mastered (LRN-003)', () => {
    const progress = new Map<string, SkillProgress>([
      [
        'math.number_foundations.counting_and_quantity',
        mastered('math.number_foundations.counting_and_quantity'),
      ],
    ]);
    renderWithCurriculum(<CurriculumMap />, '/x', undefined, progress);
    // Now Comparing Numbers is unlocked and links to its lesson.
    const link = screen.getByRole('link', { name: 'Comparing Numbers' });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('skill=math.number_foundations.comparing_numbers'),
    );
  });

  it('shows an error state instead of crashing when curriculum fails to load', () => {
    renderWithCurriculum(<CurriculumMap />, '/x', { ok: false, errors: ['boom'] });
    expect(screen.getByRole('alert')).toHaveTextContent(/curriculum failed to load: boom/i);
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
