/**
 * Deterministic screening of AI-proposed practice questions (Phase 19,
 * DEC-005/010).
 *
 * A model may propose an item. Nothing it proposes reaches a learner until it
 * has survived every check below AND a human has approved it. The checks run
 * here rather than in @learn/ai-gateway because they need the content schemas,
 * the real validators, and the active curriculum - and the gateway is
 * deliberately isolated from all three.
 *
 * The checks are chosen to catch what a language model actually gets wrong.
 * They cannot verify arithmetic (there is no CAS here), and this file does not
 * pretend otherwise: the last line of defence is the human reviewer, who is
 * shown the answer and the explanation and has to say yes.
 */
import { validateContent } from '@learn/schemas';
import { validateAnswer, type ValidatorType } from '@learn/validation-engine';
import type { CoursePackage, Question } from '@learn/curriculum';
import type { DraftCandidate } from '@learn/ai-gateway';

export interface ScreenedDraft {
  /** The candidate shaped into a real question, present only when it passed. */
  question: Question | null;
  /** Why it was rejected; empty when it passed. */
  problems: string[];
  /** Non-blocking notes worth showing the reviewer. */
  notes: string[];
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function optionsOf(candidate: DraftCandidate): string[] {
  const params = candidate.parameters as { options?: unknown } | undefined;
  return Array.isArray(params?.options) ? params.options.map(asString) : [];
}

/** Question IDs are derived, never taken from the model. */
function draftQuestionId(skillId: string, index: number): string {
  return `${skillId}.draft_${index}`;
}

export function screenDraft(
  candidate: DraftCandidate,
  skillId: string,
  pkg: CoursePackage,
  index: number,
): ScreenedDraft {
  const problems: string[] = [];
  const notes: string[] = [];

  const skill = pkg.graph.skills.get(skillId);
  if (!skill) {
    return { question: null, problems: [`unknown skill ${skillId}`], notes };
  }

  // The model never gets to choose identifiers. Anything it proposed for
  // question_id or skill_id is discarded rather than trusted.
  const shaped: Record<string, unknown> = {
    ...candidate,
    question_id: draftQuestionId(skillId, index),
    skill_id: skillId,
    content_version: skill.content_version,
  };
  delete shaped.common_wrong_answers;

  // 1. It must satisfy the same schema every authored question satisfies.
  const schemaCheck = validateContent('question', shaped);
  if (!schemaCheck.valid) {
    return { question: null, problems: schemaCheck.errors, notes };
  }
  const question = shaped as unknown as Question;

  // 2. A question whose id already exists would silently replace real content.
  if (pkg.questions.some((q) => q.question_id === question.question_id)) {
    problems.push(`question_id ${question.question_id} already exists`);
  }

  const answer = asString(question.answer_spec.correct_answer);
  const prompt = question.prompt;

  // 3. The stated answer must be gradeable by the validator it declares. This
  //    does not prove the answer is right, but it does catch "about 5" on a
  //    numeric item, which would be ungradeable forever.
  const graded = validateAnswer(question.validator as ValidatorType, answer, question.answer_spec);
  if (!graded.correct) {
    problems.push(
      `the stated answer "${answer}" does not grade as correct through the ${question.validator} validator`,
    );
  }

  // 4. Choice questions must actually offer their answer.
  const options = optionsOf(candidate);
  if (question.validator === 'exact_choice' || question.type === 'multiple_choice') {
    if (options.length < 2) {
      problems.push('a choice question needs at least two options');
    } else if (!options.includes(answer)) {
      problems.push('the correct answer is not among the options');
    }
    if (new Set(options).size !== options.length) {
      problems.push('the options contain duplicates');
    }
  }

  // 5. Giving the answer away makes the item worthless as practice.
  if (answer.length > 1 && prompt.toLowerCase().includes(answer.toLowerCase())) {
    problems.push('the prompt contains the answer');
  }
  for (const hint of question.hints ?? []) {
    if (answer.length > 1 && hint.text.toLowerCase().includes(answer.toLowerCase())) {
      problems.push(`hint ${hint.level} contains the answer`);
    }
  }

  // 6. Things worth a reviewer's attention that are not disqualifying.
  if ((question.hints ?? []).length === 0) notes.push('no hints - the learner gets no ladder');
  if (!question.explanation?.trim()) notes.push('no explanation');
  if (question.difficulty > (skill.difficulty_band ?? 5) + 1) {
    notes.push('harder than the rest of this skill');
  }

  return { question: problems.length === 0 ? question : null, problems, notes };
}

export interface ScreeningOutcome {
  accepted: { question: Question; notes: string[] }[];
  rejected: { index: number; problems: string[] }[];
}

/** Screen a whole batch, keeping the rejects so the reviewer sees what failed. */
export function screenDrafts(
  candidates: DraftCandidate[],
  skillId: string,
  pkg: CoursePackage,
): ScreeningOutcome {
  const accepted: ScreeningOutcome['accepted'] = [];
  const rejected: ScreeningOutcome['rejected'] = [];
  const seenPrompts = new Set(
    (pkg.questionsBySkill.get(skillId) ?? []).map((q) => q.prompt.trim().toLowerCase()),
  );

  candidates.forEach((candidate, i) => {
    const result = screenDraft(candidate, skillId, pkg, accepted.length + 1);
    if (!result.question) {
      rejected.push({ index: i, problems: result.problems });
      return;
    }
    // A duplicate of an item the skill already has adds nothing.
    const key = result.question.prompt.trim().toLowerCase();
    if (seenPrompts.has(key)) {
      rejected.push({ index: i, problems: ['duplicates a question this skill already has'] });
      return;
    }
    seenPrompts.add(key);
    accepted.push({ question: result.question, notes: result.notes });
  });

  return { accepted, rejected };
}
