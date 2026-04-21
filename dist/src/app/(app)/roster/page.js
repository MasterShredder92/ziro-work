import { jsx as _jsx } from "react/jsx-runtime";
import { listFamilies } from "@data/families";
import { listStudents } from "@data/students";
import { listLocations } from "@data/locations";
import { getTeachersForTenant } from "@data/teachers";
import { getCRMTenantId } from "../crm/_tenant";
import { RosterClient } from "./_client";
export const dynamic = "force-dynamic";
const LOCATION_SHORT_NAMES = {
    "f7b52dd5-12ee-437f-9c60-f8adf454ac31": "Bellevue",
    "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": "Gretna",
    "cebd97d4-c241-4de2-8ade-49e5cc0070d5": "Elkhorn",
    "d48229c1-b70a-4d29-893e-5079887dab76": "Omaha",
};
export default async function RosterPage() {
    var _a;
    const tenantId = await getCRMTenantId();
    // Fetch all data in parallel
    const [families, students, teachersResult, locations] = await Promise.all([
        listFamilies(tenantId, {}, { limit: 2000, orderBy: "name", ascending: true }),
        listStudents(tenantId, {}, { limit: 5000, orderBy: "last_name", ascending: true }),
        getTeachersForTenant(tenantId),
        listLocations(tenantId, { is_active: true }, { limit: 20 }),
    ]);
    const teachers = (_a = teachersResult.data) !== null && _a !== void 0 ? _a : [];
    // Build teacher name lookup
    const teacherNames = {};
    for (const t of teachers) {
        const fn = t.first_name;
        const ln = t.last_name;
        const name = [fn, ln].filter(Boolean).join(" ");
        if (name)
            teacherNames[t.id] = name;
    }
    // Build location stats
    const locationStats = locations.map((loc) => {
        var _a, _b, _c;
        const locStudents = students.filter((s) => { var _a; return s.location_id === loc.id && ((_a = s.status) !== null && _a !== void 0 ? _a : "").toLowerCase() === "active"; });
        const locFamilyIds = new Set(locStudents.map((s) => s.family_id).filter(Boolean));
        const locFamilies = families.filter((f) => f.primary_location_id === loc.id || locFamilyIds.has(f.id));
        const monthlyRevenue = locFamilies.reduce((sum, f) => {
            var _a;
            const active = students.filter((s) => { var _a; return s.family_id === f.id && ((_a = s.status) !== null && _a !== void 0 ? _a : "").toLowerCase() === "active"; });
            if (active.length === 0)
                return sum;
            const rate = ((_a = f.rate_tier) !== null && _a !== void 0 ? _a : 4500) / 100;
            const blocks = active.reduce((b, s) => { var _a; return b + ((_a = s.blocks_per_week) !== null && _a !== void 0 ? _a : 1) * 4; }, 0);
            return sum + blocks * rate;
        }, 0);
        return {
            id: loc.id,
            name: (_a = loc.name) !== null && _a !== void 0 ? _a : loc.id,
            shortName: (_b = LOCATION_SHORT_NAMES[loc.id]) !== null && _b !== void 0 ? _b : ((_c = loc.name) !== null && _c !== void 0 ? _c : loc.id),
            studentCount: locStudents.length,
            familyCount: locFamilies.filter((f) => { var _a; return ((_a = f.billing_status) !== null && _a !== void 0 ? _a : "active").toLowerCase() === "active"; }).length,
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
    locationStats.sort((a, b) => (ORDER.indexOf(a.id) === -1 ? 99 : ORDER.indexOf(a.id)) -
        (ORDER.indexOf(b.id) === -1 ? 99 : ORDER.indexOf(b.id)));
    return (_jsx(RosterClient, { families: families, students: students, teacherNames: teacherNames, locationStats: locationStats }));
}
