import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
export function requireEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
}
function optionalEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0)
        return null;
    return value.trim();
}
export function resolveCrossProjectConfig() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const sourceUrl = (_b = (_a = optionalEnv("SOURCE_SUPABASE_URL")) !== null && _a !== void 0 ? _a : optionalEnv("LESSONPRENEUR_SUPABASE_URL")) !== null && _b !== void 0 ? _b : requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const sourceServiceRoleKey = (_d = (_c = optionalEnv("SOURCE_SUPABASE_SERVICE_ROLE_KEY")) !== null && _c !== void 0 ? _c : optionalEnv("LESSONPRENEUR_SUPABASE_SERVICE_ROLE_KEY")) !== null && _d !== void 0 ? _d : requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const targetUrl = (_g = (_f = (_e = optionalEnv("TARGET_SUPABASE_URL")) !== null && _e !== void 0 ? _e : optionalEnv("ZIRO_SUPABASE_URL")) !== null && _f !== void 0 ? _f : optionalEnv("GNGBYY_SUPABASE_URL")) !== null && _g !== void 0 ? _g : "";
    const targetServiceRoleKey = (_l = (_k = (_j = (_h = optionalEnv("TARGET_SUPABASE_SERVICE_ROLE_KEY")) !== null && _h !== void 0 ? _h : optionalEnv("ZIRO_SUPABASE_SERVICE_ROLE_KEY")) !== null && _j !== void 0 ? _j : optionalEnv("SUPABASE_SERVICE_ROLE_KEY_GNGBYY")) !== null && _k !== void 0 ? _k : optionalEnv("GNGBYY_SUPABASE_SERVICE_ROLE_KEY")) !== null && _l !== void 0 ? _l : "";
    if (!targetUrl) {
        throw new Error("Missing target URL. Set TARGET_SUPABASE_URL (or ZIRO_SUPABASE_URL).");
    }
    if (!targetServiceRoleKey) {
        throw new Error("Missing target service-role key. Set TARGET_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY_GNGBYY).");
    }
    return {
        sourceUrl,
        sourceServiceRoleKey,
        targetUrl,
        targetServiceRoleKey,
    };
}
export function createAdminClient(url, serviceRoleKey) {
    return createClient(url, serviceRoleKey, {
        db: { schema: "public" },
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
async function queryViaPgEndpoint(url, serviceRoleKey, query) {
    const response = await fetch(`${url}/pg/query`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
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
export async function listPublicTables(client, url, serviceRoleKey) {
    var _a, _b, _c;
    const query = "select table_name from information_schema.tables where table_schema='public' order by table_name";
    let rows = [];
    const { data, error } = await client.rpc("exec_sql", { query });
    if (!error) {
        rows = (data !== null && data !== void 0 ? data : []);
    }
    else if (url && serviceRoleKey) {
        try {
            rows = await queryViaPgEndpoint(url, serviceRoleKey, query);
        }
        catch (_d) {
            const response = await fetch(`${url}/rest/v1/`, {
                headers: {
                    apikey: serviceRoleKey,
                    Authorization: `Bearer ${serviceRoleKey}`,
                    Accept: "application/openapi+json",
                },
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Unable to list tables (exec_sql + pg/query + openapi failed). Last error: ${response.status} ${text}`);
            }
            const openapi = (await response.json());
            const schemas = (_b = (_a = openapi.components) === null || _a === void 0 ? void 0 : _a.schemas) !== null && _b !== void 0 ? _b : {};
            const out = new Set();
            for (const key of Object.keys(schemas)) {
                let name = key;
                if (name.startsWith("public."))
                    name = name.slice("public.".length);
                else if (name.startsWith("public_"))
                    name = name.slice("public_".length);
                out.add(name.toLowerCase());
            }
            return out;
        }
    }
    else {
        throw new Error(error.message || "Failed to list tables.");
    }
    const out = new Set();
    for (const row of rows) {
        const name = String((_c = row.table_name) !== null && _c !== void 0 ? _c : "").trim();
        if (name)
            out.add(name.toLowerCase());
    }
    return out;
}
function openApiColumnsFromSchemas(schemas, table) {
    var _a, _b, _c, _d;
    const direct = (_b = (_a = schemas[table]) !== null && _a !== void 0 ? _a : schemas[`public.${table}`]) !== null && _b !== void 0 ? _b : schemas[`public_${table}`];
    const fromDirect = Object.keys((_c = direct === null || direct === void 0 ? void 0 : direct.properties) !== null && _c !== void 0 ? _c : {});
    if (fromDirect.length)
        return fromDirect;
    const want = table.toLowerCase();
    for (const [rawKey, schema] of Object.entries(schemas)) {
        let name = rawKey;
        if (name.startsWith("public."))
            name = name.slice("public.".length);
        else if (name.startsWith("public_"))
            name = name.slice("public_".length);
        if (name.toLowerCase() === want) {
            const cols = Object.keys((_d = schema === null || schema === void 0 ? void 0 : schema.properties) !== null && _d !== void 0 ? _d : {});
            if (cols.length)
                return cols;
        }
    }
    return [];
}
export async function getTableColumns(client, table, url, serviceRoleKey) {
    var _a, _b;
    const query = "select column_name from information_schema.columns " +
        `where table_schema='public' and table_name='${table}' order by ordinal_position`;
    let rows = [];
    const { data, error } = await client.rpc("exec_sql", { query });
    if (!error) {
        rows = (data !== null && data !== void 0 ? data : []);
    }
    else if (url && serviceRoleKey) {
        try {
            rows = await queryViaPgEndpoint(url, serviceRoleKey, query);
        }
        catch (_c) {
            const response = await fetch(`${url}/rest/v1/`, {
                headers: {
                    apikey: serviceRoleKey,
                    Authorization: `Bearer ${serviceRoleKey}`,
                    Accept: "application/openapi+json",
                },
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Unable to read columns for ${table} (exec_sql + pg/query + openapi failed). Last error: ${response.status} ${text}`);
            }
            const openapi = (await response.json());
            const schemas = (_b = (_a = openapi.components) === null || _a === void 0 ? void 0 : _a.schemas) !== null && _b !== void 0 ? _b : {};
            const columns = openApiColumnsFromSchemas(schemas, table);
            return { table, columns };
        }
    }
    else {
        throw new Error(error.message || `Failed to load columns for ${table}`);
    }
    return {
        table,
        columns: rows
            .map((row) => { var _a; return String((_a = row.column_name) !== null && _a !== void 0 ? _a : "").trim(); })
            .filter(Boolean),
    };
}
export async function exactCount(client, table) {
    const { count, error } = await client
        .from(table)
        .select("*", { head: true, count: "exact" });
    if (error)
        throw new Error(error.message || `Failed counting table ${table}`);
    return count !== null && count !== void 0 ? count : 0;
}
