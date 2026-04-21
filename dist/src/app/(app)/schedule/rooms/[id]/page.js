import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveScheduleContext } from "../../guard";
import { getScheduleRoom } from "@data/scheduleRooms";
import { listRoomBookings } from "@data/roomBookings";
import { bookRoomAction, deleteRoomAction, updateRoomAction, } from "../actions";
export const dynamic = "force-dynamic";
const INPUT_CLASS = "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[#00ff88]/50 focus:outline-none";
export default async function RoomDetailPage({ params, }) {
    var _a, _b, _c;
    const ctx = await resolveScheduleContext().catch(() => null);
    if (!ctx) {
        return _jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Forbidden." });
    }
    const { id } = await params;
    const room = await getScheduleRoom(id, ctx.tenantId);
    if (!room)
        notFound();
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 1);
    const to = new Date(now);
    to.setDate(to.getDate() + 14);
    const bookings = await listRoomBookings(ctx.tenantId, {
        room_id: room.id,
        start_from: from.toISOString(),
        start_to: to.toISOString(),
    }, { limit: 500 });
    const update = updateRoomAction.bind(null, room.id);
    const del = deleteRoomAction.bind(null, room.id);
    const book = bookRoomAction.bind(null, room.id);
    return (_jsxs("div", { className: "space-y-6 max-w-4xl", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Schedule OS \u00B7 Room" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: room.name }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] mt-0.5", children: ["Capacity ", room.capacity, " \u00B7", " ", room.isActive ? "Active" : "Inactive", " \u00B7", " ", (_a = room.roomType) !== null && _a !== void 0 ? _a : "—"] })] }), ctx.canWrite ? (_jsxs("form", { action: update, className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Details" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsx(Field, { label: "Name", children: _jsx("input", { name: "name", defaultValue: room.name, className: INPUT_CLASS }) }), _jsx(Field, { label: "Capacity", children: _jsx("input", { type: "number", name: "capacity", min: 1, defaultValue: room.capacity, className: INPUT_CLASS }) }), _jsx(Field, { label: "Location ID", children: _jsx("input", { name: "locationId", defaultValue: (_b = room.locationId) !== null && _b !== void 0 ? _b : "", className: INPUT_CLASS }) }), _jsx(Field, { label: "Room type", children: _jsx("input", { name: "roomType", defaultValue: (_c = room.roomType) !== null && _c !== void 0 ? _c : "", className: INPUT_CLASS }) }), _jsx(Field, { label: "Equipment (comma-separated)", children: _jsx("input", { name: "equipment", defaultValue: room.equipment.join(", "), className: INPUT_CLASS }) }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-[var(--z-fg)] mt-6", children: [_jsx("input", { type: "checkbox", name: "isActive", defaultChecked: room.isActive }), "Active"] })] }), _jsx("button", { type: "submit", className: "rounded-lg border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/20", children: "Save room" })] })) : null, _jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: [_jsxs("header", { className: "px-4 py-3 border-b border-[var(--z-border)] flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Bookings timeline" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Next 14 days" })] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [bookings.length, " booking", bookings.length === 1 ? "" : "s"] })] }), bookings.length === 0 ? (_jsx("div", { className: "px-4 py-8 text-center text-sm text-[var(--z-muted)]", children: "No upcoming bookings." })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: bookings.map((b) => {
                            var _a;
                            return (_jsxs("li", { className: "px-4 py-3 flex items-center gap-3", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-[#00ff88]" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "text-sm font-medium text-[var(--z-fg)] truncate", children: (_a = b.purpose) !== null && _a !== void 0 ? _a : "Booking" }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)]", children: [new Date(b.startTime).toLocaleString(), " \u2192", " ", new Date(b.endTime).toLocaleTimeString(), b.eventId ? (_jsxs(_Fragment, { children: [" ", "\u00B7", " ", _jsx(Link, { href: `/schedule/events/${b.eventId}`, className: "text-[#00ff88] hover:underline", children: "event" })] })) : null] })] })] }, b.id));
                        }) }))] }), ctx.canWrite ? (_jsxs("form", { action: book, className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Book an existing event into this room" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsx(Field, { label: "Event ID", children: _jsx("input", { name: "eventId", className: INPUT_CLASS, required: true }) }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-[var(--z-fg)] mt-6", children: [_jsx("input", { type: "checkbox", name: "allowConflict" }), "Allow conflict"] })] }), _jsx("button", { type: "submit", className: "rounded-lg border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/20", children: "Book event" })] })) : null, ctx.canWrite ? (_jsx("form", { action: del, children: _jsx("button", { type: "submit", className: "rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20", children: "Delete room" }) })) : null] }));
}
function Field({ label, children, }) {
    return (_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), children] }));
}
