import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function loadCriticalTables(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`Expected non-empty array in ${filePath}`);
  }
  if (typeof raw[0] === "string") {
    return raw;
  }
  return raw.map((row) => row.table);
}

const useFullPublicList = process.argv.includes("--full");
const listFromEnv = process.env.PUBLIC_BOOTSTRAP_TABLE_LIST?.trim();
const defaultRelative = useFullPublicList
  ? path.join("scripts", "schema", "lessonpreneur-public-tables-complete.json")
  : path.join("scripts", "schema", "public-sync-order.json");
const listRel = listFromEnv || defaultRelative;
const SYNC_ORDER_PATH = path.isAbsolute(listRel)
  ? listRel
  : path.resolve(process.cwd(), listRel);
const CRITICAL_TABLES = loadCriticalTables(SYNC_ORDER_PATH);

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

async function listTables(targetClient, targetUrl, targetKey) {
  const query =
    "select table_name from information_schema.tables where table_schema='public' order by table_name";

  const { data, error } = await targetClient.rpc("exec_sql", { query });
  if (!error) {
    return new Set(
      (data || [])
        .map((row) => String(row.table_name || "").trim().toLowerCase())
        .filter(Boolean),
    );
  }

  const response = await fetch(`${targetUrl}/rest/v1/`, {
    headers: {
      apikey: targetKey,
      Authorization: `Bearer ${targetKey}`,
      Accept: "application/openapi+json",
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Could not list target tables: ${response.status} ${text}`);
  }
  const openapi = await response.json();
  const schemas = openapi?.components?.schemas ?? {};
  const out = new Set();
  for (const key of Object.keys(schemas)) {
    let name = key;
    if (name.startsWith("public.")) name = name.slice("public.".length);
    else if (name.startsWith("public_")) name = name.slice("public_".length);
    out.add(name.toLowerCase());
  }
  return out;
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

function defaultReferencesOtherColumns(defaultExpr, allNames, currentName) {
  const expr = String(defaultExpr || "");
  if (!expr) return false;
  for (const name of allNames) {
    if (name === currentName) continue;
    const re = new RegExp(`\\b${name.replace(/"/g, "")}\\b`, "i");
    if (re.test(expr)) return true;
  }
  return false;
}

function renderCreate(table, columns) {
  const names = columns.map((c) => String(c.column_name || "").trim()).filter(Boolean);
  const defs = columns.map((col) => {
    const parts = [`${qIdent(col.column_name)} ${col.formatted_type}`];
    const def = col.default_expr ? String(col.default_expr) : "";
    if (
      def &&
      !def.toLowerCase().includes("nextval(") &&
      !defaultReferencesOtherColumns(def, names, String(col.column_name || ""))
    ) {
      parts.push(`default ${def}`);
    }
    if (col.not_null) parts.push("not null");
    return `  ${parts.join(" ")}`;
  });
  if (columns.some((col) => col.column_name === "id")) {
    defs.push(`  primary key (${qIdent("id")})`);
  }
  return `create table if not exists public.${qIdent(table)} (\n${defs.join(",\n")}\n);`;
}

function baseTypeName(formattedType) {
  const noArray = formattedType.endsWith("[]")
    ? formattedType.slice(0, -2)
    : formattedType;
  const withoutParams = noArray.replace(/\(.+\)$/, "").trim().toLowerCase();
  return withoutParams;
}

function isBuiltinType(formattedType) {
  const base = baseTypeName(formattedType);
  return BUILTIN_TYPE_PREFIXES.some((prefix) => base.startsWith(prefix));
}

async function enumLabels(sourceClient, typeName) {
  const query =
    "select e.enumlabel as label " +
    "from pg_type t " +
    "join pg_enum e on e.enumtypid = t.oid " +
    "join pg_namespace n on n.oid = t.typnamespace " +
    "where n.nspname = 'public' " +
    `and t.typname = '${typeName}' ` +
    "order by e.enumsortorder";
  const { data, error } = await sourceClient.rpc("exec_sql", { query });
  if (error) {
    throw new Error(`Could not load enum values for ${typeName}: ${error.message}`);
  }
  return (data || []).map((row) => String(row.label || "").trim()).filter(Boolean);
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

async function main() {
  const sourceUrl = process.env.SOURCE_SUPABASE_URL || requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const sourceKey =
    process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY ||
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const targetUrl = requireEnv("TARGET_SUPABASE_URL");
  const targetKey = requireEnv("TARGET_SUPABASE_SERVICE_ROLE_KEY");

  const source = adminClient(sourceUrl, sourceKey);
  const target = adminClient(targetUrl, targetKey);

  const targetTables = await listTables(target, targetUrl, targetKey);
  const missing = CRITICAL_TABLES.filter((table) => !targetTables.has(table.toLowerCase()));

  console.log(`Table list: ${SYNC_ORDER_PATH}`);

  const sqlChunks = [
    "-- Auto-generated CREATE TABLE IF NOT EXISTS for missing public tables (see generate-target-bootstrap-sql.mjs)",
    "create extension if not exists \"pgcrypto\";",
  ];

  const pendingTables = [];
  const customTypes = new Set();

  for (const table of missing) {
    const cols = await sourceColumns(source, table);
    if (!cols.length) continue;
    pendingTables.push({ table, cols });
    for (const col of cols) {
      const type = String(col.formatted_type || "").trim();
      if (!type || isBuiltinType(type)) continue;
      const base = baseTypeName(type);
      if (base) customTypes.add(base);
    }
  }

  for (const typeName of Array.from(customTypes)) {
    const labels = await enumLabels(source, typeName);
    if (labels.length > 0) {
      sqlChunks.push(renderEnumCreate(typeName, labels));
    }
  }

  for (const { table, cols } of pendingTables) {
    sqlChunks.push(renderCreate(table, cols));
  }

  const outPath = path.resolve(process.cwd(), "scripts", "schema", "target-bootstrap.sql");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${sqlChunks.join("\n\n")}\n`, "utf8");

  console.log(`Wrote ${outPath}`);
  for (const table of missing) {
    console.log(`- ${table}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
