/**
 * Course administration (Phase 18): validating, installing, and switching
 * courses, and what happens when an installed course turns out to be broken.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { InMemoryModuleStore, type InstalledModule } from '@learn/persistence';
import { serializeCourseModule, loadCoursePackage } from '@learn/curriculum';
import { CurriculumProvider, useCurriculum } from '../src/state/CurriculumContext.js';
import { Authoring } from '../src/screens/Authoring.js';
import { loadSampleCurriculum } from '../src/data/curriculum.js';

/** A small but completely valid two-skill course, as a module file. */
function tinyModuleJson(name = 'Tiny Course'): string {
  const thresholds = {
    understanding: 80,
    accuracy: 85,
    independence: 80,
    retention: 75,
    transfer: 70,
  };
  const raw = {
    manifest: {
      schema_version: '1.0.0',
      content_version: '1.0.0',
      courses: ['math.tiny'],
      generated_at: '2026-07-25T00:00:00Z',
    },
    courses: [
      {
        course_id: 'math.tiny',
        subject_id: 'math',
        title: 'Tiny',
        version: '1.0.0',
        status: 'published' as const,
        units: [{ unit_id: 'math.basics', title: 'Basics', order: 1 }],
      },
    ],
    skills: [
      {
        skill_id: 'math.basics.counting',
        unit_id: 'math.basics',
        title: 'Counting',
        summary: 'Count things.',
        objectives: ['Count a small group.'],
        prerequisites: [],
        mastery_thresholds: thresholds,
        content_version: '1.0.0',
      },
    ],
    lessons: [
      {
        lesson_id: 'math.basics.counting.lesson',
        skill_id: 'math.basics.counting',
        title: 'Counting',
        components: [{ type: 'intuitive_explanation' as const, body: 'Count one at a time.' }],
        content_version: '1.0.0',
      },
    ],
    questions: [
      {
        question_id: 'math.basics.counting.q1',
        skill_id: 'math.basics.counting',
        type: 'numeric',
        difficulty: 1,
        prompt: 'How many is 2 and 1 more?',
        answer_spec: { correct_answer: 3 },
        validator: 'numeric',
        hints: [{ level: 1, text: 'Count on by one.' }],
        dimensions: ['accuracy'],
        explanation: 'Two and one more is three.',
        content_version: '1.0.0',
      },
    ],
    misconceptions: [],
  };
  const loaded = loadCoursePackage(raw);
  if (!loaded.ok) throw new Error(loaded.errors.join('\n'));
  return serializeCourseModule(loaded.package, name);
}

function fileOf(json: string, name = 'course-module.json'): File {
  return new File([json], name, { type: 'application/json' });
}

function renderAuthoring(store: InMemoryModuleStore) {
  return render(
    <CurriculumProvider modules={store}>
      <MemoryRouter>
        <Authoring store={store} />
      </MemoryRouter>
    </CurriculumProvider>,
  );
}

