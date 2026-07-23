/**
 * Stub tutor provider (DEC-010). Generates responses deterministically from the
 * VERIFIED context only — it invents no facts and calls no external service.
 * A real provider implements the same TutorProvider interface and drops in
 * behind the gateway without other changes (doc 08 §9).
 */
import type { TutorProvider, TutorRequest, ProviderResponse, TutorContext } from './types.js';

const UNCERTAINTY =
  'This is generated from your lesson material; your checked answers are unchanged.';

function noVerifiedMaterial(context: TutorContext): string {
  return `I do not have verified material for "${context.skill_title}" yet, so I cannot explain it reliably. Your lesson and practice still work as usual.`;
}

function explain(context: TutorContext): string {
  const parts: string[] = [];
  parts.push(`Here is another way to think about ${context.skill_title}.`);
  if (context.objective) parts.push(`The goal is: ${context.objective}`);
  if (context.lesson_excerpt) parts.push(`From your lesson: ${context.lesson_excerpt}`);
  if (context.correct_answer !== undefined) {
    parts.push(`For this problem the checked answer is ${context.correct_answer}.`);
  }
  parts.push(`(${UNCERTAINTY})`);
  return parts.join('\n\n');
}

function guide(context: TutorContext): string {
  const parts: string[] = [];
  parts.push(
    `Let's work through ${context.skill_title} one step at a time — I won't give the answer.`,
  );
  if (context.problem_prompt) parts.push(`The problem is: ${context.problem_prompt}`);
  parts.push('What is the first thing you notice? What rule from the lesson could apply here?');
  if (context.objective) parts.push(`Keep the goal in mind: ${context.objective}`);
  parts.push(`(${UNCERTAINTY})`);
  return parts.join('\n\n');
}

function compare(context: TutorContext): string {
  const parts: string[] = [
    `Two ways to approach ${context.skill_title}:`,
    '1) Work it step by step using the rule from the lesson.',
    '2) Estimate or check with a simpler case first, then compare.',
  ];
  if (context.lesson_excerpt) parts.push(`Your lesson says: ${context.lesson_excerpt}`);
  parts.push(`(${UNCERTAINTY})`);
  return parts.join('\n\n');
}

function diagnose(context: TutorContext): string {
  const parts: string[] = [];
  if (context.detected_misconception) {
    parts.push(`It looks like a common slip: ${context.detected_misconception}`);
  } else {
    parts.push('Let us look at where the reasoning went off track.');
  }
  if (context.lesson_excerpt)
    parts.push(`Re-read this from your lesson: ${context.lesson_excerpt}`);
  parts.push('Try the step again with that in mind.');
  parts.push(`(${UNCERTAINTY})`);
  return parts.join('\n\n');
}

function extend(context: TutorContext): string {
  const parts: string[] = [
    `Here is a related idea to stretch your understanding of ${context.skill_title}.`,
    'Try making up a similar problem of your own and solving it, then check it with practice.',
  ];
  parts.push(`(${UNCERTAINTY})`);
  return parts.join('\n\n');
}

export class StubTutorProvider implements TutorProvider {
  readonly name = 'stub';
  private available: boolean;

  constructor(available = true) {
    this.available = available;
  }

  setAvailable(value: boolean): void {
    this.available = value;
  }

  isAvailable(): boolean {
    return this.available;
  }

  generate(request: TutorRequest): Promise<ProviderResponse> {
    const { mode, context } = request;
    const hasMaterial =
      context.lesson_excerpt !== undefined ||
      context.objective !== undefined ||
      context.detected_misconception !== undefined;

    if (!hasMaterial && mode !== 'guide') {
      return Promise.resolve({ text: noVerifiedMaterial(context) });
    }

    switch (mode) {
      case 'explain':
        return Promise.resolve({ text: explain(context) });
      case 'guide':
        return Promise.resolve({ text: guide(context) });
      case 'compare':
        return Promise.resolve({ text: compare(context) });
      case 'diagnose':
        return Promise.resolve({ text: diagnose(context) });
      case 'extend':
        return Promise.resolve({ text: extend(context) });
      default:
        return Promise.resolve({ text: noVerifiedMaterial(context) });
    }
  }
}
