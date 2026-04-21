import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { cn } from "@/components/ui/utils/cn";
function formatDate(value) {
    if (!value)
        return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
        return "—";
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
function leadName(lead) {
    var _a, _b, _c, _d;
    const first = (_a = lead.first_name) !== null && _a !== void 0 ? _a : "";
    const last = (_b = lead.last_name) !== null && _b !== void 0 ? _b : "";
    const parent = (_c = lead.parent_name) !== null && _c !== void 0 ? _c : "";
    const fallback = (_d = lead.student_name) !== null && _d !== void 0 ? _d : "";
    return `${first} ${last}`.trim() || parent || fallback || "Unnamed";
}
function StageBadge({ stage }) {
    const label = stage !== null && stage !== void 0 ? stage : "new";
    const tone = label === "enrolled" || label === "converted"
        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
        : label === "lost"
            ? "bg-red-500/15 text-red-300 border-red-500/30"
            : label === "trial"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
    return (_jsx("span", { className: cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", tone), children: label }));
}
function TierBadge({ tier, }) {
    const label = tier !== null && tier !== void 0 ? tier : "—";
    const tone = tier === "hot"
        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
        : tier === "warm"
            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
            : tier === "cold"
                ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
    return (_jsx("span", { className: cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em]", tone), children: label }));
}
export function LeadTable({ leads, basePath = "/leads", maxRows = 200, emptyMessage = "No leads yet.", }) {
    const rows = leads.slice(0, maxRows);
    if (rows.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center text-sm text-[var(--z-muted)]", children: emptyMessage }));
    }
    return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-[color-mix(in_oklab,var(--z-surface),white_2%)] text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2.5 text-left font-semibold", children: "Lead" }), _jsx("th", { className: "px-4 py-2.5 text-left font-semibold", children: "Instrument" }), _jsx("th", { className: "px-4 py-2.5 text-left font-semibold", children: "Source" }), _jsx("th", { className: "px-4 py-2.5 text-left font-semibold", children: "Stage" }), _jsx("th", { className: "px-4 py-2.5 text-left font-semibold", children: "Tier" }), _jsx("th", { className: "px-4 py-2.5 text-right font-semibold", children: "Score" }), _jsx("th", { className: "px-4 py-2.5 text-right font-semibold", children: "Age" }), _jsx("th", { className: "px-4 py-2.5 text-right font-semibold", children: "Created" })] }) }), _jsx("tbody", { children: rows.map((lead) => {
                            var _a, _b, _c, _d, _e, _f, _g, _h;
                            const row = lead;
                            const email = (_a = row.email) !== null && _a !== void 0 ? _a : null;
                            const phone = (_b = row.phone) !== null && _b !== void 0 ? _b : null;
                            const instrument = (_c = row.instrument) !== null && _c !== void 0 ? _c : null;
                            const source = (_e = (_d = row.source) !== null && _d !== void 0 ? _d : row.how_heard) !== null && _e !== void 0 ? _e : "—";
                            return (_jsxs("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/[0.02] transition-colors", children: [_jsx("td", { className: "px-4 py-3 min-w-[220px]", children: _jsxs(Link, { href: `${basePath}/${lead.id}`, className: "block min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-[var(--z-fg)] truncate", children: leadName(lead) }), _jsx("div", { className: "text-xs text-[var(--z-muted)] truncate", children: (_f = email !== null && email !== void 0 ? email : phone) !== null && _f !== void 0 ? _f : "—" })] }) }), _jsx("td", { className: "px-4 py-3 text-[var(--z-fg)]", children: instrument !== null && instrument !== void 0 ? instrument : "—" }), _jsx("td", { className: "px-4 py-3 text-[var(--z-fg)]", children: source }), _jsx("td", { className: "px-4 py-3", children: _jsx(StageBadge, { stage: (_g = lead.stage) !== null && _g !== void 0 ? _g : null }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(TierBadge, { tier: lead.qualification_tier }) }), _jsx("td", { className: "px-4 py-3 text-right text-[var(--z-fg)]", children: (_h = lead.qualification_score) !== null && _h !== void 0 ? _h : "—" }), _jsxs("td", { className: "px-4 py-3 text-right text-[var(--z-muted)]", children: [lead.age_days, "d"] }), _jsx("td", { className: "px-4 py-3 text-right text-[var(--z-muted)]", children: formatDate(lead.created_at) })] }, lead.id));
                        }) })] }) }) }));
}
