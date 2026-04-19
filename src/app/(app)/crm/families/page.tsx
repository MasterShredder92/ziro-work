import { countStudentsByFamilyIds, listFamilies } from "@data/families";
import { listStudents } from "@data/students";
import { listLocations } from "@data/locations";
import type { Family as FamilyRow } from "@/lib/types/entities";
import {
  parseTableSort,
  FAMILY_SORT_KEYS,
  familySortOrder,
} from "@/lib/crm/crmListSortMaps";
import { getCRMTenantId } from "../_tenant";
import { CRMLayout, CRMNav, EmptyState } from "../_components";
import { FamiliesListClient } from "./families-list-client";

export const dynamic = "force-dynamic";

export default async function FamiliesIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string;
    sort?: string;
    dir?: string;
    location_id?: string;
    family_location_scope?: string;
  }>;
}) {
  const tenantId = await getCRMTenantId();
  const params = (await searchParams) ?? {};
  const parsed = parseTableSort(
    params.sort,
    params.dir,
    FAMILY_SORT_KEYS,
  );
  const order = familySortOrder(parsed.key, parsed.dir);
  const locationId = params.location_id?.trim() || "";
  const scope = (params.family_location_scope ?? "primary").trim();

  const [locations, rows] = await Promise.all([
    listLocations(tenantId, { is_active: true }, { limit: 200 }),
    (async (): Promise<FamilyRow[]> => {
      if (!locationId) {
        return (await listFamilies(
          tenantId,
          { search: params.search },
          {
            limit: 500,
            orderBy: order.orderBy,
            ascending: order.ascending,
          },
        )) as FamilyRow[];
      }
      if (scope === "students") {
        const studs = await listStudents(
          tenantId,
          { location_id: locationId },
          { limit: 5000, orderBy: "created_at", ascending: false },
        );
        const familyIds = [
          ...new Set(
            studs.map((s) => s.family_id).filter((id): id is string => Boolean(id)),
          ),
        ];
        if (familyIds.length === 0) return [];
        return (await listFamilies(
          tenantId,
          { search: params.search, family_ids: familyIds },
          {
            limit: 500,
            orderBy: order.orderBy,
            ascending: order.ascending,
          },
        )) as FamilyRow[];
      }
      return (await listFamilies(
        tenantId,
        { search: params.search, primary_location_id: locationId },
        {
          limit: 500,
          orderBy: order.orderBy,
          ascending: order.ascending,
        },
      )) as FamilyRow[];
    })(),
  ]);

  const locationNameById = Object.fromEntries(
    locations.map((l) => [l.id, l.name ?? l.id]),
  );
  const counts = await countStudentsByFamilyIds(
    tenantId,
    rows.map((r) => r.id),
  );

  return (
    <CRMLayout title="Families" subtitle="Household accounts and billing units.">
      <CRMNav current="families" />
      <form className="mb-4 flex flex-wrap items-end gap-2" method="get">
        {params.sort ? (
          <input type="hidden" name="sort" value={params.sort} />
        ) : null}
        {params.dir ? (
          <input type="hidden" name="dir" value={params.dir} />
        ) : null}
        <label className="flex flex-col gap-1 text-xs text-[var(--z-muted,#909098)]">
          Studio
          <select
            name="location_id"
            defaultValue={locationId}
            className="h-9 min-w-[10rem] rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] px-2 text-sm text-[var(--z-fg,#f0f0f0)]"
          >
            <option value="">All studios</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name ?? l.id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--z-muted,#909098)]">
          Match families by
          <select
            name="family_location_scope"
            defaultValue={scope}
            className="h-9 min-w-[12rem] rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] px-2 text-sm text-[var(--z-fg,#f0f0f0)]"
          >
            <option value="primary">Home studio (family record)</option>
            <option value="students">Any student at this studio</option>
          </select>
        </label>
        <input
          type="search"
          name="search"
          defaultValue={params.search ?? ""}
          placeholder="Search families…"
          className="h-9 w-64 rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] px-3 text-sm text-[var(--z-fg,#f0f0f0)] placeholder:text-[var(--z-muted-2,#606068)]"
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-[var(--z-accent,#00ff88)]/10 px-3 text-sm font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/20"
        >
          Apply
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title="No families found"
          body={`Tenant ${tenantId}. If families exist in Supabase under another tenant_id, update profile.tenant_id for this login to match your Lessonpreneur tenant.`}
        />
      ) : (
        <FamiliesListClient
          rows={rows}
          counts={counts}
          locationNameById={locationNameById}
        />
      )}
    </CRMLayout>
  );
}
