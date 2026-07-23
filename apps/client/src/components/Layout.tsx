/**
 * App shell: skip link, primary navigation (keyboard-operable), and the main
 * region. One primary region per screen (doc 07 §3). Nav links use aria-current
 * so the active screen is identifiable without relying on color (doc 11 §4).
 */
import { NavLink, Outlet } from 'react-router-dom';
import { SCREENS } from '../screens/registry.js';

export function Layout(): JSX.Element {
  const navScreens = SCREENS.filter((s) => s.nav);
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
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
