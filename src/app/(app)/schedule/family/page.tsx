import { resolveScheduleContext } from "../guard";
import { listEvents } from "@/lib/schedule/service";
import type { LessonEvent } from "@/lib/schedule/types";
import { resolveCurrentFamilyId } from "@/lib/family/queries";
import { PortalScheduleList } from "@/components/portals/PortalScheduleList";
import { getFamilyById } from "@data/families";
import { listStudents } from "@data/students";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function groupByStudent(events: LessonEvent[]): Map<string, LessonEvent[]> {
  const out = new Map<string, LessonEvent[]>();
  for (const ev of events) {
    const key = ev.studentId ?? "unassigned";
    const arr = out.get(key) ?? [];
    arr.push(ev);
    out.set(key, arr);
  }
  return out;
}

function studentDisplayName(row: { first_name?: string | null; last_name?: string | null }): string {
  const first = typeof row.first_name === "string" ? row.first_name.trim() : "";
  const last = typeof row.last_name === "string" ? row.last_name.trim() : "";
  return `${first} ${last}`.trim() || "Student";
}

export default async function FamilySchedulePage({
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
  const requestedFamilyId =
    typeof resolved.familyId === "string" ? resolved.familyId.trim() : "";
  const familyId =
    ctx.session.role === "family"
      ? (await resolveCurrentFamilyId(ctx.session.userId, ctx.tenantId)) ?? ""
      : requestedFamilyId;

  const now = new Date();
  const from = now.toISOString();
  const later = new Date(now);
  later.setDate(later.getDate() + 28);

  const events = familyId
    ? await listEvents(ctx.tenantId, {
        familyId,
        range: { start: from, end: later.toISOString() },
        limit: 500,
      })
    : [];

  const family = familyId
    ? await getFamilyById(familyId, ctx.tenantId).catch(() => null)
    : null;
  const familyLabel = family?.name || family?.primary_contact_name || family?.parent_name || null;

  const familyStudents = familyId
    ? await listStudents(
        ctx.tenantId,
        { family_id: familyId },
        { orderBy: "first_name", ascending: true, limit: 500 },
      ).catch(() => [])
    : [];
  const studentNamesById = new Map<string, string>(
    familyStudents.map((student) => [student.id, studentDisplayName(student)]),
  );

  const byStudent = groupByStudent(events);

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Schedule OS · Family
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          {ctx.session.role === "family"
            ? "My family schedule"
            : "Family schedule"}
        </h1>
        {familyLabel ? (
          <p className="text-sm text-[var(--z-fg)] mt-0.5">{familyLabel}</p>
        ) : null}
        <p className="text-xs text-[var(--z-muted)] mt-0.5">
          {ctx.session.role === "family"
            ? "Upcoming lessons for every student in your household."
            : "Read-only upcoming lessons for every linked student."}
        </p>
      </header>

      {ctx.session.role !== "family" ? (
        <form
          method="GET"
          className="flex gap-3 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
        >
          <label className="flex-1 flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              Family ID
            </span>
            <input
              name="familyId"
              defaultValue={familyId}
              placeholder="family uuid"
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

      {byStudent.size === 0 ? (
        <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]">
          {familyId
            ? "No upcoming events for this family in the next 4 weeks."
            : "No family profile is linked yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(byStudent.entries()).map(([studentId, list]) => (
            <section
              key={studentId}
              className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]"
            >
              <header className="px-4 py-3 border-b border-[var(--z-border)] flex items-center justify-between">
                <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                  Student: {studentNamesById.get(studentId) ?? studentId}
                </div>
                <div className="text-xs text-[var(--z-muted)]">
                  {list.length} event{list.length === 1 ? "" : "s"}
                </div>
              </header>
              <PortalScheduleList
                title="Upcoming"
                rows={list.map((ev) => {
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
