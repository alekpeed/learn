/**
 * The app's tutor gateway, wired to the stub provider (DEC-010). A real provider
 * implements TutorProvider and replaces the stub here with no other changes.
 * The gateway returns display text only — it cannot touch verified state.
 */
import { TutorGateway, StubTutorProvider } from '@learn/ai-gateway';

export const tutorProvider = new StubTutorProvider();
export const tutorGateway = new TutorGateway(tutorProvider, {
  log: (event) => {
    if (event.level === 'warn') console.warn('[tutor]', event.message);
  },
});
