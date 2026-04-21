export const SCHEDULING_ACCENT_HEX = "#22c55e";
export const APPOINTMENT_COLOR_SWATCHES = [
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#a855f7",
    "#f59e0b",
    "#ef4444",
];
export function normalizeSchedulingStatus(status) {
    const normalized = (status !== null && status !== void 0 ? status : "scheduled").toLowerCase();
    if (normalized === "cancelled" || normalized === "canceled" || normalized === "no_show") {
        return "canceled";
    }
    if (normalized === "completed")
        return "completed";
    if (normalized === "confirmed")
        return "confirmed";
    return "scheduled";
}
export function withAlpha(color, alphaHex = "33") {
    if (!color)
        return `${SCHEDULING_ACCENT_HEX}${alphaHex}`;
    if (/^#[0-9a-fA-F]{6}$/.test(color))
        return `${color}${alphaHex}`;
    return color;
}
export function statusBadgeClass(status) {
    const tone = normalizeSchedulingStatus(status);
    if (tone === "canceled")
        return "border-red-500/30 bg-red-500/10 text-red-300";
    if (tone === "completed")
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    if (tone === "confirmed") {
        return "border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_86%)] text-[var(--z-accent)]";
    }
    return "border-[var(--z-border)] bg-white/[0.05] text-[var(--z-fg)]";
}
export function eventCardClass(status) {
    const tone = normalizeSchedulingStatus(status);
    if (tone === "canceled")
        return "border-red-400/50 bg-red-400/5 text-red-200";
    if (tone === "completed")
        return "border-emerald-500/40 bg-emerald-500/5 text-emerald-200";
    if (tone === "confirmed") {
        return "border-[color-mix(in_oklab,var(--z-accent),transparent_50%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] text-[var(--z-accent)]";
    }
    return "border-[var(--z-border)] bg-[var(--z-surface)] text-[var(--z-fg)]";
}