describe('course modules in the app (Phase 18)', () => {
  it('shows the built-in course until one is installed', async () => {
    renderAuthoring(new InMemoryModuleStore());
    expect(await screen.findByText(/no installed courses/i)).toBeVisible();
    expect(screen.getAllByText(/built-in/i).length).toBeGreaterThan(0);
  });

  it('validates a chosen file and previews it without installing anything', async () => {
    const store = new InMemoryModuleStore();
    renderAuthoring(store);

    await userEvent.upload(
      await screen.findByLabelText(/course module file/i),
      fileOf(tinyModuleJson()),
    );

    expect(await screen.findByRole('heading', { name: /tiny course/i })).toBeVisible();
    expect(screen.getByText(/nothing has changed yet/i)).toBeVisible();
    // Nothing is installed until the learner confirms.
    expect(await store.list()).toEqual([]);
  });

  it('installs a course and makes it the active curriculum', async () => {
    const store = new InMemoryModuleStore();
    renderAuthoring(store);

    await userEvent.upload(
      await screen.findByLabelText(/course module file/i),
      fileOf(tinyModuleJson()),
    );
    await userEvent.click(await screen.findByRole('button', { name: /install and use/i }));

    await waitFor(async () => {
      expect(await store.getActiveId()).not.toBeNull();
    });
    expect(await screen.findByText(/is now the active course/i)).toBeVisible();
  });

  it('lists every problem in an invalid course and installs nothing', async () => {
    const store = new InMemoryModuleStore();
    renderAuthoring(store);

    const broken = JSON.parse(tinyModuleJson()) as Record<string, unknown>;
    delete (broken.skills as Record<string, unknown>[])[0]!.mastery_thresholds;

    await userEvent.upload(
      await screen.findByLabelText(/course module file/i),
      fileOf(JSON.stringify(broken)),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/was not installed/i);
    expect(await store.list()).toEqual([]);
  });

  it('rejects a file that is not a course at all', async () => {
    const store = new InMemoryModuleStore();
    renderAuthoring(store);
    await userEvent.upload(
      await screen.findByLabelText(/course module file/i),
      fileOf('just some text'),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/not valid JSON/i);
  });

  it('switches back to the built-in course', async () => {
    const store = new InMemoryModuleStore();
    const installed: InstalledModule = {
      module_id: 'm1',
      name: 'Tiny Course',
      installed_at: '2026-07-25T00:00:00.000Z',
      json: tinyModuleJson(),
    };
    await store.install(installed);
    await store.setActiveId('m1');

    renderAuthoring(store);
    await userEvent.click(await screen.findByRole('button', { name: /use the built-in course/i }));

    await waitFor(async () => {
      expect(await store.getActiveId()).toBeNull();
    });
  });

  it('removing a course does not touch progress and reverts to built-in', async () => {
    const store = new InMemoryModuleStore();
    await store.install({
      module_id: 'm1',
      name: 'Tiny Course',
      installed_at: '2026-07-25T00:00:00.000Z',
      json: tinyModuleJson(),
    });
    await store.setActiveId('m1');

    renderAuthoring(store);
    await userEvent.click(await screen.findByRole('button', { name: /^remove$/i }));

    await waitFor(async () => {
      expect(await store.list()).toEqual([]);
      expect(await store.getActiveId()).toBeNull();
    });
    expect(await screen.findByText(/progress was not touched/i)).toBeVisible();
  });
});

describe('an installed course drives the app (Phase 18)', () => {
  function Probe(): JSX.Element {
    const { package: pkg, activeModuleName } = useCurriculum();
    return (
      <p>
        {activeModuleName ?? 'built-in'}:{pkg?.skills.length ?? 0}
      </p>
    );
  }

  it('teaches from the active module instead of the bundled course', async () => {
    const store = new InMemoryModuleStore();
    await store.install({
      module_id: 'm1',
      name: 'Tiny Course',
      installed_at: '2026-07-25T00:00:00.000Z',
      json: tinyModuleJson(),
    });
    await store.setActiveId('m1');

    render(
      <CurriculumProvider modules={store}>
        <Probe />
      </CurriculumProvider>,
    );

    expect(await screen.findByText('Tiny Course:1')).toBeVisible();
  });

  it('falls back to the bundled course when the installed one is broken', async () => {
    const store = new InMemoryModuleStore();
    const broken = JSON.parse(tinyModuleJson()) as Record<string, unknown>;
    broken.skills = [];
    await store.install({
      module_id: 'm1',
      name: 'Broken Course',
      installed_at: '2026-07-25T00:00:00.000Z',
      json: JSON.stringify(broken),
    });
    await store.setActiveId('m1');

    const bundledSkills = (() => {
      const loaded = loadSampleCurriculum();
      return loaded.ok ? loaded.package.skills.length : 0;
    })();

    render(
      <CurriculumProvider modules={store}>
        <Probe />
      </CurriculumProvider>,
    );

    // Content a learner installed must never be able to brick the app.
    expect(await screen.findByText(`built-in:${bundledSkills}`)).toBeVisible();
  });

  it('survives a module store that cannot be read', async () => {
    const failing = {
      list: vi.fn().mockRejectedValue(new Error('nope')),
      install: vi.fn(),
      remove: vi.fn(),
      getActiveId: vi.fn().mockRejectedValue(new Error('nope')),
      setActiveId: vi.fn(),
    };

    render(
      <CurriculumProvider modules={failing}>
        <Probe />
      </CurriculumProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/^built-in:\d+$/)).toBeVisible();
    });
  });
});
