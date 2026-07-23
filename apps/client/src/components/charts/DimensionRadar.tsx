/**
 * A small pentagon radar of the five mastery dimensions. Decorative SVG with an
 * accessible fallback: the shape is aria-hidden and the real information lives
 * in an adjacent data list read by assistive tech.
 */
import type { MasteryScores } from '@learn/domain';
import { MASTERY_DIMENSIONS } from '@learn/domain';

const LABELS: Record<string, string> = {
  understanding: 'Understanding',
  accuracy: 'Accuracy',
  independence: 'Independence',
  retention: 'Retention',
  transfer: 'Transfer',
};

const SIZE = 180;
const CENTER = SIZE / 2;
const RADIUS = 68;

function point(index: number, value01: number): [number, number] {
  // Start at the top (-90 degrees) and go clockwise.
  const angle = -Math.PI / 2 + (index / MASTERY_DIMENSIONS.length) * 2 * Math.PI;
  const r = RADIUS * value01;
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

export function DimensionRadar({ scores }: { scores: MasteryScores }): JSX.Element {
  const outline = MASTERY_DIMENSIONS.map((_, i) => point(i, 1).join(',')).join(' ');
  const mid = MASTERY_DIMENSIONS.map((_, i) => point(i, 0.5).join(',')).join(' ');
  const shape = MASTERY_DIMENSIONS.map((d, i) => point(i, scores[d] / 100).join(',')).join(' ');

  return (
    <div className="radar">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="radar-svg"
        aria-hidden="true"
        focusable="false"
      >
        <polygon points={outline} className="radar-grid" />
        <polygon points={mid} className="radar-grid radar-grid--mid" />
        {MASTERY_DIMENSIONS.map((_, i) => {
          const [x, y] = point(i, 1);
          return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} className="radar-axis" />;
        })}
        <polygon points={shape} className="radar-shape" />
        {MASTERY_DIMENSIONS.map((d, i) => {
          const [x, y] = point(i, scores[d] / 100);
          return <circle key={d} cx={x} cy={y} r={2.5} className="radar-dot" />;
        })}
      </svg>
      <dl className="radar-legend">
        {MASTERY_DIMENSIONS.map((d) => (
          <div key={d} className="radar-legend-row">
            <dt>{LABELS[d]}</dt>
            <dd>{Math.round(scores[d])}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
