/**
 * Figure widget registry (DEC-019).
 *
 * Content names a `kind` and supplies numbers; the drawing lives here. That is
 * the same arrangement the validators use - content says `"validator":
 * "exact_value"` and the code implements it - so curriculum stays data, is
 * still schema-validated at load, and an installed course module cannot smuggle
 * executable content past the Phase 18 loader.
 *
 * Three rules every renderer follows:
 *
 *   1. `alt` is required by the schema, and the SVG carries it as its accessible
 *      name. The existing questions already describe their figures in words, so
 *      a figure augments the prompt and never carries information found nowhere
 *      else - nothing is lost when it cannot be displayed.
 *   2. Every colour comes from a CSS custom property, so light, dark and high
 *      contrast all work without a per-theme rule here.
 *   3. Bad or unknown input degrades to the alt text. A course module naming a
 *      widget this build does not have must not break the screen.
 */
import type { ReactNode } from 'react';

export interface FigureSpec {
  kind: string;
  alt: string;
  params?: Record<string, unknown>;
}

function num(params: Record<string, unknown> | undefined, key: string): number | null {
  const value = params?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function str(params: Record<string, unknown> | undefined, key: string): string | null {
  const value = params?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Shared frame: gives every figure its accessible name and its palette. */
function Frame({
  alt,
  viewBox,
  children,
}: {
  alt: string;
  viewBox: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <svg className="figure" viewBox={viewBox} role="img" aria-label={alt}>
      {children}
    </svg>
  );
}

/**
 * A right triangle with its sides labelled and the right angle marked.
 *
 * `unknown` names a side the question is asking for; it renders as "?" instead
 * of its value. Without that, a figure for "legs 3 and 4, find the hypotenuse"
 * would answer the question it illustrates. The value is still supplied, and is
 * still used to shape the drawing - it is simply not shown.
 */
function RightTriangle({ alt, params }: FigureSpec): JSX.Element | null {
  const a = num(params, 'a');
  const b = num(params, 'b');
  const c = num(params, 'c');
  if (a === null || b === null || c === null || a <= 0 || b <= 0 || c <= 0) return null;
  const unknown = str(params, 'unknown');
  const show = (side: 'a' | 'b' | 'c', value: number): string =>
    unknown === side ? '?' : String(value);

  // Scale the longer leg to a fixed length so a 3-4-5 and a 30-40-50 draw the
  // same shape; the labels carry the real magnitudes.
  const scale = 150 / Math.max(a, b);
  const w = b * scale;
  const h = a * scale;
  const originX = 30;
  const baseY = 30 + h;
  const tick = 12;
  const angleLabel = str(params, 'angle_label');

  return (
    <Frame alt={alt} viewBox={`0 0 ${w + 90} ${h + 70}`}>
      <polygon
        className="fig-shape"
        points={`${originX},${baseY} ${originX + w},${baseY} ${originX},${30}`}
      />
      {/* Right-angle marker at the corner between the two legs. */}
      <polyline
        className="fig-line"
        points={`${originX + tick},${baseY} ${originX + tick},${baseY - tick} ${originX},${baseY - tick}`}
      />
      <text className="fig-label" x={originX - 8} y={30 + h / 2} textAnchor="end">
        {show('a', a)}
      </text>
      <text className="fig-label" x={originX + w / 2} y={baseY + 20} textAnchor="middle">
        {show('b', b)}
      </text>
      <text className="fig-label" x={originX + w / 2 + 12} y={30 + h / 2 - 6} textAnchor="start">
        {show('c', c)}
      </text>
      {angleLabel && (
        <text className="fig-label" x={originX + w - 22} y={baseY - 10} textAnchor="middle">
          {angleLabel}
        </text>
      )}
    </Frame>
  );
}

/**
 * y = a sin(bx) + d, or the cosine of the same shape, over two periods.
 * Sampled rather than approximated with beziers so the drawn curve is the
 * function itself.
 */
function TrigGraph({ alt, params }: FigureSpec): JSX.Element | null {
  const amplitude = num(params, 'amplitude') ?? 1;
  const periodDeg = num(params, 'period') ?? 360;
  const midline = num(params, 'midline') ?? 0;
  const fn = str(params, 'fn') ?? 'sin';
  if (amplitude === 0 || periodDeg <= 0) return null;

  const w = 340;
  const h = 190;
  const padX = 34;
  const padY = 22;
  const spanDeg = periodDeg * 2;
  const peak = Math.abs(amplitude);
  const top = midline + peak;
  const bottom = midline - peak;
  const range = top - bottom || 1;

  const x = (deg: number): number => padX + (deg / spanDeg) * (w - padX * 2);
  const y = (value: number): number => padY + ((top - value) / range) * (h - padY * 2);

  const points: string[] = [];
  const steps = 240;
  for (let i = 0; i <= steps; i += 1) {
    const deg = (i / steps) * spanDeg;
    const radians = ((deg / periodDeg) * 2 * Math.PI) % (2 * Math.PI);
    const base = fn === 'cos' ? Math.cos(radians) : Math.sin(radians);
    points.push(`${x(deg).toFixed(2)},${y(midline + amplitude * base).toFixed(2)}`);
  }

  return (
    <Frame alt={alt} viewBox={`0 0 ${w} ${h}`}>
      <line className="fig-axis" x1={padX} y1={y(midline)} x2={w - padX} y2={y(midline)} />
      <line className="fig-axis" x1={padX} y1={padY} x2={padX} y2={h - padY} />
      {/* Midline is dashed where it differs from the axis, so a shifted wave reads. */}
      {midline !== 0 && (
        <line className="fig-guide" x1={padX} y1={y(midline)} x2={w - padX} y2={y(midline)} />
      )}
      <polyline className="fig-curve" points={points.join(' ')} />
      <text className="fig-label" x={padX - 6} y={y(top) + 4} textAnchor="end">
        {Number(top.toFixed(2))}
      </text>
      <text className="fig-label" x={padX - 6} y={y(bottom) + 4} textAnchor="end">
        {Number(bottom.toFixed(2))}
      </text>
      <text className="fig-label" x={x(periodDeg)} y={h - 4} textAnchor="middle">
        {periodDeg}
      </text>
      <text className="fig-label" x={x(spanDeg)} y={h - 4} textAnchor="middle">
        {spanDeg}
      </text>
    </Frame>
  );
}

/** The unit circle with one angle marked and its point on the circumference. */
function UnitCircle({ alt, params }: FigureSpec): JSX.Element | null {
  const angleDeg = num(params, 'angle');
  if (angleDeg === null) return null;

  const size = 220;
  const c = size / 2;
  const r = 78;
  const radians = (angleDeg * Math.PI) / 180;
  const px = c + r * Math.cos(radians);
  const py = c - r * Math.sin(radians);
  const label = str(params, 'point_label');

  return (
    <Frame alt={alt} viewBox={`0 0 ${size} ${size}`}>
      <line className="fig-axis" x1={10} y1={c} x2={size - 10} y2={c} />
      <line className="fig-axis" x1={c} y1={10} x2={c} y2={size - 10} />
      <circle className="fig-shape" cx={c} cy={c} r={r} />
      <line className="fig-radius" x1={c} y1={c} x2={px} y2={py} />
      <circle className="fig-point" cx={px} cy={py} r={4.5} />
      <text
        className="fig-label"
        x={px + (px >= c ? 8 : -8)}
        y={py + (py <= c ? -8 : 16)}
        textAnchor={px >= c ? 'start' : 'end'}
      >
        {label ?? `${angleDeg} deg`}
      </text>
    </Frame>
  );
}

/** A number line with optional marked values. */
function NumberLine({ alt, params }: FigureSpec): JSX.Element | null {
  const min = num(params, 'min');
  const max = num(params, 'max');
  if (min === null || max === null || max <= min) return null;
  const step = num(params, 'step') ?? 1;
  if (step <= 0 || (max - min) / step > 60) return null;

  const raw = params?.['marks'];
  const marks = Array.isArray(raw) ? raw.filter((m): m is number => typeof m === 'number') : [];

  const w = 340;
  const h = 74;
  const padX = 22;
  const axisY = 40;
  const x = (value: number): number => padX + ((value - min) / (max - min)) * (w - padX * 2);

  const ticks: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));

  return (
    <Frame alt={alt} viewBox={`0 0 ${w} ${h}`}>
      <line className="fig-axis" x1={padX} y1={axisY} x2={w - padX} y2={axisY} />
      {ticks.map((t) => (
        <g key={t}>
          <line className="fig-line" x1={x(t)} y1={axisY - 5} x2={x(t)} y2={axisY + 5} />
          <text className="fig-label" x={x(t)} y={axisY + 22} textAnchor="middle">
            {t}
          </text>
        </g>
      ))}
      {marks.map((m) => (
        <circle key={`m${m}`} className="fig-point" cx={x(m)} cy={axisY} r={5} />
      ))}
    </Frame>
  );
}

