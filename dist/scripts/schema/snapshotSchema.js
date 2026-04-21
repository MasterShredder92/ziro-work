import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const TARGET_TABLES = [
    "schedule_blocks",
    "students",
    "families",
    "teachers",
    "locations",
    "profile_locations",
    "teacher_locations",
    "finance_locations",
    "location_hours",
];
function requireEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
async function queryViaPgEndpoint(url, serviceKey, query) {
    const response = await fetch(`${url}/pg/query`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`pg/query failed (${response.status}): ${text}`);
    }
    const payload = (await response.json());
    if (Array.isArray(payload))
        return payload;
    return Array.isArray(payload.data) ? payload.data : [];
}
async function queryViaExecSqlRpc(url, serviceKey, query) {
    const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`rest rpc exec_sql failed (${response.status}): ${text}`);
    }
    const payload = (await response.json());
    if (Array.isArray(payload))
        return payload;
    return Array.isArray(payload.data) ? payload.data : [];
}
async function querySchema(url, serviceKey) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const supabase = createClient(url, serviceKey, {
        db: { schema: "public" },
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const tableList = TARGET_TABLES.map((name) => `'${name}'`).join(",");
    const query = `select table_name,column_name,data_type,udt_name,is_nullable,column_default,ordinal_position ` +
        `from information_schema.columns where table_schema='public' and table_name in (${tableList}) ` +
        `order by table_name,ordinal_position`;
    const rpc = await supabase.rpc("exec_sql", { query });
    if (!rpc.error) {
        return ((_a = rpc.data) !== null && _a !== void 0 ? _a : []);
    }
    try {
        return await queryViaExecSqlRpc(url, serviceKey, query);
    }
    catch (_l) {
        // continue to next fallback
    }
    try {
        return await queryViaPgEndpoint(url, serviceKey, query);
    }
    catch (_m) {
        const response = await fetch(`${url}/rest/v1/`, {
            headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                Accept: "application/openapi+json",
            },
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Unable to read schema (exec_sql + pg/query + openapi failed). Last error: ${response.status} ${text}`);
        }
        const openapi = (await response.json());
        const schemas = (_c = (_b = openapi.components) === null || _b === void 0 ? void 0 : _b.schemas) !== null && _c !== void 0 ? _c : {};
        const rows = [];
        for (const tableName of TARGET_TABLES) {
            const tableSchema = (_e = (_d = schemas[tableName]) !== null && _d !== void 0 ? _d : schemas[`public.${tableName}`]) !== null && _e !== void 0 ? _e : schemas[`public_${tableName}`];
            const properties = (_f = tableSchema === null || tableSchema === void 0 ? void 0 : tableSchema.properties) !== null && _f !== void 0 ? _f : {};
            const required = new Set((_g = tableSchema === null || tableSchema === void 0 ? void 0 : tableSchema.required) !== null && _g !== void 0 ? _g : []);
            let ordinal = 1;
            for (const [columnName, columnSchema] of Object.entries(properties)) {
                rows.push({
                    table_name: tableName,
                    column_name: columnName,
                    data_type: (_h = columnSchema.type) !== null && _h !== void 0 ? _h : "unknown",
                    udt_name: (_k = (_j = columnSchema.format) !== null && _j !== void 0 ? _j : columnSchema.type) !== null && _k !== void 0 ? _k : "unknown",
                    is_nullable: required.has(columnName) ? "NO" : "YES",
                    column_default: null,
                    ordinal_position: ordinal,
                });
                ordinal += 1;
            }
        }
        return rows;
    }
}
async function main() {
    var _a, _b, _c;
    const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const outputPath = path.resolve(process.cwd(), "scripts", "schema", "schema.json");
    const rows = await querySchema(url, serviceKey);
    const grouped = {};
    for (const table of TARGET_TABLES)
        grouped[table] = [];
    for (const row of rows) {
        const tableName = String((_a = row.table_name) !== null && _a !== void 0 ? _a : "").trim();
        if (!tableName)
            continue;
        if (!grouped[tableName])
            grouped[tableName] = [];
        grouped[tableName].push({
            column_name: row.column_name,
            data_type: row.data_type,
            udt_name: row.udt_name,
            is_nullable: row.is_nullable,
            column_default: row.column_default,
            ordinal_position: row.ordinal_position,
        });
    }
    const output = {
        generated_at: new Date().toISOString(),
        source: "supabase_information_schema",
        tables: grouped,
    };
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    console.log(`Wrote live schema snapshot: ${outputPath}`);
    for (const table of TARGET_TABLES) {
        console.log(`- ${table}: ${(_c = (_b = grouped[table]) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0} columns`);
    }
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
