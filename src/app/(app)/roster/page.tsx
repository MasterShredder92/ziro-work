import { listFamilies } from "@data/families";
import { listStudents } from "@data/students";
import { listLocations } from "@data/locations";
import { getTeachersForTenant } from "@data/teachers";
import { getCRMTenantId } from "../crm/_tenant";
import { RosterClient } from "./_client";

export const dynamic = "force-dynamic";

const LOCATION_SHORT_NAMES: Record<string, string> = {
  "f7b52dd5-12ee-437f-9c60-f8adf454ac31": "Bellevue",
  "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": "Gretna",
  "cebd97d4-c241-4de2-8ade-49e5cc0070d5": "Elkhorn",
  "d48229c1-b70a-4d29-893e-5079887dab76": "Omaha",
};

export default async function RosterPage() {
  const tenantId = await getCRMTenantId();

  // Fetch all data in parallel
  const [families, students, teachersResult, locations] = await Promise.all([
    listFamilies(tenantId, {}, { limit: 2000, orderBy: "name", ascending: true }),
    listStudents(tenantId, {}, { limit: 5000, orderBy: "last_name", ascending: true }),
    getTeachersForTenant(tenantId),
    listLocations(tenantId, { is_active: true }, { limit: 20 }),
  ]);

  const teachers = teachersResult.data ?? [];

  // Build teacher name lookup
  const teacherNames: Record<string, string> = {};
  for (const t of teachers) {
    const fn = (t as Record<string, unknown>).first_name as string | undefined;
    const ln = (t as Record<string, unknown>).last_name as string | undefined;
    const name = [fn, ln].filter(Boolean).join(" ");
    if (name) teacherNames[t.id] = name;
  }

  // Build location stats
  const locationStats = locations.map((loc) => {
    const locStudents = students.filter(
      (s) => s.location_id === loc.id && (s.status ?? "").toLowerCase() === "active"
    );
    const locFamilyIds = new Set(
      locStudents.map((s) => s.family_id).filter(Boolean)
    );
    const locFamilies = families.filter(
      (f) => f.primary_location_id === loc.id || locFamilyIds.has(f.id)
    );
    const monthlyRevenue = locFamilies.reduce((sum, f) => {
      const active = students.filter(
        (s) => s.family_id === f.id && (s.status ?? "").toLowerCase() === "active"
      );
      if (active.length === 0) return sum;
      const rate = (f.rate_tier ?? 4500) / 100;
      const blocks = active.reduce(
        (b, s) => b + (s.blocks_per_week ?? 1) * 4,
        0
      );
      return sum + blocks * rate;
    }, 0);

    return {
      id: loc.id,
      name: loc.name ?? loc.id,
      shortName: LOCATION_SHORT_NAMES[loc.id] ?? (loc.name ?? loc.id),
      studentCount: locStudents.length,
      familyCount: locFamilies.filter(
        (f) => (f.billing_status ?? "active").toLowerCase() === "active"
      ).length,
      monthlyRevenue,
    };
  });

  // Sort location stats by known order
  const ORDER = [
    "f7b52dd5-12ee-437f-9c60-f8adf454ac31", // Bellevue
    "40c67ffc-91b5-46a9-94bd-6ddffdfb7638", // Gretna
    "cebd97d4-c241-4de2-8ade-49e5cc0070d5", // Elkhorn
    "d48229c1-b70a-4d29-893e-5079887dab76", // Omaha
  ];
  locationStats.sort(
    (a, b) =>
      (ORDER.indexOf(a.id) === -1 ? 99 : ORDER.indexOf(a.id)) -
      (ORDER.indexOf(b.id) === -1 ? 99 : ORDER.indexOf(b.id))
  );

  return (
    <RosterClient
      families={families as Parameters<typeof RosterClient>[0]["families"]}
      students={students as Parameters<typeof RosterClient>[0]["students"]}
      teacherNames={teacherNames}
      locationStats={locationStats}
    />
  );
}
