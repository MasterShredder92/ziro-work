import { countStudentsByFamilyIds, listFamilies } from "@data/families";
import { listStudents } from "@data/students";
import { listTeachers } from "@data/teachers";
import { listLocations } from "@data/locations";
import type { Family as FamilyRow } from "@/lib/types/entities";
import { getCRMTenantId } from "../_tenant";
import { FamiliesListClient } from "./families-list-client";

export const dynamic = "force-dynamic";

export default async function FamiliesIndexPage() {
  const tenantId = await getCRMTenantId();

  const [locations, rows, allTeachers] = await Promise.all([
    listLocations(tenantId, {}, { limit: 200 }),
    listFamilies(tenantId, {}, { limit: 2000, orderBy: "name", ascending: true }) as Promise<FamilyRow[]>,
    listTeachers(tenantId, {}, { limit: 500 }),
  ]);

  const locationNameById = Object.fromEntries(
    locations.map((l) => [l.id, l.name ?? l.id]),
  );

  const teacherNameById: Record<string, string> = {};
  for (const t of allTeachers) {
    const raw = t as { id: string; display_name?: string | null; first_name?: string | null; last_name?: string | null };
    const name =
      raw.display_name?.trim() ||
      [raw.first_name, raw.last_name].filter(Boolean).join(" ").trim();
    if (name) teacherNameById[raw.id] = name;
  }

  const counts = await countStudentsByFamilyIds(
    tenantId,
    rows.map((r) => r.id),
  );

  const allStudents = await listStudents(tenantId, {}, { limit: 2000, orderBy: "created_at", ascending: false });

  const studentsByFamily: Record<string, {
    id: string;
    name: string;
    instrument?: string | null;
    status?: string | null;
    teacherName?: string | null;
  }[]> = {};

  for (const s of allStudents) {
    if (!s.family_id) continue;
    if (!studentsByFamily[s.family_id]) studentsByFamily[s.family_id] = [];
    const raw = s as { teacher_id?: string | null; instrument?: string | null };
    const teacherName = raw.teacher_id ? (teacherNameById[raw.teacher_id] ?? null) : null;
    studentsByFamily[s.family_id]!.push({
      id: s.id,
      name: [s.first_name, s.last_name].filter(Boolean).join(" ") || s.id,
      instrument: raw.instrument ?? null,
      status: s.status ?? null,
      teacherName,
    });
  }

  const teacherByFamily: Record<string, string> = {};
  for (const [famId, studs] of Object.entries(studentsByFamily)) {
    const seen = new Set<string>();
    for (const s of studs) {
      if (s.teacherName) seen.add(s.teacherName);
    }
    const unique = Array.from(seen).sort();
    if (unique.length > 0) teacherByFamily[famId] = unique.join(", ");
  }

  return (
    <div className="flex flex-col h-full">
      <FamiliesListClient
        rows={rows}
        counts={counts}
        locationNameById={locationNameById}
        locationOptions={locations.map((l) => ({ id: l.id, name: l.name ?? l.id }))}
        studentsByFamily={studentsByFamily}
        teacherByFamily={teacherByFamily}
      />
    </div>
  );
}
