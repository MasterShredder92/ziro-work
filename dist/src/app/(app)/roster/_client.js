"use client";
import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
// ─── Location config ──────────────────────────────────────────────────────────
const LOCATION_CONFIG = {
    "f7b52dd5-12ee-437f-9c60-f8adf454ac31": { color: "#7C3AED", accent: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.4)" },
    "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": { color: "#16A34A", accent: "rgba(22,163,74,0.15)", border: "rgba(22,163,74,0.4)" },
    "cebd97d4-c241-4de2-8ade-49e5cc0070d5": { color: "#0EA5E9", accent: "rgba(14,165,233,0.15)", border: "rgba(14,165,233,0.4)" },
    "d48229c1-b70a-4d29-893e-5079887dab76": { color: "#DC2626", accent: "rgba(220,38,38,0.15)", border: "rgba(220,38,38,0.4)" },
};
const DEFAULT_LOC = { color: "#606068", accent: "rgba(96,96,104,0.1)", border: "rgba(96,96,104,0.3)" };
function locStyle(id) {
    var _a;
    return id ? ((_a = LOCATION_CONFIG[id]) !== null && _a !== void 0 ? _a : DEFAULT_LOC) : DEFAULT_LOC;
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Strip " Family" suffix and return just the meaningful name part */
function displayName(raw) {
    return raw.replace(/\s+family$/i, "").trim() || raw;
}
/** Contact name to show below the family name (only if it adds info) */
function contactSub(family) {
    var _a;
    const raw = (_a = family.primary_contact_name) !== null && _a !== void 0 ? _a : family.parent_name;
    if (!raw)
        return null;
    // strip "Family" from both for comparison
    const cleanFamily = displayName(family.name).toLowerCase();
    const cleanContact = raw.toLowerCase().replace(/\s+family$/i, "").trim();
    if (cleanContact === cleanFamily)
        return null;
    return raw;
}
function monthlyForFamily(students, family) {
    var _a;
    const active = students.filter((s) => s.family_id === family.id && s.status === "active");
    if (active.length === 0)
        return 0;
    const rate = ((_a = family.rate_tier) !== null && _a !== void 0 ? _a : 4500) / 100;
    return active.reduce((sum, s) => { var _a; return sum + ((_a = s.blocks_per_week) !== null && _a !== void 0 ? _a : 1) * 4 * rate; }, 0);
}
function normalizeCard(family) {
    var _a;
    if (family.card_last_four) {
        const brand = ((_a = family.card_brand) !== null && _a !== void 0 ? _a : "").toLowerCase();
        const last = family.card_last_four;
        if (brand.includes("visa"))
            return { label: `VISA ···${last}`, type: "visa" };
        if (brand.includes("master"))
            return { label: `MC ···${last}`, type: "mc" };
        if (brand.includes("amex") || brand.includes("american"))
            return { label: `AMEX ···${last}`, type: "amex" };
        return { label: `···${last}`, type: "sq" };
    }
    if (family.square_customer_id)
        return { label: "Square on file", type: "sq" };
    return { label: "No card", type: "none" };
}
const CARD_COLORS = { visa: "#60A5FA", mc: "#FB923C", amex: "#34D399", sq: "#9CA3AF", none: "#F87171" };
/** Color-coded student count pill */
function StudentPill({ count }) {
    const cfg = count === 0 ? { bg: "rgba(100,100,120,0.15)", color: "#555" } :
        count === 1 ? { bg: "rgba(96,165,250,0.18)", color: "#60A5FA" } :
            count === 2 ? { bg: "rgba(74,222,128,0.18)", color: "#4ADE80" } :
                count === 3 ? { bg: "rgba(251,191,36,0.18)", color: "#FBBF24" } :
                    { bg: "rgba(192,132,252,0.18)", color: "#C084FC" };
    return (_jsxs("span", { className: "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap", style: { background: cfg.bg, color: cfg.color }, children: [count, " student", count !== 1 ? "s" : ""] }));
}
// ─── Location Stat Card ───────────────────────────────────────────────────────
function LocationCard({ stat, isActive, onClick }) {
    const s = locStyle(stat.id);
    return (_jsxs("button", { onClick: onClick, className: "flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:scale-[1.02]", style: {
            background: isActive ? s.accent : "var(--z-surface)",
            borderColor: isActive ? s.color : "var(--z-border)",
            boxShadow: isActive ? `0 0 0 1px ${s.color}` : "none",
        }, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-bold", style: { color: s.color }, children: stat.shortName }), isActive && (_jsx("span", { className: "rounded-full px-2 py-0.5 text-[10px] font-semibold", style: { background: s.color, color: "#fff" }, children: "Filtered" }))] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-2xl font-extrabold text-[var(--z-fg)]", children: stat.studentCount }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)]", children: "students" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-extrabold text-[var(--z-fg)]", children: stat.familyCount }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)]", children: "families" })] })] }), _jsxs("div", { className: "text-xs font-semibold", style: { color: s.color }, children: ["~$", stat.monthlyRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 }), "/mo"] })] }));
}
// ─── Student inline row (expanded) ───────────────────────────────────────────
function StudentInlineRow({ student, teacherName }) {
    var _a, _b, _c;
    const s = locStyle(student.location_id);
    const calloutBank = Math.max(0, 4 - ((_a = student.total_callouts) !== null && _a !== void 0 ? _a : 0));
    const instrument = student.instrument
        ? student.instrument.charAt(0).toUpperCase() + student.instrument.slice(1)
        : "—";
    return (_jsxs("div", { className: "flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border px-4 py-2.5 text-sm", style: { background: "var(--z-bg)", borderColor: s.border, borderLeftWidth: "3px" }, children: [_jsx("div", { className: "min-w-[140px] font-semibold", children: _jsx(Link, { href: `/students/${student.id}`, className: "hover:underline", style: { color: s.color }, children: [student.first_name, student.last_name].filter(Boolean).join(" ") || "Unnamed" }) }), _jsx("div", { className: "min-w-[80px] text-[var(--z-muted)]", children: instrument }), _jsx("div", { className: "min-w-[120px] text-[var(--z-muted)]", children: teacherName || "Unassigned" }), _jsx("div", { className: "min-w-[80px]", children: _jsx("span", { className: "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", style: {
                        background: student.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: student.status === "active" ? "#22C55E" : "#EF4444",
                    }, children: student.status }) }), _jsxs("div", { className: "min-w-[70px] text-xs text-[var(--z-muted)]", children: [(_b = student.blocks_per_week) !== null && _b !== void 0 ? _b : 1, "\u00D7/wk"] }), _jsx("div", { className: "min-w-[80px] text-xs text-[var(--z-muted)]", children: student.rate_per_session != null ? `$${student.rate_per_session}/block` : "—" }), _jsxs("div", { className: "ml-auto flex items-center gap-1 text-[10px] text-[var(--z-muted)]", children: [_jsxs("span", { title: "Callout bank remaining", children: ["\uD83C\uDFAB ", calloutBank, "/4"] }), _jsx("span", { className: "mx-1 opacity-30", children: "\u00B7" }), _jsxs("span", { title: "Total lessons taken", children: [(_c = student.total_lessons_taken) !== null && _c !== void 0 ? _c : 0, " lessons"] })] })] }));
}
// ─── Family Row ───────────────────────────────────────────────────────────────
function FamilyTableRow({ family, students, teacherNames, isExpanded, onToggle, showContactSub, }) {
    var _a, _b, _c, _d, _e;
    const ls = locStyle(family.primary_location_id);
    const card = normalizeCard(family);
    const cardColor = CARD_COLORS[card.type];
    const familyStudents = students.filter((s) => s.family_id === family.id);
    const activeStudents = familyStudents.filter((s) => s.status === "active");
    const monthly = monthlyForFamily(students, family);
    const sub = showContactSub ? contactSub(family) : null;
    const hasOverdue = ((_a = family.overdue_balance_cents) !== null && _a !== void 0 ? _a : 0) > 0 || ((_b = family.balance) !== null && _b !== void 0 ? _b : 0) < 0;
    const isInactive = ((_c = family.billing_status) !== null && _c !== void 0 ? _c : "active").toLowerCase() !== "active";
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "hidden sm:grid relative cursor-pointer border-b transition-colors hover:bg-white/[0.02]", style: {
                    gridTemplateColumns: "4px 1.8fr 110px 100px 1fr 130px 150px",
                    minHeight: "48px",
                    alignItems: "center",
                    columnGap: "12px",
                    paddingLeft: 0,
                    paddingRight: "14px",
                    borderColor: "var(--z-border)",
                    opacity: isInactive ? 0.45 : 1,
                }, onClick: onToggle, children: [_jsx("div", { className: "self-stretch rounded-l", style: { background: ls.color, width: "4px" } }), _jsxs("div", { className: "overflow-hidden py-2", children: [_jsxs("div", { className: "flex items-center gap-1.5 overflow-hidden", children: [_jsx("svg", { className: `h-2.5 w-2.5 flex-shrink-0 text-[var(--z-muted)] transition-transform ${isExpanded ? "rotate-90" : ""}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) }), _jsx(Link, { href: `/crm?family=${family.id}`, className: "truncate text-[13px] font-bold text-[var(--z-fg)] hover:underline", onClick: (e) => e.stopPropagation(), children: displayName(family.name) }), hasOverdue && (_jsx("span", { className: "flex-shrink-0 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide bg-[rgba(248,113,113,0.15)] text-[#F87171]", children: "Overdue" })), family.is_military && (_jsx("span", { className: "flex-shrink-0 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide bg-[rgba(96,165,250,0.15)] text-[#60A5FA]", children: "Military" }))] }), sub && _jsx("div", { className: "mt-0.5 truncate text-[11px] text-[var(--z-muted)]", children: sub })] }), _jsx("div", { children: _jsx(StudentPill, { count: activeStudents.length }) }), _jsx("div", { className: `text-[13px] font-bold whitespace-nowrap ${monthly > 0 ? "text-[var(--z-fg)]" : "text-[var(--z-muted)]"}`, children: monthly > 0 ? `$${monthly.toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo` : "—" }), _jsx("div", { className: "truncate text-[11px] text-[var(--z-muted)]", children: (_d = family.primary_email) !== null && _d !== void 0 ? _d : "—" }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)] whitespace-nowrap", children: (_e = family.primary_phone) !== null && _e !== void 0 ? _e : "—" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "h-1.5 w-1.5 flex-shrink-0 rounded-full", style: { background: cardColor } }), _jsx("span", { className: "text-[11px] font-semibold whitespace-nowrap", style: { color: cardColor }, children: card.label })] })] }), _jsxs("div", { className: "sm:hidden border-b border-l-4 px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.02]", style: {
                    borderColor: "var(--z-border)",
                    borderLeftColor: ls.color,
                    opacity: isInactive ? 0.45 : 1,
                }, onClick: onToggle, children: [_jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [_jsx("svg", { className: `h-2.5 w-2.5 flex-shrink-0 text-[var(--z-muted)] transition-transform ${isExpanded ? "rotate-90" : ""}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) }), _jsx("span", { className: "text-[14px] font-bold text-[var(--z-fg)]", children: displayName(family.name) }), hasOverdue && (_jsx("span", { className: "rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide bg-[rgba(248,113,113,0.15)] text-[#F87171]", children: "Overdue" })), family.is_military && (_jsx("span", { className: "rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide bg-[rgba(96,165,250,0.15)] text-[#60A5FA]", children: "Military" }))] }), sub && _jsx("div", { className: "mt-0.5 text-[11px] text-[var(--z-muted)]", children: sub }), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-x-3 gap-y-1", children: [_jsx(StudentPill, { count: activeStudents.length }), _jsx("span", { className: "text-[13px] font-bold text-[var(--z-fg)]", children: monthly > 0 ? `$${monthly.toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo` : "—" }), _jsxs("span", { className: "flex items-center gap-1 text-[11px] font-semibold", style: { color: cardColor }, children: [_jsx("span", { className: "h-1.5 w-1.5 rounded-full", style: { background: cardColor } }), card.label] })] }), (family.primary_email || family.primary_phone) && (_jsxs("div", { className: "mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--z-muted)]", children: [family.primary_email && _jsx("span", { className: "truncate", children: family.primary_email }), family.primary_phone && _jsx("span", { children: family.primary_phone })] }))] }), isExpanded && (_jsxs("div", { className: "border-b px-6 py-3 space-y-2", style: { borderColor: "var(--z-border)", background: "var(--z-surface-2)" }, children: [familyStudents.length === 0 ? (_jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "No students linked to this family." })) : (familyStudents.map((s) => {
                        var _a;
                        return (_jsx(StudentInlineRow, { student: s, teacherName: s.teacher_id ? ((_a = teacherNames[s.teacher_id]) !== null && _a !== void 0 ? _a : "Unknown") : "Unassigned" }, s.id));
                    })), _jsxs("div", { className: "flex gap-3 pt-1", children: [_jsx(Link, { href: `/crm?family=${family.id}`, className: "text-xs font-semibold hover:underline", style: { color: "var(--z-accent)" }, children: "View family \u2192" }), _jsx("button", { className: "text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]", onClick: (e) => { e.stopPropagation(); onToggle(); }, children: "Collapse" })] })] }))] }));
}
// ─── Main Roster Client ───────────────────────────────────────────────────────
export function RosterClient({ families, students, teacherNames, locationStats }) {
    const [activeLocationId, setActiveLocationId] = useState(null);
    const [expandedFamilies, setExpandedFamilies] = useState(new Set());
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("active");
    const toggleFamily = (id) => setExpandedFamilies((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleLocation = (id) => setActiveLocationId((prev) => (prev === id ? null : id));
    const filteredFamilies = useMemo(() => {
        let result = families;
        if (activeLocationId) {
            const inLoc = new Set(students.filter((s) => s.location_id === activeLocationId).map((s) => s.family_id).filter(Boolean));
            result = result.filter((f) => f.primary_location_id === activeLocationId || inLoc.has(f.id));
        }
        if (statusFilter !== "all") {
            result = result.filter((f) => { var _a; return ((_a = f.billing_status) !== null && _a !== void 0 ? _a : "active").toLowerCase() === statusFilter; });
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter((f) => {
                var _a, _b, _c, _d, _e;
                return ((_a = f.name) !== null && _a !== void 0 ? _a : "").toLowerCase().includes(q) ||
                    ((_b = f.primary_email) !== null && _b !== void 0 ? _b : "").toLowerCase().includes(q) ||
                    ((_c = f.primary_phone) !== null && _c !== void 0 ? _c : "").includes(q) ||
                    ((_d = f.primary_contact_name) !== null && _d !== void 0 ? _d : "").toLowerCase().includes(q) ||
                    ((_e = f.parent_name) !== null && _e !== void 0 ? _e : "").toLowerCase().includes(q);
            });
        }
        return result;
    }, [families, students, activeLocationId, statusFilter, search]);
    // Auto-disambiguate: find last names (after stripping "Family") that appear more than once
    const duplicateNames = useMemo(() => {
        var _a;
        const counts = {};
        for (const f of filteredFamilies) {
            const key = displayName(f.name).toLowerCase();
            counts[key] = ((_a = counts[key]) !== null && _a !== void 0 ? _a : 0) + 1;
        }
        return new Set(Object.entries(counts).filter(([, v]) => v > 1).map(([k]) => k));
    }, [filteredFamilies]);
    // Summary stats
    const totalActive = students.filter((s) => s.status === "active").length;
    const totalFamilies = families.filter((f) => { var _a; return ((_a = f.billing_status) !== null && _a !== void 0 ? _a : "active").toLowerCase() === "active"; }).length;
    const totalMonthly = families.reduce((sum, f) => sum + monthlyForFamily(students, f), 0);
    const noCard = families.filter((f) => { var _a; return !f.card_last_four && !f.square_customer_id && ((_a = f.billing_status) !== null && _a !== void 0 ? _a : "active").toLowerCase() === "active"; }).length;
    return (_jsxs(PageShell, { title: "Roster", children: [_jsx(AgentPageBar, { agentId: "sid", chatPlaceholder: "Ask Sid about any student on the roster\u2026", pageContext: { page: "roster" } }), _jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
                            { val: totalActive, label: "Active students", color: "var(--z-accent)" },
                            { val: totalFamilies, label: "Active families", color: "var(--z-fg)" },
                            { val: `$${totalMonthly.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, label: "Monthly revenue", color: "#4ADE80" },
                            { val: noCard, label: "No card on file", color: "#F87171" },
                        ].map(({ val, label, color }) => (_jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-2xl font-extrabold", style: { color }, children: val }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: label })] }, label))) }), _jsxs("div", { children: [_jsx("p", { className: "mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--z-muted)]", children: "Click a studio to filter" }), _jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: locationStats.map((stat) => (_jsx(LocationCard, { stat: stat, isActive: activeLocationId === stat.id, onClick: () => toggleLocation(stat.id) }, stat.id))) })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("input", { type: "search", placeholder: "Search families, email, phone\u2026", value: search, onChange: (e) => setSearch(e.target.value), className: "h-9 w-64 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]" }), _jsx("div", { className: "flex overflow-hidden rounded-lg border border-[var(--z-border)] text-sm", children: ["active", "all", "inactive"].map((s) => (_jsx("button", { onClick: () => setStatusFilter(s), className: "px-3 py-1.5 capitalize transition-colors", style: {
                                        background: statusFilter === s ? "var(--z-accent)" : "var(--z-surface)",
                                        color: statusFilter === s ? "var(--z-on-accent)" : "var(--z-muted)",
                                        fontWeight: statusFilter === s ? 700 : 400,
                                    }, children: s }, s))) }), _jsxs("span", { className: "ml-auto text-sm text-[var(--z-muted)]", children: [filteredFamilies.length, " families"] }), _jsx(Link, { href: "/crm/families", className: "text-xs font-semibold hover:underline", style: { color: "var(--z-accent)" }, children: "Full CRM view \u2192" })] }), _jsx("div", { className: "flex flex-wrap gap-4 text-[11px] text-[var(--z-muted)]", children: [
                            { color: "#60A5FA", label: "1 student" },
                            { color: "#4ADE80", label: "2 students" },
                            { color: "#FBBF24", label: "3 students" },
                            { color: "#C084FC", label: "4+ students" },
                            { color: "#555", label: "0 students" },
                        ].map(({ color, label }) => (_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "h-2 w-2 rounded-full", style: { background: color } }), label] }, label))) }), _jsxs("div", { className: "rounded-xl border border-[var(--z-border)] overflow-hidden", children: [_jsxs("div", { className: "hidden sm:grid px-0 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--z-muted)]", style: {
                                    gridTemplateColumns: "4px 1.8fr 110px 100px 1fr 130px 150px",
                                    columnGap: "12px",
                                    paddingRight: "14px",
                                    background: "var(--z-surface)",
                                    borderBottom: "1px solid var(--z-border)",
                                    alignItems: "center",
                                }, children: [_jsx("div", {}), _jsx("div", { className: "pl-5", children: "Name" }), _jsx("div", { children: "Students" }), _jsx("div", { children: "Monthly" }), _jsx("div", { children: "Email" }), _jsx("div", { children: "Phone" }), _jsx("div", { children: "Card" })] }), _jsx("div", { children: filteredFamilies.length === 0 ? (_jsx("div", { className: "px-6 py-12 text-center text-sm text-[var(--z-muted)]", children: "No families match your filters." })) : (filteredFamilies.map((family) => (_jsx(FamilyTableRow, { family: family, students: students, teacherNames: teacherNames, isExpanded: expandedFamilies.has(family.id), onToggle: () => toggleFamily(family.id), showContactSub: duplicateNames.has(displayName(family.name).toLowerCase()) }, family.id)))) })] })] })] }));
}
