import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.TARGET_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const TENANT_ID = "00000000-0000-0000-0000-000000000000"; 
const STUDENT_ID = "bdf9980c-dd32-4e36-98c8-08aa176e36fe"; // Nina's ID
const REPORT_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663566800631/fRkZQZrFpojWrpuV.pdf";

async function run() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing credentials");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log("Linking Nina's report...");
  const { error } = await supabase.from("championship_reports").insert({
    tenant_id: TENANT_ID,
    student_id: STUDENT_ID,
    report_type: "monthly",
    file_url: REPORT_URL,
    content: { framing: "Championship-Level", status: "Top-Tier", generated_at: new Date().toISOString() },
    created_at: new Date().toISOString()
  });

  if (error) {
    console.error("Failed to link report:", error.message);
    process.exit(1);
  }

  console.log("SUCCESS: Nina's report is now linked.");
}

run().catch(console.error);
