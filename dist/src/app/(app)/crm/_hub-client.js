/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/system/PageTransition";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
import { LOCATION_MAP, LOCATIONS } from "@/lib/config/locations";
const INSTRUMENT_EMOJI = {
    guitar: "🎸", bass: "🎸", piano: "🎹", keyboard: "🎹",
    drums: "🥁", percussion: "🥁", violin: "🎻", viola: "🎻",
    cello: "🎻", trumpet: "🎺", trombone: "🎺", saxophone: "🎷",
    clarinet: "🎷", flute: "🎷", voice: "🎤", vocals: "🎤",
};
function instrEmoji(instr) {
    if (!instr)
        return "🎵";
    const key = instr.toLowerCase();
    for (const [k, v] of Object.entries(INSTRUMENT_EMOJI)) {
        if (key.includes(k))
            return v;
    }
    return "🎵";
}
function statusColor(s) {
    if (!s)
        return "text-[#505055]";
    const l = s.toLowerCase();
    if (l === "active")
        return "text-[#00ff88]";
    if (l === "paused")
        return "text-amber-400";
    if (l === "inactive" || l === "cancelled")
        return "text-red-400";
    return "text-[#909098]";
}
function invoiceStatusBadge(s) {
    const l = s.toLowerCase();
    if (l === "paid")
        return "bg-[#00ff88]/10 text-[#00ff88]";
    if (l === "overdue")
        return "bg-red-500/10 text-red-400";
    if (l === "pending")
        return "bg-amber-400/10 text-amber-400";
    return "bg-white/5 text-[#909098]";
}
function displayName(name) { return name.replace(/\s+Family$/i, "").trim(); }
function FamilyDetailContent({ family, onClose }) {
    const [tab, setTab] = useState("students");
    const [students, setStudents] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(false);
    const locConfig = family.primary_location_id ? LOCATION_MAP[family.primary_location_id] : null;
    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`/api/crm/students?familyId=${family.id}`).then(r => r.json()).catch(() => ({ data: [] })),
            fetch(`/api/billing/invoices?family_id=${family.id}`).then(r => r.json()).catch(() => ({ data: [] })),
        ]).then(([sRes, iRes]) => {
            setStudents(Array.isArray(sRes.data) ? sRes.data : []);
            setInvoices(Array.isArray(iRes.data) ? iRes.data : []);
            const events = [];
            (Array.isArray(iRes.data) ? iRes.data : []).forEach((inv) => {
                var _a;
                if (inv.paid_date)
                    events.push({ id: `inv-paid-${inv.id}`, type: "payment", label: `Payment received — $${inv.amount}`, timestamp: inv.paid_date });
                events.push({ id: `inv-${inv.id}`, type: "invoice", label: `Invoice created — $${inv.amount} (${inv.status})`, timestamp: (_a = inv.due_date) !== null && _a !== void 0 ? _a : "" });
            });
            events.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
            setTimeline(events);
            setLoading(false);
        });
    }, [family.id]);
    return (_jsxs("div", { className: "flex h-full flex-col bg-[#0a0a0c]", children: [locConfig && _jsx("div", { className: "h-1 w-full shrink-0", style: { backgroundColor: locConfig.color } }), _jsxs("div", { className: "flex items-center justify-between border-b border-[#1c1c1e] px-4 py-4", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("div", { className: "text-base font-bold text-white", children: displayName(family.name) }), locConfig && _jsx("span", { className: "rounded-full px-2 py-0.5 text-[10px] font-bold", style: { backgroundColor: `${locConfig.color}20`, color: locConfig.color }, children: locConfig.name })] }), _jsxs("div", { className: "mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#505055]", children: [family.primary_email && _jsx("span", { className: "truncate", children: family.primary_email }), family.primary_phone && _jsx("span", { children: family.primary_phone }), family.balance_owed != null && family.balance_owed > 0 && _jsxs("span", { className: "font-semibold text-red-400", children: ["$", family.balance_owed.toFixed(2), " owed"] })] })] }), _jsx("button", { onClick: onClose, className: "ml-3 shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#505055] hover:bg-white/10 hover:text-white transition-colors text-lg", children: "\u2715" })] }), _jsx("div", { className: "flex border-b border-[#1c1c1e] px-2", children: ["students", "invoices", "timeline"].map(t => (_jsx("button", { onClick: () => setTab(t), className: `px-3 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${tab === t ? "border-b-2 border-[#00ff88] text-[#00ff88]" : "text-[#505055] hover:text-[#909098]"}`, children: t }, t))) }), _jsx("div", { className: "flex-1 overflow-y-auto p-4", children: loading ? (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map(i => _jsx("div", { className: "h-12 animate-pulse rounded-lg bg-white/5" }, i)) })) : (_jsxs(_Fragment, { children: [tab === "students" && (_jsxs("div", { className: "space-y-2", children: [students.length === 0 ? _jsx("div", { className: "text-sm text-[#505055]", children: "No students linked to this family." }) : students.map(s => {
                                    var _a, _b;
                                    return (_jsxs(Link, { href: `/students/${s.id}`, className: "flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#111113] p-3 hover:border-[#2b2b2f] hover:bg-white/3 transition-colors", children: [_jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1c1c1e] text-lg", children: instrEmoji(s.instrument) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "text-sm font-semibold text-white truncate", children: [s.first_name, " ", s.last_name] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-[#505055]", children: [_jsx("span", { children: (_a = s.instrument) !== null && _a !== void 0 ? _a : "—" }), s.rate_per_session != null && _jsxs("span", { className: "text-[#909098]", children: ["$", s.rate_per_session, "/session"] })] })] }), _jsx("span", { className: `text-xs font-semibold ${statusColor(s.status)}`, children: (_b = s.status) !== null && _b !== void 0 ? _b : "—" }), _jsx("span", { className: "text-[#303035] text-xs", children: "\u2192" })] }, s.id));
                                }), _jsx(Link, { href: `/crm/students/new?familyId=${family.id}`, className: "mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#2b2b2f] p-3 text-xs font-semibold text-[#505055] hover:border-[#00ff88]/30 hover:text-[#00ff88] transition-colors", children: "+ Add student" })] })), tab === "invoices" && (_jsx("div", { className: "space-y-2", children: invoices.length === 0 ? _jsx("div", { className: "text-sm text-[#505055]", children: "No invoices found for this family." }) : invoices.map(inv => {
                                var _a, _b;
                                return (_jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#111113] p-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "text-sm font-semibold text-white", children: ["$", inv.amount.toFixed(2)] }), _jsxs("div", { className: "text-xs text-[#505055]", children: [(_a = inv.description) !== null && _a !== void 0 ? _a : "Session", " \u00B7 Due ", (_b = inv.due_date) !== null && _b !== void 0 ? _b : "—"] })] }), _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-semibold ${invoiceStatusBadge(inv.status)}`, children: inv.status })] }, inv.id));
                            }) })), tab === "timeline" && (_jsx("div", { className: "space-y-0", children: timeline.length === 0 ? _jsx("div", { className: "text-sm text-[#505055]", children: "No timeline events yet." }) : timeline.map((ev, i) => (_jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: `mt-1 h-2 w-2 rounded-full shrink-0 ${ev.type === "payment" ? "bg-[#00ff88]" : "bg-[#2b2b2f]"}` }), i < timeline.length - 1 && _jsx("div", { className: "w-px flex-1 bg-[#1c1c1e]" })] }), _jsxs("div", { className: "pb-4 min-w-0", children: [_jsx("div", { className: "text-xs font-semibold text-[#d4d4d4]", children: ev.label }), _jsx("div", { className: "text-[10px] text-[#505055]", children: ev.timestamp ? new Date(ev.timestamp).toLocaleDateString() : "—" })] })] }, ev.id))) }))] })) })] }));
}
/** Desktop side panel */
function FamilyDetailPanel({ family, onClose }) {
    return (_jsx("div", { className: "flex h-full flex-col border-l border-[#1c1c1e]", children: _jsx(FamilyDetailContent, { family: family, onClose: onClose }) }));
}
/** Mobile full-screen bottom sheet */
function FamilyDetailSheet({ family, onClose }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { className: "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-[#1c1c1e] bg-[#0a0a0c] shadow-2xl", style: { maxHeight: "92dvh", height: "92dvh" }, children: [_jsx("div", { className: "flex justify-center pt-3 pb-1 shrink-0", children: _jsx("div", { className: "h-1 w-10 rounded-full bg-[#2b2b2f]" }) }), _jsx("div", { className: "flex-1 overflow-hidden", children: _jsx(FamilyDetailContent, { family: family, onClose: onClose }) })] })] }));
}
export function CRMHubClient() {
    const [locations, setLocations] = useState([]);
    const [selectedLocationId, setSelectedLocationId] = useState("all");
    const [families, setFamilies] = useState([]);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);
    useEffect(() => {
        fetch("/api/locations/options").then(r => r.json()).then(res => {
            setLocations(Array.isArray(res.data) ? res.data : []);
        }).catch(() => { });
    }, []);
    const loadFamilies = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedLocationId !== "all")
            params.set("locationId", selectedLocationId);
        if (search)
            params.set("search", search);
        if (statusFilter !== "all")
            params.set("status", statusFilter);
        fetch(`/api/crm/families?${params}`).then(r => r.json()).then(res => {
            const raw = Array.isArray(res.data) ? res.data : [];
            raw.sort((a, b) => displayName(a.name).localeCompare(displayName(b.name)));
            setFamilies(raw);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [selectedLocationId, search, statusFilter]);
    useEffect(() => { const t = setTimeout(loadFamilies, 300); return () => clearTimeout(t); }, [loadFamilies]);
    const getLocName = (id) => {
        var _a, _b, _c, _d;
        if (id === "all")
            return "All Locations";
        return (_d = (_b = (_a = locations.find(l => l.id === id)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = LOCATION_MAP[id]) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : id;
    };
    const activeCount = families.filter(f => { var _a; const s = ((_a = f.billing_status) !== null && _a !== void 0 ? _a : "").toLowerCase(); return s === "active" || s === ""; }).length;
    const inactiveCount = families.filter(f => { var _a; const s = ((_a = f.billing_status) !== null && _a !== void 0 ? _a : "").toLowerCase(); return s === "inactive" || s === "cancelled" || s === "paused"; }).length;
    return (_jsxs(PageTransition, { children: [_jsxs("div", { className: "flex h-[calc(100vh-56px)] flex-col overflow-hidden", children: [_jsxs("div", { className: "shrink-0 border-b border-[#1c1c1e] px-4 py-4 md:px-6", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsx(PageHeader, { title: "Families & Students", subtitle: "All families, students, and their session history" }), _jsx(Link, { href: "/crm/families/new", className: "shrink-0 rounded-lg bg-[#00ff88]/10 px-3 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors", children: "+ New" })] }), _jsx("div", { className: "mt-3", children: _jsx(AgentPageBar, { agentId: "sid", chatPlaceholder: "Ask Sid about families or relationship management\u2026", pageContext: { page: "crm-families", totalFamilies: families.length, activeCount, inactiveCount, selectedLocation: selectedLocationId !== "all" ? getLocName(selectedLocationId) : "All Locations" } }) }), _jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: ["all", ...LOCATIONS.map(l => l.id)].map(locId => {
                                    const locCfg = locId !== "all" ? LOCATION_MAP[locId] : null;
                                    const isActive = selectedLocationId === locId;
                                    return (_jsx("button", { onClick: () => { setSelectedLocationId(locId); setSelectedFamily(null); }, className: "rounded-full px-3 py-1 text-xs font-semibold transition-colors border", style: isActive && locCfg
                                            ? { backgroundColor: `${locCfg.color}20`, color: locCfg.color, borderColor: `${locCfg.color}50` }
                                            : isActive
                                                ? { backgroundColor: "#00ff8815", color: "#00ff88", borderColor: "#00ff8840" }
                                                : { backgroundColor: "transparent", color: "#505055", borderColor: "#1c1c1e" }, children: getLocName(locId) }, locId));
                                }) }), _jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx("div", { className: "flex rounded-lg border border-[#1c1c1e] overflow-hidden text-xs font-semibold", children: [{ id: "all", label: `All (${families.length})` }, { id: "active", label: `Active (${activeCount})` }, { id: "inactive", label: `Inactive (${inactiveCount})` }].map(s => (_jsx("button", { onClick: () => setStatusFilter(s.id), className: `px-3 py-1.5 transition-colors ${statusFilter === s.id ? "bg-white/8 text-white" : "text-[#505055] hover:text-[#909098]"}`, children: s.label }, s.id))) }), _jsx("input", { type: "text", placeholder: "Search families...", value: search, onChange: e => setSearch(e.target.value), className: "flex-1 min-w-0 rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-1.5 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none" })] })] }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx("div", { className: `flex flex-col overflow-y-auto border-r border-[#1c1c1e] transition-all duration-200 ${(!isMobile && selectedFamily) ? "w-80 shrink-0" : "flex-1"}`, children: loading ? (_jsx("div", { className: "p-4 space-y-2", children: [1, 2, 3, 4, 5].map(i => _jsx("div", { className: "h-16 animate-pulse rounded-lg bg-white/5" }, i)) })) : families.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center flex-1 gap-3 text-center p-8", children: [_jsx("div", { className: "text-4xl", children: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67" }), _jsx("div", { className: "text-sm font-semibold text-[#909098]", children: "No families found" }), _jsx("div", { className: "text-xs text-[#505055]", children: search ? "Try a different search term" : "Add your first family to get started" })] })) : (_jsx("div", { className: "divide-y divide-[#1c1c1e]", children: families.map(fam => {
                                        const locCfg = fam.primary_location_id ? LOCATION_MAP[fam.primary_location_id] : null;
                                        const isSelected = (selectedFamily === null || selectedFamily === void 0 ? void 0 : selectedFamily.id) === fam.id;
                                        return (_jsxs("button", { onClick: () => setSelectedFamily(fam.id === (selectedFamily === null || selectedFamily === void 0 ? void 0 : selectedFamily.id) ? null : fam), className: `w-full text-left transition-colors hover:bg-white/3 ${isSelected ? "bg-[#00ff88]/5" : ""}`, children: [locCfg && _jsx("div", { className: "h-0.5 w-full", style: { backgroundColor: locCfg.color } }), _jsxs("div", { className: `flex items-center gap-3 px-4 py-3 ${isSelected ? "border-l-2 border-[#00ff88]" : ""}`, children: [_jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", style: { backgroundColor: locCfg ? `${locCfg.color}25` : "#1c1c1e", border: locCfg ? `1.5px solid ${locCfg.color}60` : "1.5px solid #2b2b2f", color: locCfg ? locCfg.color : "#909098" }, children: displayName(fam.name).slice(0, 2).toUpperCase() }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-semibold text-white truncate", children: displayName(fam.name) }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-[#505055]", children: [fam.primary_email && _jsx("span", { className: "truncate max-w-[140px]", children: fam.primary_email }), fam.primary_phone && _jsx("span", { className: "shrink-0", children: fam.primary_phone })] })] }), _jsxs("div", { className: "flex flex-col items-end gap-1 shrink-0", children: [fam.balance_owed != null && fam.balance_owed > 0 && _jsxs("span", { className: "text-xs font-semibold text-red-400", children: ["$", fam.balance_owed.toFixed(0)] }), locCfg && _jsx("span", { className: "text-[9px] font-bold", style: { color: locCfg.color }, children: locCfg.name })] })] })] }, fam.id));
                                    }) })) }), !isMobile && selectedFamily && (_jsx("div", { className: "flex-1 overflow-hidden", children: _jsx(FamilyDetailPanel, { family: selectedFamily, onClose: () => setSelectedFamily(null) }) }))] })] }), isMobile && selectedFamily && (_jsx(FamilyDetailSheet, { family: selectedFamily, onClose: () => setSelectedFamily(null) }))] }));
}
