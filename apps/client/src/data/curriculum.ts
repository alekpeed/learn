/**
 * Loads the bundled MVP curriculum package (offline-first: content ships with
 * the app, doc 02 §11). Content lives as data under /content/mvp, authored one
 * file per unit, and is validated by the curriculum loader at startup.
 */
import { loadCoursePackage, type LoadResult } from '@learn/curriculum';

import manifest from '../../../../content/mvp/manifest.json';
import courses from '../../../../content/mvp/courses.json';
import misconceptions from '../../../../content/mvp/misconceptions.json';
import numberFoundations from '../../../../content/mvp/units/number_foundations.json';
import addSub from '../../../../content/mvp/units/add_sub.json';
import multDiv from '../../../../content/mvp/units/mult_div.json';
import numericalStructure from '../../../../content/mvp/units/numerical_structure.json';
import integers from '../../../../content/mvp/units/integers.json';
import fractions from '../../../../content/mvp/units/fractions.json';
import decimalsPercents from '../../../../content/mvp/units/decimals_percents.json';
import ratios from '../../../../content/mvp/units/ratios.json';
import measurement from '../../../../content/mvp/units/measurement.json';
import algebra from '../../../../content/mvp/units/algebra.json';
import functions from '../../../../content/mvp/units/functions.json';
import geometry from '../../../../content/mvp/units/geometry.json';
import algebra2 from '../../../../content/mvp/units/algebra2.json';
import precalculus from '../../../../content/mvp/units/precalculus.json';
import trigonometry from '../../../../content/mvp/units/trigonometry.json';
import scienceThinking from '../../../../content/mvp/units/science_thinking.json';
import scienceExperiments from '../../../../content/mvp/units/science_experiments.json';
import scienceMeasurement from '../../../../content/mvp/units/science_measurement.json';
import scienceData from '../../../../content/mvp/units/science_data.json';
import physics from '../../../../content/mvp/units/physics.json';
import chemistry from '../../../../content/mvp/units/chemistry.json';
import biology from '../../../../content/mvp/units/biology.json';

interface UnitFile {
  skills: unknown[];
  lessons: unknown[];
  questions: unknown[];
}

const units: UnitFile[] = [
  numberFoundations,
  addSub,
  multDiv,
  numericalStructure,
  integers,
  fractions,
  decimalsPercents,
  ratios,
  measurement,
  algebra,
  functions,
  geometry,
  algebra2,
  precalculus,
  trigonometry,
  scienceThinking,
  scienceExperiments,
  scienceMeasurement,
  scienceData,
  physics,
  chemistry,
  biology,
];

export function loadSampleCurriculum(): LoadResult {
  return loadCoursePackage({
    manifest,
    courses,
    skills: units.flatMap((u) => u.skills),
    lessons: units.flatMap((u) => u.lessons),
    questions: units.flatMap((u) => u.questions),
    misconceptions: misconceptions.misconceptions,
  });
}
