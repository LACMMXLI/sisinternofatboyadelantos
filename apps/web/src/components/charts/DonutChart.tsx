interface DonutSegment {
  label: string;
  value: number;
  colorVar: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel: string;
  centerSubLabel?: string;
  size?: number;
}

/**
 * Anillo de dona propio en SVG (§9: "una solución SVG propia es válida si
 * es accesible"), sin librería externa de gráficas. Usa `stroke-dasharray`
 * por segmento; el color nunca es el único portador de información (los
 * porcentajes/valores se listan aparte en CategoryBreakdown).
 */
export function DonutChart({ segments, centerLabel, centerSubLabel, size = 120 }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offsetAccumulator = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--line)" strokeWidth="14" />
        {segments.map((seg) => {
          const fraction = seg.value / total;
          const dash = fraction * circumference;
          const dashArray = `${dash} ${circumference - dash}`;
          const dashOffset = -offsetAccumulator;
          offsetAccumulator += dash;
          return (
            <circle
              key={seg.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={seg.colorVar}
              strokeWidth="14"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-sm leading-tight font-bold text-ink">{centerLabel}</p>
          {centerSubLabel ? <p className="text-[10px] text-muted">{centerSubLabel}</p> : null}
        </div>
      </div>
    </div>
  );
}
