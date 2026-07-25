/**
 * Course administration (Phase 18): export the active course as a module file,
 * validate and install a module someone else authored, preview what it contains,
 * and switch back to the built-in course.
 *
 * Validation is the same loader the bundled curriculum goes through, so an
 * imported course cannot be less valid than the shipped one, and every error the
 * loader found is shown rather than a single "invalid file". Nothing here writes
 * to the learner's event log: installing a course changes what is taught, never
 * what was learned.
 */
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  parseCourseModule,
  serializeCourseModule,
  summarizeModule,
  MODULE_FORMAT,
  type ModuleSummary,
} from '@learn/curriculum';
import { newId, type InstalledModule, type ModuleStore } from '@learn/persistence';
import { useCurriculum } from '../state/CurriculumContext.js';
import { moduleStore as defaultStore } from '../data/repository.js';
import { ScreenState } from '../components/ScreenState.js';

function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsText(file);
  });
}

interface Pending {
  name: string;
  json: string;
  summary: ModuleSummary;
}

export function Authoring({ store = defaultStore }: { store?: ModuleStore }): JSX.Element {
  const { package: pkg, errors, activeModuleName, reloadModules } = useCurriculum();
  const [installed, setInstalled] = useState<InstalledModule[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setInstalled(await store.list());
    setActiveId(await store.getActiveId());
  }, [store]);

  useEffect(() => {
    refresh().catch(() => setProblems(['Installed courses could not be read on this device.']));
  }, [refresh]);

  function onExport(): void {
    if (!pkg) return;
    const name = activeModuleName ?? 'Ground-Up Learning (built-in)';
    const blob = new Blob([serializeCourseModule(pkg, name)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course-module.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('The current course was exported.');
  }

  async function onChoose(e: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (fileInput.current) fileInput.current.value = '';
    if (!file) return;
    setStatus(null);
    setPending(null);
    setProblems([]);

    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      setProblems(['That file could not be read.']);
      return;
    }

    const parsed = parseCourseModule(text);
    if (!parsed.ok) {
      setProblems(parsed.errors);
      return;
    }
    // Validated but not installed: nothing changes until it is confirmed.
    setPending({
      name: parsed.module.name,
      json: text,
      summary: summarizeModule(parsed.module, parsed.package),
    });
  }

  async function onInstall(): Promise<void> {
    if (!pending) return;
    const module: InstalledModule = {
      module_id: newId(),
      name: pending.name,
      installed_at: new Date().toISOString(),
      json: pending.json,
    };
    await store.install(module);
    await store.setActiveId(module.module_id);
    setPending(null);
    setStatus(`"${module.name}" is now the active course.`);
    await refresh();
    await reloadModules();
  }

  async function onActivate(moduleId: string | null): Promise<void> {
    await store.setActiveId(moduleId);
    setStatus(moduleId === null ? 'Switched back to the built-in course.' : 'Course switched.');
    await refresh();
    await reloadModules();
  }

  async function onRemove(moduleId: string): Promise<void> {
    await store.remove(moduleId);
    setStatus('Course removed. Your progress was not touched.');
    await refresh();
    await reloadModules();
  }

  return (
    <section>
      <h1>Courses</h1>
      <p className="card-note">
        A course is just data. Export the one you are using, share the file, or install one someone
        else wrote. Your progress lives separately and is never changed by anything on this screen.
      </p>

      {errors.length > 0 && (
        <div className="feedback" role="alert" data-status="error">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      {status && (
        <p className="feedback" role="status" data-status="success">
          {status}
        </p>
      )}

      <fieldset>
        <legend>Current course</legend>
        <p>
          <strong>{activeModuleName ?? 'Ground-Up Learning (built-in)'}</strong>
          {pkg && (
            <span className="card-note">
              {' '}
              — {pkg.skills.length} skills, {pkg.questions.length} questions
            </span>
          )}
        </p>
        <button type="button" onClick={onExport} disabled={!pkg}>
          Export this course
        </button>
      </fieldset>

      <fieldset>
        <legend>Install a course</legend>
        <label htmlFor="module-file">Course module file (.json)</label>
        <input
          id="module-file"
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={onChoose}
        />
        <p className="card-note">Module format {MODULE_FORMAT}.</p>

        {problems.length > 0 && (
          <div className="feedback" role="alert" data-status="error">
            <p>
              That course was not installed. It has {problems.length} problem
              {problems.length === 1 ? '' : 's'}:
            </p>
            <ul className="module-errors">
              {problems.slice(0, 20).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            {problems.length > 20 && <p>...and {problems.length - 20} more.</p>}
          </div>
        )}

        {pending && (
          <div className="module-preview" role="group" aria-label="Course preview">
            <h2>{pending.name}</h2>
            <p className="card-note">Valid. Nothing has changed yet.</p>
            <dl className="module-counts">
              <div>
                <dt>Courses</dt>
                <dd>{pending.summary.courses}</dd>
              </div>
              <div>
                <dt>Units</dt>
                <dd>{pending.summary.units}</dd>
              </div>
              <div>
                <dt>Skills</dt>
                <dd>{pending.summary.skills}</dd>
              </div>
              <div>
                <dt>Lessons</dt>
                <dd>{pending.summary.lessons}</dd>
              </div>
              <div>
                <dt>Questions</dt>
                <dd>{pending.summary.questions}</dd>
              </div>
              <div>
                <dt>Misconceptions</dt>
                <dd>{pending.summary.misconceptions}</dd>
              </div>
            </dl>
            {pending.summary.skillsWithoutQuestions.length > 0 && (
              <p className="card-note">
                {pending.summary.skillsWithoutQuestions.length} skill
                {pending.summary.skillsWithoutQuestions.length === 1 ? ' has' : 's have'} no
                practice questions and cannot be mastered.
              </p>
            )}
            {pending.summary.skillsWithoutLesson.length > 0 && (
              <p className="card-note">
                {pending.summary.skillsWithoutLesson.length} skill
                {pending.summary.skillsWithoutLesson.length === 1 ? ' has' : 's have'} no lesson.
              </p>
            )}
            <button type="button" onClick={onInstall}>
              Install and use this course
            </button>
            <button type="button" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend>Installed courses</legend>
        {installed.length === 0 ? (
          <ScreenState
            status="empty"
            message="No installed courses. The built-in course is in use."
          />
        ) : (
          <ul className="module-list">
            {installed.map((m) => (
              <li key={m.module_id} className="module-item">
                <span className="module-name">
                  {m.name}
                  {m.module_id === activeId && <strong> (in use)</strong>}
                </span>
                {m.module_id !== activeId && (
                  <button type="button" onClick={() => onActivate(m.module_id)}>
                    Use this course
                  </button>
                )}
                <button type="button" onClick={() => onRemove(m.module_id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {activeId !== null && (
          <button type="button" onClick={() => onActivate(null)}>
            Use the built-in course
          </button>
        )}
      </fieldset>
    </section>
  );
}
