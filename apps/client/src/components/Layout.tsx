/**
 * App shell: skip link, primary navigation (keyboard-operable), an offline
 * banner, and the main region. One primary region per screen (doc 07 §3). Nav
 * links use aria-current so the active screen is identifiable without relying on
 * color (doc 11 §4). While offline the AI tutor is paused; everything else works.
 */
import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { SCREENS } from '../screens/registry.js';
import { useOnlineStatus } from '../state/useOnlineStatus.js';
import { tutorProvider } from '../data/tutor.js';

export function Layout(): JSX.Element {
  const navScreens = SCREENS.filter((s) => s.nav);
  const online = useOnlineStatus();

  // The AI tutor is the only online-dependent feature; pause it when offline so
  // the gateway serves its verified fallback (doc 10 §7). Learning is unaffected.
  useEffect(() => {
    tutorProvider.setAvailable(online);
  }, [online]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="app-header">
        <span className="app-title">Ground-Up Learning</span>
        <nav aria-label="Primary">
          <ul>
            {navScreens.map((s) => (
              <li key={s.path}>
                <NavLink
                  to={s.path}
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                >
                  {s.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {!online && (
        <p className="offline-banner" role="status" data-status="offline">
          You are offline. Lessons, practice, and reviews still work; the AI tutor is paused.
        </p>
      )}
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
