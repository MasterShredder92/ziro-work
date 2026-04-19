import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const SYNC_ORDER_PATH = path.resolve(
  process.cwd(),
  "scripts",
  "schema",
  "public-sync-order.json",
);
const CRITICAL_TABLES = JSON.parse(fs.readFileSync(SYNC_ORDER_PATH, "utf8")).map(
  (row) => row.table,
);

const BUILTIN_TYPE_PREFIXES = [
  "uuid",
  "text",
  "integer",
  "bigint",
  "smallint",
  "boolean",
  "numeric",
  "real",
  "double precision",
  "json",
  "jsonb",
  "date",
  "time",
  "timestamp",
  "character varying",
  "varchar",
  "character",
  "bytea",
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function qIdent(value) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function adminClient(url, key) {
  return createClient(url, key, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function baseTypeName(formattedType) {
  const noArray = formattedType.endsWith("[]")
    ? formattedType.slice(0, -2)
    : formattedType;
  return noArray.replace(/\(.+\)$/, "").trim().toLowerCase();
}

function isBuiltinType(formattedType) {
  const base = baseTypeName(formattedType);
  return BUILTIN_TYPE_PREFIXES.some((prefix) => base.startsWith(prefix));
}

function safeDefaultExpr(defaultExpr) {
  if (!defaultExpr) return null;
  const expr = String(defaultExpr).trim();
  if (!expr) return null;
  if (expr.toLowerCase().includes("nextval(")) return null;
  return expr;
}

async function sourceColumns(sourceClient, table) {
  const query =
    "select " +
    "a.attname as column_name, " +
    "pg_catalog.format_type(a.atttypid, a.atttypmod) as formatted_type, " +
    "a.attnotnull as not_null, " +
    "pg_get_expr(d.adbin, d.adrelid) as default_expr " +
    "from pg_attribute a " +
    "join pg_class c on c.oid = a.attrelid " +
    "join pg_namespace n on n.oid = c.relnamespace " +
    "left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum " +
    "where n.nspname = 'public' " +
    `and c.relname = '${table}' ` +
    "and a.attnum > 0 " +
    "and not a.attisdropped " +
    "order by a.attnum";

  const { data, error } = await sourceClient.rpc("exec_sql", { query });
  if (error) {
    throw new Error(`Could not load source schema for ${table}: ${error.message}`);
  }
  return data || [];
}

async function sourceEnumLabels(sourceClient, typeName) {
  const query =
    "select e.enumlabel as label " +
    "from pg_type t " +
    "join pg_enum e on e.enumtypid = t.oid " +
    "join pg_namespace n on n.oid = t.typnamespace " +
    "where n.nspname = 'public' " +
    `and t.typname = '${typeName}' ` +
    "order by e.enumsortorder";

  const { data, error } = await sourceClient.rpc("exec_sql", { query });
  if (error) return [];
  return (data || [])
    .map((row) => String(row.label || "").trim())
    .filter(Boolean);
}

async function targetOpenApiColumns(targetUrl, targetKey) {
  const response = await fetch(`${targetUrl}/rest/v1/`, {
    headers: {
      apikey: targetKey,
      Authorization: `Bearer ${targetKey}`,
      Accept: "application/openapi+json",
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Could not read target OpenAPI: ${response.status} ${text}`);
  }
  const openapi = await response.json();
  const schemas = openapi?.components?.schemas ?? {};
  const out = new Map();
  for (const [rawName, schema] of Object.entries(schemas)) {
    const tableName = rawName.startsWith("public.")
      ? rawName.slice("public.".length)
      : rawName.startsWith("public_")
        ? rawName.slice("public_".length)
        : rawName;
    const cols = new Set(Object.keys(schema?.properties ?? {}));
    if (cols.size > 0) out.set(tableName.toLowerCase(), cols);
  }
  return out;
}

function renderEnumCreate(typeName, labels) {
  const escaped = labels.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ");
  return (
    "do $$ begin " +
    `if not exists (select 1 from pg_type where typname = '${typeName}') then ` +
    `create type public.${qIdent(typeName)} as enum (${escaped}); ` +
    "end if; end $$;"
  );
}

function renderAlter(table, column) {
  const parts = [
    `alter table if exists public.${qIdent(table)} add column if not exists ${qIdent(column.column_name)} ${column.formatted_type}`,
  ];
  const def = safeDefaultExpr(column.default_expr);
  if (def) parts.push(`default ${def}`);
  if (column.not_null && def) parts.push("not null");
  return `${parts.join(" ")};`;
}

async function main() {
  const sourceUrl = process.env.SOURCE_SUPABASE_URL || requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const sourceKey =
    process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY ||
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const targetUrl = requireEnv("TARGET_SUPABASE_URL");
  const targetKey = requireEnv("TARGET_SUPABASE_SERVICE_ROLE_KEY");

  const source = adminClient(sourceUrl, sourceKey);
  const targetCols = await targetOpenApiColumns(targetUrl, targetKey);

  const sql = ["-- Auto-generated target column parity SQL"];
  const neededCustomTypes = new Set();
  const missingByTable = new Map();

  for (const table of CRITICAL_TABLES) {
    const srcCols = await sourceColumns(source, table);
    if (!srcCols.length) continue;
    const tgt = targetCols.get(table.toLowerCase()) ?? new Set();
    const missing = srcCols.filter((col) => !tgt.has(col.column_name));
    if (!missing.length) continue;
    missingByTable.set(table, missing);

    for (const col of missing) {
      const type = String(col.formatted_type || "").trim();
      if (!type || isBuiltinType(type)) continue;
      const base = baseTypeName(type);
      if (base) neededCustomTypes.add(base);
    }
  }

  for (const typeName of Array.from(neededCustomTypes)) {
    const labels = await sourceEnumLabels(source, typeName);
    if (labels.length > 0) sql.push(renderEnumCreate(typeName, labels));
  }

  for (const [table, columns] of missingByTable.entries()) {
    sql.push(`-- ${table}`);
    for (const col of columns) {
      sql.push(renderAlter(table, col));
    }
  }

  const outPath = path.resolve(process.cwd(), "scripts", "schema", "target-column-parity.sql");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${sql.join("\n")}\n`, "utf8");

  console.log(`Wrote ${outPath}`);
  for (const [table, columns] of missingByTable.entries()) {
    console.log(`- ${table}: +${columns.length} columns`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
