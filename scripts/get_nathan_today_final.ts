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
  const today = "2026-04-21";

  const { data: schedule } = await supabase
    .from("schedule_blocks")
    .select("start_time, end_time, status, student_id")
    .eq("teacher_id", teacherId)
    .eq("block_date", today)
    .not("student_id", "is", null)
    .order("start_time");

  if (!schedule || schedule.length === 0) {
    console.log("No students found.");
    process.exit(0);
  }

  const studentIds = schedule.map(s => s.student_id);
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name")
    .in("id", studentIds);

  const studentMap: Record<string, string> = {};
  students?.forEach(s => {
    studentMap[s.id] = `${s.first_name} ${s.last_name}`;
  });

  console.log(`\n--- Nathan Wolf's Students for Today (${today}) ---`);
  schedule.forEach((block: any) => {
    const name = studentMap[block.student_id] || "Unknown Student";
    console.log(`${block.start_time} - ${block.end_time}: ${name} [${block.status}]`);
  });
}

main().catch(console.error);
