import { logAudit } from "@/lib/audit/log";
import { getStudentAttendanceSummary } from "@/lib/attendance/queries";
import { listAttendance } from "@/lib/attendance/queries";
import { resolveStudentContext } from "../guard";
import {
  AttendanceKpiCards,
  AttendanceRecordTable,
  AttendanceSummaryWidget,
} from "../../attendance/components";

export const dynamic = "force-dynamic";

export default async function StudentAttendancePortalPage() {
  let ctx;
  try {
    ctx = await resolveStudentContext();
  } catch {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        Your attendance isn&apos;t available right now.
      </div>
    );
  }

  const [summary, combined] = await Promise.all([
    getStudentAttendanceSummary(ctx.studentId, ctx.tenantId),
    listAttendance(ctx.studentId, null, ctx.tenantId),
  ]);

  await logAudit("attendance.surface.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    studentId: ctx.studentId,
    source: "student_portal",
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          My attendance
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          View your attendance history, streaks, and punctuality.
        </p>
      </header>
      <AttendanceSummaryWidget summary={summary} detailHref={undefined} />
      <AttendanceKpiCards kpis={summary.kpis} title="Snapshot" />
      <AttendanceRecordTable
        records={combined.records}
        sessions={combined.sessions}
      />
    </div>
  );
}
