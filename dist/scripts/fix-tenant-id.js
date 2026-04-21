import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const TABLES = [
    "students",
    "families",
    "teachers",
    "enrollments",
    "schedules",
    "invoices",
    "payments",
    "lifecycle",
    "notes",
];
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
function resolveConfig() {
    var _a;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Set it in .env.local.");
    }
    if (!serviceKey) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local.");
    }
    let projectRef = "";
    try {
        projectRef = (_a = new URL(url).hostname.split(".")[0]) !== null && _a !== void 0 ? _a : "";
    }
    catch (_b) {
        projectRef = "";
    }
    return { url, projectRef, serviceKey };
}
async function updateTenantId(client, table, tenantId) {
    var _a;
    const { error, count } = await client.from(table)
        .update({ tenant_id: tenantId }, { count: "exact" })
        .gte("id", ZERO_UUID)
        .select("*", { head: true, count: "exact" });
    if (error) {
        const pg = error;
        return { table, updated: 0, error: `${(_a = pg.code) !== null && _a !== void 0 ? _a : ""} ${pg.message}`.trim() };
    }
    return { table, updated: count !== null && count !== void 0 ? count : 0 };
}
async function verifyTable(client, table, tenantId) {
    var _a, _b;
    const totalRes = await client
        .from(table)
        .select("id", { head: true, count: "exact" });
    if (totalRes.error) {
        return { total: 0, mismatched: 0, error: totalRes.error.message };
    }
    const total = (_a = totalRes.count) !== null && _a !== void 0 ? _a : 0;
    const mismatchRes = await client
        .from(table)
        .select("id", { head: true, count: "exact" })
        .neq("tenant_id", tenantId);
    if (mismatchRes.error) {
        return { total, mismatched: 0, error: mismatchRes.error.message };
    }
    return { total, mismatched: (_b = mismatchRes.count) !== null && _b !== void 0 ? _b : 0 };
}
async function main() {
    const { url, projectRef, serviceKey } = resolveConfig();
    const tenantId = DEFAULT_TENANT_ID;
    console.log(`Project:   ${projectRef} (${url})`);
    console.log(`Tenant ID: ${tenantId}`);
    console.log("");
    const client = createClient(url, serviceKey, {
        db: { schema: "public" },
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const outcomes = [];
    for (const t of TABLES) {
        process.stdout.write(`UPDATE ${t.padEnd(13)} ... `);
        const o = await updateTenantId(client, t, tenantId);
        outcomes.push(o);
        if (o.error)
            console.log(`FAIL (${o.error})`);
        else
            console.log(`OK (${o.updated} rows)`);
    }
    console.log("\nVerifying alignment...");
    let anyMismatch = false;
    for (const t of TABLES) {
        const v = await verifyTable(client, t, tenantId);
        if (v.error) {
            console.log(`  ${t.padEnd(13)} ERROR: ${v.error}`);
            anyMismatch = true;
            continue;
        }
        const status = v.mismatched === 0 ? "OK" : "MISMATCH";
        if (v.mismatched !== 0)
            anyMismatch = true;
        console.log(`  ${t.padEnd(13)} ${status}  total=${v.total}  with_tenant=${v.total - v.mismatched}`);
    }
    if (anyMismatch) {
        console.error("\nFAIL: at least one table still has rows whose tenant_id != DEFAULT_TENANT_ID.");
        process.exit(1);
    }
    console.log(`\nOK: every row across [${TABLES.join(", ")}] now has tenant_id = ${tenantId}.`);
    process.exit(0);
}
main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
});
