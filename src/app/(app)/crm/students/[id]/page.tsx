import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentById } from "@data/students";
import { getFamilyById } from "@data/families";
import { getTeacherById } from "@data/teachers";
import {
  getNextLessonLabelsForStudents,
  getStudentSchedule,
  getStudentProgressSummary,
  listEnrollmentsFor,
} from "@/lib/crm";
import type { Family as FamilyRow } from "@/lib/types/entities";
import { getCRMTenantId } from "../../_tenant";
import { CRMLayout, CRMNav, KpiTile, TableShell } from "../../_components";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await getCRMTenantId();
  const student = await getStudentById(id, tenantId);
  if (!student) notFound();

  const [schedule, progress, enrollments, familyRaw, nextLessonMap] =
    await Promise.all([
      getStudentSchedule(tenantId, id),
      getStudentProgressSummary(tenantId, id),
      listEnrollmentsFor(tenantId, { student_id: id }),
      student.family_id ? getFamilyById(student.family_id, tenantId) : null,
      getNextLessonLabelsForStudents(tenantId, [id]),
    ]);
  const nextLesson = nextLessonMap[id];
  const family = (familyRaw ?? null) as FamilyRow | null;

  const teacherIds = [...new Set(enrollments.map((e) => e.teacher_id))];
  const teacherResults = await Promise.all(
    teacherIds.map((tid) => getTeacherById(tid)),
  );
  const teacherLabel = new Map<string, string>();
  teacherResults.forEach((res, i) => {
    const tid = teacherIds[i];
    const t = res.data as
      | {
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
        }
      | null;
    if (!t) return;
    const label =
      (t.display_name as string | null)?.trim() ||
      [t.first_name, t.last_name].filter(Boolean).join(" ").trim();
    if (label) teacherLabel.set(tid, label);
  });

  return (
    <CRMLayout
      title={`${student.first_name} ${student.last_name}`}
      subtitle={`Student · ${student.status}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/schedule/student?studentId=${encodeURIComponent(student.id)}`}
            className="rounded-md border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-1.5 text-sm font-semibold text-[#d4d4d4] hover:bg-white/5"
          >
            View in Scheduling
          </Link>
          <Link
            href={`/crm/enrollments?studentId=${student.id}`}
            className="rounded-md bg-[#00ff88]/10 px-3 py-1.5 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20"
          >
            Manage enrollment
          </Link>
        </div>
      }
    >
      <CRMNav current="students" />

      <div className="grid gap-3 md:grid-cols-4">
        <KpiTile label="Sessions / month" value={student.sessions_per_month ?? 0} />
        <KpiTile label="Blocks / week" value={student.blocks_per_week ?? 0} />
        <KpiTile label="Goals" value={`${progress.completedGoals}/${progress.goalsCount}`} />
        <KpiTile label="Skills tracked" value={progress.skillsCount} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Profile</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={student.email ?? null} />
            <Row label="Phone" value={student.phone ?? null} />
            <Row label="Instrument" value={student.instrument ?? null} />
            <Row
              label="Enrollment type"
              value={student.enrollment_type ?? null}
            />
            <Row label="Start date" value={student.start_date ?? null} />
            <Row
              label="First lesson"
              value={student.first_lesson_date ?? null}
            />
            <Row
              label="Next lesson"
              value={nextLesson ?? null}
            />
          </dl>
        </div>

        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Family</h3>
          {family ? (
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-[#f0f0f0]">{family.name}</div>
              <div className="text-xs text-[#909098]">
                {family.primary_email ?? "—"} · {family.primary_phone ?? "—"}
              </div>
              <div className="mt-2">
                <Link
                  href={`/crm/families/${family.id}`}
                  className="text-[#00ff88] hover:underline"
                >
                  Open family profile →
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#707078]">Not linked to a family.</div>
          )}
        </div>

        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">
            Billing summary
          </h3>
          <dl className="space-y-2 text-sm">
            <Row
              label="Rate / session"
              value={
                student.rate_per_session != null
                  ? `$${student.rate_per_session}`
                  : null
              }
            />
            <Row
              label="Overdue"
              value={
                student.overdue_amount != null
                  ? `$${student.overdue_amount}`
                  : null
              }
            />
            <Row
              label="Total paid"
              value={
                student.total_paid != null ? `$${student.total_paid}` : null
              }
            />
          </dl>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]">
        Schedule
      </h2>
      {schedule.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-4 text-sm text-[#707078]">
          No scheduled lessons.
        </div>
      ) : (
        <TableShell headers={["Day", "Start", "End", "Teacher", "Status"]}>
          {schedule.map((s) => (
            <tr key={s.blockId} className="border-b border-[#1c1c1e] last:border-0">
              <td className="px-4 py-2 text-[#909098]">{s.dayOfWeek ?? "—"}</td>
              <td className="px-4 py-2 text-[#909098]">{s.startsAt ?? "—"}</td>
              <td className="px-4 py-2 text-[#909098]">{s.endsAt ?? "—"}</td>
              <td className="px-4 py-2 text-[#909098]">
                {s.teacherId ? (
                  <Link
                    href={`/crm/teachers/${s.teacherId}`}
                    className="hover:text-[#00ff88]"
                  >
                    View teacher
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-2 text-[#909098]">{s.status ?? "—"}</td>
            </tr>
          ))}
        </TableShell>
      )}

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]">
        Enrollments
      </h2>
      {enrollments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-4 text-sm text-[#707078]">
          No enrollments yet.
        </div>
      ) : (
        <TableShell
          headers={["Teacher", "Status", "Start", "End", "Updated"]}
        >
          {enrollments.map((e) => (
            <tr key={e.id} className="border-b border-[#1c1c1e] last:border-0">
              <td className="px-4 py-2 text-[#909098]">
                <Link
                  href={`/crm/teachers/${e.teacher_id}`}
                  className="hover:text-[#00ff88]"
                >
                  {teacherLabel.get(e.teacher_id) ?? e.teacher_id}
                </Link>
              </td>
              <td className="px-4 py-2 text-[#909098]">{e.status}</td>
              <td className="px-4 py-2 text-[#909098]">{e.start_date ?? "—"}</td>
              <td className="px-4 py-2 text-[#909098]">{e.end_date ?? "—"}</td>
              <td className="px-4 py-2 text-[#707078]">
                {e.updated_at.slice(0, 10)}
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]">
        Notes
      </h2>
      <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4 text-sm text-[#d4d4d4]">
        {student.notes ? student.notes : (
          <span className="text-[#707078]">No notes yet.</span>
        )}
      </div>
    </CRMLayout>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between border-b border-[#14141a] pb-1 last:border-0">
      <dt className="text-xs uppercase tracking-wider text-[#606068]">{label}</dt>
      <dd className="text-[#d4d4d4]">{value ?? "—"}</dd>
    </div>
  );
}
