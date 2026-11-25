import type { AxisScores, Locale } from '../types/mindprint';
import { AXIS_ORDER, TRANSLATIONS } from '../i18n/translations';

interface RadarChartProps {
  primary: AxisScores;
  secondary?: AxisScores;
  primaryLabel?: string;
  secondaryLabel?: string;
  locale: Locale;
}

export function RadarChart({
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  locale,
}: RadarChartProps) {
  const t = TRANSLATIONS[locale];
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 108;

  const pointAt = (idx: number, value01: number) => {
    const angle = -Math.PI / 2 + (idx / AXIS_ORDER.length) * Math.PI * 2;
    const r = radius * value01;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      angle,
    };
  };

  const buildPolygon = (scores: AxisScores) =>
    AXIS_ORDER.map((k, idx) => {
      const p = pointAt(idx, Math.max(0.08, scores[k] / 100));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[330px]"
        role="img"
        aria-label={t.results.radarTitle}
      >
        {/* Concentric rings */}
        {[0.25, 0.5, 0.75, 1.0].map((level) => {
          const pts = AXIS_ORDER.map((_, idx) => {
            const p = pointAt(idx, level);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(' ');
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke="rgba(20, 20, 19, 0.14)"
              strokeWidth={level === 1 ? 1.4 : 1}
              strokeDasharray={level < 1 ? '3 3' : undefined}
            />
          );
        })}

        {/* Axis spokes & labels */}
        {AXIS_ORDER.map((key, idx) => {
          const edge = pointAt(idx, 1.0);
          const labelPos = pointAt(idx, 1.24);
          const anchor =
            Math.abs(Math.cos(edge.angle)) < 0.2
              ? 'middle'
              : Math.cos(edge.angle) > 0
                ? 'start'
                : 'end';

          return (
            <g key={key}>
              <line
                x1={cx}
                y1={cy}
                x2={edge.x}
                y2={edge.y}
                stroke="rgba(20, 20, 19, 0.16)"
                strokeWidth="1"
              />
              <text
                x={labelPos.x}
                y={labelPos.y + 4}
                textAnchor={anchor}
                className="fill-[#141413] text-[11px] font-bold"
              >
                {t.axes[key].short}
              </text>
            </g>
          );
        })}

        {/* Secondary polygon (Friend target) */}
        {secondary && (
          <polygon
            points={buildPolygon(secondary)}
            fill="rgba(29, 78, 216, 0.14)"
            stroke="#1D4ED8"
            strokeWidth="2.2"
            strokeDasharray="6 4"
          />
        )}

        {/* Primary polygon (User) */}
        <polygon
          points={buildPolygon(primary)}
          fill="rgba(255, 59, 31, 0.20)"
          stroke="#FF3B1F"
          strokeWidth="2.5"
        />

        {/* Vertex dots */}
        {AXIS_ORDER.map((key, idx) => {
          const p = pointAt(idx, Math.max(0.08, primary[key] / 100));
          return (
            <circle
              key={key}
              cx={p.x}
              cy={p.y}
              r="3.8"
              fill="#FF3B1F"
              stroke="#141413"
              strokeWidth="1.2"
            />
          );
        })}
      </svg>

      {secondary && (
        <div className="mt-2 flex items-center gap-4 font-mono-num text-xs font-bold">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-[#141413] bg-[#FF3B1F]" />
            {primaryLabel ?? t.results.syncYou}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-[#141413] bg-[#1D4ED8]" />
            {secondaryLabel ?? t.results.syncFriend}
          </span>
        </div>
      )}
    </div>
  );
}
