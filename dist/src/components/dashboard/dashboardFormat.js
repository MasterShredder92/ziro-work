export function formatUsdFromCents(cents) {
    const safe = Number.isFinite(cents) ? cents : 0;
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(safe / 100);
}
export function formatShortNumber(n) {
    if (!Number.isFinite(n))
        return "0";
    if (Math.abs(n) >= 1000000)
        return `${(n / 1000000).toFixed(1)}M`;
    if (Math.abs(n) >= 1000)
        return `${(n / 1000).toFixed(1)}k`;
    return String(Math.round(n));
}
export function startOfUtcMonth(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}
export function daysAgoIso(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}
