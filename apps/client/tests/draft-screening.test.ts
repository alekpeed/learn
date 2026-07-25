/**
 * Deterministic screening of AI-proposed questions (Phase 19).
 *
 * These are written adversarially: each case is something a language model
 * plausibly produces that must not reach a learner. The point of the phase is
 * that none of them can, regardless of how confident the model sounded.
 */
import { describe, it, expect } from 'vitest';
import { parseDraftCandidates, buildDraftPrompt } from '@learn/ai-gateway';
import { screenDraft, screenDrafts } from '../src/authoring/screenDraft.js';
import { publishApprovedDrafts, publishedCourseName } from '../src/authoring/publishDrafts.js';
import { InMemoryModuleStore } from '@learn/persistence';
import { loadSampleCurriculum } from '../src/data/curriculum.js';
import type { CoursePackage, Question } from '@learn/curriculum';

const loaded = loadSampleCurriculum();
if (!loaded.ok) throw new Error(loaded.errors.join('\n'));
const pkg: CoursePackage = loaded.package;
const SKILL = 'math.number_foundations.place_value';

/** A candidate that should pass every check. */
function good(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: 'numeric',
    difficulty: 2,
    prompt: 'What is the value of the 7 in 472?',
    answer_spec: { correct_answer: 70 },
    validator: 'numeric',
    hints: [{ level: 1, text: 'Name the column the digit sits in.' }],
    dimensions: ['accuracy'],
    explanation: 'The 7 is in the tens column, so it is worth 7 tens.',
    ...over,
  };
}

describe('parsing model output (Phase 19)', () => {
  it('reads a bare JSON array', () => {
    expect(parseDraftCandidates('[{"prompt":"a"},{"prompt":"b"}]')).toHaveLength(2);
  });

  it('tolerates a code fence and surrounding prose', () => {
    const text = 'Sure! Here you go:\n```json\n[{"prompt":"a"}]\n```\nHope that helps.';
    expect(parseDraftCandidates(text)).toHaveLength(1);
  });

  it('returns nothing for prose with no array', () => {
    expect(parseDraftCandidates('I cannot do that.')).toEqual([]);
  });

  it('returns nothing for malformed JSON rather than guessing', () => {
    expect(parseDraftCandidates('[{"prompt": }]')).toEqual([]);
  });

  it('discards non-object elements', () => {
    expect(parseDraftCandidates('["a string", 3, {"prompt":"ok"}]')).toHaveLength(1);
  });

  it('builds a prompt that names the skill and forbids leaking the answer', () => {
    const prompt = buildDraftPrompt({
      context: { skill_id: SKILL, skill_title: 'Place Value' },
      count: 3,
    });
    expect(prompt).toMatch(/Place Value/);
    expect(prompt).toMatch(/must not appear in the prompt/i);
  });
});

describe('screening a proposed question (Phase 19)', () => {
  it('accepts a well-formed question', () => {
    const result = screenDraft(good(), SKILL, pkg, 1);
    expect(result.problems).toEqual([]);
    expect(result.question).not.toBeNull();
  });

  it('never lets the model choose the identifiers', () => {
    const result = screenDraft(
      good({ question_id: 'math.fractions.fraction_meaning.q1', skill_id: 'math.evil.skill' }),
      SKILL,
      pkg,
      1,
    );
    // Both are derived, so a model cannot overwrite existing content by naming it.
    expect(result.question?.question_id).toBe(`${SKILL}.draft_1`);
    expect(result.question?.skill_id).toBe(SKILL);
  });

  it('rejects a question that does not satisfy the content schema', () => {
    const result = screenDraft(good({ hints: 'a string, not a list' }), SKILL, pkg, 1);
    expect(result.question).toBeNull();
    expect(result.problems.length).toBeGreaterThan(0);
  });

  it('rejects an answer the declared validator cannot grade', () => {
    const result = screenDraft(
      good({ answer_spec: { correct_answer: 'about seventy' } }),
      SKILL,
      pkg,
      1,
    );
    expect(result.question).toBeNull();
    expect(result.problems.join(' ')).toMatch(/does not grade as correct/);
  });

  it('rejects a choice question whose answer is not among the options', () => {
    const result = screenDraft(
      good({
        type: 'multiple_choice',
        validator: 'exact_choice',
        answer_spec: { correct_answer: '70' },
        parameters: { options: ['7', '700', '7000'] },
      }),
      SKILL,
      pkg,
      1,
    );
    expect(result.question).toBeNull();
    expect(result.problems.join(' ')).toMatch(/not among the options/);
  });

  it('rejects a choice question with duplicate options', () => {
    const result = screenDraft(
      good({
        type: 'multiple_choice',
        validator: 'exact_choice',
        answer_spec: { correct_answer: '70' },
        parameters: { options: ['70', '7', '7'] },
      }),
      SKILL,
      pkg,
      1,
    );
    expect(result.problems.join(' ')).toMatch(/duplicates/);
  });

  it('rejects a prompt that gives away its own answer', () => {
    const result = screenDraft(
      good({ prompt: 'The 7 in 472 is worth 70. What is the value of the 7 in 472?' }),
      SKILL,
      pkg,
      1,
    );
    expect(result.question).toBeNull();
    expect(result.problems.join(' ')).toMatch(/prompt contains the answer/);
  });

  it('rejects a hint that gives away the answer', () => {
    const result = screenDraft(
      good({ hints: [{ level: 1, text: 'The answer is 70.' }] }),
      SKILL,
      pkg,
      1,
    );
    expect(result.question).toBeNull();
    expect(result.problems.join(' ')).toMatch(/hint 1 contains the answer/);
  });

  it('strips any misconception tags the model invented', () => {
    const result = screenDraft(
      good({
        common_wrong_answers: [{ value: 7, misconception_id: 'mc.math.invented.nonsense' }],
      }),
      SKILL,
      pkg,
      1,
    );
    // A tag pointing at no catalog record would fail the loader later; drop it
    // rather than let a model mint misconception IDs.
    expect(result.question?.common_wrong_answers).toBeUndefined();
  });

  it('rejects an unknown skill', () => {
    expect(screenDraft(good(), 'math.nope.ghost', pkg, 1).problems.join(' ')).toMatch(
      /unknown skill/,
    );
  });

  it('notes a missing explanation without blocking on it', () => {
    const result = screenDraft(good({ explanation: 'x' }), SKILL, pkg, 1);
    expect(result.question).not.toBeNull();
  });
});