/** A coordinate plane with optional plotted points. */
function CoordinatePlane({ alt, params }: FigureSpec): JSX.Element | null {
  const min = num(params, 'min') ?? -5;
  const max = num(params, 'max') ?? 5;
  if (max <= min || max - min > 40) return null;

  const raw = params?.['points'];
  const points = Array.isArray(raw)
    ? raw.filter(
        (p): p is [number, number] =>
          Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number'),
      )
    : [];

  const size = 230;
  const pad = 16;
  const scale = (size - pad * 2) / (max - min);
  const x = (v: number): number => pad + (v - min) * scale;
  const y = (v: number): number => size - pad - (v - min) * scale;

  const lines: number[] = [];
  for (let v = Math.ceil(min); v <= max; v += 1) lines.push(v);

  return (
    <Frame alt={alt} viewBox={`0 0 ${size} ${size}`}>
      {lines.map((v) => (
        <g key={`g${v}`}>
          <line className="fig-grid" x1={x(v)} y1={y(min)} x2={x(v)} y2={y(max)} />
          <line className="fig-grid" x1={x(min)} y1={y(v)} x2={x(max)} y2={y(v)} />
        </g>
      ))}
      <line className="fig-axis" x1={x(min)} y1={y(0)} x2={x(max)} y2={y(0)} />
      <line className="fig-axis" x1={x(0)} y1={y(min)} x2={x(0)} y2={y(max)} />
      {points.map(([px, py]) => (
        <g key={`p${px},${py}`}>
          <circle className="fig-point" cx={x(px)} cy={y(py)} r={5} />
          <text className="fig-label" x={x(px) + 8} y={y(py) - 8} textAnchor="start">
            ({px}, {py})
          </text>
        </g>
      ))}
    </Frame>
  );
}

