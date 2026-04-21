import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatTs(iso) {
    if (!iso)
        return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return "—";
    return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    });
}
function StepPill({ status }) {
    const s = status.toLowerCase();
    let cn = "border-[var(--z-border)] bg-white/5 text-[var(--z-muted)]";
    if (s === "succeeded")
        cn = "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    else if (s === "failed")
        cn = "border-rose-500/30 bg-rose-500/15 text-rose-300";
    else if (s === "running")
        cn = "border-sky-500/30 bg-sky-500/15 text-sky-300";
    else if (s === "skipped")
        cn = "border-amber-500/30 bg-amber-500/15 text-amber-300";
    return (_jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cn}`, children: status }));
}
export function RunTimeline({ run, logs }) {
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)] mb-3 font-semibold", children: ["Steps (", run.steps.length, ")"] }), run.steps.length === 0 ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] italic", children: "No steps recorded yet." })) : (_jsx("ol", { className: "space-y-2", children: run.steps.map((step, i) => (_jsxs("li", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] p-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-[10px] font-mono text-[var(--z-muted)]", children: ["#", i + 1] }), _jsx(StepPill, { status: step.status }), _jsx("span", { className: "text-sm font-medium text-[var(--z-fg)]", children: step.type })] }), _jsx("div", { className: "mt-1 text-[11px] text-[var(--z-muted)] font-mono", children: step.actionId }), step.error ? (_jsx("div", { className: "mt-2 text-xs text-rose-300", children: step.error.message })) : null] }), _jsxs("div", { className: "text-right text-[10px] text-[var(--z-muted)] shrink-0", children: [_jsx("div", { children: formatTs(step.startedAt) }), typeof step.durationMs === "number" ? (_jsxs("div", { children: [step.durationMs, "ms"] })) : null] })] }), step.output ? (_jsxs("details", { className: "mt-2", children: [_jsx("summary", { className: "cursor-pointer text-[11px] text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "Output" }), _jsx("pre", { className: "mt-1 whitespace-pre-wrap break-all rounded bg-black/30 p-2 text-[11px] text-[var(--z-fg)]/80", children: JSON.stringify(step.output, null, 2) })] })) : null] }, `${step.actionId}-${i}`))) }))] }), _jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)] mb-3 font-semibold", children: ["Logs (", logs.length, ")"] }), logs.length === 0 ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] italic", children: "No logs." })) : (_jsx("ol", { className: "space-y-1 font-mono text-[11px]", children: logs.map((log) => (_jsxs("li", { className: "flex items-start gap-2 rounded px-2 py-1 hover:bg-white/5", children: [_jsx("span", { className: "shrink-0 text-[var(--z-muted)]", children: formatTs(log.created_at) }), _jsx("span", { className: `shrink-0 uppercase ${log.level === "error"
                                        ? "text-rose-300"
                                        : log.level === "warn"
                                            ? "text-amber-300"
                                            : "text-[var(--z-muted)]"}`, children: log.level }), _jsx("span", { className: "text-[var(--z-fg)] break-all", children: log.message })] }, log.id))) }))] }), run.payload && Object.keys(run.payload).length > 0 ? (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)] mb-3 font-semibold", children: "Payload" }), _jsx("pre", { className: "whitespace-pre-wrap break-all rounded bg-black/30 p-3 text-[11px] text-[var(--z-fg)]/80", children: JSON.stringify(run.payload, null, 2) })] })) : null] }));
}
