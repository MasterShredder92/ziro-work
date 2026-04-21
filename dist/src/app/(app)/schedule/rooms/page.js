import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from "next/link";
import { resolveScheduleContext } from "../guard";
import { listScheduleRooms } from "@data/scheduleRooms";
import { createRoomAction } from "./actions";
export const dynamic = "force-dynamic";
// ─── Canonical location registry ─────────────────────────────────────────────
const LOCATIONS = [
    { id: "f7b52dd5-12ee-437f-9c60-f8adf454ac31", name: "Bellevue", color: "#7C3AED", expectedRooms: 8 },
    { id: "d48229c1-b70a-4d29-893e-5079887dab76", name: "Omaha", color: "#DC2626", expectedRooms: 10 },
    { id: "cebd97d4-c241-4de2-8ade-49e5cc0070d5", name: "Elkhorn", color: "#0EA5E9", expectedRooms: 6 },
    { id: "40c67ffc-91b5-46a9-94bd-6ddffdfb7638", name: "Gretna", color: "#16A34A", expectedRooms: 9 },
];
const INPUT_CLASS = "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[#00ff88]/50 focus:outline-none";
// ─── Natural sort: "Room 2" < "Room 10" ──────────────────────────────────────
function naturalSortKey(name) {
    const m = name.match(/\d+/);
    return m ? parseInt(m[0], 10) : 999;
}
export default async function RoomManagerPage() {
    let ctx;
    try {
        ctx = await resolveScheduleContext();
    }
    catch (_a) {
        return _jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Forbidden." });
    }
    const allRooms = await listScheduleRooms(ctx.tenantId);
    // Group rooms by locationId, sort each group numerically
    const roomsByLocation = new Map();
    for (const loc of LOCATIONS) {
        const locRooms = allRooms
            .filter((r) => r.locationId === loc.id)
            .sort((a, b) => naturalSortKey(a.name) - naturalSortKey(b.name));
        roomsByLocation.set(loc.id, locRooms);
    }
    // Rooms with no matching location (shouldn't happen but handle gracefully)
    const knownLocationIds = new Set(LOCATIONS.map((l) => l.id));
    const orphanRooms = allRooms
        .filter((r) => !r.locationId || !knownLocationIds.has(r.locationId))
        .sort((a, b) => naturalSortKey(a.name) - naturalSortKey(b.name));
    return (_jsxs("div", { className: "space-y-8 max-w-5xl", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Schedule OS \u00B7 Rooms" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Room Manager" }), _jsx("p", { className: "text-xs text-[var(--z-muted)] mt-0.5", children: "Practice rooms and studios by location \u2014 with capacity and equipment." })] }), LOCATIONS.map((loc) => {
                var _a;
                const rooms = (_a = roomsByLocation.get(loc.id)) !== null && _a !== void 0 ? _a : [];
                const configured = rooms.length;
                const unconfigured = Math.max(0, loc.expectedRooms - configured);
                return (_jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-3 w-3 rounded-full", style: { backgroundColor: loc.color } }), _jsx("h2", { className: "text-sm font-bold text-[var(--z-fg)]", children: loc.name }), _jsxs("span", { className: "text-[11px] text-[var(--z-muted)]", children: [configured, " / ", loc.expectedRooms, " rooms configured"] })] }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)]", children: _jsxs("tr", { className: "text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: [_jsx("th", { className: "px-4 py-2 font-semibold", children: "Room" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Type" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Cap" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Equipment" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Status" }), _jsx("th", { className: "px-4 py-2" })] }) }), _jsx("tbody", { children: rooms.length === 0 && unconfigured === 0 ? (_jsx("tr", { children: _jsxs("td", { colSpan: 6, className: "px-4 py-6 text-center text-[var(--z-muted)] text-xs", children: ["No rooms configured for ", loc.name, " yet."] }) })) : (_jsxs(_Fragment, { children: [rooms.map((r) => {
                                                    var _a;
                                                    return (_jsxs("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/3", children: [_jsx("td", { className: "px-4 py-2 font-semibold text-[var(--z-fg)]", children: r.name }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: (_a = r.roomType) !== null && _a !== void 0 ? _a : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: r.capacity }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)] truncate max-w-[220px]", children: r.equipment.length ? r.equipment.join(", ") : "—" }), _jsx("td", { className: "px-4 py-2", children: r.isActive ? (_jsx("span", { className: "text-[#00ff88] text-xs font-semibold", children: "Active" })) : (_jsx("span", { className: "text-[var(--z-muted)] text-xs", children: "Inactive" })) }), _jsx("td", { className: "px-4 py-2 text-right", children: _jsx(Link, { href: `/schedule/rooms/${r.id}`, className: "text-xs text-[#00ff88] hover:underline", children: "Manage \u2192" }) })] }, r.id));
                                                }), Array.from({ length: unconfigured }).map((_, i) => (_jsxs("tr", { className: "border-t border-[var(--z-border)] opacity-40", children: [_jsxs("td", { className: "px-4 py-2 text-[var(--z-muted)] italic text-xs", children: ["Room ", configured + i + 1, " \u2014 not configured"] }), _jsx("td", { colSpan: 5, className: "px-4 py-2" })] }, `uncfg-${i}`)))] })) })] }) })] }, loc.id));
            }), orphanRooms.length > 0 && (_jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-3 w-3 rounded-full bg-[var(--z-muted)]" }), _jsx("h2", { className: "text-sm font-bold text-[var(--z-muted)]", children: "Unassigned" })] }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)]", children: _jsxs("tr", { className: "text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: [_jsx("th", { className: "px-4 py-2 font-semibold", children: "Room" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Type" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Cap" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Equipment" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Status" }), _jsx("th", { className: "px-4 py-2" })] }) }), _jsx("tbody", { children: orphanRooms.map((r) => {
                                        var _a;
                                        return (_jsxs("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/3", children: [_jsx("td", { className: "px-4 py-2 font-semibold text-[var(--z-fg)]", children: r.name }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: (_a = r.roomType) !== null && _a !== void 0 ? _a : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: r.capacity }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)] truncate max-w-[220px]", children: r.equipment.length ? r.equipment.join(", ") : "—" }), _jsx("td", { className: "px-4 py-2", children: r.isActive ? (_jsx("span", { className: "text-[#00ff88] text-xs font-semibold", children: "Active" })) : (_jsx("span", { className: "text-[var(--z-muted)] text-xs", children: "Inactive" })) }), _jsx("td", { className: "px-4 py-2 text-right", children: _jsx(Link, { href: `/schedule/rooms/${r.id}`, className: "text-xs text-[#00ff88] hover:underline", children: "Manage \u2192" }) })] }, r.id));
                                    }) })] }) })] })), ctx.canWrite ? (_jsxs("form", { action: createRoomAction, className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Add a room" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: [_jsx(Field, { label: "Name", required: true, children: _jsx("input", { name: "name", required: true, placeholder: "Room 1", className: INPUT_CLASS }) }), _jsx(Field, { label: "Location", required: true, children: _jsxs("select", { name: "locationId", required: true, className: INPUT_CLASS, children: [_jsx("option", { value: "", children: "Select location\u2026" }), LOCATIONS.map((loc) => (_jsx("option", { value: loc.id, children: loc.name }, loc.id)))] }) }), _jsx(Field, { label: "Room type", children: _jsx("input", { name: "roomType", placeholder: "Studio / Practice / \u2026", className: INPUT_CLASS }) }), _jsx(Field, { label: "Capacity", children: _jsx("input", { type: "number", name: "capacity", defaultValue: 1, min: 1, className: INPUT_CLASS }) }), _jsx(Field, { label: "Equipment (comma-separated)", children: _jsx("input", { name: "equipment", placeholder: "piano, mic, stand", className: INPUT_CLASS }) })] }), _jsx("button", { type: "submit", className: "rounded-lg border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/20", children: "Create room" })] })) : null] }));
}
function Field({ label, required, children, }) {
    return (_jsxs("label", { className: "flex flex-col gap-1", children: [_jsxs("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: [label, required ? _jsx("span", { className: "text-amber-300", children: " *" }) : null] }), children] }));
}
