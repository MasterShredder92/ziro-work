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
  const teacherId = "bc3fd153-9000-468a-b0ec-04af19eb0dbc"; // Nathan Wolf

  console.log("Searching for any student ever scheduled with Nathan Wolf...");
  const { data: schedule, error } = await supabase
    .from("schedule_blocks")
    .select("block_date, start_time, student_id")
    .eq("teacher_id", teacherId)
    .not("student_id", "is", null)
    .limit(10);

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  if (!schedule || schedule.length === 0) {
    console.log("Nathan Wolf has no students assigned in any schedule block.");
  } else {
    console.log(JSON.stringify(schedule, null, 2));
  }
}

main().catch(console.error);
