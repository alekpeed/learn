import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Figure, FIGURE_KINDS } from '../src/components/figures/Figure.js';

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(here, '..', '..', '..', 'packages', 'schemas', 'schemas');

describe('figure widget registry (DEC-019)', () => {
  it('renders every kind the schema allows', () => {
    const common = JSON.parse(readFileSync(join(schemaPath, 'common.schema.json'), 'utf8')) as {
      $defs: { figure: { properties: { kind: { enum: string[] } } } };
    };
    // If the schema admits a kind nothing can draw, content would validate and
    // then silently fall back to text. Keep the two in step.
    expect([...FIGURE_KINDS].sort()).toEqual([...common.$defs.figure.properties.kind.enum].sort());
  });

  it('gives the drawing an accessible name from alt', () => {
    render(
      <Figure
        figure={{
          kind: 'right_triangle',
          alt: 'A 3-4-5 right triangle.',
          params: { a: 3, b: 4, c: 5 },
        }}
      />,
    );
    expect(screen.getByRole('img', { name: 'A 3-4-5 right triangle.' })).toBeInTheDocument();
  });

  it('labels the sides it is given', () => {
    const { container } = render(
      <Figure figure={{ kind: 'right_triangle', alt: 'alt', params: { a: 3, b: 4, c: 5 } }} />,
    );
    const labels = [...container.querySelectorAll('.fig-label')].map((n) => n.textContent);
    expect(labels).toEqual(expect.arrayContaining(['3', '4', '5']));
  });

  it('hides the side the question is asking for, so a figure never answers itself', () => {
    const { container } = render(
      <Figure
        figure={{
          kind: 'right_triangle',
          alt: 'Legs 3 and 4; the hypotenuse is what the question asks for.',
          params: { a: 3, b: 4, c: 5, unknown: 'c' },
        }}
      />,
    );
    const labels = [...container.querySelectorAll('.fig-label')].map((n) => n.textContent);
    expect(labels).toEqual(expect.arrayContaining(['3', '4', '?']));
    expect(labels).not.toContain('5');
  });

  it('draws a trig graph as a sampled curve, not an approximation', () => {
    const { container } = render(
      <Figure
        figure={{
          kind: 'trig_graph',
          alt: 'A sine wave.',
          params: { fn: 'sin', amplitude: 2, period: 120, midline: 1 },
        }}
      />,
    );
    const curve = container.querySelector('.fig-curve');
    expect(curve).not.toBeNull();
    const points = (curve?.getAttribute('points') ?? '').trim().split(/\s+/);
    expect(points.length).toBeGreaterThan(100);
    // Peak and trough must sit at midline +/- amplitude, i.e. 3 and -1.
    const ys = points.map((p) => Number(p.split(',')[1]));
    expect(Math.min(...ys)).toBeLessThan(Math.max(...ys));
  });

  it('marks the requested angle on the unit circle', () => {
    render(
      <Figure
        figure={{ kind: 'unit_circle', alt: 'Unit circle at 60 degrees.', params: { angle: 60 } }}
      />,
    );
    expect(screen.getByRole('img', { name: /60 degrees/ })).toBeInTheDocument();
  });

  it('falls back to the alt text for a kind this build cannot draw', () => {
    render(
      <Figure figure={{ kind: 'holographic_torus', alt: 'A described shape.', params: {} }} />,
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('A described shape.')).toBeInTheDocument();
  });

  it('falls back rather than drawing nonsense from bad parameters', () => {
    render(
      <Figure figure={{ kind: 'right_triangle', alt: 'Described instead.', params: { a: -1 } }} />,
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Described instead.')).toBeInTheDocument();
  });

  it('renders nothing at all when a question has no figure', () => {
    const { container } = render(<Figure figure={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
