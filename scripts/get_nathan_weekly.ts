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
  
  // Define current week range (April 20 - April 26, 2026)
  const startDate = "2026-04-20";
  const endDate = "2026-04-26";

  console.log(`Fetching weekly schedule for Nathan Wolf (${startDate} to ${endDate})...`);

  const { data: schedule, error } = await supabase
    .from("schedule_blocks")
    .select("block_date, start_time, end_time, status, student_id")
    .eq("teacher_id", teacherId)
    .gte("block_date", startDate)
    .lte("block_date", endDate)
    .not("student_id", "is", null)
    .order("block_date")
    .order("start_time");

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  if (!schedule || schedule.length === 0) {
    console.log("No students found for this week.");
    process.exit(0);
  }

  const studentIds = Array.from(new Set(schedule.map(s => s.student_id)));
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name")
    .in("id", studentIds);

  const studentMap: Record<string, string> = {};
  students?.forEach(s => {
    studentMap[s.id] = `${s.first_name} ${s.last_name}`;
  });

  const weeklyData: Record<string, any[]> = {};
  schedule.forEach((block: any) => {
    if (!weeklyData[block.block_date]) weeklyData[block.block_date] = [];
    weeklyData[block.block_date].push({
      time: `${block.start_time.slice(0, 5)} - ${block.end_time.slice(0, 5)}`,
      student: studentMap[block.student_id] || "Unknown Student",
      status: block.status
    });
  });

  console.log(JSON.stringify(weeklyData, null, 2));
}

main().catch(console.error);
