/**
 * Single registry of MVP screens (doc 07 §2). Drives both the router and the
 * navigation so every screen has a route (FND-002).
 */
export interface ScreenDef {
  path: string;
  label: string;
  title: string;
  /** Show in the primary navigation. */
  nav: boolean;
}

export const SCREENS: ScreenDef[] = [
  { path: '/', label: 'Welcome', title: 'Welcome', nav: false },
  { path: '/goal', label: 'Goal', title: 'Goal Selection', nav: false },
  { path: '/diagnostic', label: 'Diagnostic', title: 'Diagnostic', nav: false },
  { path: '/diagnostic/results', label: 'Results', title: 'Diagnostic Results', nav: false },
  { path: '/dashboard', label: 'Dashboard', title: 'Dashboard', nav: true },
  { path: '/map', label: 'Curriculum map', title: 'Curriculum Map', nav: true },
  { path: '/lesson', label: 'Lesson', title: 'Lesson', nav: true },
  { path: '/practice', label: 'Practice', title: 'Practice', nav: true },
  { path: '/mastery-check', label: 'Mastery check', title: 'Mastery Check', nav: true },
  { path: '/review', label: 'Review', title: 'Review Queue', nav: true },
  { path: '/progress', label: 'Progress', title: 'Progress', nav: true },
  { path: '/courses', label: 'Courses', title: 'Courses', nav: true },
  { path: '/settings', label: 'Settings', title: 'Settings', nav: true },
];