/**
 * An angle: two rays from a vertex with the opening marked.
 *
 * `hide_measure` omits the degree label, for questions that ask the learner to
 * read or classify the angle - showing the number would answer them.
 */
function Angle({ alt, params }: FigureSpec): JSX.Element | null {
  const degrees = num(params, 'degrees');
  if (degrees === null || degrees <= 0 || degrees >= 360) return null;
  const hide = params?.['hide_measure'] === true;

  const w = 260;
  const h = 190;
  const vx = 46;
  const vy = h - 46;
  const len = 150;
  const rad = (degrees * Math.PI) / 180;
  const ex = vx + len * Math.cos(rad);
  const ey = vy - len * Math.sin(rad);
  const arcR = 40;
  const large = degrees > 180 ? 1 : 0;
  const arc = [
    `M ${vx + arcR} ${vy}`,
    `A ${arcR} ${arcR} 0 ${large} 0 ${(vx + arcR * Math.cos(rad)).toFixed(2)} ${(vy - arcR * Math.sin(rad)).toFixed(2)}`,
  ].join(' ');
  const midRad = rad / 2;

  return (
    <Frame alt={alt} viewBox={`0 0 ${w} ${h}`}>
      <line className="fig-shape" x1={vx} y1={vy} x2={vx + len} y2={vy} />
      <line className="fig-shape" x1={vx} y1={vy} x2={ex} y2={ey} />
      <path className="fig-guide" d={arc} fill="none" />
      {!hide && (
        <text
          className="fig-label"
          x={vx + (arcR + 22) * Math.cos(midRad)}
          y={vy - (arcR + 22) * Math.sin(midRad) + 4}
          textAnchor="middle"
        >
          {degrees} deg
        </text>
      )}
      <circle className="fig-point" cx={vx} cy={vy} r={3.5} />
    </Frame>
  );
}

const RENDERERS: Record<string, (spec: FigureSpec) => JSX.Element | null> = {
  angle: Angle,
  right_triangle: RightTriangle,
  trig_graph: TrigGraph,
  unit_circle: UnitCircle,
  number_line: NumberLine,
  coordinate_plane: CoordinatePlane,
};

/** Every widget kind this build can draw. Used by a content test. */
export const FIGURE_KINDS = Object.keys(RENDERERS);

export function Figure({ figure }: { figure: FigureSpec | undefined }): JSX.Element | null {
  if (!figure?.alt) return null;
  const render = RENDERERS[figure.kind];
  const drawn = render ? render(figure) : null;
  if (!drawn) {
    // Unknown kind, or parameters this renderer cannot use. The prompt already
    // describes the figure, so state the alternative rather than showing a gap.
    return <p className="figure-fallback">{figure.alt}</p>;
  }
  return <figure className="figure-wrap">{drawn}</figure>;
}
