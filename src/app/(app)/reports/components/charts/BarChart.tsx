import { colorFor, collectLabels, maxY, type Series } from "./shared";

export type BarChartProps = {
  series: Series[];
  height?: number;
  title?: string;
  stacked?: boolean;
};

export function BarChart({
  series,
  height = 240,
  title,
  stacked = false,
}: BarChartProps) {
  if (!series.length) return <Empty height={height} />;
  const labels = collectLabels(series);
  const width = 600;
  const padding = { top: 12, right: 16, bottom: 28, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const groupWidth = innerW / Math.max(1, labels.length);

  const max = stacked
    ? Math.max(
        1,
        ...labels.map((label) =>
          series.reduce(
            (sum, s) => sum + (s.data.find((p) => String(p.x) === label)?.y ?? 0),
            0,
          ),
        ),
      )
    : maxY(series);

  const barWidth = stacked
    ? Math.max(4, groupWidth - 8)
    : Math.max(2, groupWidth / Math.max(1, series.length) - 4);

  return (
    <div>
      {title ? (
        <div className="mb-2 text-xs font-semibold text-[var(--z-fg)]">
          {title}
        </div>
      ) : null}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {labels.map((label, i) => {
          const groupX = padding.left + i * groupWidth;
          if (stacked) {
            let offset = 0;
            return (
              <g key={label}>
                {series.map((s, sIdx) => {
                  const point = s.data.find((p) => String(p.x) === label);
                  const val = point?.y ?? 0;
                  const h = (val / max) * innerH;
                  const y = padding.top + innerH - offset - h;
                  offset += h;
                  return (
                    <rect
                      key={s.id}
                      x={groupX + (groupWidth - barWidth) / 2}
                      y={y}
                      width={barWidth}
                      height={h}
                      fill={colorFor(sIdx)}
                    />
                  );
                })}
                <text
                  x={groupX + groupWidth / 2}
                  y={height - 8}
                  fill="currentColor"
                  fontSize={10}
                  textAnchor="middle"
                  className="text-[var(--z-muted)]"
                >
                  {label}
                </text>
              </g>
            );
          }
          return (
            <g key={label}>
              {series.map((s, sIdx) => {
                const point = s.data.find((p) => String(p.x) === label);
                const val = point?.y ?? 0;
                const h = (val / max) * innerH;
                const x =
                  groupX +
                  sIdx * (barWidth + 4) +
                  (groupWidth - series.length * (barWidth + 4)) / 2;
                return (
                  <rect
                    key={s.id}
                    x={x}
                    y={padding.top + innerH - h}
                    width={barWidth}
                    height={h}
                    fill={colorFor(sIdx)}
                    rx={2}
                  />
                );
              })}
              <text
                x={groupX + groupWidth / 2}
                y={height - 8}
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
    </div>
  );
}

function Empty({ height }: { height: number }) {
  return (
    <div
      className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-xs text-[var(--z-muted)]"
      style={{ minHeight: height }}
    >
      No data.
    </div>
  );
}
