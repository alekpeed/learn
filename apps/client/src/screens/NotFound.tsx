import { Link, useLocation } from 'react-router-dom';

/** Recovery page for unknown routes (FND-002). */
export function NotFound(): JSX.Element {
  const location = useLocation();
  return (
    <section>
      <h1>Page not found</h1>
      <p>
        There is nothing at <code>{location.pathname}</code>.
      </p>
      <Link to="/dashboard">Go to your dashboard</Link>
    </section>
  );
}
