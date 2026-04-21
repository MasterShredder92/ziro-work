"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
/** Matches `Database["public"]["Enums"]["lead_stage"]` — keep in sync with `leads/page.tsx` grouping. */
export const LEAD_KANBAN_STAGES = [
    "inquiry",
    "contacted",
    "scheduled",
    "enrolled",
    "lost",
];
const STAGES = LEAD_KANBAN_STAGES;
function leadIdleDays(l) {
    var _a;
    const row = l;
    const iso = (_a = row.updated_at) !== null && _a !== void 0 ? _a : row.created_at;
    if (!iso)
        return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t))
        return null;
    return Math.floor((Date.now() - t) / 86400000);
}
export function LeadKanbanBoard({ grouped: initial, }) {
    const router = useRouter();
    const [grouped, setGrouped] = useState(initial);
    const [busyId, setBusyId] = useState(null);
    const [err, setErr] = useState(null);
    async function patchStage(leadId, stage) {
        var _a;
        setBusyId(leadId);
        setErr(null);
        try {
            const res = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ stage }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((_a = body.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            }
            setGrouped((prev) => {
                var _a;
                let moved;
                const next = {};
                for (const s of STAGES)
                    next[s] = [];
                for (const s of STAGES) {
                    for (const l of (_a = prev[s]) !== null && _a !== void 0 ? _a : []) {
                        if (l.id === leadId) {
                            moved = Object.assign(Object.assign({}, l), { stage });
                        }
                        else {
                            next[s].push(l);
                        }
                    }
                }
                if (moved) {
                    next[stage].push(moved);
                }
                return next;
            });
            router.refresh();
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusyId(null);
        }
    }
    async function convertLead(leadId) {
        var _a, _b;
        setBusyId(leadId);
        setErr(null);
        try {
            const res = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}/convert`, { method: "POST" });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((_a = body.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            }
            const json = (await res.json());
            const sid = (_b = json.data) === null || _b === void 0 ? void 0 : _b.studentId;
            router.refresh();
            if (sid) {
                router.push(`/crm/students/${encodeURIComponent(sid)}`);
            }
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusyId(null);
        }
    }
    async function scheduleFollowup(leadId) {
        var _a;
        const when = window.prompt("Follow-up time (ISO date/time, e.g. 2026-04-20T15:00:00)");
        if (!(when === null || when === void 0 ? void 0 : when.trim()))
            return;
        setBusyId(leadId);
        setErr(null);
        try {
            const res = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}/followup`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ when: when.trim() }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((_a = body.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            }
            router.refresh();
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusyId(null);
        }
    }
    const totalLeads = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    return (_jsxs("div", { children: [_jsx(AgentPageBar, { agentId: "star", chatPlaceholder: "Ask STAR about your leads\u2026", pageContext: { page: "leads", totalLeads, stages: LEAD_KANBAN_STAGES } }), err ? (_jsx("div", { className: "mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300", children: err })) : null, _jsx("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6", children: STAGES.map((s) => {
                    var _a, _b, _c;
                    return (_jsxs("div", { className: "flex min-h-[220px] flex-col rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)]", children: [_jsxs("div", { className: "border-b border-[var(--z-border,#1c1c1e)] p-3", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]", children: s }), _jsxs("div", { className: "mt-0.5 text-xs text-[var(--z-muted,#909098)]", children: [(_b = (_a = grouped[s]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0, " leads"] })] }), _jsx("ul", { className: "flex-1 space-y-2 overflow-y-auto p-2", children: ((_c = grouped[s]) !== null && _c !== void 0 ? _c : []).map((l) => {
                                    var _a, _b, _c, _d, _e;
                                    return (_jsxs("li", { className: "flex flex-col gap-2 rounded-md border border-[#14141a] bg-black p-2 text-xs", children: [_jsxs(Link, { href: `/crm/contacts/${encodeURIComponent(`lead:${l.id}`)}`, className: "font-semibold text-[var(--z-fg,#f0f0f0)] hover:text-[var(--z-accent,#00ff88)]", children: [l.first_name, " ", (_a = l.last_name) !== null && _a !== void 0 ? _a : ""] }), _jsxs("div", { className: "text-[11px] text-[#707078]", children: [(_b = l.email) !== null && _b !== void 0 ? _b : "—", " \u00B7 ", (_c = l.phone) !== null && _c !== void 0 ? _c : "—"] }), l.instrument ? (_jsx("div", { className: "text-[11px] text-[var(--z-muted,#909098)]", children: l.instrument })) : null, (() => {
                                                const days = leadIdleDays(l);
                                                if (days == null)
                                                    return null;
                                                const tone = days >= 14 ? "hot" : days >= 7 ? "warn" : "muted";
                                                const cls = tone === "hot"
                                                    ? "border-red-500/40 bg-red-500/15 text-red-200"
                                                    : tone === "warn"
                                                        ? "border-amber-500/40 bg-amber-500/15 text-amber-100"
                                                        : "border-[var(--z-border,#1c1c1e)] bg-white/[0.04] text-[#909098]";
                                                return (_jsx("div", { className: `inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`, title: "Days since last update on this lead", children: days === 0 ? "Updated today" : `${days}d since update` }));
                                            })(), _jsxs("label", { className: "flex flex-col gap-1 text-[10px] uppercase tracking-wider text-[#606068]", children: ["Stage", _jsx("select", { className: "rounded border border-[#1c1c1e] bg-[#0a0a0c] px-1 py-1 text-[11px] text-[#f0f0f0]", value: STAGES.includes((_d = l.stage) !== null && _d !== void 0 ? _d : STAGES[0])
                                                            ? ((_e = l.stage) !== null && _e !== void 0 ? _e : STAGES[0])
                                                            : STAGES[0], disabled: busyId === l.id, onChange: (e) => patchStage(l.id, e.target.value), children: STAGES.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) })] }), _jsxs("div", { className: "flex flex-wrap gap-1", children: [_jsx("button", { type: "button", disabled: busyId === l.id, onClick: () => convertLead(l.id), className: "rounded bg-[var(--z-accent,#00ff88)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/25 disabled:opacity-50", children: "Convert" }), _jsx("button", { type: "button", disabled: busyId === l.id, onClick: () => scheduleFollowup(l.id), className: "rounded border border-[var(--z-border,#1c1c1e)] px-2 py-0.5 text-[10px] text-[var(--z-muted,#909098)] hover:bg-white/5 disabled:opacity-50", children: "Follow-up" })] })] }, l.id));
                                }) })] }, s));
                }) })] }));
}
