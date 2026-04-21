import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ExportHistoryTable({ jobs, tenantId }) {
    if (jobs.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center text-sm text-[var(--z-muted)]", children: "No export jobs yet." }));
    }
    return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-left text-xs", children: [_jsx("thead", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2", children: "Filename" }), _jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2", children: "Format" }), _jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2", children: "Status" }), _jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2", children: "Size" }), _jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2", children: "Created" }), _jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2", children: "Report" }), _jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2" })] }) }), _jsx("tbody", { children: jobs.map((j) => {
                        var _a;
                        return (_jsxs("tr", { className: "border-b border-[var(--z-border)] last:border-b-0", children: [_jsx("td", { className: "px-3 py-2 font-mono text-[11px] text-[var(--z-fg)]", children: j.filename }), _jsx("td", { className: "px-3 py-2 uppercase text-[var(--z-muted)]", children: j.format }), _jsx("td", { className: "px-3 py-2", children: _jsx("span", { className: `rounded-full border px-2 py-0.5 text-[10px] ${j.status === "completed"
                                            ? "border-emerald-400/40 text-emerald-300"
                                            : j.status === "failed"
                                                ? "border-rose-400/40 text-rose-300"
                                                : "border-[var(--z-border)] text-[var(--z-muted)]"}`, children: j.status }) }), _jsx("td", { className: "px-3 py-2 text-[var(--z-muted)]", children: formatSize(j.sizeBytes) }), _jsx("td", { className: "px-3 py-2 text-[var(--z-muted)]", children: new Date(j.createdAt).toLocaleString() }), _jsx("td", { className: "px-3 py-2 text-[var(--z-muted)]", children: (_a = j.reportId) !== null && _a !== void 0 ? _a : "—" }), _jsx("td", { className: "px-3 py-2", children: j.status === "completed" ? (_jsx("a", { href: `/reports/api/exports/${j.id}?tenantId=${tenantId}&download=1`, className: "rounded-md border border-[var(--z-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--z-fg)] hover:bg-white/5", children: "Download" })) : j.error ? (_jsx("span", { className: "text-[11px] text-rose-300", children: j.error })) : null })] }, j.id));
                    }) })] }) }));
}
function formatSize(bytes) {
    if (!bytes)
        return "—";
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
