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

  console.log(`Searching for Nathan Wolf's schedule for ${today}...`);

  // 1. Find Nathan
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, first_name, last_name")
    .ilike("first_name", "%Nathan%")
    .ilike("last_name", "%Wolf%")
    .limit(1);

  if (!teachers || teachers.length === 0) {
    console.error("Teacher Nathan Wolf not found.");
    process.exit(1);
  }

  const teacher = teachers[0];
  console.log(`Found Teacher: ${teacher.first_name} ${teacher.last_name} (ID: ${teacher.id})`);

  // 2. Get Schedule Blocks
  const { data: schedule, error } = await supabase
    .from("schedule_blocks")
    .select("id, start_time, end_time, status, student_id")
    .eq("tenant_id", TENANT_ID)
    .eq("teacher_id", teacher.id)
    .eq("block_date", today)
    .order("start_time");

  if (error) {
    console.error("Error fetching schedule:", error.message);
    process.exit(1);
  }

  if (!schedule || schedule.length === 0) {
    console.log("No students scheduled for today.");
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

  console.log("\n--- Nathan Wolf's Students Today ---");
  schedule.forEach((block: any) => {
    const studentName = block.student_id ? (studentMap[block.student_id] || "Unknown Student") : "No Student Assigned";
    console.log(`${block.start_time} - ${block.end_time}: ${studentName} [${block.status}]`);
  });
}

main().catch(console.error);
