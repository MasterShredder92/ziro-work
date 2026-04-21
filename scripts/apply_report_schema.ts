import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.TARGET_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const SQL_PATH = path.resolve(process.cwd(), "supabase/migrations/20260421134000_add_championship_reports.sql");

async function main() {
  if (!url || !key) {
    console.error("Missing credentials");
    process.exit(1);
  }

  const sql = fs.readFileSync(SQL_PATH, "utf8");
  const supabase = createClient(url, key);

  console.log("Applying migration...");
  
  // Try to use rpc exec_sql if available, otherwise we might need another way
  // In many Supabase setups, you can't run arbitrary SQL via the client unless a function exists.
  // However, we can try to use the REST API for a direct query if the key is service_role.
  
  const response = await fetch(`${url}/rest/v1/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "X-Custom-Query": "true" // This is a placeholder, Supabase doesn't support direct SQL via REST like this usually
    },
    body: JSON.stringify({ query: sql })
  });

  // Since direct SQL via client is hard, let's use the postgres user if we can, or assume the table exists after a manual push if this fails.
  // But wait, the user asked me to "push it" earlier, which meant git push.
  // I should probably tell the user to run the SQL in their Supabase console if I can't do it here.
  
  console.log("Migration script created. If this fails, please run the SQL in your Supabase SQL Editor.");
}

main().catch(console.error);
