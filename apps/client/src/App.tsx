import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { Layout } from './components/Layout.js';
import { LearnerProvider } from './state/LearnerContext.js';
import { CurriculumProvider } from './state/CurriculumContext.js';
import { ProgressProvider } from './state/ProgressContext.js';
import { Welcome } from './screens/Welcome.js';
import { Dashboard } from './screens/Dashboard.js';
import { Settings } from './screens/Settings.js';
import { Authoring } from './screens/Authoring.js';
import { Learners } from './screens/Learners.js';
import { CurriculumMap } from './screens/CurriculumMap.js';
import { LessonScreen } from './screens/LessonScreen.js';
import { PracticeScreen } from './screens/PracticeScreen.js';
import { ReviewQueue } from './screens/ReviewQueue.js';
import { Progress } from './screens/Progress.js';
import { DiagnosticScreen } from './screens/DiagnosticScreen.js';
import { DiagnosticResults } from './screens/DiagnosticResults.js';
import { Placeholder } from './screens/Placeholder.js';
import { NotFound } from './screens/NotFound.js';

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <LearnerProvider>
        <CurriculumProvider>
          <ProgressProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Welcome />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courses" element={<Authoring />} />
                <Route path="/learners" element={<Learners />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/map" element={<CurriculumMap />} />
                <Route path="/lesson" element={<LessonScreen />} />
                <Route path="/practice" element={<PracticeScreen />} />
                <Route path="/review" element={<ReviewQueue />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/diagnostic" element={<DiagnosticScreen />} />
                <Route path="/diagnostic/results" element={<DiagnosticResults />} />
                <Route path="/goal" element={<Placeholder title="Goal Selection" />} />
                <Route path="/mastery-check" element={<Placeholder title="Mastery Check" />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </ProgressProvider>
        </CurriculumProvider>
      </LearnerProvider>
    </ErrorBoundary>
  );
}
