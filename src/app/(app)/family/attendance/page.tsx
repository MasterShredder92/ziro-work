import { ensureFamilyAccess } from "../guard";
import {
  getFamilyStudents,
  resolveCurrentFamilyId,
} from "@/lib/portal/queries";
import { getStudentAttendanceSummary, listAttendance } from "@/lib/attendance/queries";
import { logAudit } from "@/lib/audit/log";
import {
  AttendanceKpiCards,
  AttendanceRecordTable,
  AttendanceSummaryWidget,
} from "../../attendance/components";

export const dynamic = "force-dynamic";

function displayName(student: unknown): string {
  if (!student || typeof student !== "object") return "Student";
  const row = student as Record<string, unknown>;
  const first = typeof row.first_name === "string" ? row.first_name : "";
  const last = typeof row.last_name === "string" ? row.last_name : "";
  const full = `${first} ${last}`.trim();
  return full.length > 0 ? full : "Student";
}

export default async function FamilyAttendancePage() {
  const session = await ensureFamilyAccess();
  const familyId = await resolveCurrentFamilyId();

  if (!familyId) {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        No family record linked to your account yet.
      </div>
    );
  }

  const students = await getFamilyStudents(familyId);
  const data = await Promise.all(
    students.map(async (s) => {
      const tenantId =
        (s as unknown as { tenant_id?: string }).tenant_id ?? session.tenantId;
      const [summary, combined] = await Promise.all([
        getStudentAttendanceSummary(s.id, tenantId),
        listAttendance(s.id, null, tenantId),
      ]);
      return { student: s, summary, records: combined.records, sessions: combined.sessions };
    }),
  );

  await logAudit("attendance.family.view", {
    tenantId: session.tenantId,
    profileId: session.userId,
    role: session.role,
    familyId,
    students: students.length,
    source: "family_portal",
  });

  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        No students linked to your family yet.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          Student attendance
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Your students&apos; attendance history, streaks, and punctuality.
        </p>
      </header>
      {data.map((row) => (
        <section key={row.summary.studentId} className="space-y-3">
          <header className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-[var(--z-fg)]">
              {displayName(row.student)}
            </h2>
          </header>
          <AttendanceSummaryWidget summary={row.summary} />
          <AttendanceKpiCards kpis={row.summary.kpis} />
          <AttendanceRecordTable
            records={row.records}
            sessions={row.sessions}
          />
        </section>
      ))}
    </div>
  );
}
