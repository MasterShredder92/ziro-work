"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
const STATUS_COLOR = {
    ok: "#00ff88",
    degraded: "#f4c430",
    down: "#ff5566",
};
export function SystemView({ activeJobs, recentJobs, deadLetter, health }) {
    const [tab, setTab] = useState("active");
    const [requeuing, setRequeuing] = useState(null);
    const summary = useMemo(() => ({
        active: activeJobs.length,
        recent: recentJobs.length,
        dead: deadLetter.length,
    }), [activeJobs, recentJobs, deadLetter]);
    async function requeue(id) {
        setRequeuing(id);
        try {
            const res = await fetch(`/admin/api/system/dead-letter/${id}/requeue`, { method: "POST" });
            if (res.ok)
                window.location.reload();
        }
        finally {
            setRequeuing(null);
        }
    }
    return (_jsxs("div", { className: "p-6 space-y-8", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-2xl font-extrabold text-[#f0f0f0] mb-1", children: "System health" }), _jsx("p", { className: "text-sm text-[#8a8a92]", children: "Background jobs, dead-letter queue, and health checks for this environment." })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[#606068] mb-3", children: "Health" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3", children: health.checks.map((c) => (_jsxs("div", { className: "rounded-lg border border-[#202026] bg-[#0d0d10] p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-sm text-[#d4d4d4] font-medium capitalize", children: c.name.replace(/_/g, " ") }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", style: { color: STATUS_COLOR[c.status] }, children: c.status })] }), _jsxs("div", { className: "text-xs text-[#606068] mt-2", children: [c.latencyMs, "ms"] }), c.message ? (_jsx("div", { className: "text-[11px] text-[#80808a] mt-1 truncate", title: c.message, children: c.message })) : null] }, c.name))) })] }), _jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsxs(TabButton, { active: tab === "active", onClick: () => setTab("active"), children: ["Active \u00B7 ", summary.active] }), _jsxs(TabButton, { active: tab === "recent", onClick: () => setTab("recent"), children: ["Recent \u00B7 ", summary.recent] }), _jsxs(TabButton, { active: tab === "dead", onClick: () => setTab("dead"), children: ["Dead-letter \u00B7 ", summary.dead] })] }), tab === "active" ? _jsx(JobTable, { jobs: activeJobs, empty: "No active jobs." }) : null, tab === "recent" ? _jsx(JobTable, { jobs: recentJobs, empty: "No recent jobs." }) : null, tab === "dead" ? (_jsx(DeadLetterTable, { rows: deadLetter, requeuing: requeuing, onRequeue: requeue })) : null] })] }));
}
function TabButton({ active, onClick, children, }) {
    return (_jsx("button", { type: "button", onClick: onClick, className: `px-3 py-1.5 rounded-md text-xs font-semibold border ${active
            ? "bg-[#1a1a1f] text-[#f0f0f0] border-[#2a2a30]"
            : "bg-transparent text-[#8a8a92] border-transparent hover:text-[#d4d4d4]"}`, children: children }));
}
function JobTable({ jobs, empty }) {
    if (jobs.length === 0) {
        return _jsx("div", { className: "text-sm text-[#606068] italic py-6", children: empty });
    }
    return (_jsx("div", { className: "overflow-x-auto rounded-lg border border-[#202026]", children: _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { className: "text-[10px] uppercase text-[#606068] bg-[#0d0d10]", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-3 py-2", children: "Kind" }), _jsx("th", { className: "text-left px-3 py-2", children: "Status" }), _jsx("th", { className: "text-left px-3 py-2", children: "Attempts" }), _jsx("th", { className: "text-left px-3 py-2", children: "Run at" }), _jsx("th", { className: "text-left px-3 py-2", children: "Updated" }), _jsx("th", { className: "text-left px-3 py-2", children: "Last error" })] }) }), _jsx("tbody", { children: jobs.map((j) => {
                        var _a, _b;
                        return (_jsxs("tr", { className: "border-t border-[#1a1a1f]", children: [_jsx("td", { className: "px-3 py-2 font-mono text-[#d4d4d4]", children: j.kind }), _jsx("td", { className: "px-3 py-2", children: j.status }), _jsxs("td", { className: "px-3 py-2", children: [j.attempts, "/", j.maxAttempts] }), _jsx("td", { className: "px-3 py-2 text-[#80808a]", children: fmt(j.runAt) }), _jsx("td", { className: "px-3 py-2 text-[#80808a]", children: fmt(j.updatedAt) }), _jsx("td", { className: "px-3 py-2 text-[#ff8899] max-w-[24rem] truncate", title: (_a = j.lastError) !== null && _a !== void 0 ? _a : "", children: (_b = j.lastError) !== null && _b !== void 0 ? _b : "" })] }, j.id));
                    }) })] }) }));
}
function DeadLetterTable({ rows, requeuing, onRequeue, }) {
    if (rows.length === 0) {
        return _jsx("div", { className: "text-sm text-[#606068] italic py-6", children: "No dead-letter jobs." });
    }
    return (_jsx("div", { className: "overflow-x-auto rounded-lg border border-[#202026]", children: _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { className: "text-[10px] uppercase text-[#606068] bg-[#0d0d10]", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-3 py-2", children: "Kind" }), _jsx("th", { className: "text-left px-3 py-2", children: "Attempts" }), _jsx("th", { className: "text-left px-3 py-2", children: "Failed at" }), _jsx("th", { className: "text-left px-3 py-2", children: "Error" }), _jsx("th", { className: "text-right px-3 py-2" })] }) }), _jsx("tbody", { children: rows.map((r) => {
                        var _a, _b;
                        return (_jsxs("tr", { className: "border-t border-[#1a1a1f]", children: [_jsx("td", { className: "px-3 py-2 font-mono text-[#d4d4d4]", children: r.kind }), _jsx("td", { className: "px-3 py-2", children: r.attempts }), _jsx("td", { className: "px-3 py-2 text-[#80808a]", children: fmt(r.failedAt) }), _jsx("td", { className: "px-3 py-2 text-[#ff8899] max-w-[24rem] truncate", title: (_a = r.lastError) !== null && _a !== void 0 ? _a : "", children: (_b = r.lastError) !== null && _b !== void 0 ? _b : "" }), _jsx("td", { className: "px-3 py-2 text-right", children: _jsx("button", { type: "button", disabled: requeuing === r.id, onClick: () => onRequeue(r.id), className: "text-[11px] px-2 py-1 rounded bg-[#1a1a1f] border border-[#2a2a30] text-[#d4d4d4] disabled:opacity-50", children: requeuing === r.id ? "Requeuing…" : "Requeue" }) })] }, r.id));
                    }) })] }) }));
}
function fmt(iso) {
    try {
        return new Date(iso).toLocaleString();
    }
    catch (_a) {
        return iso;
    }
}
