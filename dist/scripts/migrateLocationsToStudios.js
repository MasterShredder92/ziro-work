import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const REAL_SCHOOLS = ["Bellevue", "Gretna", "Elkhorn", "Omaha"];
const DEMO_LOCATION_NAMES = ["Demo", "North Studio", "South Studio"];
const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";
function requiredEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function normalizeName(value) {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
}
function locationSlug(name) {
    return normalizeName(name).replace(/\s+/g, "-");
}
function schoolFromName(value) {
    const normalized = normalizeName(value);
    for (const school of REAL_SCHOOLS) {
        if (normalized.includes(normalizeName(school)))
            return school;
    }
    return null;
}
function pickFirstString(values, fallback) {
    for (const value of values) {
        if (typeof value === "string" && value.trim().length > 0)
            return value.trim();
    }
    return fallback;
}
async function resolveTenantId(client) {
    var _a, _b, _c, _d;
    const explicit = (_a = process.env.TARGET_TENANT_ID) === null || _a === void 0 ? void 0 : _a.trim();
    if (explicit)
        return explicit;
    const { data, error } = await client.from("locations").select("tenant_id,name");
    if (error)
        throw error;
    const score = new Map();
    for (const row of data !== null && data !== void 0 ? data : []) {
        const tenantId = String((_b = row.tenant_id) !== null && _b !== void 0 ? _b : "").trim();
        const name = String((_c = row.name) !== null && _c !== void 0 ? _c : "");
        if (!tenantId)
            continue;
        const school = schoolFromName(name);
        const weight = school ? 5 : 1;
        score.set(tenantId, ((_d = score.get(tenantId)) !== null && _d !== void 0 ? _d : 0) + weight);
    }
    let bestTenant = DEFAULT_TENANT_ID;
    let bestScore = -1;
    for (const [tenantId, count] of score.entries()) {
        if (count > bestScore) {
            bestScore = count;
            bestTenant = tenantId;
        }
    }
    return bestTenant;
}
async function loadLocations(client) {
    const { data, error } = await client
        .from("locations")
        .select("id,tenant_id,name,address,city,state,zip,phone,email,website,is_active,hours_json");
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
async function loadFinanceLocations(client) {
    const { data, error } = await client
        .from("finance_locations")
        .select("id,tenant_id,name,code,location_type,is_active");
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
async function run() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const client = createClient(url, serviceKey, {
        db: { schema: "public" },
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const tenantId = await resolveTenantId(client);
    const allLocations = await loadLocations(client);
    const financeLocations = await loadFinanceLocations(client);
    const tenantLocations = allLocations.filter((row) => row.tenant_id === tenantId);
    const financeBySchool = new Map();
    for (const row of financeLocations) {
        const school = schoolFromName(row.name);
        if (!school)
            continue;
        if (!financeBySchool.has(school))
            financeBySchool.set(school, row);
    }
    const baseLocation = (_b = (_a = tenantLocations.find((row) => !DEMO_LOCATION_NAMES.includes(row.name))) !== null && _a !== void 0 ? _a : tenantLocations[0]) !== null && _b !== void 0 ? _b : null;
    let inserted = 0;
    let updated = 0;
    const canonicalIdBySchool = new Map();
    for (const school of REAL_SCHOOLS) {
        const matchedExact = (_c = tenantLocations.find((row) => normalizeName(row.name) === normalizeName(school))) !== null && _c !== void 0 ? _c : null;
        const matchedFuzzy = (_d = tenantLocations.find((row) => schoolFromName(row.name) === school)) !== null && _d !== void 0 ? _d : null;
        const matched = matchedExact !== null && matchedExact !== void 0 ? matchedExact : matchedFuzzy;
        const finance = (_e = financeBySchool.get(school)) !== null && _e !== void 0 ? _e : null;
        const payload = {
            tenant_id: tenantId,
            name: school,
            address: pickFirstString([matched === null || matched === void 0 ? void 0 : matched.address, baseLocation === null || baseLocation === void 0 ? void 0 : baseLocation.address], `${school} Campus`),
            city: pickFirstString([matched === null || matched === void 0 ? void 0 : matched.city, baseLocation === null || baseLocation === void 0 ? void 0 : baseLocation.city], school),
            state: pickFirstString([matched === null || matched === void 0 ? void 0 : matched.state, baseLocation === null || baseLocation === void 0 ? void 0 : baseLocation.state], "NE"),
            zip: pickFirstString([matched === null || matched === void 0 ? void 0 : matched.zip, baseLocation === null || baseLocation === void 0 ? void 0 : baseLocation.zip], "68000"),
            phone: pickFirstString([matched === null || matched === void 0 ? void 0 : matched.phone, baseLocation === null || baseLocation === void 0 ? void 0 : baseLocation.phone], ""),
            email: pickFirstString([matched === null || matched === void 0 ? void 0 : matched.email, baseLocation === null || baseLocation === void 0 ? void 0 : baseLocation.email], ""),
            website: pickFirstString([matched === null || matched === void 0 ? void 0 : matched.website, baseLocation === null || baseLocation === void 0 ? void 0 : baseLocation.website], ""),
            is_active: true,
            hours_json: Object.assign(Object.assign({}, ((_f = matched === null || matched === void 0 ? void 0 : matched.hours_json) !== null && _f !== void 0 ? _f : {})), { slug: locationSlug(school), timezone: "America/Chicago", source_finance_code: (_g = finance === null || finance === void 0 ? void 0 : finance.code) !== null && _g !== void 0 ? _g : null }),
        };
        if (matched) {
            const { error } = await client
                .from("locations")
                .update(payload)
                .eq("id", matched.id)
                .eq("tenant_id", tenantId);
            if (error)
                throw error;
            canonicalIdBySchool.set(school, matched.id);
            updated += 1;
            continue;
        }
        const { data: insertedRows, error } = await client
            .from("locations")
            .insert(payload)
            .select("id")
            .limit(1);
        if (error)
            throw error;
        const insertedId = String((_j = (_h = insertedRows === null || insertedRows === void 0 ? void 0 : insertedRows[0]) === null || _h === void 0 ? void 0 : _h.id) !== null && _j !== void 0 ? _j : "");
        if (insertedId)
            canonicalIdBySchool.set(school, insertedId);
        inserted += 1;
    }
    const fallbackCanonicalId = (_l = (_k = canonicalIdBySchool.get("Bellevue")) !== null && _k !== void 0 ? _k : canonicalIdBySchool.values().next().value) !== null && _l !== void 0 ? _l : null;
    if (fallbackCanonicalId) {
        const demoRows = tenantLocations.filter((row) => DEMO_LOCATION_NAMES.some((name) => normalizeName(name) === normalizeName(row.name)));
        if (demoRows.length > 0) {
            const demoIds = demoRows.map((row) => row.id);
            await client
                .from("schedule_blocks")
                .update({ location_id: fallbackCanonicalId, tenant_id: tenantId })
                .in("location_id", demoIds);
            await client
                .from("students")
                .update({ location_id: fallbackCanonicalId, tenant_id: tenantId })
                .in("location_id", demoIds);
            await client
                .from("families")
                .update({ primary_location_id: fallbackCanonicalId, tenant_id: tenantId })
                .in("primary_location_id", demoIds);
            await client.from("teacher_locations").delete().in("location_id", demoIds);
            await client.from("profile_locations").delete().in("location_id", demoIds);
            await client.from("location_hours").delete().in("location_id", demoIds);
            await client.from("locations").delete().in("id", demoIds).eq("tenant_id", tenantId);
        }
    }
    const { data: finalRows, error: finalError } = await client
        .from("locations")
        .select("id,name,tenant_id,is_active,address,city,state,zip")
        .eq("tenant_id", tenantId)
        .in("name", [...REAL_SCHOOLS])
        .order("name", { ascending: true });
    if (finalError)
        throw finalError;
    console.log("Location reconstruction complete.");
    console.log(`Tenant: ${tenantId}`);
    console.log(`Updated: ${updated}`);
    console.log(`Inserted: ${inserted}`);
    console.log("Canonical schools:");
    for (const row of finalRows !== null && finalRows !== void 0 ? finalRows : []) {
        console.log(`- ${String(row.name)} (${String(row.id)}) active=${String(row.is_active)} address=${String(row.address)}, ${String(row.city)}, ${String(row.state)} ${String(row.zip)}`);
    }
}
run().catch((err) => {
    if (err instanceof Error) {
        console.error(err.message);
    }
    else {
        try {
            console.error(JSON.stringify(err, null, 2));
        }
        catch (_a) {
            console.error(String(err));
        }
    }
    process.exit(1);
});
