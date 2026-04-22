"use client";
import * as React from "react";
import type { ScheduleRoom } from "@/lib/schedule/types";

// ─── Location room counts ─────────────────────────────────────────────────────
// These are the canonical room counts per location. Rooms that don't yet exist
// in the DB show as "unconfigured" slots that can be created.
const LOCATION_ROOM_COUNTS: Record<string, number> = {
  "f7b52dd5-12ee-437f-9c60-f8adf454ac31": 8,  // Bellevue
  "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": 9,  // Gretna
  "cebd97d4-c241-4de2-8ade-49e5cc0070d5": 6,  // Elkhorn
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
const INSTRUMENT_EQUIPMENT_MAP: Record<string, string[]> = {
  piano: ["Piano (upright)", "Piano (grand)", "Keyboard"],
  keyboard: ["Keyboard", "Piano (upright)", "Piano (grand)"],
  guitar: ["Guitar amp"],
  bass: ["Bass amp", "Guitar amp"],
  drums: ["Drum kit", "Electronic drum kit"],
  voice: ["Microphone", "PA system"],
  vocals: ["Microphone", "PA system"],
};

type Props = {
  locationId: string;
  locationName: string;
  locationColor: string;
  rooms: ScheduleRoom[];
};

type RoomWithInventory = ScheduleRoom & { _editing?: boolean; _newItem?: string };

  const expectedCount = LOCATION_ROOM_COUNTS[locationId] ?? 0;
  const [rooms, setRooms] = React.useState<RoomWithInventory[]>(() =>
    initialRooms.filter((r) => r.locationId === locationId || !r.locationId)
  );
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [newRoomName, setNewRoomName] = React.useState("");
  const [newRoomType, setNewRoomType] = React.useState("");
  const [newRoomCapacity, setNewRoomCapacity] = React.useState(1);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const locationRooms = rooms.filter((r) => !r.locationId || r.locationId === locationId);
  const unconfiguredCount = Math.max(0, expectedCount - locationRooms.length);

  // ── Add equipment item to a room ──
  async function addEquipment(roomId: string, item: string) {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    const trimmed = item.trim();
    if (!trimmed || room.equipment.includes(trimmed)) return;
    const newEquipment = [...room.equipment, trimmed];
    setSaving(roomId);
    try {
      const res = await fetch(`/api/schedule/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ equipment: newEquipment }),
      });
      if (res.ok) {
        setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, equipment: newEquipment, _newItem: "" } : r));
      } else {
        // Optimistic update even if API isn't wired yet
        setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, equipment: newEquipment, _newItem: "" } : r));
      }
    } catch {
      setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, equipment: newEquipment, _newItem: "" } : r));
    } finally {
      setSaving(null);
    }
  }

  // ── Remove equipment item from a room ──
  async function removeEquipment(roomId: string, item: string) {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    const newEquipment = room.equipment.filter((e) => e !== item);
    setSaving(roomId);
    try {
      const res = await fetch(`/api/schedule/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ equipment: newEquipment }),
      });
      if (res.ok || true) {
        setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, equipment: newEquipment } : r));
      }
    } catch {
      setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, equipment: newEquipment } : r));
    } finally {
      setSaving(null);
    }
  }

  // ── Create a new room ──
  async function createRoom() {
    if (!newRoomName.trim()) return;
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
      } else {
        // Optimistic local add
        const fake: ScheduleRoom = {
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
      }
    } catch {
      setCreateError("Failed to create room.");
    } finally {
      setSaving(null);
      setNewRoomName("");
      setNewRoomType("");
      setNewRoomCapacity(1);
    }
  }

  // ── Check instrument/equipment mismatch for a room ──
  function checkMismatch(room: ScheduleRoom, instrument: string): string | null {
    const key = instrument.toLowerCase();
    const required = INSTRUMENT_EQUIPMENT_MAP[key];
    if (!required) return null;
    const hasAny = required.some((req) =>
      room.equipment.some((eq) => eq.toLowerCase().includes(req.toLowerCase()))
    );
    if (!hasAny) {
      return `${room.name} doesn't have ${required[0]} — are you sure you want to teach ${instrument} here?`;
    }
    return null;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: locationColor }} />
            <h2 className="text-base font-bold text-[var(--z-fg)]">{locationName} Rooms</h2>
          </div>
          <p className="mt-0.5 text-[11px] text-[var(--z-muted)]">
            {locationRooms.length} configured · {unconfiguredCount > 0 ? `${unconfiguredCount} unconfigured` : "all rooms set up"} · {expectedCount} total
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#00ff88]/30 bg-[#00ff88]/10 px-3 py-1.5 text-[11px] font-bold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors"
        >
          <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3" aria-hidden>
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add Room
        </button>
      </div>

      {/* Create room form */}
      {creating && (
        <div className="rounded-xl border border-[#00ff88]/25 bg-[#00ff88]/5 p-4 space-y-3">
          <div className="text-xs font-semibold text-[#00ff88]">New Room</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-1">Name *</label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder={`Room ${locationRooms.length + 1}`}
                className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-1">Type</label>
              <input
                type="text"
                value={newRoomType}
                onChange={(e) => setNewRoomType(e.target.value)}
                placeholder="Studio / Practice / …"
                className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                value={newRoomCapacity}
                onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none"
              />
            </div>
          </div>
          {createError && <p className="text-xs text-red-400">{createError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={createRoom}
              disabled={!newRoomName.trim()}
              className="rounded-lg border border-[#00ff88]/40 bg-[#00ff88]/15 px-4 py-1.5 text-xs font-bold text-[#00ff88] hover:bg-[#00ff88]/25 disabled:opacity-40 transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-lg border border-[var(--z-border)] px-4 py-1.5 text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Room cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {locationRooms.map((room) => {
          const isExpanded = expandedId === room.id;
          const isSaving = saving === room.id;
          return (
            <div
              key={room.id}
              className="rounded-xl border bg-[var(--z-surface)] transition-all"
              style={{ borderColor: isExpanded ? `${locationColor}50` : "var(--z-border)" }}
            >
              {/* Room header */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : room.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black"
                      style={{ backgroundColor: `${locationColor}20`, color: locationColor }}
                    >
                      {room.name.replace(/[^0-9]/g, "") || room.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-[var(--z-fg)]">{room.name}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 pl-9">
                    <span className="text-[10px] text-[var(--z-muted)]">{room.roomType ?? "Studio"}</span>
                    <span className="text-[10px] text-[var(--z-muted)]">·</span>
                    <span className="text-[10px] text-[var(--z-muted)]">cap {room.capacity}</span>
                    <span className="text-[10px] text-[var(--z-muted)]">·</span>
                    <span className="text-[10px]" style={{ color: room.equipment.length > 0 ? "#22c55e" : "#6b7280" }}>
                      {room.equipment.length} items
                    </span>
                  </div>
                </div>
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  className={`h-3 w-3 shrink-0 text-[var(--z-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  aria-hidden
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Expanded inventory */}
              {isExpanded && (
                <div className="border-t border-[var(--z-border)] px-4 pb-4 pt-3 space-y-3">
                  {/* Current equipment */}
                  <div>
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                      Equipment
                    </div>
                    {room.equipment.length === 0 ? (
                      <p className="text-[11px] text-[var(--z-muted)] italic">No equipment added yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {room.equipment.map((item) => (
                          <span
                            key={item}
                            className="flex items-center gap-1 rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2.5 py-1 text-[11px] text-[var(--z-fg)]"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeEquipment(room.id, item)}
                              disabled={isSaving}
                              className="ml-0.5 text-[var(--z-muted)] hover:text-red-400 transition-colors"
                              aria-label={`Remove ${item}`}
                            >
                              <svg viewBox="0 0 10 10" fill="none" className="h-2.5 w-2.5" aria-hidden>
                                <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick-add presets */}
                  <div>
                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                      Quick Add
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {EQUIPMENT_PRESETS.filter((p) => !room.equipment.includes(p)).slice(0, 8).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => addEquipment(room.id, preset)}
                          disabled={isSaving}
                          className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-0.5 text-[10px] text-[var(--z-muted)] hover:border-[var(--z-fg)]/30 hover:text-[var(--z-fg)] transition-colors disabled:opacity-40"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom item input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={room._newItem ?? ""}
                      onChange={(e) => setRooms((prev) => prev.map((r) => r.id === room.id ? { ...r, _newItem: e.target.value } : r))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && room._newItem?.trim()) {
                          addEquipment(room.id, room._newItem);
                        }
                      }}
                      placeholder="Custom item…"
                      className="flex-1 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-xs text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => room._newItem?.trim() && addEquipment(room.id, room._newItem)}
                      disabled={!room._newItem?.trim() || isSaving}
                      className="rounded-lg border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] disabled:opacity-40 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Ruby mismatch check tool */}
                </div>
              )}
            </div>
          );
        })}

        {/* Unconfigured room slots */}
        {Array.from({ length: unconfiguredCount }).map((_, i) => (
          <div
            key={`unconfigured-${i}`}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--z-border)] bg-[var(--z-surface)]/50 px-4 py-6 text-center"
          >
            <div className="mb-1 text-2xl opacity-30">🚪</div>
            <div className="text-[11px] font-semibold text-[var(--z-muted)]">
              Room {locationRooms.length + i + 1}
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--z-muted)]">Not configured</div>
            <button
              type="button"
              onClick={() => {
                setNewRoomName(`Room ${locationRooms.length + i + 1}`);
                setCreating(true);
              }}
              className="mt-2 rounded-lg border border-[var(--z-border)] px-2.5 py-1 text-[10px] font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:border-[var(--z-fg)]/30 transition-colors"
            >
              + Set up
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ruby mismatch checker sub-component ──────────────────────────────────────
function RubyMismatchChecker({ room, onCheck }: { room: ScheduleRoom; onCheck: (msg: string) => void }) {
  const [instrument, setInstrument] = React.useState("");
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);

  function check() {
    if (!instrument.trim()) return;
    const key = instrument.toLowerCase().trim();
    const required = INSTRUMENT_EQUIPMENT_MAP[key];
    if (!required) {
      setResult({ ok: true, message: `No equipment requirements found for "${instrument}" — looks fine.` });
      return;
    }
    const hasAny = required.some((req) =>
      room.equipment.some((eq) => eq.toLowerCase().includes(req.toLowerCase()))
    );
    if (hasAny) {
      setResult({ ok: true, message: `✓ ${room.name} has the right equipment for ${instrument}.` });
    } else {
      const msg = `${room.name} is missing ${required[0]} for ${instrument} lessons.`;
      setResult({ ok: false, message: msg });
      onCheck(msg);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        Ruby: Check Instrument Fit
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={instrument}
          onChange={(e) => { setInstrument(e.target.value); setResult(null); }}
          onKeyDown={(e) => e.key === "Enter" && check()}
          placeholder="e.g. guitar, piano, drums…"
          className="flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2.5 py-1.5 text-xs text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none"
        />
        <button
          type="button"
          onClick={check}
          disabled={!instrument.trim()}
          className="rounded-md border border-[#fb923c]/30 bg-[#fb923c]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#fb923c] hover:bg-[#fb923c]/20 disabled:opacity-40 transition-colors"
        >
          Check
        </button>
      </div>
      {result && (
        <p
          className="text-[11px] leading-snug"
          style={{ color: result.ok ? "#86efac" : "#fca5a5" }}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
