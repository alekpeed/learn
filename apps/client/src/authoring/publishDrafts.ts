/**
 * Publishing approved drafts (Phase 19).
 *
 * An approved draft does not get spliced into the running curriculum. Instead
 * the whole course is rebuilt with the new questions added and pushed back
 * through the Phase 18 module pipeline, which means it faces the full loader
 * again - schema, graph integrity, misconception references, the lot. If the
 * combined course does not load, nothing is installed and the learner keeps the
 * course they had.
 *
 * That is deliberately more work than mutating an array. It means there is no
 * path by which AI-proposed content reaches a learner without passing exactly
 * the same gate as content a human wrote.
 */
import {
  parseCourseModule,
  serializeCourseModule,
  type CoursePackage,
  type Question,
} from '@learn/curriculum';
import { newId, type InstalledModule, type ModuleStore } from '@learn/persistence';

export type PublishResult =
  { ok: true; module: InstalledModule; questionCount: number } | { ok: false; errors: string[] };

/**
 * Build a course containing everything the active one has plus `additions`,
 * validate it end to end, and install it as the active course.
 */
export async function publishApprovedDrafts(
  pkg: CoursePackage,
  additions: Question[],
  courseName: string,
  store: ModuleStore,
  now: () => string = () => new Date().toISOString(),
): Promise<PublishResult> {
  if (additions.length === 0) return { ok: false, errors: ['nothing approved to publish'] };

  const combined: CoursePackage = { ...pkg, questions: [...pkg.questions, ...additions] };
  const json = serializeCourseModule(combined, courseName);

  // The same validation an imported course faces. A draft that slipped past
  // screening still cannot get in here.
  const parsed = parseCourseModule(json);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const module: InstalledModule = {
    module_id: newId(),
    name: courseName,
    installed_at: now(),
    json,
  };
  await store.install(module);
  await store.setActiveId(module.module_id);
  return { ok: true, module, questionCount: additions.length };
}

/** The name a course takes once drafts have been added to it. */
export function publishedCourseName(current: string | null): string {
  const base = current ?? 'Ground-Up Learning';
  const match = /^(.*) \+drafts \((\d+)\)$/.exec(base);
  if (match) return `${match[1]} +drafts (${Number(match[2]) + 1})`;
  return `${base} +drafts (1)`;
}
