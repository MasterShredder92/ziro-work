import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
function formatWhen(iso) {
    if (!iso)
        return "–";
    try {
        return new Date(iso).toLocaleString();
    }
    catch (_a) {
        return iso;
    }
}
function formatDuration(ms) {
    if (ms == null)
        return "–";
    const seconds = Math.round(ms / 1000);
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return `${minutes}m ${rem}s`;
}
export function SubmissionList({ submissions }) {
    if (submissions.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center text-sm text-[var(--z-muted)]", children: "No submissions yet." }));
    }
    return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)] text-left", children: [_jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)]", children: "Submitted" }), _jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)]", children: "Status" }), _jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)]", children: "Profile" }), _jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)] text-right", children: "Duration" }), _jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)] text-right" })] }) }), _jsx("tbody", { children: submissions.map((s) => {
                        var _a, _b, _c;
                        return (_jsxs("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/[0.02]", children: [_jsx("td", { className: "px-4 py-2 text-[var(--z-fg)]", children: formatWhen((_a = s.completedAt) !== null && _a !== void 0 ? _a : s.startedAt) }), _jsx("td", { className: "px-4 py-2 capitalize text-[var(--z-muted)]", children: s.status }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)] font-mono text-xs", children: (_c = (_b = s.profileId) !== null && _b !== void 0 ? _b : s.submittedBy) !== null && _c !== void 0 ? _c : "anonymous" }), _jsx("td", { className: "px-4 py-2 text-right text-[var(--z-muted)]", children: formatDuration(s.durationMs) }), _jsx("td", { className: "px-4 py-2 text-right", children: _jsx(Link, { href: `/forms/submission/${s.id}`, className: "text-xs text-[#00ff88] hover:text-[#00e679]", children: "View" }) })] }, s.id));
                    }) })] }) }));
}
