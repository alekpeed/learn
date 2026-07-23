/**
 * Loads the bundled sample curriculum package (offline-first: content ships
 * with the app, doc 02 §11). The content lives as data under /content and is
 * validated by the curriculum loader at startup.
 */
import { loadCoursePackage, type LoadResult } from '@learn/curriculum';

import manifest from '../../../../content/sample/manifest.json';
import courses from '../../../../content/sample/courses.json';
import skills from '../../../../content/sample/skills.json';
import lessons from '../../../../content/sample/lessons.json';
import questions from '../../../../content/sample/questions.json';

export function loadSampleCurriculum(): LoadResult {
  return loadCoursePackage({ manifest, courses, skills, lessons, questions });
}
