import { batchTeacherScheduleHeadlines } from "@/lib/crm";
import {
  parseTableSort,
  TEACHER_SORT_KEYS,
  teacherSortOrder,
} from "@/lib/crm/crmListSortMaps";
import {
  countActiveEnrollmentsByTeacherIds,
  countEnrollmentsByTeacherIds,
} from "@data/enrollments";
import { listTeachers } from "@data/teachers";
import { getCRMTenantId } from "../_tenant";
import { CRMLayout, CRMNav, EmptyState } from "../_components";
import { TeachersListClient } from "./teachers-list-client";

export const dynamic = "force-dynamic";

export default async function TeachersIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string; dir?: string }>;
}) {
  const tenantId = await getCRMTenantId();
  const params = (await searchParams) ?? {};
  const parsed = parseTableSort(
    params.sort,
    params.dir,
    TEACHER_SORT_KEYS,
  );
  const order = teacherSortOrder(parsed.key, parsed.dir);
  const rows = await listTeachers(tenantId, undefined, {
    limit: 500,
    orderBy: order.orderBy,
    ascending: order.ascending,
  });
  const ids = rows.map((r) => r.id as string);
  const [activeByTeacher, headlines, totalByTeacher] = await Promise.all([
    countActiveEnrollmentsByTeacherIds(tenantId, ids),
    batchTeacherScheduleHeadlines(tenantId, ids),
    countEnrollmentsByTeacherIds(tenantId, ids),
  ]);

  return (
    <CRMLayout
      title="Teachers"
      subtitle="Teaching staff with lifecycle status and load."
    >
      <CRMNav current="teachers" />
      {rows.length === 0 ? (
        <EmptyState title="No teachers found" />
      ) : (
        <TeachersListClient
          rows={rows}
          activeByTeacher={activeByTeacher}
          totalByTeacher={totalByTeacher}
          headlines={headlines}
        />
      )}
    </CRMLayout>
  );
}
