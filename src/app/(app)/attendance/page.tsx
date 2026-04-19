import Link from "next/link";
import { logAudit } from "@/lib/audit/log";
import { getAttendanceDashboard } from "@/lib/attendance/service";
import { resolveAttendancePageContext } from "./guard";
import {
  AttendanceKpiCards,
  AttendanceStudentTable,
} from "./components";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AttendanceDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  let ctx;
  try {
    ctx = await resolveAttendancePageContext();
  } catch {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        You don&apos;t have access to the Attendance OS. Please contact your
        administrator.
      </div>
    );
  }

  const resolved = (await searchParams) ?? {};
  const start = typeof resolved.start === "string" ? resolved.start : undefined;
  const end = typeof resolved.end === "string" ? resolved.end : undefined;
  const range = start && end ? { start, end } : undefined;

  const data = await getAttendanceDashboard(ctx.tenantId, range);

  await logAudit("attendance.dashboard.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    windowStart: data.windowStart,
    windowEnd: data.windowEnd,
    students: data.students.length,
  });

  return (
    <div className="space-y-6">
      <section id="overview" className="space-y-3">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-[var(--z-fg)]">
            Attendance Dashboard
          </h1>
          <p className="text-sm text-[var(--z-muted)]">
            {data.windowStart} → {data.windowEnd} · {data.students.length}{" "}
            students
          </p>
        </header>
        <AttendanceKpiCards kpis={data.totals} title="Workspace totals" />
      </section>

      <section id="at-risk" className="space-y-2 scroll-mt-20">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">At-risk students</h2>
        <AttendanceStudentTable
          rows={data.atRisk}
          emptyLabel="No high or critical risk students in this window."
        />
      </section>

      <section id="students" className="space-y-2 scroll-mt-20">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">All students</h2>
        <AttendanceStudentTable
          rows={data.students}
          emptyLabel="No student attendance records in this window."
        />
      </section>

      <section id="sessions" className="space-y-2 scroll-mt-20">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">
          Upcoming & recent sessions
        </h2>
        {data.upcomingSessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
            No sessions in this window yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)]">
            <table className="min-w-full text-sm">
              <thead className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_10%)]">
                <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Class</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {data.upcomingSessions.slice(0, 25).map((s) => (
                  <tr key={s.id} className="border-t border-[var(--z-border)]">
                    <td className="px-4 py-2 text-[var(--z-fg)]">
                      {s.session_date}
                    </td>
                    <td className="px-4 py-2 text-[var(--z-muted)]">
                      {s.start_time?.slice(0, 5) ?? "—"} –{" "}
                      {s.end_time?.slice(0, 5) ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-[var(--z-muted)]">
                      {s.status}
                    </td>
                    <td className="px-4 py-2 text-[var(--z-muted)]">
                      {s.class_label ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/attendance/session/${s.id}`}
                        className="text-[#00ffd0] hover:underline text-xs font-semibold"
                      >
                        Roster →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
