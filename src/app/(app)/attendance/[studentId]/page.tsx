import { logAudit } from "@/lib/audit/log";
import { getStudentAttendancePageData } from "@/lib/attendance/service";
import { resolveAttendancePageContext } from "../guard";
import {
  AttendanceKpiCards,
  AttendanceRecordTable,
  AttendanceSummaryWidget,
} from "../components";

export const dynamic = "force-dynamic";

type RouteParams = { studentId: string };
type SearchParams = Record<string, string | string[] | undefined>;

export default async function StudentAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams?: Promise<SearchParams>;
}) {
  const { studentId } = await params;
  let ctx;
  try {
    ctx = await resolveAttendancePageContext();
  } catch {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        You don&apos;t have access to attendance for this student.
      </div>
    );
  }
  const resolved = (await searchParams) ?? {};
  const start = typeof resolved.start === "string" ? resolved.start : undefined;
  const end = typeof resolved.end === "string" ? resolved.end : undefined;
  const range = start && end ? { start, end } : undefined;

  const data = await getStudentAttendancePageData(studentId, ctx.tenantId, range);
  const name = data.student
    ? [data.student.first_name, data.student.last_name].filter(Boolean).join(" ")
    : studentId;

  await logAudit("attendance.student.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    studentId,
    records: data.records.length,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          {name || studentId}
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Attendance history · streaks · flags
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <AttendanceKpiCards kpis={data.summary.kpis} />
          <AttendanceRecordTable
            records={data.records}
            sessions={data.sessions}
          />
        </div>
        <div className="space-y-3">
          <AttendanceSummaryWidget
            summary={data.summary}
            studentId={studentId}
          />
          <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              Streaks
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-[var(--z-muted)] text-xs">
                  Current present
                </div>
                <div className="text-[var(--z-fg)] font-semibold">
                  +{data.summary.currentPresentStreak}
                </div>
              </div>
              <div>
                <div className="text-[var(--z-muted)] text-xs">
                  Current absent
                </div>
                <div className="text-[var(--z-fg)] font-semibold">
                  -{data.summary.currentAbsentStreak}
                </div>
              </div>
              <div>
                <div className="text-[var(--z-muted)] text-xs">
                  Longest present
                </div>
                <div className="text-[var(--z-fg)] font-semibold">
                  +{data.summary.longestPresentStreak}
                </div>
              </div>
              <div>
                <div className="text-[var(--z-muted)] text-xs">
                  Longest absent
                </div>
                <div className="text-[var(--z-fg)] font-semibold">
                  -{data.summary.longestAbsentStreak}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
