import { ScreenState } from '../components/ScreenState.js';

/**
 * Placeholder for screens whose behavior lands in later phases (Phase 2+).
 * Each still has a route, a heading, and a defined empty state (FND-002, doc 07 §4).
 */
export function Placeholder({ title }: { title: string }): JSX.Element {
  return (
    <section>
      <h1>{title}</h1>
      <ScreenState
        status="empty"
        message="This screen is part of a later phase and is not built yet."
      />
    </section>
  );
}
