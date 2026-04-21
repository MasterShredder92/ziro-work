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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const client = createClient(url, key, {
        db: { schema: "public" },
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const tenantId = await resolveTenantId(client);
    const [scheduleBlocks, locations, teachers, students, rooms] = await Promise.all([
        fetchAll(client, "schedule_blocks", "id,tenant_id,location_id,teacher_id,student_id,room_id,original_teacher_id,original_teacher_name"),
        fetchAll(client, "locations", "id,tenant_id,name,is_active"),
        fetchAll(client, "teachers", "id,tenant_id,first_name,last_name,display_name,email"),
        fetchAll(client, "students", "id,tenant_id,first_name,last_name,email,phone"),
        fetchAll(client, "rooms", "id,tenant_id,location_id"),
    ]);
    const canonicalLocations = locations.filter((row) => row.tenant_id === tenantId && row.is_active && schoolFromName(row.name));
    const locationIdSet = new Set(canonicalLocations.map((row) => row.id));
    const fallbackLocationId = (_d = (_b = (_a = canonicalLocations.find((row) => normalize(row.name) === "bellevue")) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : (_c = canonicalLocations[0]) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null;
    if (!fallbackLocationId) {
        throw new Error("No canonical locations found. Run scripts/migrateLocationsToStudios.ts first.");
    }
    const teacherIdSet = new Set(teachers.filter((t) => t.tenant_id === tenantId).map((t) => t.id));
    const studentIdSet = new Set(students.filter((s) => s.tenant_id === tenantId).map((s) => s.id));
    const roomIdSet = new Set(rooms
        .filter((room) => room.tenant_id === tenantId && (!room.location_id || locationIdSet.has(room.location_id)))
        .map((room) => room.id));
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
    const studentByNatural = new Map();
    for (const row of students) {
        const keys = [
            normalize(row.email),
            normalize(row.phone),
            normalizeName(row.first_name, row.last_name),
        ].filter(Boolean);
        for (const keyValue of keys) {
            if (!studentByNatural.has(keyValue))
                studentByNatural.set(keyValue, row.id);
        }
    }
    const firstTeacherId = (_e = teacherIdSet.values().next().value) !== null && _e !== void 0 ? _e : null;
    if (!firstTeacherId) {
        throw new Error("No teachers available for schedule mapping.");
    }
    const locationById = new Map(locations.map((row) => [row.id, row]));
    const canonicalLocationBySchool = new Map();
    for (const row of canonicalLocations) {
        const school = schoolFromName(row.name);
        if (school && !canonicalLocationBySchool.has(school)) {
            canonicalLocationBySchool.set(school, row.id);
        }
    }
    let updatedBlocks = 0;
    let remappedTeachers = 0;
    let remappedStudents = 0;
    let remappedLocations = 0;
    let nulledRooms = 0;
    let fixedTenants = 0;
    for (const row of scheduleBlocks) {
        const patch = {};
        if (row.tenant_id !== tenantId) {
            patch.tenant_id = tenantId;
            fixedTenants += 1;
        }
        let nextTeacherId = row.teacher_id;
        if (!teacherIdSet.has(nextTeacherId)) {
            const mapped = (_g = (_f = (row.original_teacher_id && teacherIdSet.has(row.original_teacher_id)
                ? row.original_teacher_id
                : null)) !== null && _f !== void 0 ? _f : teacherByNatural.get(normalize(row.original_teacher_name))) !== null && _g !== void 0 ? _g : firstTeacherId;
            nextTeacherId = mapped;
            patch.teacher_id = mapped;
            remappedTeachers += 1;
        }
        if (row.student_id && !studentIdSet.has(row.student_id)) {
            const mappedStudent = (_h = studentByNatural.get(normalize(row.student_id))) !== null && _h !== void 0 ? _h : null;
            patch.student_id = mappedStudent;
            remappedStudents += 1;
        }
        if (!locationIdSet.has(row.location_id)) {
            const sourceLocation = locationById.get(row.location_id);
            const sourceSchool = sourceLocation ? schoolFromName(sourceLocation.name) : null;
            const mappedLocation = (_j = (sourceSchool ? canonicalLocationBySchool.get(sourceSchool) : null)) !== null && _j !== void 0 ? _j : fallbackLocationId;
            patch.location_id = mappedLocation;
            remappedLocations += 1;
        }
        if (row.room_id && !roomIdSet.has(row.room_id)) {
            patch.room_id = null;
            nulledRooms += 1;
        }
        if (Object.keys(patch).length === 0)
            continue;
        const { error } = await client.from("schedule_blocks").update(patch).eq("id", row.id);
        if (error)
            throw error;
        updatedBlocks += 1;
    }
    console.log("Schedule reconstruction complete.");
    console.log(`Tenant: ${tenantId}`);
    console.log(`Total schedule blocks scanned: ${scheduleBlocks.length}`);
    console.log(`Updated blocks: ${updatedBlocks}`);
    console.log(`Teacher remaps: ${remappedTeachers}`);
    console.log(`Student remaps/nulls: ${remappedStudents}`);
    console.log(`Location remaps: ${remappedLocations}`);
    console.log(`Room nullifications: ${nulledRooms}`);
    console.log(`Tenant fixes: ${fixedTenants}`);
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
