/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/system/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
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
function teacherName(t) {
    if (t.display_name)
        return t.display_name;
    const parts = [t.first_name, t.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Unknown";
}
function initials(t) {
    const name = teacherName(t);
    const parts = name.split(" ");
    if (parts.length >= 2)
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}
function w9Status(t) {
    if (t.w9_completed_at)
        return { label: "W-9 ✓", color: "#22c55e" };
    if (t.needs_1099)
        return { label: "W-9 needed", color: "#f59e0b" };
    return { label: "No 1099", color: "#505055" };
}
function TeacherDetailPanel({ teacher, onClose }) {
    var _a, _b, _c, _d, _e, _f;
    const locIds = (_a = teacher.location_ids) !== null && _a !== void 0 ? _a : [];
    const locConfigs = locIds.map(id => LOCATION_MAP[id]).filter(Boolean);
    const w9 = w9Status(teacher);
    const payRate = (_c = (_b = teacher.pay_rate_per_half_hour) !== null && _b !== void 0 ? _b : teacher.rate_per_block) !== null && _c !== void 0 ? _c : null;
    return (_jsxs("div", { className: "flex flex-col h-full", children: [locConfigs.length > 0 && (_jsx("div", { className: "flex h-1.5 w-full shrink-0", children: locConfigs.map((lc, i) => _jsx("div", { className: "flex-1", style: { backgroundColor: lc.color } }, i)) })), _jsxs("div", { className: "flex items-center justify-between border-b border-[#1c1c1e] px-6 py-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [teacher.photo_url ? (_jsx("img", { src: teacher.photo_url, alt: teacherName(teacher), className: "h-12 w-12 rounded-full object-cover border border-[#2b2b2f]" })) : (_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-[#1c1c1e] text-sm font-bold text-[#909098]", children: initials(teacher) })), _jsxs("div", { children: [_jsx("div", { className: "text-base font-bold text-white", children: teacherName(teacher) }), _jsx("div", { className: "text-xs text-[#505055]", children: (_d = teacher.teacher_role) !== null && _d !== void 0 ? _d : "Teacher" })] })] }), _jsx("button", { onClick: onClose, className: "text-[#505055] hover:text-white transition-colors text-lg", children: "\u2715" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-5 space-y-5", children: [_jsxs("section", { children: [_jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2", children: "Contact" }), _jsxs("div", { className: "space-y-1.5 text-sm", children: [teacher.email && _jsxs("div", { className: "flex gap-3 text-[#909098]", children: [_jsx("span", { className: "text-[#505055] w-12", children: "Email" }), teacher.email] }), teacher.phone && _jsxs("div", { className: "flex gap-3 text-[#909098]", children: [_jsx("span", { className: "text-[#505055] w-12", children: "Phone" }), teacher.phone] }), teacher.hire_date && _jsxs("div", { className: "flex gap-3 text-[#909098]", children: [_jsx("span", { className: "text-[#505055] w-12", children: "Hired" }), new Date(teacher.hire_date).toLocaleDateString()] })] })] }), _jsxs("section", { children: [_jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2", children: "Compensation" }), _jsxs("div", { className: "flex items-center justify-between rounded-lg border border-[#1c1c1e] bg-[#111113] px-4 py-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-lg font-extrabold text-[#00ff88]", children: payRate != null ? `$${payRate}` : "—" }), _jsx("div", { className: "text-[10px] text-[#505055]", children: "per 30-min block" })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-sm font-semibold", style: { color: w9.color }, children: w9.label }), _jsx("div", { className: "text-[10px] text-[#505055]", children: teacher.needs_1099 ? "1099 contractor" : "W-2 employee" })] })] })] }), ((_e = teacher.instruments) !== null && _e !== void 0 ? _e : []).length > 0 && (_jsxs("section", { children: [_jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2", children: "Instruments" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ((_f = teacher.instruments) !== null && _f !== void 0 ? _f : []).map((instr, i) => (_jsxs("span", { className: "rounded-full border border-[#2b2b2f] bg-[#111113] px-3 py-1 text-xs text-[#909098]", children: [instrEmoji(instr), " ", instr] }, i))) })] })), locConfigs.length > 0 && (_jsxs("section", { children: [_jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2", children: "Locations" }), _jsx("div", { className: "flex flex-wrap gap-2", children: locConfigs.map((lc, i) => (_jsx("span", { className: "rounded-full px-3 py-1 text-xs font-bold", style: { backgroundColor: `${lc.color}20`, color: lc.color }, children: lc.name }, i))) })] })), teacher.bio && (_jsxs("section", { children: [_jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-[#303035] mb-2", children: "Bio" }), _jsx("p", { className: "text-sm text-[#909098] leading-relaxed", children: teacher.bio })] })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `h-2 w-2 rounded-full ${(teacher.is_sub_available || teacher.sub_available) ? "bg-[#22c55e]" : "bg-[#505055]"}` }), _jsx("span", { className: "text-xs text-[#909098]", children: (teacher.is_sub_available || teacher.sub_available) ? "Available for sub coverage" : "Not available for subs" })] }), _jsx(Link, { href: `/teachers/${teacher.id}`, className: "flex items-center justify-center gap-2 rounded-lg border border-[#2b2b2f] px-4 py-2.5 text-sm font-semibold text-[#909098] hover:text-white hover:border-[#404048] transition-colors", children: "View Full Profile \u2192" })] })] }));
}
export function TeachersClient() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locationFilter, setLocationFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [search, setSearch] = useState("");
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const loadTeachers = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (locationFilter !== "all")
            params.set("locationId", locationFilter);
        if (statusFilter === "active")
            params.set("isActive", "true");
        if (statusFilter === "inactive")
            params.set("isActive", "false");
        fetch(`/api/crm/teachers?${params}`)
            .then(r => r.json())
            .then(res => {
            const raw = Array.isArray(res.data) ? res.data : [];
            raw.sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
            setTeachers(raw);
            setLoading(false);
        })
            .catch(() => setLoading(false));
    }, [locationFilter, statusFilter]);
    useEffect(() => { loadTeachers(); }, [loadTeachers]);
    const filtered = search
        ? teachers.filter(t => {
            var _a, _b;
            const name = teacherName(t).toLowerCase();
            const instr = ((_a = t.instruments) !== null && _a !== void 0 ? _a : []).join(" ").toLowerCase();
            const q = search.toLowerCase();
            return name.includes(q) || instr.includes(q) || ((_b = t.email) !== null && _b !== void 0 ? _b : "").toLowerCase().includes(q);
        })
        : teachers;
    return (_jsx(PageTransition, { children: _jsxs("div", { className: "flex h-[calc(100vh-56px)] flex-col overflow-hidden", children: [_jsxs("div", { className: "shrink-0 border-b border-[#1c1c1e] px-6 py-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsx(PageHeader, { title: "Teachers", subtitle: "Staff directory, pay rates, and W-9 status" }), _jsx(Link, { href: "/crm/teachers/new", className: "shrink-0 rounded-lg bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors", children: "+ Add Teacher" })] }), _jsx("div", { className: "mt-3", children: _jsx(AgentPageBar, { agentId: "vader", chatPlaceholder: "Ask Vader about teachers or staffing\u2026", pageContext: { page: "teachers", totalTeachers: filtered.length, locationFilter, statusFilter } }) }), _jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: ["all", ...LOCATIONS.map(l => l.id)].map(locId => {
                                var _a;
                                const locCfg = locId !== "all" ? LOCATION_MAP[locId] : null;
                                const isActive = locationFilter === locId;
                                return (_jsx("button", { onClick: () => { setLocationFilter(locId); setSelectedTeacher(null); }, className: "rounded-full px-3 py-1 text-xs font-semibold transition-colors border", style: isActive && locCfg ? { backgroundColor: `${locCfg.color}20`, color: locCfg.color, borderColor: `${locCfg.color}50` } : isActive ? { backgroundColor: "#00ff8815", color: "#00ff88", borderColor: "#00ff8830" } : { backgroundColor: "transparent", color: "#505055", borderColor: "#1c1c1e" }, children: locId === "all" ? "All Locations" : (_a = locCfg === null || locCfg === void 0 ? void 0 : locCfg.name) !== null && _a !== void 0 ? _a : locId }, locId));
                            }) }), _jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx("div", { className: "flex rounded-lg border border-[#1c1c1e] overflow-hidden text-xs font-semibold", children: ["all", "active", "inactive"].map(s => (_jsx("button", { onClick: () => setStatusFilter(s), className: `px-3 py-1.5 capitalize transition-colors ${statusFilter === s ? "bg-white/8 text-white" : "text-[#505055] hover:text-[#909098]"}`, children: s }, s))) }), _jsx("input", { type: "text", placeholder: "Search teachers, instruments\u2026", value: search, onChange: e => setSearch(e.target.value), className: "flex-1 rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-1.5 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none" })] })] }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx("div", { className: `flex-1 overflow-y-auto p-4 ${selectedTeacher ? "hidden lg:block" : ""}`, children: loading ? (_jsx("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3", children: [1, 2, 3, 4, 5, 6].map(i => _jsx("div", { className: "h-32 animate-pulse rounded-xl bg-white/5" }, i)) })) : filtered.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-64 gap-3 text-center", children: [_jsx("div", { className: "text-4xl", children: "\uD83D\uDC69\u200D\uD83C\uDFEB" }), _jsx("div", { className: "text-sm font-semibold text-[#909098]", children: "No teachers found" })] })) : (_jsx("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3", children: filtered.map(t => {
                                    var _a, _b, _c, _d, _e, _f, _g;
                                    const locIds = (_a = t.location_ids) !== null && _a !== void 0 ? _a : [];
                                    const locConfigs = locIds.map(id => LOCATION_MAP[id]).filter(Boolean);
                                    const isSelected = (selectedTeacher === null || selectedTeacher === void 0 ? void 0 : selectedTeacher.id) === t.id;
                                    const w9 = w9Status(t);
                                    const payRate = (_c = (_b = t.pay_rate_per_half_hour) !== null && _b !== void 0 ? _b : t.rate_per_block) !== null && _c !== void 0 ? _c : null;
                                    return (_jsxs("button", { onClick: () => setSelectedTeacher(t.id === (selectedTeacher === null || selectedTeacher === void 0 ? void 0 : selectedTeacher.id) ? null : t), className: `text-left rounded-xl border transition-all overflow-hidden ${isSelected ? "border-[#00ff88]/40 bg-[#00ff88]/5" : "border-[#1c1c1e] bg-[#0a0a0c] hover:border-[#2b2b2f] hover:bg-white/2"}`, children: [locConfigs.length > 0 ? (_jsx("div", { className: "flex h-1 w-full", children: locConfigs.map((lc, i) => _jsx("div", { className: "flex-1", style: { backgroundColor: lc.color } }, i)) })) : _jsx("div", { className: "h-1 w-full bg-[#1c1c1e]" }), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsxs("div", { className: "relative shrink-0", children: [t.photo_url ? (_jsx("img", { src: t.photo_url, alt: teacherName(t), className: "h-12 w-12 rounded-full object-cover border border-[#2b2b2f]" })) : (_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-[#1c1c1e] text-sm font-bold text-[#909098] border border-[#2b2b2f]", children: initials(t) })), (t.is_active !== false) && _jsx("div", { className: "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#22c55e] border-2 border-[#0a0a0c]" })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-bold text-white truncate", children: teacherName(t) }), _jsx("div", { className: "text-xs text-[#505055] truncate", children: (_d = t.email) !== null && _d !== void 0 ? _d : "—" }), _jsxs("div", { className: "mt-1 flex flex-wrap gap-1", children: [((_e = t.instruments) !== null && _e !== void 0 ? _e : []).slice(0, 3).map((instr, i) => (_jsxs("span", { className: "rounded-full bg-[#1c1c1e] px-2 py-0.5 text-[10px] text-[#909098]", children: [instrEmoji(instr), " ", instr] }, i))), ((_f = t.instruments) !== null && _f !== void 0 ? _f : []).length > 3 && _jsxs("span", { className: "rounded-full bg-[#1c1c1e] px-2 py-0.5 text-[10px] text-[#505055]", children: ["+", ((_g = t.instruments) !== null && _g !== void 0 ? _g : []).length - 3] })] })] })] }), _jsxs("div", { className: "mt-3 flex items-center justify-between", children: [_jsx("div", { className: "text-xs", children: payRate != null ? _jsxs("span", { className: "font-semibold text-[#00ff88]", children: ["$", payRate, "/30min"] }) : _jsx("span", { className: "text-[#505055]", children: "Rate TBD" }) }), _jsx("span", { className: "text-[10px] font-semibold", style: { color: w9.color }, children: w9.label })] }), locConfigs.length > 0 && (_jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: locConfigs.map((lc, i) => _jsx("span", { className: "rounded-full px-2 py-0.5 text-[10px] font-bold", style: { backgroundColor: `${lc.color}20`, color: lc.color }, children: lc.name }, i)) }))] })] }, t.id));
                                }) })) }), selectedTeacher && (_jsx("div", { className: "w-full lg:w-96 shrink-0 border-l border-[#1c1c1e] bg-[#0a0a0c] overflow-y-auto", children: _jsx(TeacherDetailPanel, { teacher: selectedTeacher, onClose: () => setSelectedTeacher(null) }) }))] })] }) }));
}
