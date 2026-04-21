/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const { createAdminClient, resolveCrossProjectConfig, } = require("./lib/crossProjectSupabase");
/** Lessonpreneur `public` north-star order (excludes `_archive_*`; not auth/storage/realtime). */
const TABLE_ORDER = require(path.join(__dirname, "schema", "public-sync-order.json"));
const BATCH_SIZE = 500;
async function tableExists(client, table) {
    const { error } = await client.from(table).select("*").limit(1);
    if (!error)
        return true;
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("does not exist") ||
        msg.includes("not found") ||
        msg.includes("could not find") ||
        msg.includes("relation") ||
        msg.includes("schema cache")) {
        return false;
    }
    return true;
}
async function loadOpenApiColumns(targetUrl, targetServiceRoleKey) {
    var _a, _b, _c;
    const response = await fetch(`${targetUrl}/rest/v1/`, {
        headers: {
            apikey: targetServiceRoleKey,
            Authorization: `Bearer ${targetServiceRoleKey}`,
            Accept: "application/openapi+json",
        },
    });
    if (!response.ok)
        return new Map();
    const openapi = (await response.json());
    const schemas = (_b = (_a = openapi.components) === null || _a === void 0 ? void 0 : _a.schemas) !== null && _b !== void 0 ? _b : {};
    const out = new Map();
    for (const [rawName, schema] of Object.entries(schemas)) {
        const tableName = rawName.startsWith("public.")
            ? rawName.slice("public.".length)
            : rawName.startsWith("public_")
                ? rawName.slice("public_".length)
                : rawName;
        const cols = Object.keys((_c = schema.properties) !== null && _c !== void 0 ? _c : {});
        if (cols.length > 0)
            out.set(tableName.toLowerCase(), new Set(cols));
    }
    return out;
}
function resolveFlag(name, fallback = false) {
    const value = process.env[name];
    if (!value)
        return fallback;
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
}
function applyPrimaryKeyOrder(query, primaryKey) {
    const cols = primaryKey
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    let q = query;
    for (const col of cols) {
        q = q.order(col, { ascending: true });
    }
    return q;
}
async function syncTable(source, target, spec, dryRun, targetColumns) {
    var _a;
    let synced = 0;
    let offset = 0;
    for (;;) {
        const base = source.from(spec.table).select("*");
        const ordered = applyPrimaryKeyOrder(base, spec.primaryKey);
        const { data, error } = await ordered.range(offset, offset + BATCH_SIZE - 1);
        if (error) {
            throw new Error(`Read failed for ${spec.table}: ${error.message}`);
        }
        const batch = (data !== null && data !== void 0 ? data : []);
        if (batch.length === 0)
            break;
        const mappedBatch = targetColumns
            ? batch.map((row) => {
                const next = {};
                for (const [key, value] of Object.entries(row)) {
                    if (targetColumns.has(key))
                        next[key] = value;
                }
                return next;
            })
            : batch;
        if (!dryRun) {
            let rowsForUpsert = mappedBatch;
            for (;;) {
                const onConflict = spec.primaryKey.replace(/\s+/g, "");
                const { error: upsertError } = await target
                    .from(spec.table)
                    .upsert(rowsForUpsert, { onConflict });
                if (!upsertError)
                    break;
                const msg = upsertError.message || "";
                const missingColMatch = (_a = msg.match(/Could not find the '([^']+)' column/i)) !== null && _a !== void 0 ? _a : msg.match(/column \"([^\"]+)\" does not exist/i);
                if (!missingColMatch) {
                    throw new Error(`Upsert failed for ${spec.table}: ${upsertError.message}`);
                }
                const missingCol = missingColMatch[1];
                rowsForUpsert = rowsForUpsert.map((row) => {
                    const next = Object.assign({}, row);
                    delete next[missingCol];
                    return next;
                });
            }
        }
        synced += batch.length;
        offset += batch.length;
    }
    return { table: spec.table, synced, skipped: dryRun };
}
async function main() {
    const cfg = resolveCrossProjectConfig();
    const dryRun = resolveFlag("SYNC_DRY_RUN", true);
    const strict = resolveFlag("SYNC_STRICT_TABLES", false);
    const source = createAdminClient(cfg.sourceUrl, cfg.sourceServiceRoleKey);
    const target = createAdminClient(cfg.targetUrl, cfg.targetServiceRoleKey);
    const targetColumnMap = await loadOpenApiColumns(cfg.targetUrl, cfg.targetServiceRoleKey);
    const executable = [];
    const skipped = [];
    for (const spec of TABLE_ORDER) {
        const [sourceExists, targetExists] = await Promise.all([
            tableExists(source, spec.table),
            tableExists(target, spec.table),
        ]);
        if (!sourceExists) {
            const reason = "table not found in source";
            if (strict)
                throw new Error(`${spec.table}: ${reason}`);
            skipped.push({ table: spec.table, reason });
            continue;
        }
        if (!targetExists) {
            const reason = "table not found in target";
            if (strict)
                throw new Error(`${spec.table}: ${reason}`);
            skipped.push({ table: spec.table, reason });
            continue;
        }
        executable.push(spec);
    }
    const results = [];
    for (const spec of executable) {
        process.stdout.write(`${dryRun ? "[DRY RUN] " : ""}Syncing ${spec.table} ... `);
        const result = await syncTable(source, target, spec, dryRun, targetColumnMap.get(spec.table.toLowerCase()));
        results.push(result);
        console.log(`${result.synced} rows`);
    }
    const totalRows = results.reduce((sum, row) => sum + row.synced, 0);
    console.log("");
    console.log(JSON.stringify({
        sourceProject: cfg.sourceUrl,
        targetProject: cfg.targetUrl,
        dryRun,
        strict,
        syncedTables: results.length,
        totalRows,
        skippedTables: skipped,
    }, null, 2));
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
export {};
