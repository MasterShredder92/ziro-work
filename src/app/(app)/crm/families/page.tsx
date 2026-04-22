import { countStudentsByFamilyIds, listFamilies } from "@data/families";
import { listStudents } from "@data/students";
import { listLocations } from "@data/locations";
import type { Family as FamilyRow } from "@/lib/types/entities";
import { getCRMTenantId } from "../_tenant";
import { FamiliesListClient } from "./families-list-client";

export const dynamic = "force-dynamic";

export default async function FamiliesIndexPage() {
  const tenantId = await getCRMTenantId();

  const [locations, rows] = await Promise.all([
    listLocations(tenantId, { is_active: true }, { limit: 200 }),
    listFamilies(tenantId, {}, { limit: 500, orderBy: "name", ascending: true }) as Promise<FamilyRow[]>,
  ]);

  const locationNameById = Object.fromEntries(
    locations.map((l) => [l.id, l.name ?? l.id]),
  );

  const counts = await countStudentsByFamilyIds(
    tenantId,
    rows.map((r) => r.id),
  );

  // Fetch students for instrument badges on each family row
  const allStudents = await listStudents(tenantId, {}, { limit: 2000, orderBy: "created_at", ascending: false });
  const studentsByFamily: Record<string, { id: string; name: string; instrument?: string | null; status?: string | null }[]> = {};
  for (const s of allStudents) {
    if (!s.family_id) continue;
    if (!studentsByFamily[s.family_id]) studentsByFamily[s.family_id] = [];
    studentsByFamily[s.family_id]!.push({
      id: s.id,
      name: [s.first_name, s.last_name].filter(Boolean).join(" ") || (s as { name?: string }).name || s.id,
      instrument: (s as { instrument?: string | null }).instrument ?? null,
      status: s.status ?? null,
    });
  }

  return (
    <div className="flex flex-col h-full">
      <FamiliesListClient
        rows={rows}
        counts={counts}
        locationNameById={locationNameById}
        studentsByFamily={studentsByFamily}
      />
    </div>
  );
}
