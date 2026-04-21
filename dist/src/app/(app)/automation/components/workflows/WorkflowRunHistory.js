"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export function WorkflowRunHistory({ open, workflowId, onClose, }) {
    const [runs, setRuns] = useState([]);
    const [selected, setSelected] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        if (!open || !workflowId)
            return;
        setBusy(true);
        void fetch(`/automation/api/runs?workflowId=${encodeURIComponent(workflowId)}&limit=25`)
            .then(async (res) => {
            var _a;
            if (!res.ok)
                throw new Error(`Failed to load runs (${res.status})`);
            const data = (await res.json());
            setRuns((_a = data.data) !== null && _a !== void 0 ? _a : []);
        })
            .catch(() => setRuns([]))
            .finally(() => setBusy(false));
    }, [open, workflowId]);
    const openRun = async (runId) => {
        try {
            const res = await fetch(`/automation/api/runs/${encodeURIComponent(runId)}`);
            if (!res.ok)
                throw new Error(`Failed to load run (${res.status})`);
            const data = (await res.json());
            if (data.data)
                setSelected({ run: data.data.run, logs: data.data.logs });
        }
        catch (_a) {
            setSelected(null);
        }
    };
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-[70] flex", role: "presentation", children: [_jsx("button", { type: "button", "aria-label": "Close workflow run history", className: "flex-1 bg-black/45", onClick: onClose }), _jsx("aside", { className: "h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-[32rem]", children: _jsxs("div", { className: "flex h-full flex-col", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Workflow run history" }), _jsx("button", { type: "button", onClick: onClose, className: "rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05]", children: "Close" })] }), _jsxs("div", { className: "grid min-h-0 flex-1 grid-cols-2 divide-x divide-[var(--z-border)]", children: [_jsxs("div", { className: "min-h-0 overflow-y-auto p-3", children: [busy ? _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Loading runs..." }) : null, !busy && runs.length === 0 ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "No runs yet." })) : null, _jsx("ul", { className: "space-y-1", children: runs.map((run) => (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => void openRun(run.id), className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-left text-xs text-[var(--z-fg)] hover:bg-white/[0.05]", children: [_jsx("div", { className: "font-mono", children: run.id.slice(0, 10) }), _jsxs("div", { className: "text-[10px] text-[var(--z-muted)]", children: [run.status, " \u00B7 ", new Date(run.started_at).toLocaleString()] })] }) }, run.id))) })] }), _jsx("div", { className: "min-h-0 overflow-y-auto p-3", children: !selected ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Select a run to inspect logs." })) : (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "rounded border border-[var(--z-border)] bg-[var(--z-bg)] p-2 text-xs", children: [_jsxs("div", { children: ["Status: ", selected.run.status] }), _jsxs("div", { children: ["Started: ", new Date(selected.run.started_at).toLocaleString()] }), _jsxs("div", { children: ["Finished:", " ", selected.run.finished_at
                                                                ? new Date(selected.run.finished_at).toLocaleString()
                                                                : "—"] })] }), _jsx("ul", { className: "space-y-1", children: selected.logs.map((log) => (_jsxs("li", { className: "rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-[11px]", children: [_jsxs("div", { className: "text-[10px] text-[var(--z-muted)]", children: [new Date(log.created_at).toLocaleString(), " \u00B7 ", log.level] }), _jsx("div", { className: "text-[var(--z-fg)]", children: log.message })] }, log.id))) })] })) })] })] }) })] }));
}
