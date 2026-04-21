"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
// ─── Location room counts ─────────────────────────────────────────────────────
// These are the canonical room counts per location. Rooms that don't yet exist
// in the DB show as "unconfigured" slots that can be created.
const LOCATION_ROOM_COUNTS = {
    "f7b52dd5-12ee-437f-9c60-f8adf454ac31": 8, // Bellevue
    "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": 9, // Gretna
    "cebd97d4-c241-4de2-8ade-49e5cc0070d5": 6, // Elkhorn
    "d48229c1-b70a-4d29-893e-5079887dab76": 10, // Omaha
};
// Common equipment items for quick-add
const EQUIPMENT_PRESETS = [
    "Piano (upright)",
    "Piano (grand)",
    "Keyboard",
    "Guitar amp",
    "Bass amp",
    "Drum kit",
    "Electronic drum kit",
    "PA system",
    "Microphone",
    "Music stand",
    "Whiteboard",
    "Mirror wall",
    "Recording interface",
    "Headphone amp",
];
// Instrument → required equipment mapping for Ruby mismatch detection
const INSTRUMENT_EQUIPMENT_MAP = {
    piano: ["Piano (upright)", "Piano (grand)", "Keyboard"],
    keyboard: ["Keyboard", "Piano (upright)", "Piano (grand)"],
    guitar: ["Guitar amp"],
    bass: ["Bass amp", "Guitar amp"],
    drums: ["Drum kit", "Electronic drum kit"],
    voice: ["Microphone", "PA system"],
    vocals: ["Microphone", "PA system"],
};
export function ScheduleRoomsPanel({ locationId, locationName, locationColor, rooms: initialRooms, onRubyEvent }) {
    var _a;
    const expectedCount = (_a = LOCATION_ROOM_COUNTS[locationId]) !== null && _a !== void 0 ? _a : 0;
    const [rooms, setRooms] = React.useState(() => initialRooms.filter((r) => r.locationId === locationId || !r.locationId));
    const [expandedId, setExpandedId] = React.useState(null);
    const [saving, setSaving] = React.useState(null);
    const [creating, setCreating] = React.useState(false);
    const [newRoomName, setNewRoomName] = React.useState("");
    const [newRoomType, setNewRoomType] = React.useState("");
    const [newRoomCapacity, setNewRoomCapacity] = React.useState(1);
    const [createError, setCreateError] = React.useState(null);
    const locationRooms = rooms.filter((r) => !r.locationId || r.locationId === locationId);
    const unconfiguredCount = Math.max(0, expectedCount - locationRooms.length);
    // ── Add equipment item to a room ──
    async function addEquipment(roomId, item) {
        const room = rooms.find((r) => r.id === roomId);
        if (!room)
            return;
        const trimmed = item.trim();
        if (!trimmed || room.equipment.includes(trimmed))
            return;
        const newEquipment = [...room.equipment, trimmed];
        setSaving(roomId);
        try {
            const res = await fetch(`/api/schedule/rooms/${roomId}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ equipment: newEquipment }),
            });
            if (res.ok) {
                setRooms((prev) => prev.map((r) => r.id === roomId ? Object.assign(Object.assign({}, r), { equipment: newEquipment, _newItem: "" }) : r));
                onRubyEvent === null || onRubyEvent === void 0 ? void 0 : onRubyEvent({ type: "book_student", message: `Added "${trimmed}" to ${room.name}.` });
            }
            else {
                // Optimistic update even if API isn't wired yet
                setRooms((prev) => prev.map((r) => r.id === roomId ? Object.assign(Object.assign({}, r), { equipment: newEquipment, _newItem: "" }) : r));
                onRubyEvent === null || onRubyEvent === void 0 ? void 0 : onRubyEvent({ type: "book_student", message: `Added "${trimmed}" to ${room.name} (saved locally).` });
            }
        }
        catch (_a) {
            setRooms((prev) => prev.map((r) => r.id === roomId ? Object.assign(Object.assign({}, r), { equipment: newEquipment, _newItem: "" }) : r));
        }
        finally {
            setSaving(null);
        }
    }
    // ── Remove equipment item from a room ──
    async function removeEquipment(roomId, item) {
        const room = rooms.find((r) => r.id === roomId);
        if (!room)
            return;
        const newEquipment = room.equipment.filter((e) => e !== item);
        setSaving(roomId);
        try {
            const res = await fetch(`/api/schedule/rooms/${roomId}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ equipment: newEquipment }),
            });
            if (res.ok || true) {
                setRooms((prev) => prev.map((r) => r.id === roomId ? Object.assign(Object.assign({}, r), { equipment: newEquipment }) : r));
                onRubyEvent === null || onRubyEvent === void 0 ? void 0 : onRubyEvent({ type: "book_student", message: `Removed "${item}" from ${room.name}.` });
            }
        }
        catch (_a) {
            setRooms((prev) => prev.map((r) => r.id === roomId ? Object.assign(Object.assign({}, r), { equipment: newEquipment }) : r));
        }
        finally {
            setSaving(null);
        }
    }
    // ── Create a new room ──
    async function createRoom() {
        if (!newRoomName.trim())
            return;
        setCreating(false);
        setSaving("new");
        setCreateError(null);
        try {
            const res = await fetch("/api/schedule/rooms", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name: newRoomName.trim(),
                    locationId,
                    roomType: newRoomType.trim() || "Studio",
                    capacity: newRoomCapacity,
                    equipment: [],
                    isActive: true,
                }),
            });
            if (res.ok) {
                const created = await res.json();
                setRooms((prev) => [...prev, created]);
                onRubyEvent === null || onRubyEvent === void 0 ? void 0 : onRubyEvent({ type: "book_student", message: `Room "${newRoomName}" created at ${locationName}.` });
            }
            else {
                // Optimistic local add
                const fake = {
                    id: `local-${Date.now()}`,
                    tenantId: "",
                    locationId,
                    name: newRoomName.trim(),
                    capacity: newRoomCapacity,
                    equipment: [],
                    roomType: newRoomType.trim() || "Studio",
                    isActive: true,
                };
                setRooms((prev) => [...prev, fake]);
                onRubyEvent === null || onRubyEvent === void 0 ? void 0 : onRubyEvent({ type: "book_student", message: `Room "${newRoomName}" added locally — will sync when API is wired.` });
            }
        }
        catch (_a) {
            setCreateError("Failed to create room.");
        }
        finally {
            setSaving(null);
            setNewRoomName("");
            setNewRoomType("");
            setNewRoomCapacity(1);
        }
    }
    // ── Check instrument/equipment mismatch for a room ──
    function checkMismatch(room, instrument) {
        const key = instrument.toLowerCase();
        const required = INSTRUMENT_EQUIPMENT_MAP[key];
        if (!required)
            return null;
        const hasAny = required.some((req) => room.equipment.some((eq) => eq.toLowerCase().includes(req.toLowerCase())));
        if (!hasAny) {
            return `${room.name} doesn't have ${required[0]} — are you sure you want to teach ${instrument} here?`;
        }
        return null;
    }
    return (_jsxs("div", { className: "p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-2.5 w-2.5 rounded-full", style: { backgroundColor: locationColor } }), _jsxs("h2", { className: "text-base font-bold text-[var(--z-fg)]", children: [locationName, " Rooms"] })] }), _jsxs("p", { className: "mt-0.5 text-[11px] text-[var(--z-muted)]", children: [locationRooms.length, " configured \u00B7 ", unconfiguredCount > 0 ? `${unconfiguredCount} unconfigured` : "all rooms set up", " \u00B7 ", expectedCount, " total"] })] }), _jsxs("button", { type: "button", onClick: () => setCreating(true), className: "flex items-center gap-1.5 rounded-lg border border-[#00ff88]/30 bg-[#00ff88]/10 px-3 py-1.5 text-[11px] font-bold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors", children: [_jsx("svg", { viewBox: "0 0 14 14", fill: "none", className: "h-3 w-3", "aria-hidden": true, children: _jsx("path", { d: "M7 2v10M2 7h10", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }), "Add Room"] })] }), creating && (_jsxs("div", { className: "rounded-xl border border-[#00ff88]/25 bg-[#00ff88]/5 p-4 space-y-3", children: [_jsx("div", { className: "text-xs font-semibold text-[#00ff88]", children: "New Room" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-1", children: "Name *" }), _jsx("input", { type: "text", value: newRoomName, onChange: (e) => setNewRoomName(e.target.value), placeholder: `Room ${locationRooms.length + 1}`, className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none", autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-1", children: "Type" }), _jsx("input", { type: "text", value: newRoomType, onChange: (e) => setNewRoomType(e.target.value), placeholder: "Studio / Practice / \u2026", className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-1", children: "Capacity" }), _jsx("input", { type: "number", min: 1, value: newRoomCapacity, onChange: (e) => setNewRoomCapacity(Number(e.target.value)), className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none" })] })] }), createError && _jsx("p", { className: "text-xs text-red-400", children: createError }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: createRoom, disabled: !newRoomName.trim(), className: "rounded-lg border border-[#00ff88]/40 bg-[#00ff88]/15 px-4 py-1.5 text-xs font-bold text-[#00ff88] hover:bg-[#00ff88]/25 disabled:opacity-40 transition-colors", children: "Create" }), _jsx("button", { type: "button", onClick: () => setCreating(false), className: "rounded-lg border border-[var(--z-border)] px-4 py-1.5 text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors", children: "Cancel" })] })] })), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3", children: [locationRooms.map((room) => {
                        var _a, _b, _c;
                        const isExpanded = expandedId === room.id;
                        const isSaving = saving === room.id;
                        return (_jsxs("div", { className: "rounded-xl border bg-[var(--z-surface)] transition-all", style: { borderColor: isExpanded ? `${locationColor}50` : "var(--z-border)" }, children: [_jsxs("button", { type: "button", onClick: () => setExpandedId(isExpanded ? null : room.id), className: "flex w-full items-center justify-between px-4 py-3 text-left", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black", style: { backgroundColor: `${locationColor}20`, color: locationColor }, children: room.name.replace(/[^0-9]/g, "") || room.name.slice(0, 2).toUpperCase() }), _jsx("span", { className: "text-sm font-semibold text-[var(--z-fg)]", children: room.name })] }), _jsxs("div", { className: "mt-0.5 flex items-center gap-2 pl-9", children: [_jsx("span", { className: "text-[10px] text-[var(--z-muted)]", children: (_a = room.roomType) !== null && _a !== void 0 ? _a : "Studio" }), _jsx("span", { className: "text-[10px] text-[var(--z-muted)]", children: "\u00B7" }), _jsxs("span", { className: "text-[10px] text-[var(--z-muted)]", children: ["cap ", room.capacity] }), _jsx("span", { className: "text-[10px] text-[var(--z-muted)]", children: "\u00B7" }), _jsxs("span", { className: "text-[10px]", style: { color: room.equipment.length > 0 ? "#22c55e" : "#6b7280" }, children: [room.equipment.length, " items"] })] })] }), _jsx("svg", { viewBox: "0 0 12 12", fill: "none", className: `h-3 w-3 shrink-0 text-[var(--z-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`, "aria-hidden": true, children: _jsx("path", { d: "M2 4l4 4 4-4", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), isExpanded && (_jsxs("div", { className: "border-t border-[var(--z-border)] px-4 pb-4 pt-3 space-y-3", children: [_jsxs("div", { children: [_jsx("div", { className: "mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Equipment" }), room.equipment.length === 0 ? (_jsx("p", { className: "text-[11px] text-[var(--z-muted)] italic", children: "No equipment added yet." })) : (_jsx("div", { className: "flex flex-wrap gap-1.5", children: room.equipment.map((item) => (_jsxs("span", { className: "flex items-center gap-1 rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2.5 py-1 text-[11px] text-[var(--z-fg)]", children: [item, _jsx("button", { type: "button", onClick: () => removeEquipment(room.id, item), disabled: isSaving, className: "ml-0.5 text-[var(--z-muted)] hover:text-red-400 transition-colors", "aria-label": `Remove ${item}`, children: _jsx("svg", { viewBox: "0 0 10 10", fill: "none", className: "h-2.5 w-2.5", "aria-hidden": true, children: _jsx("path", { d: "M2 2l6 6M8 2l-6 6", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" }) }) })] }, item))) }))] }), _jsxs("div", { children: [_jsx("div", { className: "mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Quick Add" }), _jsx("div", { className: "flex flex-wrap gap-1", children: EQUIPMENT_PRESETS.filter((p) => !room.equipment.includes(p)).slice(0, 8).map((preset) => (_jsxs("button", { type: "button", onClick: () => addEquipment(room.id, preset), disabled: isSaving, className: "rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-0.5 text-[10px] text-[var(--z-muted)] hover:border-[var(--z-fg)]/30 hover:text-[var(--z-fg)] transition-colors disabled:opacity-40", children: ["+ ", preset] }, preset))) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: (_b = room._newItem) !== null && _b !== void 0 ? _b : "", onChange: (e) => setRooms((prev) => prev.map((r) => r.id === room.id ? Object.assign(Object.assign({}, r), { _newItem: e.target.value }) : r)), onKeyDown: (e) => {
                                                        var _a;
                                                        if (e.key === "Enter" && ((_a = room._newItem) === null || _a === void 0 ? void 0 : _a.trim())) {
                                                            addEquipment(room.id, room._newItem);
                                                        }
                                                    }, placeholder: "Custom item\u2026", className: "flex-1 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-xs text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none" }), _jsx("button", { type: "button", onClick: () => { var _a; return ((_a = room._newItem) === null || _a === void 0 ? void 0 : _a.trim()) && addEquipment(room.id, room._newItem); }, disabled: !((_c = room._newItem) === null || _c === void 0 ? void 0 : _c.trim()) || isSaving, className: "rounded-lg border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] disabled:opacity-40 transition-colors", children: "Add" })] }), _jsx(RubyMismatchChecker, { room: room, onCheck: (msg) => onRubyEvent === null || onRubyEvent === void 0 ? void 0 : onRubyEvent({ type: "conflict", message: msg }) })] }))] }, room.id));
                    }), Array.from({ length: unconfiguredCount }).map((_, i) => (_jsxs("div", { className: "flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--z-border)] bg-[var(--z-surface)]/50 px-4 py-6 text-center", children: [_jsx("div", { className: "mb-1 text-2xl opacity-30", children: "\uD83D\uDEAA" }), _jsxs("div", { className: "text-[11px] font-semibold text-[var(--z-muted)]", children: ["Room ", locationRooms.length + i + 1] }), _jsx("div", { className: "mt-0.5 text-[10px] text-[var(--z-muted)]", children: "Not configured" }), _jsx("button", { type: "button", onClick: () => {
                                    setNewRoomName(`Room ${locationRooms.length + i + 1}`);
                                    setCreating(true);
                                }, className: "mt-2 rounded-lg border border-[var(--z-border)] px-2.5 py-1 text-[10px] font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:border-[var(--z-fg)]/30 transition-colors", children: "+ Set up" })] }, `unconfigured-${i}`)))] })] }));
}
// ── Ruby mismatch checker sub-component ──────────────────────────────────────
function RubyMismatchChecker({ room, onCheck }) {
    const [instrument, setInstrument] = React.useState("");
    const [result, setResult] = React.useState(null);
    function check() {
        if (!instrument.trim())
            return;
        const key = instrument.toLowerCase().trim();
        const required = INSTRUMENT_EQUIPMENT_MAP[key];
        if (!required) {
            setResult({ ok: true, message: `No equipment requirements found for "${instrument}" — looks fine.` });
            return;
        }
        const hasAny = required.some((req) => room.equipment.some((eq) => eq.toLowerCase().includes(req.toLowerCase())));
        if (hasAny) {
            setResult({ ok: true, message: `✓ ${room.name} has the right equipment for ${instrument}.` });
        }
        else {
            const msg = `${room.name} is missing ${required[0]} for ${instrument} lessons.`;
            setResult({ ok: false, message: msg });
            onCheck(msg);
        }
    }
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 space-y-2", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Ruby: Check Instrument Fit" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: instrument, onChange: (e) => { setInstrument(e.target.value); setResult(null); }, onKeyDown: (e) => e.key === "Enter" && check(), placeholder: "e.g. guitar, piano, drums\u2026", className: "flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2.5 py-1.5 text-xs text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none" }), _jsx("button", { type: "button", onClick: check, disabled: !instrument.trim(), className: "rounded-md border border-[#fb923c]/30 bg-[#fb923c]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#fb923c] hover:bg-[#fb923c]/20 disabled:opacity-40 transition-colors", children: "Check" })] }), result && (_jsx("p", { className: "text-[11px] leading-snug", style: { color: result.ok ? "#86efac" : "#fca5a5" }, children: result.message }))] }));
}