describe('screening a batch (Phase 19)', () => {
  it('keeps the good ones and reports why the rest failed', () => {
    const outcome = screenDrafts(
      [good(), good({ answer_spec: { correct_answer: 'nope' } }), good({ prompt: 'Another one?' })],
      SKILL,
      pkg,
    );
    expect(outcome.accepted).toHaveLength(2);
    expect(outcome.rejected).toHaveLength(1);
    expect(outcome.rejected[0]?.problems.join(' ')).toMatch(/does not grade/);
  });

  it('gives accepted questions distinct ids', () => {
    const outcome = screenDrafts([good(), good({ prompt: 'A different question?' })], SKILL, pkg);
    const ids = outcome.accepted.map((a) => a.question.question_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rejects a duplicate of a question the skill already has', () => {
    const existing = pkg.questionsBySkill.get(SKILL)?.[0];
    const outcome = screenDrafts([good({ prompt: existing?.prompt })], SKILL, pkg);
    expect(outcome.accepted).toHaveLength(0);
    expect(outcome.rejected[0]?.problems.join(' ')).toMatch(/duplicates a question/);
  });

  it('rejects two identical suggestions in the same batch', () => {
    const outcome = screenDrafts([good(), good()], SKILL, pkg);
    expect(outcome.accepted).toHaveLength(1);
    expect(outcome.rejected).toHaveLength(1);
  });
});

describe('publishing approved drafts (Phase 19)', () => {
  function approved(): Question {
    const screened = screenDraft(good(), SKILL, pkg, 1);
    if (!screened.question) throw new Error(screened.problems.join('; '));
    return screened.question;
  }

  it('rebuilds the whole course and installs it as the active one', async () => {
    const store = new InMemoryModuleStore();
    const result = await publishApprovedDrafts(pkg, [approved()], 'Course +drafts (1)', store);
    expect(result.ok, result.ok ? '' : result.errors.join('\n')).toBe(true);
    if (!result.ok) return;
    expect(result.questionCount).toBe(1);
    expect(await store.getActiveId()).toBe(result.module.module_id);
  });

  it('installs nothing when the rebuilt course would not load', async () => {
    const store = new InMemoryModuleStore();
    // A question that passed screening but names a skill outside the graph
    // cannot survive the loader - which is the point of revalidating.
    const bad = { ...approved(), skill_id: 'math.nope.ghost' } as Question;
    const result = await publishApprovedDrafts(pkg, [bad], 'Course +drafts (1)', store);
    expect(result.ok).toBe(false);
    expect(await store.list()).toEqual([]);
    expect(await store.getActiveId()).toBeNull();
  });

  it('refuses to publish an empty approval set', async () => {
    const store = new InMemoryModuleStore();
    const result = await publishApprovedDrafts(pkg, [], 'Course', store);
    expect(result.ok).toBe(false);
    expect(await store.list()).toEqual([]);
  });

  it('keeps every existing question', async () => {
    const store = new InMemoryModuleStore();
    const result = await publishApprovedDrafts(pkg, [approved()], 'Course +drafts (1)', store);
    if (!result.ok) throw new Error(result.errors.join('\n'));
    const installed = JSON.parse(result.module.json) as { questions: unknown[] };
    expect(installed.questions).toHaveLength(pkg.questions.length + 1);
  });

  it('counts up rather than stacking suffixes', () => {
    expect(publishedCourseName(null)).toBe('Ground-Up Learning +drafts (1)');
    expect(publishedCourseName('My Course')).toBe('My Course +drafts (1)');
    expect(publishedCourseName('My Course +drafts (1)')).toBe('My Course +drafts (2)');
    expect(publishedCourseName('My Course +drafts (9)')).toBe('My Course +drafts (10)');
  });
});
