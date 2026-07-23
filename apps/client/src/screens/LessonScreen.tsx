import { Link, useSearchParams } from 'react-router-dom';
import { useCurriculum } from '../state/CurriculumContext.js';
import { LessonView } from '../components/LessonView.js';
import { ScreenState } from '../components/ScreenState.js';

export function LessonScreen(): JSX.Element {
  const { package: pkg, errors } = useCurriculum();
  const [params] = useSearchParams();
  const skillId = params.get('skill');

  if (!pkg) {
    return (
      <section>
        <h1>Lesson</h1>
        <ScreenState status="error" message={`Curriculum failed to load: ${errors.join('; ')}`} />
      </section>
    );
  }

  const lesson = skillId ? pkg.lessonBySkill.get(skillId) : pkg.lessons[0];

  if (!lesson) {
    return (
      <section>
        <h1>Lesson</h1>
        <ScreenState status="empty" message="No lesson selected.">
          <Link to="/map">Choose a skill from the curriculum map</Link>
        </ScreenState>
      </section>
    );
  }

  return (
    <section>
      <LessonView lesson={lesson} />
      <nav aria-label="Lesson actions" className="lesson-actions">
        <Link to="/map">Back to curriculum map</Link>
      </nav>
    </section>
  );
}
