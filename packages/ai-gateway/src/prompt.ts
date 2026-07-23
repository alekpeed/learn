/**
 * Prompt construction (doc 08 AI Tutor Gateway). Turns a validated TutorRequest
 * into a system + user prompt that instructs any provider to follow the doc 10
 * rules: use only the supplied verified context, never claim to change state,
 * hold back the answer in guided mode, and state uncertainty when unsure.
 */
import type { TutorRequest, TutorMode, TutorContext } from './types.js';

const MODE_INSTRUCTIONS: Record<TutorMode, string> = {
  explain: 'Explain the idea a different way, in plain language. You may state the checked answer.',
  guide:
    'Guide the learner with ONE Socratic question or the next small step. Do NOT reveal or state the final answer.',
  compare: 'Compare two methods or representations for this skill, briefly.',
  diagnose:
    'Explain the specific mistake using the detected misconception, and point to the fix. Do not just give the answer.',
  extend: 'Offer a short related example or extension to deepen understanding.',
};

function contextBlock(context: TutorContext): string {
  const lines: string[] = [`Skill: ${context.skill_title} (${context.skill_id})`];
  if (context.objective) lines.push(`Objective: ${context.objective}`);
  if (context.lesson_excerpt) lines.push(`Verified lesson excerpt: ${context.lesson_excerpt}`);
  if (context.problem_prompt) lines.push(`Current problem: ${context.problem_prompt}`);
  if (context.correct_answer !== undefined) {
    lines.push(`Checked answer (from the deterministic validator): ${context.correct_answer}`);
  }
  if (context.detected_misconception) {
    lines.push(`Detected misconception: ${context.detected_misconception}`);
  }
  if (context.prerequisite_titles?.length) {
    lines.push(`Prerequisites: ${context.prerequisite_titles.join(', ')}`);
  }
  return lines.join('\n');
}

export const SYSTEM_PROMPT = [
  'You are a patient tutor inside a mastery-based learning app.',
  'Rules you must always follow:',
  '- Use ONLY the verified context provided. Do not invent facts, problems, or answers.',
  '- You never change the learner’s grades, mastery, or progress; never claim to have done so.',
  '- Keep responses concise, plain-language, and matched to a beginner.',
  '- If the context is insufficient, say you cannot verify it rather than guessing.',
  '- Preserve mathematical notation exactly.',
].join('\n');

export interface BuiltPrompt {
  system: string;
  user: string;
}

export function buildPrompt(request: TutorRequest): BuiltPrompt {
  const { mode, context, question } = request;
  const user = [
    MODE_INSTRUCTIONS[mode],
    '',
    'Verified context:',
    contextBlock(context),
    question ? `\nLearner asks: ${question}` : '',
  ].join('\n');
  return { system: SYSTEM_PROMPT, user };
}
