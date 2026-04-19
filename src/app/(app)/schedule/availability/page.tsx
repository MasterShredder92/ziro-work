import { resolveScheduleContext } from "../guard";
import { getTeacherWeeklyAvailability } from "@/lib/schedule/availability";
import { saveTeacherAvailabilityAction } from "./actions";

export const dynamic = "force-dynamic";

const INPUT_CLASS =
  "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[#00ff88]/50 focus:outline-none";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TeacherAvailabilityPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  let ctx;
  try {
    ctx = await resolveScheduleContext();
  } catch {
    return (
      <div className="text-sm text-[var(--z-muted)]">Forbidden.</div>
    );
  }

  const resolved = (await searchParams) ?? {};
  const teacherId =
    typeof resolved.teacherId === "string" ? resolved.teacherId : "";

  const weekly = teacherId
    ? await getTeacherWeeklyAvailability(ctx.tenantId, teacherId)
    : null;

  const slotByDay = new Map<number, { start: string; end: string }>();
  if (weekly) {
    for (const s of weekly.slots) {
      slotByDay.set(s.dayOfWeek, { start: s.startTime, end: s.endTime });
    }
  }

  const save = teacherId
    ? saveTeacherAvailabilityAction.bind(null, teacherId)
    : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Schedule OS · Teacher availability
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          Weekly availability
        </h1>
        <p className="text-xs text-[var(--z-muted)] mt-0.5">
          Set the days & time windows a teacher is generally available to
          teach.
        </p>
      </header>

      <form
        method="GET"
        className="flex flex-wrap items-end gap-3 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
      >
        <label className="flex flex-col gap-1 flex-1 min-w-[220px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Teacher ID
          </span>
          <input
            name="teacherId"
            defaultValue={teacherId}
            placeholder="teacher uuid"
            className={INPUT_CLASS}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm font-medium text-[var(--z-fg)] hover:bg-white/5"
        >
          Load availability
        </button>
      </form>

      {teacherId && weekly && save ? (
        <form
          action={save}
          className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-3"
        >
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">
            Weekly grid
          </h2>
          <div className="space-y-2">
            {DAY_LABELS.map((label, day) => {
              const existing = slotByDay.get(day);
              return (
                <div
                  key={day}
                  className="grid grid-cols-[140px_auto_1fr_1fr] items-center gap-3 border border-[var(--z-border)] rounded-lg px-3 py-2"
                >
                  <div className="text-sm font-medium text-[var(--z-fg)]">
                    {label}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[var(--z-muted)]">
                    <input
                      type="checkbox"
                      name={`day_${day}_enabled`}
                      defaultChecked={!!existing}
                    />
                    Enabled
                  </label>
                  <input
                    type="time"
                    name={`day_${day}_start`}
                    defaultValue={existing?.start ?? "09:00"}
                    className={INPUT_CLASS}
                  />
                  <input
                    type="time"
                    name={`day_${day}_end`}
                    defaultValue={existing?.end ?? "17:00"}
                    className={INPUT_CLASS}
                  />
                </div>
              );
            })}
          </div>
          {ctx.canWrite ? (
            <button
              type="submit"
              className="rounded-lg border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/20"
            >
              Save availability
            </button>
          ) : null}
        </form>
      ) : (
        <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]">
          Enter a teacher ID above to manage availability.
        </div>
      )}
    </div>
  );
}
