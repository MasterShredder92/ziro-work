import { listEnrollments } from "@data/enrollments";
import { getStudentsByIds, listStudents } from "@data/students";
import { getTeachersByIds, listTeachers } from "@data/teachers";
import {
  enrollmentSortOrder,
  ENROLLMENT_SORT_KEYS,
  parseTableSort,
} from "@/lib/crm/crmListSortMaps";
import { getCRMTenantId } from "../_tenant";
import { CRMLayout, CRMNav, EmptyState } from "../_components";
import { EnrollmentActions, EnrollmentFilters } from "./_client";
import { EnrollmentsListClient } from "./enrollments-list-client";

export const dynamic = "force-dynamic";

const DEFAULT_STATUSES = ["active", "ended", "cancelled", "completed", "pending"];

export default async function EnrollmentManagerPage({
  searchParams,
}: {
  searchParams?: Promise<{
    studentId?: string;
    teacherId?: string;
    status?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const tenantId = await getCRMTenantId();
  const params = (await searchParams) ?? {};
  const parsed = parseTableSort(
    params.sort,
    params.dir,
    ENROLLMENT_SORT_KEYS,
  );
  const order = enrollmentSortOrder(parsed.key, parsed.dir);
  const rows = await listEnrollments(
    tenantId,
    {
      student_id: params.studentId,
      teacher_id: params.teacherId,
      status: params.status,
    },
    {
      limit: 2000,
      orderBy: order.orderBy,
      ascending: order.ascending,
    },
  );
  const statusUnion = Array.from(
    new Set([...DEFAULT_STATUSES, ...rows.map((r) => r.status)]),
  ).sort();

  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  const teacherIds = [...new Set(rows.map((r) => r.teacher_id))];
  const [students, teachers, teacherOptions, studentOptions] = await Promise.all([
    getStudentsByIds(tenantId, studentIds),
    getTeachersByIds(tenantId, teacherIds),
    listTeachers(tenantId, undefined, { limit: 500 }),
    listStudents(tenantId, undefined, { limit: 500 }),
  ]);
  const studentName = new Map(
    students.map((s) => [
      s.id,
      `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.id,
    ]),
  );
  const teacherName = new Map(
    teachers.map((t) => {
      const row = t as {
        id: string;
        display_name?: string | null;
        first_name?: string | null;
        last_name?: string | null;
      };
      const label =
        row.display_name?.trim() ||
        [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
        row.id;
      return [row.id, label];
    }),
  );

  const studentNameById = Object.fromEntries(studentName);
  const teacherNameById = Object.fromEntries(teacherName);
  const teacherOptionsForRows = teacherOptions.map((t) => {
    const row = t as {
      id: string;
      display_name?: string | null;
      first_name?: string | null;
      last_name?: string | null;
    };
    const label =
      row.display_name?.trim() ||
      [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
      row.id;
    return { id: row.id, label };
  });

  return (
    <CRMLayout
      title="Enrollment Manager"
      subtitle="Start, update, and end student enrollments."
    >
      <CRMNav current="enrollments" />

      <EnrollmentFilters
        currentSort={params.sort}
        currentDir={params.dir}
        teachers={teacherOptions.map((t) => {
          const row = t as {
            id: string;
            display_name?: string | null;
            first_name?: string | null;
            last_name?: string | null;
          };
          const label =
            row.display_name?.trim() ||
            [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
            row.id;
          return { id: row.id, label };
        })}
        students={studentOptions.map((s) => ({
          id: s.id,
          label:
            `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.id,
        }))}
        currentTeacherId={params.teacherId}
        currentStudentId={params.studentId}
        currentStatus={params.status}
        statuses={statusUnion}
      />

      <EnrollmentActions />

      {rows.length === 0 ? (
        <EmptyState title="No enrollments found" />
      ) : (
        <EnrollmentsListClient
          rows={rows}
          studentNameById={studentNameById}
          teacherNameById={teacherNameById}
          teacherOptions={teacherOptionsForRows}
          statuses={statusUnion}
        />
      )}
    </CRMLayout>
  );
}
