import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
function utilizationTint(pct) {
    if (pct >= 80)
        return "text-[var(--z-danger,#b91c1c)]";
    if (pct >= 50)
        return "text-[var(--z-accent)]";
    return "text-[var(--z-muted)]";
}
export function RoomList({ rooms, summaries = [] }) {
    const byRoom = new Map(summaries.map((s) => [s.roomId, s]));
    if (rooms.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-sm text-[var(--z-muted)]", children: "No rooms configured for this location yet." }));
    }
    return (_jsx("ul", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", children: rooms.map((room) => {
            var _a, _b;
            const s = byRoom.get(room.id);
            const utilPct = (_a = s === null || s === void 0 ? void 0 : s.utilizationPct) !== null && _a !== void 0 ? _a : 0;
            return (_jsx("li", { children: _jsxs(Link, { href: `/locations/rooms/${room.id}`, className: "group flex h-full flex-col gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 transition hover:border-[var(--z-accent)]", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("h3", { className: "truncate text-sm font-semibold text-[var(--z-fg)]", children: room.name }), room.is_active === false ? (_jsx("span", { className: "rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)]", children: "Inactive" })) : null] }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: [(_b = room.room_type) !== null && _b !== void 0 ? _b : "Room", room.floor ? ` · Floor ${room.floor}` : ""] }), _jsxs("div", { className: "mt-auto flex items-center justify-between text-xs", children: [_jsxs("span", { className: utilizationTint(utilPct), children: [utilPct, "% utilized"] }), _jsx("span", { className: "text-[var(--z-accent)] group-hover:underline", children: "View \u2192" })] })] }) }, room.id));
        }) }));
}
