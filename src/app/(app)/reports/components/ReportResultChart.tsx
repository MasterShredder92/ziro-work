import type { ReportChart } from "@/lib/reports/types";

export type ReportResultChartProps = {
  chart: ReportChart;
  height?: number;
};

const SERIES_COLORS = [
  "#00ff88",
  "#00b0ff",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
];

/**
 * Inline SVG renderer that covers bar, line, and pie charts without a
 * charting dependency. Keeps server-rendering friendly.
 */
export function ReportResultChart({ chart, height = 240 }: ReportResultChartProps) {
  if (!chart.series.length) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]">
        No chart data.
      </div>
    );
  }

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Chart
        </div>
        <div className="text-sm font-semibold text-[var(--z-fg)]">
          {chart.title ?? "Report visualization"}
        </div>
      </div>
      {chart.type === "pie" ? (
        <PieChart chart={chart} height={height} />
      ) : chart.type === "line" ? (
        <LineChart chart={chart} height={height} />
      ) : (
        <BarChart chart={chart} height={height} />
      )}
      <Legend chart={chart} />
    </div>
  );
}

function Legend({ chart }: { chart: ReportChart }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[var(--z-muted)]">
      {chart.series.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: SERIES_COLORS[idx % SERIES_COLORS.length] }}
          />
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function collectLabels(chart: ReportChart): string[] {
  const set = new Set<string>();
  for (const s of chart.series) {
    for (const p of s.data) set.add(String(p.x));
  }
  return Array.from(set);
}

function maxY(chart: ReportChart): number {
  let m = 0;
  for (const s of chart.series) {
    for (const p of s.data) {
      if (p.y > m) m = p.y;
    }
  }
  return m || 1;
}

function BarChart({ chart, height }: { chart: ReportChart; height: number }) {
  const labels = collectLabels(chart);
  const max = maxY(chart);
  const width = 600;
  const padding = { top: 8, right: 8, bottom: 24, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const groupWidth = innerW / Math.max(1, labels.length);
  const barWidth = Math.max(
    2,
    groupWidth / Math.max(1, chart.series.length) - 4,
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="none"
    >
      {labels.map((label, i) => {
        const groupX = padding.left + i * groupWidth;
        return (
          <g key={label}>
            {chart.series.map((s, sIdx) => {
              const point = s.data.find((p) => String(p.x) === label);
              const y = point ? (point.y / max) * innerH : 0;
              const x =
                groupX +
                sIdx * (barWidth + 4) +
                (groupWidth - chart.series.length * (barWidth + 4)) / 2;
              return (
                <rect
                  key={s.id}
                  x={x}
                  y={padding.top + innerH - y}
                  width={barWidth}
                  height={y}
                  fill={SERIES_COLORS[sIdx % SERIES_COLORS.length]}
                  rx={2}
                />
              );
            })}
            <text
              x={groupX + groupWidth / 2}
              y={height - 6}
              fill="currentColor"
              fontSize={10}
              textAnchor="middle"
              className="text-[var(--z-muted)]"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ chart, height }: { chart: ReportChart; height: number }) {
  const labels = collectLabels(chart);
  const max = maxY(chart);
  const width = 600;
  const padding = { top: 8, right: 8, bottom: 24, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const step = innerW / Math.max(1, labels.length - 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="none"
    >
      {chart.series.map((s, sIdx) => {
        const points = labels.map((label, i) => {
          const point = s.data.find((p) => String(p.x) === label);
          const y = point ? (point.y / max) * innerH : 0;
          return `${padding.left + i * step},${padding.top + innerH - y}`;
        });
        return (
          <polyline
            key={s.id}
            fill="none"
            stroke={SERIES_COLORS[sIdx % SERIES_COLORS.length]}
            strokeWidth={2}
            points={points.join(" ")}
          />
        );
      })}
      {labels.map((label, i) => (
        <text
          key={label}
          x={padding.left + i * step}
          y={height - 6}
          fill="currentColor"
          fontSize={10}
          textAnchor="middle"
          className="text-[var(--z-muted)]"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function PieChart({ chart, height }: { chart: ReportChart; height: number }) {
  const series = chart.series[0];
  if (!series) return null;
  const total = series.data.reduce((sum, p) => sum + (p.y || 0), 0) || 1;
  const size = Math.min(height, 240);
  const radius = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  const cumulatives = series.data.reduce<number[]>((acc, p) => {
    const prev = acc[acc.length - 1] ?? 0;
    acc.push(prev + (p.y || 0));
    return acc;
  }, []);
  const slices = series.data.map((p, idx) => {
    const prev = idx === 0 ? 0 : cumulatives[idx - 1] ?? 0;
    const curr = cumulatives[idx] ?? prev;
    const startAngle = (prev / total) * 2 * Math.PI;
    const endAngle = (curr / total) * 2 * Math.PI;
    const x1 = cx + radius * Math.sin(startAngle);
    const y1 = cy - radius * Math.cos(startAngle);
    const x2 = cx + radius * Math.sin(endAngle);
    const y2 = cy - radius * Math.cos(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const d =
      `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return {
      d,
      color: SERIES_COLORS[idx % SERIES_COLORS.length],
      label: String(p.x),
    };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto max-h-[240px]">
      {slices.map((s, idx) => (
        <path key={idx} d={s.d} fill={s.color} stroke="#0b0b0d" strokeWidth={1} />
      ))}
    </svg>
  );
}
