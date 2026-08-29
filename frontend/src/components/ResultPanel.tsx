import type { ComplexityResult } from '../lib/api';
import GrowthCurve from './GrowthCurve';

interface ResultPanelProps {
  result: ComplexityResult | null;
  error: string | null;
}

export default function ResultPanel({ result, error }: ResultPanelProps) {
  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-center px-6">
        <div>
          <p className="font-mono-display text-blueprint-amber text-sm mb-2">
            READOUT FAILED
          </p>
          <p className="text-blueprint-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center text-center px-6">
        <div>
          <p className="font-mono-display text-blueprint-muted text-sm tracking-wide">
            AWAITING INPUT
          </p>
          <p className="text-blueprint-muted/70 text-sm mt-2 max-w-xs">
            Paste a function and hit Analyze — the instrument will plot its growth here.
          </p>
        </div>
      </div>
    );
  }

  const confidencePct = Math.round(result.confidence * 100);
  const source = (result.heuristic_signals?.source as string) ?? 'heuristic';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-baseline justify-between">
        <span className="font-mono-display text-4xl font-bold text-blueprint-text">
          {result.time_complexity}
        </span>
        <span className="font-mono-display text-xs text-blueprint-muted uppercase">
          via {source}
        </span>
      </div>

      {result.space_complexity && (
        <p className="font-mono-display text-sm text-blueprint-muted mt-1">
          space: {result.space_complexity}
        </p>
      )}

      <div className="mt-6">
        <GrowthCurve complexity={result.time_complexity} />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <span className="font-mono-display text-xs text-blueprint-muted uppercase">
          confidence
        </span>
        <div className="flex-1 h-1.5 bg-blueprint-grid/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-blueprint-amber transition-all duration-700"
            style={{ width: `${confidencePct}%` }}
          />
        </div>
        <span className="font-mono-display text-xs text-blueprint-text">
          {confidencePct}%
        </span>
      </div>

      <div className="mt-6 relative pl-4 border-l-2 border-blueprint-amber/60">
        <p className="text-sm text-blueprint-muted leading-relaxed">
          {result.explanation}
        </p>
      </div>
    </div>
  );
}
