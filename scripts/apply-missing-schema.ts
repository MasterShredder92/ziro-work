import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MIGRATION_PATH = path.resolve(
  process.cwd(),
  "supabase/migrations/20260417_rebuild_missing_core_tables.sql"
);

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "[apply-missing-schema] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  if (!fs.existsSync(MIGRATION_PATH)) {
    console.error(`[apply-missing-schema] Migration not found: ${MIGRATION_PATH}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(MIGRATION_PATH, "utf8");

  const supabase = createClient(url, key, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`[apply-missing-schema] Applying ${path.basename(MIGRATION_PATH)}...`);

  const { error } = await supabase.rpc("exec_sql", { query: sql });

  if (error) {
    console.log(
      "[apply-missing-schema] RPC exec_sql not available, falling back to PostgREST meta endpoint..."
    );

    const response = await fetch(`${url}/pg/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `[apply-missing-schema] FAILED: ${response.status} ${text}\n\nRPC error: ${error.message}`
      );
      process.exit(1);
    }
  }

  console.log("[apply-missing-schema] SUCCESS: migration applied.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[apply-missing-schema] FAILED:", err);
  process.exit(1);
});
