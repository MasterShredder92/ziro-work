import { resolveScheduleContext } from "../guard";
import { listEvents } from "@/lib/schedule/service";
import { resolveStudentContext } from "@/app/(app)/student/guard";
import { PortalScheduleList } from "@/components/portals/PortalScheduleList";
import { getStudentById } from "@data/students";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function StudentSchedulePage({
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
  const requestedStudentId =
    typeof resolved.studentId === "string" ? resolved.studentId.trim() : "";

  const studentId =
    ctx.session.role === "student"
      ? (await resolveStudentContext().catch(() => null))?.studentId ?? ""
      : requestedStudentId;

  const now = new Date();
  const from = now.toISOString();
  const later = new Date(now);
  later.setDate(later.getDate() + 28);

  const events = studentId
    ? await listEvents(ctx.tenantId, {
        studentId,
        range: { start: from, end: later.toISOString() },
        limit: 200,
      })
    : [];

  const student = studentId
    ? await getStudentById(studentId, ctx.tenantId).catch(() => null)
    : null;
  const studentName = student
    ? `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "Student"
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Schedule OS · Student
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          {ctx.session.role === "student"
            ? "My upcoming lessons"
            : "Student upcoming lessons"}
        </h1>
        {studentName ? (
          <p className="text-sm text-[var(--z-fg)] mt-0.5">
            {studentName}
          </p>
        ) : null}
        <p className="text-xs text-[var(--z-muted)] mt-0.5">
          {ctx.session.role === "student"
            ? "Your next 4 weeks of scheduled lessons."
            : "Read-only view of a student's upcoming lessons."}
        </p>
      </header>

      {ctx.session.role !== "student" ? (
        <form
          method="GET"
          className="flex gap-3 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
        >
          <label className="flex-1 flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              Student ID
            </span>
            <input
              name="studentId"
              defaultValue={studentId}
              placeholder="student uuid"
              className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
            />
          </label>
          <button
            type="submit"
            className="self-end rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm font-medium text-[var(--z-fg)] hover:bg-white/5"
          >
            Load
          </button>
        </form>
      ) : null}

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-0">
        <PortalScheduleList
          title="Upcoming lessons"
          emptyLabel={
            studentId
              ? "No upcoming events in the next 4 weeks."
              : "No student profile is linked yet."
          }
          rows={events.map((ev) => {
            return {
              id: ev.id,
              subject: ev.title,
              blockDate: ev.startTime.slice(0, 10),
              startTime: ev.startTime.slice(11, 16),
              endTime: ev.endTime.slice(11, 16),
              status: ev.status,
              blockType: ev.kind,
            };
          })}
        />
      </div>
    </div>
  );
}
