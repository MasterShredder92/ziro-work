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

  // Build teacher name lookup: id -> short name
  const teacherNameById: Record<string, string> = {};
  for (const t of allTeachers) {
    const name = (t as { display_name?: string | null; first_name?: string; last_name?: string }).display_name
      ?? [(t as { first_name?: string }).first_name, (t as { last_name?: string }).last_name].filter(Boolean).join(" ")
      ?? "";
    if (name) teacherNameById[t.id] = name;
  }

  const counts = await countStudentsByFamilyIds(
    tenantId,
    rows.map((r) => r.id),
  );

  const allStudents = await listStudents(tenantId, {}, { limit: 2000, orderBy: "created_at", ascending: false });
  const studentsByFamily: Record<string, { id: string; name: string; instrument?: string | null; status?: string | null; teacherName?: string | null }[]> = {};
  for (const s of allStudents) {
    if (!s.family_id) continue;
    if (!studentsByFamily[s.family_id]) studentsByFamily[s.family_id] = [];
    const teacherId = (s as { teacher_id?: string | null }).teacher_id;
    studentsByFamily[s.family_id]!.push({
      id: s.id,
      name: [s.first_name, s.last_name].filter(Boolean).join(" ") || (s as { name?: string }).name || s.id,
      instrument: (s as { instrument?: string | null }).instrument ?? null,
      status: s.status ?? null,
      teacherName: teacherId ? (teacherNameById[teacherId] ?? null) : null,
    });
  }

  // Pick the most common teacher per family
  const teacherByFamily: Record<string, string> = {};
  for (const [famId, studs] of Object.entries(studentsByFamily)) {
    const freq: Record<string, number> = {};
    for (const s of studs) {
      if (s.teacherName) freq[s.teacherName] = (freq[s.teacherName] ?? 0) + 1;
    }
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    if (top) teacherByFamily[famId] = top[0];
  }

  return (
    <div className="flex flex-col h-full">
      <FamiliesListClient
        rows={rows}
        counts={counts}
        locationNameById={locationNameById}
        studentsByFamily={studentsByFamily}
        teacherByFamily={teacherByFamily}
      />
    </div>
  );
}
