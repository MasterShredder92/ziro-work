import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MIGRATIONS_DIR = path.resolve(process.cwd(), "supabase", "migrations");

type MigrationResult = {
  file: string;
  ok: boolean;
  error?: string;
};

function extractProjectRef(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
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

async function runViaPgQuery(
  url: string,
  serviceKey: string,
  sql: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${url}/pg/query`, {
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

async function applyMigrationFile(
  filePath: string,
  exec: (sql: string) => Promise<{ ok: boolean; error?: string }>,
): Promise<MigrationResult> {
  const file = path.basename(filePath);
  const sql = fs.readFileSync(filePath, "utf8");
  const r = await exec(sql);
  return { file, ok: r.ok, error: r.error };
}

async function main() {
  const url =
    process.env.TARGET_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const overrideRef = process.env.SUPABASE_PROJECT_REF;

  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
    );
    process.exit(1);
  }

  const projectRef = overrideRef || extractProjectRef(url);
  if (!projectRef) {
    console.error(`Could not determine project ref from URL: ${url}`);
    process.exit(1);
  }

  const useMgmt = Boolean(accessToken);
  const label = useMgmt
    ? "Management API"
    : "exec_sql RPC with pg/query fallback";
  console.log(`Applying migrations to project ${projectRef} via ${label}`);

  const exec = async (sql: string): Promise<{ ok: boolean; error?: string }> => {
    if (useMgmt) {
      return runViaManagementApi(projectRef, accessToken!, sql);
    }
    const viaRpc = await runViaExecSqlRpc(url, serviceKey, sql);
    if (viaRpc.ok) return viaRpc;

    const viaPg = await runViaPgQuery(url, serviceKey, sql);
    if (viaPg.ok) return viaPg;

    return {
      ok: false,
      error: `exec_sql error: ${viaRpc.error}\npg/query error: ${viaPg.error}`,
    };
  };

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const onlyFile = process.env.APPLY_MIGRATION_FILE;
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".sql"))
    .filter((f) => (onlyFile ? f === onlyFile : true))
    .sort();

  console.log(`Applying ${files.length} migration(s)`);

  const results: MigrationResult[] = [];
  for (const f of files) {
    const full = path.join(MIGRATIONS_DIR, f);
    process.stdout.write(`  -> ${f} ... `);
    const r = await applyMigrationFile(full, exec);
    results.push(r);
    if (r.ok) console.log(`OK`);
    else {
      console.log(`FAIL`);
      console.log(`     ${r.error}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(
    `Summary: ${results.length - failed.length}/${results.length} migrations applied.`,
  );

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("../src/lib/audit/runFullAudit");
    const report = await mod.runFullAudit();
    console.log("\nAudit report:");
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.log(
      `\nAudit error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  process.exit(failed.length === 0 ? 0 : 1);
}

main();
