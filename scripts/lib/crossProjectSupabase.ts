import * as path from "path";
import * as dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

type PairConfig = {
  sourceUrl: string;
  sourceServiceRoleKey: string;
  targetUrl: string;
  targetServiceRoleKey: string;
};

export type TableSchemaSnapshot = {
  table: string;
  columns: string[];
};

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optionalEnv(name: string): string | null {
  const value = process.env[name];
  if (!value || value.trim().length === 0) return null;
  return value.trim();
}

export function resolveCrossProjectConfig(): PairConfig {
  const sourceUrl =
    optionalEnv("SOURCE_SUPABASE_URL") ??
    optionalEnv("LESSONPRENEUR_SUPABASE_URL") ??
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");

  const sourceServiceRoleKey =
    optionalEnv("SOURCE_SUPABASE_SERVICE_ROLE_KEY") ??
    optionalEnv("LESSONPRENEUR_SUPABASE_SERVICE_ROLE_KEY") ??
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const targetUrl =
    optionalEnv("TARGET_SUPABASE_URL") ??
    optionalEnv("ZIRO_SUPABASE_URL") ??
    optionalEnv("GNGBYY_SUPABASE_URL") ??
    "";

  const targetServiceRoleKey =
    optionalEnv("TARGET_SUPABASE_SERVICE_ROLE_KEY") ??
    optionalEnv("ZIRO_SUPABASE_SERVICE_ROLE_KEY") ??
    optionalEnv("SUPABASE_SERVICE_ROLE_KEY_GNGBYY") ??
    optionalEnv("GNGBYY_SUPABASE_SERVICE_ROLE_KEY") ??
    "";

  if (!targetUrl) {
    throw new Error(
      "Missing target URL. Set TARGET_SUPABASE_URL (or ZIRO_SUPABASE_URL).",
    );
  }
  if (!targetServiceRoleKey) {
    throw new Error(
      "Missing target service-role key. Set TARGET_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY_GNGBYY).",
    );
  }

  return {
    sourceUrl,
    sourceServiceRoleKey,
    targetUrl,
    targetServiceRoleKey,
  };
}

export function createAdminClient(
  url: string,
  serviceRoleKey: string,
): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function queryViaPgEndpoint(
  url: string,
  serviceRoleKey: string,
  query: string,
): Promise<Record<string, unknown>[]> {
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
  const payload = (await response.json()) as
    | Record<string, unknown>[]
    | { data?: Record<string, unknown>[] };
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function listPublicTables(
  client: SupabaseClient,
  url?: string,
  serviceRoleKey?: string,
): Promise<Set<string>> {
  const query =
    "select table_name from information_schema.tables where table_schema='public' order by table_name";

  let rows: Record<string, unknown>[] = [];
  const { data, error } = await client.rpc("exec_sql", { query });
  if (!error) {
    rows = (data ?? []) as Record<string, unknown>[];
  } else if (url && serviceRoleKey) {
    try {
      rows = await queryViaPgEndpoint(url, serviceRoleKey, query);
    } catch {
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Accept: "application/openapi+json",
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Unable to list tables (exec_sql + pg/query + openapi failed). Last error: ${response.status} ${text}`,
        );
      }
      const openapi = (await response.json()) as {
        components?: { schemas?: Record<string, unknown> };
      };
      const schemas = openapi.components?.schemas ?? {};
      const out = new Set<string>();
      for (const key of Object.keys(schemas)) {
        let name = key;
        if (name.startsWith("public.")) name = name.slice("public.".length);
        else if (name.startsWith("public_")) name = name.slice("public_".length);
        out.add(name.toLowerCase());
      }
      return out;
    }
  } else {
    throw new Error(error.message || "Failed to list tables.");
  }

  const out = new Set<string>();
  for (const row of rows as Array<{ table_name?: string }>) {
    const name = String(row.table_name ?? "").trim();
    if (name) out.add(name.toLowerCase());
  }
  return out;
}

function openApiColumnsFromSchemas(
  schemas: Record<string, { properties?: Record<string, unknown> }>,
  table: string,
): string[] {
  const direct =
    schemas[table] ??
    schemas[`public.${table}`] ??
    schemas[`public_${table}`];
  const fromDirect = Object.keys(direct?.properties ?? {});
  if (fromDirect.length) return fromDirect;

  const want = table.toLowerCase();
  for (const [rawKey, schema] of Object.entries(schemas)) {
    let name = rawKey;
    if (name.startsWith("public.")) name = name.slice("public.".length);
    else if (name.startsWith("public_")) name = name.slice("public_".length);
    if (name.toLowerCase() === want) {
      const cols = Object.keys(schema?.properties ?? {});
      if (cols.length) return cols;
    }
  }
  return [];
}

export async function getTableColumns(
  client: SupabaseClient,
  table: string,
  url?: string,
  serviceRoleKey?: string,
): Promise<TableSchemaSnapshot> {
  const query =
    "select column_name from information_schema.columns " +
    `where table_schema='public' and table_name='${table}' order by ordinal_position`;

  let rows: Record<string, unknown>[] = [];
  const { data, error } = await client.rpc("exec_sql", { query });
  if (!error) {
    rows = (data ?? []) as Record<string, unknown>[];
  } else if (url && serviceRoleKey) {
    try {
      rows = await queryViaPgEndpoint(url, serviceRoleKey, query);
    } catch {
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Accept: "application/openapi+json",
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Unable to read columns for ${table} (exec_sql + pg/query + openapi failed). Last error: ${response.status} ${text}`,
        );
      }

      const openapi = (await response.json()) as {
        components?: {
          schemas?: Record<
            string,
            {
              properties?: Record<string, unknown>;
            }
          >;
        };
      };
      const schemas = openapi.components?.schemas ?? {};
      const columns = openApiColumnsFromSchemas(schemas, table);
      return { table, columns };
    }
  } else {
    throw new Error(error.message || `Failed to load columns for ${table}`);
  }

  return {
    table,
    columns: (rows as Array<{ column_name?: string }>)
      .map((row) => String(row.column_name ?? "").trim())
      .filter(Boolean),
  };
}

export async function exactCount(
  client: SupabaseClient,
  table: string,
): Promise<number> {
  const { count, error } = await client
    .from(table)
    .select("*", { head: true, count: "exact" });
  if (error) throw new Error(error.message || `Failed counting table ${table}`);
  return count ?? 0;
}
