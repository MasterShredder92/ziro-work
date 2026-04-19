import {
  colorFor,
  collectLabels,
  maxY,
  type Series,
} from "./shared";

export type LineChartProps = {
  series: Series[];
  height?: number;
  title?: string;
  showAxis?: boolean;
};

export function LineChart({
  series,
  height = 240,
  title,
  showAxis = true,
}: LineChartProps) {
  if (!series.length) return <EmptyChart height={height} />;
  const labels = collectLabels(series);
  const max = maxY(series);
  const width = 600;
  const padding = { top: 12, right: 16, bottom: 28, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const step = innerW / Math.max(1, labels.length - 1);

  return (
    <div>
      {title ? <ChartTitle title={title} /> : null}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {showAxis ? <Grid innerW={innerW} innerH={innerH} padding={padding} /> : null}
        {series.map((s, i) => {
          const points = labels
            .map((label, idx) => {
              const p = s.data.find((pt) => String(pt.x) === label);
              const y = p ? (p.y / max) * innerH : 0;
              return `${padding.left + idx * step},${padding.top + innerH - y}`;
            })
            .join(" ");
          return (
            <g key={s.id}>
              <polyline
                fill="none"
                stroke={colorFor(i)}
                strokeWidth={2}
                points={points}
              />
              {s.data.map((p, idx) => {
                const labelIdx = labels.indexOf(String(p.x));
                if (labelIdx < 0) return null;
                const y = (p.y / max) * innerH;
                return (
                  <circle
                    key={idx}
                    cx={padding.left + labelIdx * step}
                    cy={padding.top + innerH - y}
                    r={3}
                    fill={colorFor(i)}
                  />
                );
              })}
            </g>
          );
        })}
        {labels.map((label, i) => (
          <text
            key={label}
            x={padding.left + i * step}
            y={height - 8}
            fill="currentColor"
            fontSize={10}
            textAnchor="middle"
            className="text-[var(--z-muted)]"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function Grid({
  innerW,
  innerH,
  padding,
}: {
  innerW: number;
  innerH: number;
  padding: { top: number; right: number; bottom: number; left: number };
}) {
  const rows = 4;
  return (
    <g className="text-[var(--z-border)]">
      {Array.from({ length: rows + 1 }).map((_, i) => {
        const y = padding.top + (innerH / rows) * i;
        return (
          <line
            key={i}
            x1={padding.left}
            y1={y}
            x2={padding.left + innerW}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.35}
          />
        );
      })}
    </g>
  );
}

function ChartTitle({ title }: { title: string }) {
  return <div className="mb-2 text-xs font-semibold text-[var(--z-fg)]">{title}</div>;
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-xs text-[var(--z-muted)]"
      style={{ minHeight: height }}
    >
      No data.
    </div>
  );
}
