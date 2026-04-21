import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/components/ui/utils/cn";
const TIER_LABELS = {
    hot: "Hot",
    warm: "Warm",
    cold: "Cold",
};
const TIER_TONES = {
    hot: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    warm: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    cold: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};
const ACTION_LABELS = {
    promote_to_student: "Promote to student",
    schedule_followup: "Schedule a follow-up",
    nurture: "Add to nurture sequence",
    needs_info: "Collect missing info",
};
function SignalRow({ label, active, detail, }) {
    return (_jsxs("li", { className: "flex items-center justify-between gap-2 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-xs", children: [_jsx("span", { className: "text-[var(--z-fg)]", children: label }), _jsx("span", { className: cn("font-semibold uppercase tracking-wider", active ? "text-emerald-300" : "text-[var(--z-muted)]"), children: active ? "yes" : detail !== null && detail !== void 0 ? detail : "no" })] }));
}
export function LeadQualificationCard({ qualification, }) {
    const { score, tier, signals, recommendedAction, reasons } = qualification;
    return (_jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4", children: [_jsxs("header", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Qualification" }), _jsx("h3", { className: "text-base font-semibold text-[var(--z-fg)]", children: ACTION_LABELS[recommendedAction] })] }), _jsxs("span", { className: cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider", TIER_TONES[tier]), children: [TIER_LABELS[tier], _jsx("span", { className: "rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] text-white", children: score })] })] }), _jsx("div", { className: "h-1.5 rounded-full bg-white/5 overflow-hidden", children: _jsx("div", { className: cn("h-full transition-all", tier === "hot"
                        ? "bg-rose-400"
                        : tier === "warm"
                            ? "bg-amber-400"
                            : "bg-sky-400"), style: { width: `${Math.min(100, Math.max(0, score))}%` } }) }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-2", children: "Signals" }), _jsxs("ul", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: [_jsx(SignalRow, { label: "Email on file", active: signals.hasEmail }), _jsx(SignalRow, { label: "Phone on file", active: signals.hasPhone }), _jsx(SignalRow, { label: "Name captured", active: signals.hasName }), _jsx(SignalRow, { label: "Instrument", active: signals.hasInstrument }), _jsx(SignalRow, { label: "Goals", active: signals.hasGoals }), _jsx(SignalRow, { label: "Preferred times", active: signals.hasPreferredTimes }), _jsx(SignalRow, { label: "Recent contact", active: signals.respondedRecently }), _jsx(SignalRow, { label: "Conversations", active: signals.engagedConversations > 0, detail: String(signals.engagedConversations) })] })] }), reasons.length > 0 ? (_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-2", children: "Why not higher" }), _jsx("ul", { className: "space-y-1 text-xs text-[var(--z-muted)]", children: reasons.map((r, i) => (_jsxs("li", { className: "flex gap-2", children: [_jsx("span", { className: "text-[var(--z-fg)]/60", children: "\u00B7" }), _jsx("span", { children: r })] }, `${r}-${i}`))) })] })) : null] }));
}
