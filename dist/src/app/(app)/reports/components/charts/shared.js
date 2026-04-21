export const SERIES_COLORS = [
    "#00ff88",
    "#00b0ff",
    "#f59e0b",
    "#ef4444",
    "#a855f7",
    "#14b8a6",
    "#f472b6",
    "#eab308",
];
export function collectLabels(series) {
    const set = new Set();
    for (const s of series)
        for (const p of s.data)
            set.add(String(p.x));
    return Array.from(set);
}
export function maxY(series) {
    let m = 0;
    for (const s of series) {
        for (const p of s.data) {
            if (p.y > m)
                m = p.y;
        }
    }
    return m || 1;
}
export function colorFor(i) {
    return SERIES_COLORS[i % SERIES_COLORS.length];
}
export function formatNumber(value) {
    if (!Number.isFinite(value))
        return "—";
    if (Math.abs(value) >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
    }
    return String(Math.round(value * 100) / 100);
}
