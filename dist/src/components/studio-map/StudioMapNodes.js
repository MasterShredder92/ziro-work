"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from "next/link";
import { Handle, Position } from "@xyflow/react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { Loader2 } from "lucide-react";
// ── Location color palette (matches roster/invoices) ─────────────────────────
export const LOCATION_COLORS = {
    "f7b52dd5-12ee-437f-9c60-f8adf454ac31": { color: "#7C3AED", glow: "rgba(124,58,237,0.45)", label: "Bellevue" },
    "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": { color: "#16A34A", glow: "rgba(22,163,74,0.45)", label: "Gretna" },
    "cebd97d4-c241-4de2-8ade-49e5cc0070d5": { color: "#0EA5E9", glow: "rgba(14,165,233,0.45)", label: "Elkhorn" },
    "d48229c1-b70a-4d29-893e-5079887dab76": { color: "#DC2626", glow: "rgba(220,38,38,0.45)", label: "Omaha" },
};
const DEFAULT_LOC = { color: "#6366f1", glow: "rgba(99,102,241,0.45)", label: "Location" };
function getLocColor(id) {
    var _a;
    return (_a = LOCATION_COLORS[id]) !== null && _a !== void 0 ? _a : DEFAULT_LOC;
}
// ── Shared orb shell ──────────────────────────────────────────────────────────
function Orb({ size, color, glow, children, className, style, }) {
    const glowSize = Math.round(size * 0.6);
    return (_jsxs("div", { className: cn("relative flex flex-col items-center justify-center rounded-full border-2 text-center select-none", className), style: Object.assign({ width: size, height: size, borderColor: `${color}66`, background: `radial-gradient(circle at 38% 32%, ${color}22 0%, #0d0d1a 70%)`, boxShadow: `0 0 0 1px ${color}33, 0 0 ${glowSize}px ${glow}, inset 0 1px 0 ${color}22` }, style), children: [_jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-[3px] rounded-full", style: { background: `radial-gradient(circle at 30% 25%, ${color}18 0%, transparent 60%)` } }), children] }));
}
// ── Company orb (center / owner) ──────────────────────────────────────────────
export function CompanyOrbNode({ data }) {
    const d = data;
    const color = "#f59e0b";
    const glow = "rgba(245,158,11,0.5)";
    return (_jsxs(_Fragment, { children: [_jsx(Handle, { type: "source", position: Position.Bottom, style: { opacity: 0 } }), _jsxs(Orb, { size: 130, color: color, glow: glow, children: [_jsx("span", { className: "px-2 text-center text-[0.65rem] font-black uppercase leading-tight tracking-[0.16em]", style: { color }, children: d.label }), d.subtitle ? (_jsx("span", { className: "mt-1 px-2 text-[0.55rem] font-medium leading-tight text-white/50", children: d.subtitle })) : null] })] }));
}
// ── Location orb ──────────────────────────────────────────────────────────────
export function LocationOrbNode({ data }) {
    const d = data;
    const { color, glow } = getLocColor(d.locationId);
    const activeGlow = d.expanded ? glow : glow.replace("0.45", "0.25");
    const activeStyle = d.expanded
        ? { boxShadow: `0 0 0 3px ${color}44, 0 0 60px ${glow}, inset 0 1px 0 ${color}22` }
        : undefined;
    return (_jsxs(_Fragment, { children: [_jsx(Handle, { type: "target", position: Position.Top, style: { opacity: 0 } }), _jsx(Handle, { type: "source", position: Position.Bottom, style: { opacity: 0 } }), _jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("button", { type: "button", onClick: (e) => { e.stopPropagation(); d.onToggle(); }, className: cn("group transition-transform duration-200 hover:scale-105 active:scale-95", focusRingClassName()), style: { borderRadius: "50%" }, children: _jsx(Orb, { size: 100, color: color, glow: activeGlow, style: activeStyle, children: d.loading ? (_jsx(Loader2, { className: "h-5 w-5 animate-spin", style: { color } })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "px-2 text-[0.62rem] font-bold leading-tight text-white/90", children: d.label }), typeof d.teacherCount === "number" && d.expanded ? (_jsxs("span", { className: "mt-0.5 text-[0.52rem] font-semibold", style: { color }, children: [d.teacherCount, " teachers"] })) : (_jsx("span", { className: "mt-0.5 text-[0.5rem] font-medium text-white/40", children: d.expanded ? "expanded" : "tap to expand" }))] })) }) }), _jsx(Link, { href: d.href, onClick: (e) => e.stopPropagation(), className: "text-[0.58rem] font-semibold underline-offset-2 hover:underline", style: { color }, children: "Schedule" })] })] }));
}
// ── Teacher orb ───────────────────────────────────────────────────────────────
export function TeacherFlowOrbNode({ data }) {
    const d = data;
    const { color, glow } = getLocColor(d.locationId);
    const teacherGlow = glow.replace("0.45", "0.30");
    return (_jsxs(_Fragment, { children: [_jsx(Handle, { type: "target", position: Position.Top, style: { opacity: 0 } }), _jsx(Handle, { type: "source", position: Position.Bottom, style: { opacity: 0 } }), _jsxs("div", { className: "flex flex-col items-center gap-1.5", children: [_jsx("button", { type: "button", onClick: (e) => { e.stopPropagation(); d.onToggle(); }, className: cn("group transition-transform duration-200 hover:scale-105 active:scale-95", focusRingClassName()), style: { borderRadius: "50%" }, children: _jsx(Orb, { size: 76, color: color, glow: teacherGlow, children: d.loading ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin", style: { color } })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-sm font-black leading-none", style: { color }, children: d.initials || "?" }), _jsx("span", { className: "mt-0.5 px-1 text-[0.5rem] font-medium leading-tight text-white/60 line-clamp-1 max-w-[4rem]", children: d.label.split(" ")[0] })] })) }) }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-[0.55rem] font-semibold text-white/70 max-w-[5rem] line-clamp-1", children: d.label }), _jsxs("p", { className: "text-[0.5rem] text-white/40", children: [d.studentCount, " students", d.openSlotCount > 0 ? ` · ${d.openSlotCount} open` : ""] })] })] })] }));
}
// ── Student mini orb ──────────────────────────────────────────────────────────
export function StudentMiniNode({ data }) {
    const d = data;
    const color = d.active ? "#34d399" : "#6b7280";
    const glow = d.active ? "rgba(52,211,153,0.35)" : "rgba(107,114,128,0.2)";
    return (_jsxs(_Fragment, { children: [_jsx(Handle, { type: "target", position: Position.Top, style: { opacity: 0 } }), _jsxs(Link, { href: d.href, onClick: (e) => e.stopPropagation(), className: cn("group flex flex-col items-center gap-1 transition-transform duration-150 hover:scale-110", focusRingClassName()), style: { borderRadius: "50%" }, children: [_jsx(Orb, { size: 52, color: color, glow: glow, className: cn(!d.active && "opacity-50 hover:opacity-80"), children: _jsx("span", { className: "text-[0.55rem] font-black leading-none", style: { color }, children: d.initials }) }), _jsx("span", { className: "max-w-[4.5rem] text-center text-[0.5rem] font-medium leading-tight text-white/60 line-clamp-2", children: d.label })] })] }));
}
// ── Agent Pipeline Node (The Senior Operator Card) ──────────────────────────
export function AgentPipelineNode({ data }) {
    const d = data;
    const isZiro = d.isDirector;
    return (_jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute inset-0 rounded-2xl blur-xl opacity-20 transition-opacity group-hover:opacity-40", style: { backgroundColor: d.accent } }), _jsxs("div", { className: cn("relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 bg-[#0a0a0f] transition-all duration-300", isZiro ? "w-48 h-56 scale-110" : "w-40 h-48", focusRingClassName()), style: {
                    borderColor: `${d.accent}44`,
                    boxShadow: `0 0 20px ${d.glow}`
                }, children: [_jsx("div", { className: cn("relative rounded-full overflow-hidden border-2", isZiro ? "h-20 w-20" : "h-16 w-16"), style: { borderColor: d.accent }, children: _jsx("img", { src: d.image, alt: d.name, className: "h-full w-full object-cover" }) }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "flex items-center justify-center gap-1.5", children: [_jsx("span", { className: "text-xs font-black tracking-tight text-white uppercase", children: d.name }), isZiro && (_jsx("span", { className: "px-1 py-0.5 rounded text-[8px] font-bold bg-white/10 text-white border border-white/20", children: "DIR" }))] }), _jsx("p", { className: "text-[9px] font-medium text-white/50 leading-tight mt-1", children: d.role })] }), _jsxs("div", { className: "mt-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10", children: [_jsx("div", { className: "h-1.5 w-1.5 rounded-full animate-pulse", style: { backgroundColor: d.accent } }), _jsx("span", { className: "text-[8px] font-bold uppercase tracking-wider text-white/70", children: d.status || "Ready" })] }), _jsx(Handle, { type: "target", position: Position.Left, style: { opacity: 0 } }), _jsx(Handle, { type: "source", position: Position.Right, style: { opacity: 0 } })] })] }));
}
// ── Agents satellite orb ──────────────────────────────────────────────────────
export function AgentsSatelliteNode({ data }) {
    const d = data;
    const color = "#a78bfa";
    const glow = "rgba(167,139,250,0.4)";
    return (_jsxs(_Fragment, { children: [_jsx(Handle, { type: "target", position: Position.Left, style: { opacity: 0 } }), _jsx(Link, { href: d.href, onClick: (e) => e.stopPropagation(), className: cn("group transition-transform duration-200 hover:scale-110", focusRingClassName()), style: { borderRadius: "50%" }, children: _jsxs(Orb, { size: 64, color: color, glow: glow, children: [_jsx("span", { className: "text-[0.52rem] font-black uppercase tracking-[0.1em]", style: { color }, children: "Agents" }), _jsx("span", { className: "mt-0.5 text-[0.48rem] text-white/40", children: "7 active" })] }) })] }));
}
