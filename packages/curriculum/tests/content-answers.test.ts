import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateAnswer, type ValidatorType } from '@learn/validation-engine';

const here = dirname(fileURLToPath(import.meta.url));
const unitsDir = join(here, '..', '..', '..', 'content', 'mvp', 'units');

const UNITS = [
  'number_foundations',
  'add_sub',
  'mult_div',
  'numerical_structure',
  'integers',
  'fractions',
  'decimals_percents',
  'ratios',
  'measurement',
  'algebra',
  'functions',
  'geometry',
  'algebra2',
  'precalculus',
  'trigonometry',
  'science_thinking',
  'science_experiments',
  'science_measurement',
  'science_data',
  'physics',
  'chemistry',
  'biology',
];

interface Question {
  question_id: string;
  prompt: string;
  validator: string;
  answer_spec: { correct_answer: unknown };
  common_wrong_answers?: { value: unknown; misconception_id: string }[];
  figure?: { kind: string; alt: string; params?: Record<string, unknown> };
}

function allQuestions(): Question[] {
  return UNITS.flatMap(
    (u) =>
      (JSON.parse(readFileSync(join(unitsDir, `${u}.json`), 'utf8')) as { questions: Question[] })
        .questions,
  );
}

describe('MVP content answers validate deterministically (Phase 6)', () => {
  it('every question is accepted by its own declared validator', () => {
    const failures: string[] = [];
    for (const q of allQuestions()) {
      const raw = q.answer_spec.correct_answer;
      // multi_select / ordering answers are arrays submitted as a `|`-joined list.
      const answer = Array.isArray(raw) ? raw.join('|') : String(raw);
      const outcome = validateAnswer(q.validator as ValidatorType, answer, q.answer_spec);
      if (!outcome.correct) {
        failures.push(`${q.question_id} (${q.validator}) rejects "${answer}"`);
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  // A distractor the validator would accept is a question that marks a correct
  // answer wrong. That has happened here before, and a string comparison in the
  // generator cannot catch it: 0.5 and 1/2 differ as text but grade the same.
  it('every declared common wrong answer is rejected by that validator', () => {
    const failures: string[] = [];
    for (const q of allQuestions()) {
      for (const cwa of q.common_wrong_answers ?? []) {
        const answer = Array.isArray(cwa.value) ? cwa.value.join('|') : String(cwa.value);
        const outcome = validateAnswer(q.validator as ValidatorType, answer, q.answer_spec);
        if (outcome.correct) {
          failures.push(`${q.question_id} (${q.validator}) accepts distractor "${answer}"`);
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  // A figure augments a prompt that is already complete on its own (DEC-019).
  // These guard the two ways that can go wrong: a figure that says nothing, and
  // a figure that gives the answer away.
  it('every figure carries alt text that is more than a restatement of nothing', () => {
    const failures: string[] = [];
    for (const q of allQuestions()) {
      if (!q.figure) continue;
      if (!q.figure.alt || q.figure.alt.trim().length < 20) {
        failures.push(
          `${q.question_id}: alt text is missing or too short to be a real alternative`,
        );
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('a right-triangle figure never labels the side the question asks for', () => {
    const failures: string[] = [];
    for (const q of allQuestions()) {
      const params = q.figure?.params;
      if (q.figure?.kind !== 'right_triangle' || !params) continue;
      const answer = Number(q.answer_spec.correct_answer);
      if (!Number.isFinite(answer)) continue;
      // If the numeric answer is one of the drawn side lengths, that side must
      // be marked unknown - otherwise the diagram hands over the answer.
      const sides: Record<string, unknown> = {
        a: params['a'],
        b: params['b'],
        c: params['c'],
      };
      for (const [name, value] of Object.entries(sides)) {
        if (value === answer && params['unknown'] !== name) {
          // Only a problem when the prompt did not already state it.
          const stated = new RegExp(`\\b${answer}\\b`).test(q.prompt);
          if (!stated) {
            failures.push(
              `${q.question_id}: figure labels side ${name}=${answer}, which is the answer`,
            );
          }
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('has a substantial question bank across the math slice', () => {
    expect(allQuestions().length).toBeGreaterThanOrEqual(50);
  });
});
