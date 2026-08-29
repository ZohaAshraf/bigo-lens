import { useEffect, useRef, useState } from 'react';

interface GrowthCurveProps {
  complexity: string;
}

const CHART_W = 560;
const CHART_H = 260;
const PADDING = 32;
const STEPS = 60;
const N_MAX = 30;

const REFERENCE_CURVES: { label: string; fn: (n: number) => number }[] = [
  { label: 'O(1)', fn: () => 1 },
  { label: 'O(log n)', fn: (n) => Math.log2(n + 1) },
  { label: 'O(n)', fn: (n) => n },
  { label: 'O(n log n)', fn: (n) => n * Math.log2(n + 1) },
  { label: 'O(n^2)', fn: (n) => n * n },
  { label: 'O(2^n)', fn: (n) => Math.pow(2, Math.min(n, 20)) },
];

function complexityFn(label: string): (n: number) => number {
  const normalized = label.replace(/\s+/g, '').toLowerCase();
  const match = REFERENCE_CURVES.find(
    (c) => c.label.replace(/\s+/g, '').toLowerCase() === normalized,
  );
  if (match) return match.fn;

  const powerMatch = normalized.match(/^o\(n\^(\d+)\)$/);
  if (powerMatch) {
    const k = Number(powerMatch[1]);
    return (n) => Math.pow(n, k);
  }

  return () => 1; // Unknown — flat line, honest about not knowing
}

function pointsFor(fn: (n: number) => number): string {
  const raw = Array.from({ length: STEPS }, (_, i) => {
    const n = (i / (STEPS - 1)) * N_MAX;
    return fn(n);
  });
  const max = Math.max(...raw, 1e-6);

  return raw
    .map((v, i) => {
      const x = PADDING + (i / (STEPS - 1)) * (CHART_W - PADDING * 2);
      const y = CHART_H - PADDING - (v / max) * (CHART_H - PADDING * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function GrowthCurve({ complexity }: GrowthCurveProps) {
  const pathRef = useRef<SVGPolylineElement>(null);
  const [pathLength, setPathLength] = useState(0);

  const activeFn = complexityFn(complexity);
  const activePoints = pointsFor(activeFn);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [complexity]);

  const isActiveCurve = (label: string) =>
    label.replace(/\s+/g, '').toLowerCase() ===
    complexity.replace(/\s+/g, '').toLowerCase();

  return (
    <div>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Growth curve for ${complexity}`}
      >
        {/* Axes */}
        <line
          x1={PADDING}
          y1={CHART_H - PADDING}
          x2={CHART_W - PADDING}
          y2={CHART_H - PADDING}
          stroke="var(--color-blueprint-grid)"
          strokeWidth={1}
        />
        <line
          x1={PADDING}
          y1={PADDING}
          x2={PADDING}
          y2={CHART_H - PADDING}
          stroke="var(--color-blueprint-grid)"
          strokeWidth={1}
        />
        <text
          x={CHART_W - PADDING}
          y={CHART_H - PADDING + 18}
          fill="var(--color-blueprint-muted)"
          fontSize={11}
          fontFamily="var(--font-mono-display)"
          textAnchor="end"
        >
          n →
        </text>
        <text
          x={PADDING - 8}
          y={PADDING - 8}
          fill="var(--color-blueprint-muted)"
          fontSize={11}
          fontFamily="var(--font-mono-display)"
          textAnchor="start"
        >
          work
        </text>

        {/* Reference curves, faint */}
        {REFERENCE_CURVES.filter((c) => !isActiveCurve(c.label)).map((c) => (
          <polyline
            key={c.label}
            points={pointsFor(c.fn)}
            fill="none"
            stroke="var(--color-blueprint-grid)"
            strokeWidth={1}
            strokeDasharray="3 4"
            opacity={0.5}
          />
        ))}

        {/* Active curve, animated draw-in */}
        <polyline
          ref={pathRef}
          points={activePoints}
          fill="none"
          stroke="var(--color-blueprint-amber)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength,
            animation: pathLength ? 'draw-curve 1.1s ease-out forwards' : 'none',
          }}
        />
      </svg>

      <style>{`
        @keyframes draw-curve {
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 font-mono-display text-[11px]">
        {REFERENCE_CURVES.map((c) => (
          <span
            key={c.label}
            className={
              isActiveCurve(c.label)
                ? 'text-blueprint-amber font-semibold'
                : 'text-blueprint-muted'
            }
          >
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
