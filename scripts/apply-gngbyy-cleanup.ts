import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MIGRATION_FILE = path.resolve(
  process.cwd(),
  "supabase",
  "migrations",
  "20260417_cleanup_gngbyy.sql",
);

const DROPPED_TABLES = [
  "students",
  "families",
  "teachers",
  "enrollments",
  "schedules",
  "invoices",
  "payments",
  "lifecycle",
  "notes",
  "addresses",
] as const;

function getConfig() {
  const projectRef =
    process.env.SUPABASE_PROJECT_REF || "dhsyxyhtoadrqfrlmsqe";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY_GNGBYY ||
    process.env.GNGBYY_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!projectRef) {
    throw new Error("SUPABASE_PROJECT_REF is required.");
  }
  if (!serviceKey) {
    throw new Error(
      "Service-role key is required. Set SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY_GNGBYY).",
    );
  }
  return { projectRef, serviceKey, accessToken };
}

async function runViaManagementApi(
  projectRef: string,
  accessToken: string,
  sql: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `HTTP ${res.status}: ${text}` };
  }
  return { ok: true };
}

async function runViaExecSqlRpc(
  url: string,
  serviceKey: string,
  sql: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `HTTP ${res.status}: ${text}` };
  }
  return { ok: true };
}

async function verifyCleanup(projectRef: string, serviceKey: string) {
  const url = `https://${projectRef}.supabase.co`;
  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const stillPresent: string[] = [];
  for (const t of DROPPED_TABLES) {
    const { error } = await client.from(t).select("*").limit(0);
    if (!error) {
      stillPresent.push(t);
      continue;
    }
    const msg = (error.message || "").toLowerCase();
    const looksMissing =
      msg.includes("does not exist") ||
      msg.includes("could not find") ||
      msg.includes("not found") ||
      msg.includes("relation");
    if (!looksMissing) stillPresent.push(t);
  }
  return stillPresent;
}

async function main() {
  const { projectRef, serviceKey, accessToken } = getConfig();
  const url = `https://${projectRef}.supabase.co`;

  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`Migration file not found: ${MIGRATION_FILE}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(MIGRATION_FILE, "utf8");

  console.log(`Applying cleanup migration to ${projectRef}...`);
  const result = accessToken
    ? await runViaManagementApi(projectRef, accessToken, sql)
    : await runViaExecSqlRpc(url, serviceKey, sql);

  if (!result.ok) {
    console.error(`  FAIL: ${result.error}`);
    console.error(
      "  Tip: DDL requires the Supabase Management API. Set SUPABASE_ACCESS_TOKEN\n" +
        "       (a personal access token from https://supabase.com/dashboard/account/tokens)\n" +
        "       so the script uses /v1/projects/{ref}/database/query.",
    );
    process.exit(1);
  }
  console.log("  OK");

  console.log("Verifying cleanup...");
  const stillPresent = await verifyCleanup(projectRef, serviceKey);
  if (stillPresent.length > 0) {
    console.error(`  FAIL: these tables still exist: ${stillPresent.join(", ")}`);
    process.exit(1);
  }
  console.log(`  OK: none of [${DROPPED_TABLES.join(", ")}] are present.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
