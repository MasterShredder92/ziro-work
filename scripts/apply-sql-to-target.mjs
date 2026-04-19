/**
 * Apply a raw .sql file to the TARGET Supabase project.
 *
 * Prefers Supabase Management API (full SQL, multi-statement) when
 * SUPABASE_ACCESS_TOKEN is set. Otherwise prints instructions.
 *
 * Usage:
 *   node scripts/apply-sql-to-target.mjs scripts/schema/target-bootstrap.sql
 *
 * Env: TARGET_SUPABASE_URL, TARGET_SUPABASE_SERVICE_ROLE_KEY,
 *      SUPABASE_ACCESS_TOKEN (recommended), SUPABASE_PROJECT_REF (optional)
 */
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) throw new Error(`Missing ${name}`);
  return String(v).trim();
}

function projectRefFromUrl(url) {
  try {
    const u = new URL(url);
    const m = u.hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function applyViaManagementApi(ref, accessToken, sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 2000)}` };
  }
  return { ok: true, body: text };
}

async function main() {
  const file =
    process.argv[2] ||
    process.env.APPLY_SQL_FILE ||
    process.env.APPLY_SQL_PATH;
  if (!file) {
    console.error(
      "Usage: node scripts/apply-sql-to-target.mjs <path-to.sql>",
    );
    process.exit(1);
  }
  const abs = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(abs, "utf8");
  const targetUrl =
    process.env.TARGET_SUPABASE_URL || requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const ref =
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    projectRefFromUrl(targetUrl);
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();

  if (!ref) {
    console.error(`Could not parse project ref from URL: ${targetUrl}`);
    process.exit(1);
  }

  if (!token) {
    console.error(
      [
        "SUPABASE_ACCESS_TOKEN is not set; cannot apply SQL from the CLI.",
        "",
        "Option A: create a personal access token at https://supabase.com/dashboard/account/tokens",
        "  then add to .env.local:",
        "    SUPABASE_ACCESS_TOKEN=sbp_...",
        "",
        "Option B: open Supabase SQL Editor for the target project and paste:",
        `  ${abs}`,
      ].join("\n"),
    );
    process.exit(1);
  }

  console.log(`Applying ${abs} to project ${ref} via Management API ...`);
  const r = await applyViaManagementApi(ref, token, sql);
  if (!r.ok) {
    console.error(r.error);
    process.exit(1);
  }
  console.log("OK");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
