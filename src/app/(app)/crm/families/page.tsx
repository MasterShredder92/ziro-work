import { countStudentsByFamilyIds, listFamilies } from "@data/families";
import { listStudents } from "@data/students";
import { listTeachers } from "@data/teachers";
import { listLocations } from "@data/locations";
import { clientFor } from "@data/_client";
import type { Family as FamilyRow } from "@/lib/types/entities";
import { getCRMTenantId } from "../_tenant";
import { FamiliesMissionControl } from "./families-mission-control-client";
import { deriveKpi, deriveInsights, deriveRiskByFamily, deriveBrief } from "./_insights";

export const dynamic = "force-dynamic";

function serverNowMs(): number {
  return Date.now();
}

async function fetchLastMessageAtByFamily(tenantId: string): Promise<Record<string, string>> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from("studio_messages")
    .select("family_id, created_at")
    .eq("tenant_id", tenantId)
    .not("family_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error || !data) return {};
  const out: Record<string, string> = {};
  for (const row of data as Array<{ family_id: string | null; created_at: string }>) {
    if (!row.family_id) continue;
    if (out[row.family_id]) continue;
    out[row.family_id] = row.created_at;
  }
  return out;
}

export default async function FamiliesIndexPage() {
  const tenantId = await getCRMTenantId();

  const [locations, rows, allTeachers, lastMessageAtByFamily] = await Promise.all([
    listLocations(tenantId, {}, { limit: 200 }),
    listFamilies(tenantId, {}, { limit: 2000, orderBy: "name", ascending: true }) as Promise<FamilyRow[]>,
    listTeachers(tenantId, {}, { limit: 500 }),
    fetchLastMessageAtByFamily(tenantId),
  ]);

  const locationNameById = Object.fromEntries(
    locations.map((l) => [l.id, l.name ?? l.id]),
  );

  const teacherNameById: Record<string, string> = {};
  const teacherPhotoById: Record<string, string | null> = {};
  for (const t of allTeachers) {
    const raw = t as {
      id: string;
      display_name?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      photo_url?: string | null;
    };
    const name =
      raw.display_name?.trim() ||
      [raw.first_name, raw.last_name].filter(Boolean).join(" ").trim();
    if (name) teacherNameById[raw.id] = name;
    const photo = raw.photo_url?.trim();
    teacherPhotoById[raw.id] = photo && photo.length > 0 ? photo : null;
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
    teacherId?: string | null;
    teacherName?: string | null;
    teacherPhotoUrl?: string | null;
    locationId?: string | null;
  }[]> = {};

  for (const s of allStudents) {
    if (!s.family_id) continue;
    if (!studentsByFamily[s.family_id]) studentsByFamily[s.family_id] = [];
    const raw = s as {
      teacher_id?: string | null;
      instrument?: string | null;
      location_id?: string | null;
    };
    const teacherName = raw.teacher_id ? (teacherNameById[raw.teacher_id] ?? null) : null;
    const teacherPhotoUrl = raw.teacher_id ? (teacherPhotoById[raw.teacher_id] ?? null) : null;
    studentsByFamily[s.family_id]!.push({
      id: s.id,
      name: [s.first_name, s.last_name].filter(Boolean).join(" ") || s.id,
      instrument: raw.instrument ?? null,
      status: s.status ?? null,
      teacherId: raw.teacher_id ?? null,
      teacherName,
      teacherPhotoUrl,
      locationId: raw.location_id ?? null,
    });
  }

  // Per-family aggregates built from the actual student rows (not the cached counts).
  const teacherByFamily: Record<string, string> = {};
  const activeStudentCountByFamily: Record<string, number> = {};
  const missingTeacherByFamily: Record<string, number> = {};
  const splitSiblingsByFamily: Record<string, boolean> = {};

  for (const [famId, studs] of Object.entries(studentsByFamily)) {
    const actives = studs.filter((s) => (s.status ?? "").toLowerCase() === "active");
    activeStudentCountByFamily[famId] = actives.length;
    const distinctTeacherIds = new Set<string>();
    const distinctTeacherNames = new Set<string>();
    let missing = 0;
    for (const s of actives) {
      if (s.teacherId) {
        distinctTeacherIds.add(s.teacherId);
        if (s.teacherName) distinctTeacherNames.add(s.teacherName);
      } else {
        missing += 1;
      }
    }
    missingTeacherByFamily[famId] = missing;
    splitSiblingsByFamily[famId] = actives.length >= 2 && distinctTeacherIds.size >= 2;
    const orderedNames = Array.from(distinctTeacherNames).sort();
    if (orderedNames.length > 0) teacherByFamily[famId] = orderedNames.join(", ");
  }

  const nowMs = serverNowMs();
  const insightInput = {
    rows,
    counts,
    locationNameById,
    studentsByFamily,
    teacherByFamily,
    activeStudentCountByFamily,
    missingTeacherByFamily,
    lastMessageAtByFamily,
    nowMs,
  };
  const kpi = deriveKpi(insightInput);
  const insights = deriveInsights(insightInput);
  const riskByFamily = deriveRiskByFamily(insightInput);
  const brief = deriveBrief(insightInput, kpi, riskByFamily);

  return (
    <div className="flex flex-col h-full">
      <FamiliesMissionControl
        rows={rows}
        counts={counts}
        locationNameById={locationNameById}
        locationOptions={locations.map((l) => ({ id: l.id, name: l.name ?? l.id }))}
        studentsByFamily={studentsByFamily}
        teacherByFamily={teacherByFamily}
        activeStudentCountByFamily={activeStudentCountByFamily}
        missingTeacherByFamily={missingTeacherByFamily}
        splitSiblingsByFamily={splitSiblingsByFamily}
        kpi={kpi}
        insights={insights}
        nowMs={nowMs}
        riskByFamily={riskByFamily}
        brief={brief}
      />
    </div>
  );
}
