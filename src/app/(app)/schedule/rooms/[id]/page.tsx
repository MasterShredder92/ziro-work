import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveScheduleContext } from "../../guard";
import { getScheduleRoom } from "@data/scheduleRooms";
import { listRoomBookings } from "@data/roomBookings";
import {
  bookRoomAction,
  deleteRoomAction,
  updateRoomAction,
} from "../actions";

export const dynamic = "force-dynamic";

const INPUT_CLASS =
  "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[#c4f036]/50 focus:outline-none";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await resolveScheduleContext().catch(() => null);
  if (!ctx) {
    return <div className="text-sm text-[var(--z-muted)]">Forbidden.</div>;
  }

  const { id } = await params;
  const room = await getScheduleRoom(id, ctx.tenantId);
  if (!room) notFound();

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 1);
  const to = new Date(now);
  to.setDate(to.getDate() + 14);

  const bookings = await listRoomBookings(
    ctx.tenantId,
    {
      room_id: room.id,
      start_from: from.toISOString(),
      start_to: to.toISOString(),
    },
    { limit: 500 },
  );

  const update = updateRoomAction.bind(null, room.id);
  const del = deleteRoomAction.bind(null, room.id);
  const book = bookRoomAction.bind(null, room.id);

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Schedule OS · Room
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          {room.name}
        </h1>
        <div className="text-xs text-[var(--z-muted)] mt-0.5">
          Capacity {room.capacity} ·{" "}
          {room.isActive ? "Active" : "Inactive"} ·{" "}
          {room.roomType ?? "—"}
        </div>
      </header>

      {ctx.canWrite ? (
        <form
          action={update}
          className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name">
              <input
                name="name"
                defaultValue={room.name}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Capacity">
              <input
                type="number"
                name="capacity"
                min={1}
                defaultValue={room.capacity}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Location ID">
              <input
                name="locationId"
                defaultValue={room.locationId ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Room type">
              <input
                name="roomType"
                defaultValue={room.roomType ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Equipment (comma-separated)">
              <input
                name="equipment"
                defaultValue={room.equipment.join(", ")}
                className={INPUT_CLASS}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-[var(--z-fg)] mt-6">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={room.isActive}
              />
              Active
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg border border-[#c4f036]/40 bg-[#c4f036]/10 px-4 py-2 text-sm font-medium text-[#c4f036] hover:bg-[#c4f036]/20"
          >
            Save room
          </button>
        </form>
      ) : null}

      <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
        <header className="px-4 py-3 border-b border-[var(--z-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Bookings timeline
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)]">
              Next 14 days
            </div>
          </div>
          <div className="text-xs text-[var(--z-muted)]">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </div>
        </header>
        {bookings.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--z-muted)]">
            No upcoming bookings.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--z-border)]">
            {bookings.map((b) => (
              <li key={b.id} className="px-4 py-3 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#c4f036]" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--z-fg)] truncate">
                    {b.purpose ?? "Booking"}
                  </div>
                  <div className="text-[11px] text-[var(--z-muted)]">
                    {new Date(b.startTime).toLocaleString()} →{" "}
                    {new Date(b.endTime).toLocaleTimeString()}
                    {b.eventId ? (
                      <>
                        {" "}
                        ·{" "}
                        <Link
                          href={`/schedule/events/${b.eventId}`}
                          className="text-[#c4f036] hover:underline"
                        >
                          event
                        </Link>
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ctx.canWrite ? (
        <form
          action={book}
          className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-3"
        >
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">
            Book an existing event into this room
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Event ID">
              <input name="eventId" className={INPUT_CLASS} required />
            </Field>
            <label className="flex items-center gap-2 text-sm text-[var(--z-fg)] mt-6">
              <input type="checkbox" name="allowConflict" />
              Allow conflict
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg border border-[#c4f036]/40 bg-[#c4f036]/10 px-4 py-2 text-sm font-medium text-[#c4f036] hover:bg-[#c4f036]/20"
          >
            Book event
          </button>
        </form>
      ) : null}

      {ctx.canWrite ? (
        <form action={del}>
          <button
            type="submit"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20"
          >
            Delete room
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
