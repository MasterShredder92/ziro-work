import { redirect } from "next/navigation";
import { resolveScheduleContext } from "../../guard";
import { createEventAction } from "../actions";

export const dynamic = "force-dynamic";

const INPUT_CLASS =
  "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[#c4f036]/50 focus:outline-none";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewEventPage() {
  try {
    await resolveScheduleContext({ requireWrite: true });
  } catch {
    redirect("/schedule");
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Schedule OS · Event editor
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          New event
        </h1>
        <p className="text-xs text-[var(--z-muted)] mt-0.5">
          Create a one-off lesson or a recurring series.
        </p>
      </header>

      <form
        action={createEventAction}
        className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4 max-w-3xl"
      >
        <Grid>
          <Field label="Title" required>
            <input
              name="title"
              required
              className={INPUT_CLASS}
              placeholder="Violin lesson — Sarah"
            />
          </Field>
          <Field label="Kind">
            <select name="kind" className={INPUT_CLASS} defaultValue="lesson">
              <option value="lesson">Lesson</option>
              <option value="group">Group</option>
              <option value="makeup">Makeup</option>
              <option value="evaluation">Evaluation</option>
              <option value="hold">Hold</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Status">
            <select name="status" className={INPUT_CLASS} defaultValue="scheduled">
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
        </Grid>

        <Grid>
          <Field label="Date" required>
            <input
              type="date"
              name="date"
              required
              defaultValue={todayIso()}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Start time" required>
            <input
              type="time"
              name="startTime"
              required
              defaultValue="09:00"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Duration (min)">
            <input
              type="number"
              name="durationMinutes"
              min={5}
              step={5}
              defaultValue={45}
              className={INPUT_CLASS}
            />
          </Field>
        </Grid>

        <Grid>
          <Field label="Teacher ID">
            <input name="teacherId" className={INPUT_CLASS} placeholder="uuid" />
          </Field>
          <Field label="Student ID">
            <input name="studentId" className={INPUT_CLASS} placeholder="uuid" />
          </Field>
          <Field label="Family ID">
            <input name="familyId" className={INPUT_CLASS} placeholder="uuid" />
          </Field>
        </Grid>

        <Grid>
          <Field label="Room ID">
            <input name="roomId" className={INPUT_CLASS} placeholder="uuid" />
          </Field>
          <Field label="Location ID">
            <input name="locationId" className={INPUT_CLASS} placeholder="uuid" />
          </Field>
          <Field label="Color">
            <input name="color" className={INPUT_CLASS} placeholder="#c4f036" />
          </Field>
        </Grid>

        <Field label="Notes">
          <textarea name="notes" className={`${INPUT_CLASS} min-h-[80px]`} />
        </Field>

        <fieldset className="rounded-lg border border-[var(--z-border)] p-4 space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)] px-2">
            Recurrence
          </legend>
          <label className="flex items-center gap-2 text-sm text-[var(--z-fg)]">
            <input type="checkbox" name="repeat" />
            Repeat this event
          </label>
          <Grid>
            <Field label="Frequency">
              <select name="frequency" className={INPUT_CLASS} defaultValue="weekly">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </Field>
            <Field label="Interval">
              <input
                type="number"
                name="interval"
                min={1}
                defaultValue={1}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Occurrences">
              <input
                type="number"
                name="count"
                min={0}
                placeholder="0 = open-ended"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="End date">
              <input type="date" name="endDate" className={INPUT_CLASS} />
            </Field>
          </Grid>
        </fieldset>

        <label className="flex items-center gap-2 text-sm text-[var(--z-fg)]">
          <input type="checkbox" name="allowConflict" />
          Allow conflicts (skip overlap checks)
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg border border-[#c4f036]/40 bg-[#c4f036]/10 px-4 py-2 text-sm font-medium text-[#c4f036] hover:bg-[#c4f036]/20"
          >
            Create event
          </button>
        </div>
      </form>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {children}
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
