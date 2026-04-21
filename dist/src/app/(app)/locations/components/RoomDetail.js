import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
function Stat({ label, value }) {
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: "mt-1 text-2xl font-semibold text-[var(--z-fg)]", children: value })] }));
}
export function RoomDetail({ data }) {
    const { room, location, summary } = data;
    return (_jsxs("section", { className: "flex flex-col gap-5", children: [_jsxs("header", { className: "flex flex-col gap-1", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Room surface" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: room.name }), location ? (_jsxs("p", { className: "text-sm text-[var(--z-muted)]", children: ["At", " ", _jsx(Link, { className: "text-[var(--z-accent)] hover:underline", href: `/locations/${location.id}`, children: location.name }), room.room_type ? ` · ${room.room_type}` : "", room.floor ? ` · Floor ${room.floor}` : ""] })) : null] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: [_jsx(Stat, { label: "Blocks", value: summary.totalBlocks }), _jsx(Stat, { label: "Utilization", value: `${summary.utilizationPct}%` }), _jsx(Stat, { label: "Teachers", value: summary.uniqueTeacherCount }), _jsx(Stat, { label: "Students", value: summary.uniqueStudentCount })] })] }));
}
