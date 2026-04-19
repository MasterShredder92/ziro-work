import Link from "next/link";
import { resolveScheduleContext } from "../guard";
import { listScheduleRooms } from "@data/scheduleRooms";
import { createRoomAction } from "./actions";

export const dynamic = "force-dynamic";

// ─── Canonical location registry ─────────────────────────────────────────────
const LOCATIONS = [
  { id: "f7b52dd5-12ee-437f-9c60-f8adf454ac31", name: "Bellevue",  color: "#7C3AED", expectedRooms: 8  },
  { id: "d48229c1-b70a-4d29-893e-5079887dab76", name: "Omaha",     color: "#DC2626", expectedRooms: 10 },
  { id: "cebd97d4-c241-4de2-8ade-49e5cc0070d5", name: "Elkhorn",   color: "#0EA5E9", expectedRooms: 6  },
  { id: "40c67ffc-91b5-46a9-94bd-6ddffdfb7638", name: "Gretna",    color: "#16A34A", expectedRooms: 9  },
];

const INPUT_CLASS =
  "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[#00ff88]/50 focus:outline-none";

// ─── Natural sort: "Room 2" < "Room 10" ──────────────────────────────────────
function naturalSortKey(name: string): number {
  const m = name.match(/\d+/);
  return m ? parseInt(m[0], 10) : 999;
}

export default async function RoomManagerPage() {
  let ctx;
  try {
    ctx = await resolveScheduleContext();
  } catch {
    return <div className="text-sm text-[var(--z-muted)]">Forbidden.</div>;
  }

  const allRooms = await listScheduleRooms(ctx.tenantId);

  // Group rooms by locationId, sort each group numerically
  const roomsByLocation = new Map<string, typeof allRooms>();
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

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Schedule OS · Rooms
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">Room Manager</h1>
        <p className="text-xs text-[var(--z-muted)] mt-0.5">
          Practice rooms and studios by location — with capacity and equipment.
        </p>
      </header>

      {/* ── Per-location sections ── */}
      {LOCATIONS.map((loc) => {
        const rooms = roomsByLocation.get(loc.id) ?? [];
        const configured = rooms.length;
        const unconfigured = Math.max(0, loc.expectedRooms - configured);

        return (
          <section key={loc.id} className="space-y-3">
            {/* Location header */}
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: loc.color }} />
              <h2 className="text-sm font-bold text-[var(--z-fg)]">{loc.name}</h2>
              <span className="text-[11px] text-[var(--z-muted)]">
                {configured} / {loc.expectedRooms} rooms configured
              </span>
            </div>

            <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)]">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
                    <th className="px-4 py-2 font-semibold">Room</th>
                    <th className="px-4 py-2 font-semibold">Type</th>
                    <th className="px-4 py-2 font-semibold">Cap</th>
                    <th className="px-4 py-2 font-semibold">Equipment</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rooms.length === 0 && unconfigured === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-[var(--z-muted)] text-xs">
                        No rooms configured for {loc.name} yet.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {rooms.map((r) => (
                        <tr key={r.id} className="border-t border-[var(--z-border)] hover:bg-white/3">
                          <td className="px-4 py-2 font-semibold text-[var(--z-fg)]">{r.name}</td>
                          <td className="px-4 py-2 text-[var(--z-muted)]">{r.roomType ?? "—"}</td>
                          <td className="px-4 py-2 text-[var(--z-muted)]">{r.capacity}</td>
                          <td className="px-4 py-2 text-[var(--z-muted)] truncate max-w-[220px]">
                            {r.equipment.length ? r.equipment.join(", ") : "—"}
                          </td>
                          <td className="px-4 py-2">
                            {r.isActive ? (
                              <span className="text-[#00ff88] text-xs font-semibold">Active</span>
                            ) : (
                              <span className="text-[var(--z-muted)] text-xs">Inactive</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Link href={`/schedule/rooms/${r.id}`} className="text-xs text-[#00ff88] hover:underline">
                              Manage →
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {/* Unconfigured placeholder rows */}
                      {Array.from({ length: unconfigured }).map((_, i) => (
                        <tr key={`uncfg-${i}`} className="border-t border-[var(--z-border)] opacity-40">
                          <td className="px-4 py-2 text-[var(--z-muted)] italic text-xs">
                            Room {configured + i + 1} — not configured
                          </td>
                          <td colSpan={5} className="px-4 py-2" />
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {/* Orphan rooms (no location assigned) */}
      {orphanRooms.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[var(--z-muted)]" />
            <h2 className="text-sm font-bold text-[var(--z-muted)]">Unassigned</h2>
          </div>
          <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)]">
                <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
                  <th className="px-4 py-2 font-semibold">Room</th>
                  <th className="px-4 py-2 font-semibold">Type</th>
                  <th className="px-4 py-2 font-semibold">Cap</th>
                  <th className="px-4 py-2 font-semibold">Equipment</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {orphanRooms.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--z-border)] hover:bg-white/3">
                    <td className="px-4 py-2 font-semibold text-[var(--z-fg)]">{r.name}</td>
                    <td className="px-4 py-2 text-[var(--z-muted)]">{r.roomType ?? "—"}</td>
                    <td className="px-4 py-2 text-[var(--z-muted)]">{r.capacity}</td>
                    <td className="px-4 py-2 text-[var(--z-muted)] truncate max-w-[220px]">
                      {r.equipment.length ? r.equipment.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {r.isActive ? (
                        <span className="text-[#00ff88] text-xs font-semibold">Active</span>
                      ) : (
                        <span className="text-[var(--z-muted)] text-xs">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/schedule/rooms/${r.id}`} className="text-xs text-[#00ff88] hover:underline">
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Add room form ── */}
      {ctx.canWrite ? (
        <form
          action={createRoomAction}
          className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">Add a room</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Name" required>
              <input name="name" required placeholder="Room 1" className={INPUT_CLASS} />
            </Field>
            <Field label="Location" required>
              <select name="locationId" required className={INPUT_CLASS}>
                <option value="">Select location…</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Room type">
              <input name="roomType" placeholder="Studio / Practice / …" className={INPUT_CLASS} />
            </Field>
            <Field label="Capacity">
              <input type="number" name="capacity" defaultValue={1} min={1} className={INPUT_CLASS} />
            </Field>
            <Field label="Equipment (comma-separated)">
              <input name="equipment" placeholder="piano, mic, stand" className={INPUT_CLASS} />
            </Field>
          </div>
          <button
            type="submit"
            className="rounded-lg border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/20"
          >
            Create room
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
        {required ? <span className="text-amber-300"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
