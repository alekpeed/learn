import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { Layout } from './components/Layout.js';
import { LearnerProvider } from './state/LearnerContext.js';
import { CurriculumProvider } from './state/CurriculumContext.js';
import { Welcome } from './screens/Welcome.js';
import { Dashboard } from './screens/Dashboard.js';
import { Settings } from './screens/Settings.js';
import { CurriculumMap } from './screens/CurriculumMap.js';
import { LessonScreen } from './screens/LessonScreen.js';
import { Placeholder } from './screens/Placeholder.js';
import { NotFound } from './screens/NotFound.js';

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <LearnerProvider>
        <CurriculumProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Welcome />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/map" element={<CurriculumMap />} />
              <Route path="/lesson" element={<LessonScreen />} />
              <Route path="/goal" element={<Placeholder title="Goal Selection" />} />
              <Route path="/diagnostic" element={<Placeholder title="Diagnostic" />} />
              <Route
                path="/diagnostic/results"
                element={<Placeholder title="Diagnostic Results" />}
              />
              <Route path="/practice" element={<Placeholder title="Practice" />} />
              <Route path="/mastery-check" element={<Placeholder title="Mastery Check" />} />
              <Route path="/review" element={<Placeholder title="Review Queue" />} />
              <Route path="/progress" element={<Placeholder title="Progress" />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </CurriculumProvider>
      </LearnerProvider>
    </ErrorBoundary>
  );
}
