import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.TARGET_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const TENANT_ID = "00000000-0000-0000-0000-000000000000";

async function main() {
  if (!url || !key) {
    console.error("Missing credentials");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const today = new Date().toISOString().split("T")[0];

  console.log(`Checking all schedule blocks for ${today}...`);

  const { data: schedule, error } = await supabase
    .from("schedule_blocks")
    .select("id, teacher_id, student_id, start_time, block_date")
    .eq("tenant_id", TENANT_ID)
    .eq("block_date", today);

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log(`Total blocks found for today: ${schedule?.length || 0}`);
  if (schedule && schedule.length > 0) {
    console.log("First 5 blocks:", JSON.stringify(schedule.slice(0, 5), null, 2));
  }
  
  // Also check tomorrow just in case of timezone issues
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const { data: tomorrowSched } = await supabase
    .from("schedule_blocks")
    .select("id")
    .eq("tenant_id", TENANT_ID)
    .eq("block_date", tomorrow);
  console.log(`Total blocks found for tomorrow (${tomorrow}): ${tomorrowSched?.length || 0}`);
}

main().catch(console.error);
