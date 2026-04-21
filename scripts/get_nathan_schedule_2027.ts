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
  const targetDate = "2027-03-25"; // Based on database content

  console.log(`Searching for Nathan Wolf's schedule for ${targetDate}...`);

  // 1. Find Nathan
  const teacherId = "bc3fd153-9000-468a-b0ec-04af19eb0dbc"; // From previous search

  // 2. Get Schedule Blocks
  const { data: schedule, error } = await supabase
    .from("schedule_blocks")
    .select("id, start_time, end_time, status, student_id")
    .eq("tenant_id", TENANT_ID)
    .eq("teacher_id", teacherId)
    .eq("block_date", targetDate)
    .order("start_time");

  if (error) {
    console.error("Error fetching schedule:", error.message);
    process.exit(1);
  }

  if (!schedule || schedule.length === 0) {
    console.log(`No students scheduled for ${targetDate}.`);
    process.exit(0);
  }

  // 3. Get Student Names
  const studentIds = schedule.map(s => s.student_id).filter(Boolean);
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name")
    .in("id", studentIds);

  const studentMap: Record<string, string> = {};
  students?.forEach(s => {
    studentMap[s.id] = `${s.first_name} ${s.last_name}`;
  });

  console.log(`\n--- Nathan Wolf's Students for ${targetDate} ---`);
  schedule.forEach((block: any) => {
    const studentName = block.student_id ? (studentMap[block.student_id] || "Unknown Student") : "No Student Assigned";
    console.log(`${block.start_time} - ${block.end_time}: ${studentName} [${block.status}]`);
  });
}

main().catch(console.error);
