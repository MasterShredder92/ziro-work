"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
const STAGES = [
    { id: "new", label: "New" },
    { id: "contacted", label: "Contacted" },
    { id: "qualified", label: "Qualified" },
    { id: "prospect", label: "Prospect" },
    { id: "enrolled", label: "Enrolled" },
    { id: "lost", label: "Lost" },
];
function groupLeadsByStage(rows) {
    var _a;
    const out = {};
    for (const s of STAGES)
        out[s.id] = [];
    for (const l of rows) {
        const stage = (_a = l.stage) !== null && _a !== void 0 ? _a : "new";
        if (!out[stage])
            out[stage] = [];
        out[stage].push(l);
    }
    return out;
}
export function LeadPipelineBoard({ leads }) {
    const router = useRouter();
    const [busy, setBusy] = useState(null);
    const [err, setErr] = useState(null);
    const grouped = groupLeadsByStage(leads);
    async function patchStage(leadId, stage) {
        var _a;
        setBusy(leadId);
        setErr(null);
        try {
            const res = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ stage }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setErr((_a = body.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            router.refresh();
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(null);
        }
    }
    async function convertLead(leadId) {
        var _a;
        setBusy(leadId);
        setErr(null);
        try {
            const res = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}/convert`, { method: "POST" });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setErr((_a = body.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            router.refresh();
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(null);
        }
    }
    return (_jsxs("div", { children: [err ? (_jsx("div", { className: "mb-3 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-100", children: err })) : null, _jsx("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6", children: STAGES.map((s) => {
                    var _a, _b, _c;
                    return (_jsxs("div", { className: "flex min-h-[220px] flex-col rounded-lg border border-[#1c1c1e] bg-[#0a0a0c]", children: [_jsxs("div", { className: "border-b border-[#1c1c1e] p-3", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[#606068]", children: s.label }), _jsxs("div", { className: "mt-0.5 text-xs text-[#909098]", children: [(_b = (_a = grouped[s.id]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0, " leads"] })] }), _jsx("ul", { className: "flex-1 space-y-1 overflow-y-auto p-2", children: ((_c = grouped[s.id]) !== null && _c !== void 0 ? _c : []).map((l) => {
                                    var _a, _b, _c, _d;
                                    return (_jsxs("li", { className: "rounded-md border border-[#14141a] bg-black p-2 text-xs", children: [_jsxs(Link, { href: `/crm/leads/${encodeURIComponent(l.id)}`, className: "block font-semibold text-[#f0f0f0] hover:text-[#00ff88]", children: [l.first_name, " ", (_a = l.last_name) !== null && _a !== void 0 ? _a : ""] }), _jsxs("div", { className: "mt-0.5 text-[11px] text-[#707078]", children: [(_b = l.email) !== null && _b !== void 0 ? _b : "—", " \u00B7 ", (_c = l.phone) !== null && _c !== void 0 ? _c : "—"] }), l.instrument ? (_jsx("div", { className: "mt-0.5 text-[11px] text-[#909098]", children: l.instrument })) : null, _jsxs("div", { className: "mt-2 flex flex-col gap-1", children: [_jsx("label", { className: "text-[10px] uppercase tracking-wider text-[#606068]", children: "Stage" }), _jsx("select", { className: "h-7 rounded border border-[#1c1c1e] bg-[#0a0a0c] px-1 text-[11px] text-[#f0f0f0]", value: (_d = l.stage) !== null && _d !== void 0 ? _d : "new", disabled: busy === l.id, onChange: (e) => patchStage(l.id, e.target.value), children: STAGES.map((st) => (_jsx("option", { value: st.id, children: st.label }, st.id))) }), _jsxs("div", { className: "flex flex-col gap-1 pt-1", children: [!l.converted_student_id ? (_jsx("button", { type: "button", disabled: busy === l.id, onClick: () => convertLead(l.id), className: "rounded bg-[#00ff88]/10 py-1 text-[11px] font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50", children: "Convert to student" })) : (_jsx(Link, { href: `/crm/students/${l.converted_student_id}`, className: "text-center text-[11px] text-[#00ff88] hover:underline", children: "View student" })), _jsx(Link, { href: `/schedule?intent=followup&leadId=${encodeURIComponent(l.id)}`, className: "rounded border border-[#1c1c1e] py-1 text-center text-[11px] text-[#909098] hover:bg-white/5", children: "Schedule follow-up" })] })] })] }, l.id));
                                }) })] }, s.id));
                }) })] }));
}
