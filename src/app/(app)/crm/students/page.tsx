import { listStudents } from "@data/students";
import { listLocations } from "@data/locations";
import {
  getNextLessonLabelsForStudents,
} from "@/lib/crm";
import {
  parseTableSort,
  STUDENT_SORT_KEYS,
  studentSortOrder,
} from "@/lib/crm/crmListSortMaps";
import { getCRMTenantId } from "../_tenant";
import { CRMLayout, CRMNav, EmptyState } from "../_components";
import { StudentsListClient } from "./students-list-client";

export const dynamic = "force-dynamic";

export default async function StudentsIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    sort?: string;
    dir?: string;
    location_id?: string;
  }>;
}) {
  const tenantId = await getCRMTenantId();
  const params = (await searchParams) ?? {};
  const parsed = parseTableSort(
    params.sort,
    params.dir,
    STUDENT_SORT_KEYS,
  );
  const order = studentSortOrder(parsed.key, parsed.dir);
  const locationId = params.location_id?.trim() || "";
  const [locations, rows] = await Promise.all([
    listLocations(tenantId, { is_active: true }, { limit: 200 }),
    listStudents(
      tenantId,
      {
        status: params.status,
        ...(locationId ? { location_id: locationId } : {}),
      },
      {
        limit: 500,
        orderBy: order.orderBy,
        ascending: order.ascending,
      },
    ),
  ]);
  const locationNameById = Object.fromEntries(
    locations.map((l) => [l.id, l.name ?? l.id]),
  );
  const ids = rows.map((r) => r.id);
  const nextLessons = await getNextLessonLabelsForStudents(tenantId, ids);

  return (
    <CRMLayout
      title="Students"
      subtitle="Active and prospective learners across the studio."
    >
      <CRMNav current="students" />
      <form className="mb-4 flex flex-wrap items-center gap-2" method="get">
        {params.sort ? (
          <input type="hidden" name="sort" value={params.sort} />
        ) : null}
        {params.dir ? (
          <input type="hidden" name="dir" value={params.dir} />
        ) : null}
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="h-9 rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] px-3 text-sm text-[var(--z-fg,#f0f0f0)]"
        >
          <option value="">All statuses</option>
          <option value="enrolled">Enrolled</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="prospect">Prospect</option>
        </select>
        <button
          type="submit"
          className="h-9 rounded-md bg-[var(--z-accent,#00ff88)]/10 px-3 text-sm font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/20"
        >
          Filter
        </button>
      </form>
      {rows.length === 0 ? (
        <EmptyState
          title="No students found"
          body={`Tenant ${tenantId}. If Supabase has students under a different tenant_id, update this user’s profile.tenant_id (or sign in with the matching account). Clear the status filter if you chose “Enrolled” or another bucket that doesn’t match your studio’s status labels.`}
        />
      ) : (
        <StudentsListClient
          rows={rows}
          nextLessons={nextLessons}
          locationNameById={locationNameById}
        />
      )}
    </CRMLayout>
  );
}
