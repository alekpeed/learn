/**
 * Lesson renderer (CUR-003). Renders every lesson component type with an
 * accessible section label. Missing optional components are simply absent and
 * never break rendering. Any accessible_text alternative is exposed for media.
 */
import type { Lesson, LessonComponentType } from '@learn/curriculum';

const COMPONENT_LABELS: Record<LessonComponentType, string> = {
  learning_objective: 'Learning objective',
  prerequisite_reminder: 'Before you start',
  intuitive_explanation: 'The idea',
  representation: 'A way to picture it',
  formal_terminology: 'The formal terms',
  worked_example: 'Worked example',
  guided_practice: 'Guided practice',
  independent_practice: 'Your turn',
  transfer_problem: 'Take it further',
  common_mistakes: 'Common mistakes',
  summary: 'Summary',
  review_prompt: 'For review',
};

export function LessonView({ lesson }: { lesson: Lesson }): JSX.Element {
  return (
    <article aria-label={`Lesson: ${lesson.title}`}>
      <h1>{lesson.title}</h1>
      {lesson.components.map((component, i) => {
        const label = COMPONENT_LABELS[component.type];
        return (
          <section key={`${component.type}-${i}`} className="lesson-component" aria-label={label}>
            <h2>{label}</h2>
            <p>{component.body}</p>
            {component.accessible_text && (
              <p className="accessible-alt">
                <span className="visually-hidden">Text description: </span>
                {component.accessible_text}
              </p>
            )}
          </section>
        );
      })}
    </article>
  );
}
