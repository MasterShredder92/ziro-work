import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const REAL_SCHOOLS = ["Bellevue", "Gretna", "Elkhorn", "Omaha"];
const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const PAGE_SIZE = 1000;
function requiredEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function normalize(value) {
    return (value !== null && value !== void 0 ? value : "").trim().toLowerCase().replace(/\s+/g, " ");
}
function normalizeName(first, last) {
    return normalize(`${first !== null && first !== void 0 ? first : ""} ${last !== null && last !== void 0 ? last : ""}`);
}
function schoolFromName(value) {
    const n = normalize(value);
    for (const school of REAL_SCHOOLS) {
        if (n.includes(normalize(school)))
            return school;
    }
    return null;
}
async function fetchAll(client, table, columns) {
    const rows = [];
    let from = 0;
    for (;;) {
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await client.from(table).select(columns).range(from, to);
        if (error)
            throw error;
        const page = (data !== null && data !== void 0 ? data : []);
        rows.push(...page);
        if (page.length < PAGE_SIZE)
            break;
        from += PAGE_SIZE;
    }
    return rows;
}
async function resolveTenantId(client) {
    var _a, _b, _c;
    const explicit = (_a = process.env.TARGET_TENANT_ID) === null || _a === void 0 ? void 0 : _a.trim();
    if (explicit)
        return explicit;
    const rows = await fetchAll(client, "locations", "id,tenant_id,name,is_active");
    const score = new Map();
    for (const row of rows) {
        const tenantId = String((_b = row.tenant_id) !== null && _b !== void 0 ? _b : "").trim();
        if (!tenantId)
            continue;
        const weight = schoolFromName(row.name) ? 5 : 1;
        score.set(tenantId, ((_c = score.get(tenantId)) !== null && _c !== void 0 ? _c : 0) + weight);
    }
    let best = DEFAULT_TENANT_ID;
    let bestScore = -1;
    for (const [tenantId, count] of score.entries()) {
        if (count > bestScore) {
            bestScore = count;
            best = tenantId;
        }
    }
    return best;
}
async function run() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const client = createClient(url, key, {
        db: { schema: "public" },
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const tenantId = await resolveTenantId(client);
    const locations = await fetchAll(client, "locations", "id,tenant_id,name,is_active");
    const families = await fetchAll(client, "families", "id,tenant_id,name,primary_email,primary_phone,primary_location_id");
    const teachers = await fetchAll(client, "teachers", "id,tenant_id,first_name,last_name,display_name,email");
    const students = await fetchAll(client, "students", "id,tenant_id,family_id,location_id,teacher_id,first_name,last_name,email,phone");
    const canonicalLocations = locations.filter((row) => row.tenant_id === tenantId && schoolFromName(row.name) && row.is_active);
    const locationIdSet = new Set(canonicalLocations.map((row) => row.id));
    const fallbackLocationId = (_d = (_b = (_a = canonicalLocations.find((row) => normalize(row.name) === "bellevue")) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : (_c = canonicalLocations[0]) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null;
    if (!fallbackLocationId) {
        throw new Error("No canonical locations found. Run scripts/migrateLocationsToStudios.ts first.");
    }
    const tenantTeachers = teachers.filter((row) => row.tenant_id === tenantId);
    const teacherIdSet = new Set(tenantTeachers.map((row) => row.id));
    const teacherByNatural = new Map();
    for (const row of teachers) {
        const keys = [
            normalize(row.email),
            normalizeName(row.first_name, row.last_name),
            normalize(row.display_name),
        ].filter(Boolean);
        for (const keyValue of keys) {
            if (!teacherByNatural.has(keyValue))
                teacherByNatural.set(keyValue, row.id);
        }
    }
    const tenantFamilies = families.filter((row) => row.tenant_id === tenantId);
    const familyIdSet = new Set(tenantFamilies.map((row) => row.id));
    const familyByNatural = new Map();
    for (const row of families) {
        const keys = [normalize(row.primary_email), normalize(row.primary_phone), normalize(row.name)].filter(Boolean);
        for (const keyValue of keys) {
            if (!familyByNatural.has(keyValue))
                familyByNatural.set(keyValue, row.id);
        }
    }
    let updatedFamilies = 0;
    let updatedTeachers = 0;
    let updatedStudents = 0;
    let deletedTeacherLocations = 0;
    let insertedTeacherLocations = 0;
    let deletedProfileLocations = 0;
    for (const row of families) {
        const patch = {};
        if (row.tenant_id !== tenantId)
            patch.tenant_id = tenantId;
        if (!row.primary_location_id || !locationIdSet.has(row.primary_location_id)) {
            patch.primary_location_id = fallbackLocationId;
        }
        if (Object.keys(patch).length === 0)
            continue;
        const { error } = await client.from("families").update(patch).eq("id", row.id);
        if (error)
            throw error;
        updatedFamilies += 1;
        familyIdSet.add(row.id);
    }
    for (const row of teachers) {
        if (row.tenant_id === tenantId)
            continue;
        const { error } = await client.from("teachers").update({ tenant_id: tenantId }).eq("id", row.id);
        if (error)
            throw error;
        updatedTeachers += 1;
        teacherIdSet.add(row.id);
    }
    for (const row of students) {
        const patch = {};
        if (row.tenant_id !== tenantId)
            patch.tenant_id = tenantId;
        if (row.family_id && !familyIdSet.has(row.family_id)) {
            const mappedFamily = (_f = (_e = familyByNatural.get(normalize(row.email))) !== null && _e !== void 0 ? _e : familyByNatural.get(normalize(row.phone))) !== null && _f !== void 0 ? _f : null;
            patch.family_id = mappedFamily;
        }
        if (!row.location_id || !locationIdSet.has(row.location_id)) {
            patch.location_id = fallbackLocationId;
        }
        if (row.teacher_id && !teacherIdSet.has(row.teacher_id)) {
            const mappedTeacher = (_h = (_g = teacherByNatural.get(normalize(row.email))) !== null && _g !== void 0 ? _g : teacherByNatural.get(normalizeName(row.first_name, row.last_name))) !== null && _h !== void 0 ? _h : null;
            patch.teacher_id = mappedTeacher;
        }
        if (Object.keys(patch).length === 0)
            continue;
        const { error } = await client.from("students").update(patch).eq("id", row.id);
        if (error)
            throw error;
        updatedStudents += 1;
    }
    const { data: teacherLocationsRows, error: tlError } = await client
        .from("teacher_locations")
        .select("id,teacher_id,location_id");
    if (tlError)
        throw tlError;
    const teacherLocationPairs = new Set();
    for (const link of teacherLocationsRows !== null && teacherLocationsRows !== void 0 ? teacherLocationsRows : []) {
        const teacherId = String((_j = link.teacher_id) !== null && _j !== void 0 ? _j : "");
        const locationId = String((_k = link.location_id) !== null && _k !== void 0 ? _k : "");
        const valid = teacherIdSet.has(teacherId) && locationIdSet.has(locationId);
        if (!valid) {
            const { error } = await client.from("teacher_locations").delete().eq("id", link.id);
            if (error)
                throw error;
            deletedTeacherLocations += 1;
            continue;
        }
        teacherLocationPairs.add(`${teacherId}:${locationId}`);
    }
    for (const teacherId of teacherIdSet) {
        const keyPair = `${teacherId}:${fallbackLocationId}`;
        if (teacherLocationPairs.has(keyPair))
            continue;
        const { error } = await client.from("teacher_locations").insert({
            teacher_id: teacherId,
            location_id: fallbackLocationId,
        });
        if (error)
            throw error;
        insertedTeacherLocations += 1;
    }
    const { data: profileLocationsRows, error: plError } = await client
        .from("profile_locations")
        .select("id,location_id");
    if (plError)
        throw plError;
    for (const row of profileLocationsRows !== null && profileLocationsRows !== void 0 ? profileLocationsRows : []) {
        if (locationIdSet.has(String((_l = row.location_id) !== null && _l !== void 0 ? _l : "")))
            continue;
        const { error } = await client.from("profile_locations").delete().eq("id", row.id);
        if (error)
            throw error;
        deletedProfileLocations += 1;
    }
    console.log("People reconstruction complete.");
    console.log(`Tenant: ${tenantId}`);
    console.log(`Updated families: ${updatedFamilies}`);
    console.log(`Updated teachers: ${updatedTeachers}`);
    console.log(`Updated students: ${updatedStudents}`);
    console.log(`Deleted invalid teacher_locations: ${deletedTeacherLocations}`);
    console.log(`Inserted teacher_locations fallback links: ${insertedTeacherLocations}`);
    console.log(`Deleted invalid profile_locations: ${deletedProfileLocations}`);
}
run().catch((error) => {
    if (error instanceof Error) {
        console.error(error.message);
    }
    else {
        try {
            console.error(JSON.stringify(error, null, 2));
        }
        catch (_a) {
            console.error(String(error));
        }
    }
    process.exit(1);
});
