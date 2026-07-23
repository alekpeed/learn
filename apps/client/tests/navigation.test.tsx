import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../src/App.js';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('navigation shell (FND-002)', () => {
  it('renders the welcome screen at the root once loaded', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: /welcome/i })).toBeInTheDocument();
  });

  it('exposes a keyboard skip link to main content', async () => {
    renderAt('/');
    await screen.findByRole('heading', { name: /welcome/i });
    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute(
      'href',
      '#main',
    );
  });

  it('shows a recovery page for unknown routes', async () => {
    renderAt('/does-not-exist');
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to your dashboard/i })).toBeInTheDocument();
  });

  it('provides primary navigation to every core screen', async () => {
    renderAt('/dashboard');
    const nav = await screen.findByRole('navigation', { name: /primary/i });
    await waitFor(() => {
      expect(nav).toBeInTheDocument();
    });
    for (const label of ['Dashboard', 'Practice', 'Review', 'Settings']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });
});
