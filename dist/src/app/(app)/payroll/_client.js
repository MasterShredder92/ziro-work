/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/system/PageTransition";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
import { LOCATION_MAP, LOCATIONS } from "@/lib/config/locations";
function fmt(cents) {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function initials(name) {
    const parts = name.split(" ");
    if (parts.length >= 2)
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}
function monthRange(offset = 0) {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    const year = d.getFullYear();
    const month = d.getMonth();
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const end = new Date(year, month + 1, 1);
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-01`;
    return { start, end: endStr, label: d.toLocaleString("default", { month: "long", year: "numeric" }) };
}
export function PayrollClient() {
    const [rows, setRows] = useState([]);
    const [_summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locationFilter, setLocationFilter] = useState("all");
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedRow, setSelectedRow] = useState(null);
    const period = monthRange(monthOffset);
    const load = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams({ start: period.start, end: period.end });
        if (locationFilter !== "all")
            params.set("locationId", locationFilter);
        fetch(`/api/payroll?${params}`)
            .then(r => r.json())
            .then(res => {
            var _a, _b;
            setRows((_a = res.rows) !== null && _a !== void 0 ? _a : []);
            setSummary((_b = res.summary) !== null && _b !== void 0 ? _b : null);
            setLoading(false);
        })
            .catch(() => setLoading(false));
    }, [locationFilter, period.start, period.end]);
    useEffect(() => { load(); }, [load]);
    const filtered = locationFilter === "all"
        ? rows
        : rows.filter(r => r.location_ids.includes(locationFilter));
    const filteredGross = filtered.reduce((s, r) => s + r.gross_pay_cents, 0);
    const filteredSessions = filtered.reduce((s, r) => s + r.session_count, 0);
    return (_jsx(PageTransition, { children: _jsxs("div", { className: "flex h-[calc(100vh-56px)] flex-col overflow-hidden", children: [_jsxs("div", { className: "shrink-0 border-b border-[#1c1c1e] px-6 py-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-4 mb-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-extrabold text-white", children: "Payroll" }), _jsx("p", { className: "text-xs text-[#505055]", children: "Teacher pay based on sessions taught" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setMonthOffset(o => o - 1), className: "rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-1.5 text-xs text-[#909098] hover:text-white transition-colors", children: "\u2190 Prev" }), _jsx("span", { className: "text-sm font-semibold text-white min-w-[140px] text-center", children: period.label }), _jsx("button", { onClick: () => setMonthOffset(o => o + 1), disabled: monthOffset >= 0, className: "rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-1.5 text-xs text-[#909098] hover:text-white disabled:opacity-40 transition-colors", children: "Next \u2192" })] })] }), _jsx("div", { className: "mb-3", children: _jsx(AgentPageBar, { agentId: "bub", chatPlaceholder: "Ask Bub about payroll or teacher pay\u2026", pageContext: { page: "payroll", period: period.label, totalGross: filteredGross, totalSessions: filteredSessions } }) }), _jsxs("div", { className: "grid grid-cols-3 gap-3 mb-3", children: [_jsxs("div", { className: "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-3", children: [_jsx("div", { className: "text-xl font-extrabold text-[#00ff88]", children: fmt(filteredGross) }), _jsx("div", { className: "text-[10px] text-[#505055]", children: "Total gross pay" })] }), _jsxs("div", { className: "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-3", children: [_jsx("div", { className: "text-xl font-extrabold text-white", children: filteredSessions.toLocaleString() }), _jsx("div", { className: "text-[10px] text-[#505055]", children: "Sessions taught" })] }), _jsxs("div", { className: "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-3", children: [_jsx("div", { className: "text-xl font-extrabold text-[#909098]", children: filtered.length }), _jsx("div", { className: "text-[10px] text-[#505055]", children: "Teachers" })] })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: ["all", ...LOCATIONS.map(l => l.id)].map(locId => {
                                var _a;
                                const lc = locId !== "all" ? LOCATION_MAP[locId] : null;
                                const active = locationFilter === locId;
                                return (_jsx("button", { onClick: () => setLocationFilter(locId), className: "rounded-full px-3 py-1 text-xs font-semibold border transition-colors", style: active && lc ? { backgroundColor: `${lc.color}20`, color: lc.color, borderColor: `${lc.color}50` } : active ? { backgroundColor: "#00ff8815", color: "#00ff88", borderColor: "#00ff8830" } : { backgroundColor: "transparent", color: "#505055", borderColor: "#1c1c1e" }, children: locId === "all" ? "All Locations" : (_a = lc === null || lc === void 0 ? void 0 : lc.name) !== null && _a !== void 0 ? _a : locId }, locId));
                            }) })] }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx("div", { className: "flex-1 overflow-y-auto", children: loading ? (_jsx("div", { className: "p-4 space-y-2", children: [1, 2, 3, 4, 5].map(i => _jsx("div", { className: "h-16 animate-pulse rounded-xl bg-white/5" }, i)) })) : filtered.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-64 gap-3 text-center", children: [_jsx("div", { className: "text-4xl", children: "\uD83D\uDCB0" }), _jsx("div", { className: "text-sm font-semibold text-[#909098]", children: "No sessions found for this period" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-[#505055] border-b border-[#1c1c1e]", style: { gridTemplateColumns: "1fr 80px 80px 100px 80px" }, children: [_jsx("span", { children: "Teacher" }), _jsx("span", { className: "text-right", children: "Sessions" }), _jsx("span", { className: "text-right", children: "Rate" }), _jsx("span", { className: "text-right", children: "Gross Pay" }), _jsx("span", { className: "text-right", children: "W-9" })] }), filtered.map(r => {
                                        const locConfigs = r.location_ids.map(id => LOCATION_MAP[id]).filter(Boolean);
                                        const isSelected = (selectedRow === null || selectedRow === void 0 ? void 0 : selectedRow.id) === r.id;
                                        return (_jsxs("button", { onClick: () => setSelectedRow(r.id === (selectedRow === null || selectedRow === void 0 ? void 0 : selectedRow.id) ? null : r), className: `w-full grid px-6 py-3 border-b border-[#1c1c1e] text-left transition-colors ${isSelected ? "bg-[#00ff88]/5" : "hover:bg-white/2"}`, style: { gridTemplateColumns: "1fr 80px 80px 100px 80px" }, children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [locConfigs.length > 0 && (_jsx("div", { className: "flex flex-col gap-0.5 shrink-0", children: locConfigs.map((lc, i) => _jsx("div", { className: "h-3 w-1 rounded-full", style: { backgroundColor: lc.color } }, i)) })), r.photo_url ? (_jsx("img", { src: r.photo_url, alt: r.display_name, className: "h-8 w-8 rounded-full object-cover border border-[#2b2b2f] shrink-0" })) : (_jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c1e] text-xs font-bold text-[#909098] shrink-0", children: initials(r.display_name) })), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold text-white truncate", children: r.display_name }), _jsx("div", { className: "text-[10px] text-[#505055] truncate", children: r.instruments.slice(0, 2).join(", ") || r.teacher_role || "—" })] })] }), _jsx("div", { className: "text-right text-sm font-semibold text-[#909098] self-center", children: r.session_count }), _jsxs("div", { className: "text-right text-sm text-[#505055] self-center", children: ["$", r.pay_rate_per_half_hour, "/30m"] }), _jsx("div", { className: "text-right text-sm font-extrabold text-[#00ff88] self-center", children: fmt(r.gross_pay_cents) }), _jsx("div", { className: "text-right self-center", children: r.w9_completed_at ? (_jsx("span", { className: "text-[10px] font-semibold text-[#22c55e]", children: "\u2713 W-9" })) : r.needs_1099 ? (_jsx("span", { className: "text-[10px] font-semibold text-[#f59e0b]", children: "Needed" })) : (_jsx("span", { className: "text-[10px] text-[#505055]", children: "\u2014" })) })] }, r.id));
                                    }), _jsxs("div", { className: "grid px-6 py-3 border-t-2 border-[#2b2b2f] bg-[#111113]", style: { gridTemplateColumns: "1fr 80px 80px 100px 80px" }, children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-widest text-[#505055]", children: "Total" }), _jsx("div", { className: "text-right text-sm font-bold text-white", children: filteredSessions }), _jsx("div", {}), _jsx("div", { className: "text-right text-sm font-extrabold text-[#00ff88]", children: fmt(filteredGross) }), _jsx("div", {})] })] })) }), selectedRow && (_jsx("div", { className: "w-full lg:w-96 shrink-0 border-l border-[#1c1c1e] bg-[#0a0a0c] overflow-y-auto", children: _jsx(PayrollDetailPanel, { row: selectedRow, onClose: () => setSelectedRow(null) }) }))] })] }) }));
}
function PayrollDetailPanel({ row, onClose }) {
    var _a;
    const locConfigs = row.location_ids.map(id => LOCATION_MAP[id]).filter(Boolean);
    return (_jsxs("div", { className: "flex flex-col h-full", children: [locConfigs.length > 0 && (_jsx("div", { className: "flex h-1.5 w-full shrink-0", children: locConfigs.map((lc, i) => _jsx("div", { className: "flex-1", style: { backgroundColor: lc.color } }, i)) })), _jsxs("div", { className: "flex items-center justify-between border-b border-[#1c1c1e] px-5 py-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [row.photo_url ? (_jsx("img", { src: row.photo_url, alt: row.display_name, className: "h-10 w-10 rounded-full object-cover border border-[#2b2b2f]" })) : (_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-[#1c1c1e] text-xs font-bold text-[#909098]", children: initials(row.display_name) })), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-bold text-white", children: row.display_name }), _jsx("div", { className: "text-[10px] text-[#505055]", children: (_a = row.teacher_role) !== null && _a !== void 0 ? _a : "Teacher" })] })] }), _jsx("button", { onClick: onClose, className: "text-[#505055] hover:text-white text-lg", children: "\u2715" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-5 space-y-5", children: [_jsxs("div", { className: "rounded-xl border border-[#1c1c1e] bg-[#111113] p-4", children: [_jsx("div", { className: "text-2xl font-extrabold text-[#00ff88]", children: fmt(row.gross_pay_cents) }), _jsx("div", { className: "text-xs text-[#505055]", children: "Gross pay this period" }), _jsxs("div", { className: "mt-2 text-xs text-[#909098]", children: [row.session_count, " sessions \u00D7 $", row.pay_rate_per_half_hour, "/30min"] })] }), row.location_breakdown.length > 0 && (_jsxs("section", { children: [_jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2", children: "Sessions by Location" }), _jsx("div", { className: "space-y-1.5", children: row.location_breakdown.map((lb) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-2 w-2 rounded-full", style: { backgroundColor: lb.location_color } }), _jsx("span", { className: "text-xs text-[#909098]", children: lb.location_name })] }), _jsxs("span", { className: "text-xs font-bold text-white", children: [lb.session_count, " sessions"] })] }, lb.location_id))) })] })), _jsxs("section", { children: [_jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2", children: "Tax Status" }), _jsxs("div", { className: "flex items-center justify-between rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-2", children: [_jsx("span", { className: "text-xs text-[#909098]", children: "1099 Contractor" }), row.w9_completed_at ? (_jsx("span", { className: "text-xs font-semibold text-[#22c55e]", children: "W-9 on file \u2713" })) : row.needs_1099 ? (_jsx("span", { className: "text-xs font-semibold text-[#f59e0b]", children: "W-9 needed" })) : (_jsx("span", { className: "text-xs text-[#505055]", children: "\u2014" }))] })] }), _jsx(Link, { href: `/teachers/${row.id}`, className: "flex items-center justify-center gap-2 rounded-lg border border-[#2b2b2f] px-4 py-2.5 text-sm font-semibold text-[#909098] hover:text-white hover:border-[#404048] transition-colors", children: "View Teacher Profile \u2192" })] })] }));
}
