import { colorFor, type Series } from "./shared";

export type PieChartProps = {
  series: Series;
  size?: number;
  title?: string;
  donut?: boolean;
  innerRadius?: number;
};

export function PieChart({
  series,
  size = 240,
  title,
  donut = false,
  innerRadius = 60,
}: PieChartProps) {
  const total = series?.data?.reduce((sum, p) => sum + (p.y || 0), 0) ?? 0;
  if (!series || total <= 0) {
    return (
      <div
        className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-xs text-[var(--z-muted)]"
        style={{ minHeight: size }}
      >
        No data.
      </div>
    );
  }
  const radius = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  const cumulative: number[] = [];
  series.data.reduce((acc, p) => {
    cumulative.push(acc);
    return acc + (p.y || 0);
  }, 0);
  const slices = series.data.map((p, idx) => {
    const prev = cumulative[idx] ?? 0;
    const next = prev + (p.y || 0);
    const startAngle = (prev / total) * 2 * Math.PI;
    const endAngle = (next / total) * 2 * Math.PI;
    const x1 = cx + radius * Math.sin(startAngle);
    const y1 = cy - radius * Math.cos(startAngle);
    const x2 = cx + radius * Math.sin(endAngle);
    const y2 = cy - radius * Math.cos(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const d = donut
      ? buildDonutPath(cx, cy, radius, innerRadius, startAngle, endAngle, largeArc)
      : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return {
      d,
      color: colorFor(idx),
      label: String(p.x),
      value: p.y,
    };
  });

  return (
    <div>
      {title ? (
        <div className="mb-2 text-xs font-semibold text-[var(--z-fg)]">
          {title}
        </div>
      ) : null}
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto" style={{ maxHeight: size }}>
        {slices.map((s, idx) => (
          <path
            key={idx}
            d={s.d}
            fill={s.color}
            stroke="#0b0b0d"
            strokeWidth={1}
          />
        ))}
        {donut ? (
          <text
            x={cx}
            y={cy + 4}
            fill="currentColor"
            textAnchor="middle"
            fontSize={14}
            className="font-semibold text-[var(--z-fg)]"
          >
            {total}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

export function DonutChart(props: Omit<PieChartProps, "donut">) {
  return <PieChart {...props} donut />;
}

function buildDonutPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
  largeArc: number,
): string {
  const ox1 = cx + outerR * Math.sin(startAngle);
  const oy1 = cy - outerR * Math.cos(startAngle);
  const ox2 = cx + outerR * Math.sin(endAngle);
  const oy2 = cy - outerR * Math.cos(endAngle);
  const ix1 = cx + innerR * Math.sin(endAngle);
  const iy1 = cy - innerR * Math.cos(endAngle);
  const ix2 = cx + innerR * Math.sin(startAngle);
  const iy2 = cy - innerR * Math.cos(startAngle);
  return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
}
