import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.TARGET_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!url || !key) {
    console.error("Missing credentials");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log("Fetching latest 5 schedule blocks from the database...");
  const { data: schedule, error } = await supabase
    .from("schedule_blocks")
    .select("id, block_date, start_time, teacher_id, student_id")
    .order("block_date", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log(JSON.stringify(schedule, null, 2));
}

main().catch(console.error);
