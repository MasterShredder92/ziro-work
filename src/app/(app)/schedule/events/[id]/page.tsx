import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveScheduleContext } from "../../guard";
import { getEvent } from "@/lib/schedule/service";
import {
  cancelEventAction,
  deleteEventAction,
  updateEventAction,
} from "../actions";

export const dynamic = "force-dynamic";

const INPUT_CLASS =
  "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[#00ff88]/50 focus:outline-none";

function splitDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function durationMinutes(start: string, end: string): number {
  return Math.max(
    5,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
  );
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await resolveScheduleContext().catch(() => null);
  if (!ctx) {
    return (
      <div className="text-sm text-[var(--z-muted)]">Forbidden.</div>
    );
  }

  const { id } = await params;
  const event = await getEvent(ctx.tenantId, id);
  if (!event) notFound();

  const { date, time } = splitDateTime(event.startTime);
  const duration = durationMinutes(event.startTime, event.endTime);

  const updateAction = updateEventAction.bind(null, event.id);
  const cancelAction = cancelEventAction.bind(null, event.id);
  const deleteAction = deleteEventAction.bind(null, event.id);

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Schedule OS · Event {event.id}
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          {event.title}
        </h1>
        <div className="text-xs text-[var(--z-muted)] mt-0.5">
          {new Date(event.startTime).toLocaleString()} →{" "}
          {new Date(event.endTime).toLocaleTimeString()} · Status:{" "}
          <span className="text-[var(--z-fg)] capitalize">{event.status}</span>
          {event.recurrenceId ? (
            <>
              {" "}
              · <span>Series {event.recurrenceId}</span>
            </>
          ) : null}
        </div>
      </header>

      {ctx.canWrite ? (
        <form
          action={updateAction}
          className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Title">
              <input
                name="title"
                defaultValue={event.title}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Status">
              <select
                name="status"
                defaultValue={event.status}
                className={INPUT_CLASS}
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="no_show">No-show</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </Field>
            <Field label="Teacher ID">
              <input
                name="teacherId"
                defaultValue={event.teacherId ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Student ID">
              <input
                name="studentId"
                defaultValue={event.studentId ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Room ID">
              <input
                name="roomId"
                defaultValue={event.roomId ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                name="date"
                defaultValue={date}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Start time">
              <input
                type="time"
                name="startTime"
                defaultValue={time}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Duration (min)">
              <input
                type="number"
                name="durationMinutes"
                min={5}
                step={5}
                defaultValue={duration}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              name="notes"
              defaultValue={event.notes ?? ""}
              className={`${INPUT_CLASS} min-h-[80px]`}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-[var(--z-fg)]">
            <input type="checkbox" name="allowConflict" />
            Allow conflicts
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/20"
            >
              Save changes
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-sm text-[var(--z-muted)]">
          Read-only view.
        </div>
      )}

      {ctx.canWrite ? (
        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">
            Danger zone
          </h2>
          <div className="flex gap-2">
            <form action={cancelAction}>
              <button
                type="submit"
                className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20"
              >
                Cancel event
              </button>
            </form>
            <form action={deleteAction}>
              <button
                type="submit"
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20"
              >
                Delete event
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div>
        <Link
          href="/schedule"
          className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]"
        >
          ← Back to calendar
        </Link>
      </div>
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
