import Link from "next/link";
import { resolveScheduleContext } from "../guard";
import { listScheduleRooms } from "@data/scheduleRooms";
import { createRoomAction } from "./actions";

export const dynamic = "force-dynamic";

const INPUT_CLASS =
  "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[#00ff88]/50 focus:outline-none";

export default async function RoomManagerPage() {
  let ctx;
  try {
    ctx = await resolveScheduleContext();
  } catch {
    return (
      <div className="text-sm text-[var(--z-muted)]">Forbidden.</div>
    );
  }

  const rooms = await listScheduleRooms(ctx.tenantId);

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Schedule OS · Rooms
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          Room manager
        </h1>
        <p className="text-xs text-[var(--z-muted)] mt-0.5">
          Practice rooms, studios, and spaces with capacity & equipment.
        </p>
      </header>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)]">
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
              <th className="px-4 py-2 font-semibold">Name</th>
              <th className="px-4 py-2 font-semibold">Capacity</th>
              <th className="px-4 py-2 font-semibold">Type</th>
              <th className="px-4 py-2 font-semibold">Equipment</th>
              <th className="px-4 py-2 font-semibold">Active</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[var(--z-muted)]"
                >
                  No rooms yet.
                </td>
              </tr>
            ) : (
              rooms.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[var(--z-border)] hover:bg-white/3"
                >
                  <td className="px-4 py-2 text-[var(--z-fg)] font-medium">
                    {r.name}
                  </td>
                  <td className="px-4 py-2 text-[var(--z-muted)]">
                    {r.capacity}
                  </td>
                  <td className="px-4 py-2 text-[var(--z-muted)]">
                    {r.roomType ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-[var(--z-muted)] truncate max-w-[240px]">
                    {r.equipment.length ? r.equipment.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {r.isActive ? (
                      <span className="text-[#00ff88] text-xs font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="text-[var(--z-muted)] text-xs">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/schedule/rooms/${r.id}`}
                      className="text-xs text-[#00ff88] hover:underline"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {ctx.canWrite ? (
        <form
          action={createRoomAction}
          className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">
            Add a room
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Name" required>
              <input name="name" required className={INPUT_CLASS} />
            </Field>
            <Field label="Capacity">
              <input
                type="number"
                name="capacity"
                defaultValue={1}
                min={1}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Room type">
              <input
                name="roomType"
                placeholder="Studio / Practice / …"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Location ID">
              <input name="locationId" className={INPUT_CLASS} />
            </Field>
            <Field label="Equipment (comma-separated)">
              <input
                name="equipment"
                placeholder="piano, mic, stand"
                className={INPUT_CLASS}
              />
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
