import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.TARGET_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const TENANT_ID = "00000000-0000-0000-0000-000000000000"; // Default tenant

async function run() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Find Nina
  console.log("Searching for Nina Acayan...");
  const { data: students, error: searchError } = await supabase
    .from("students")
    .select("id, first_name, last_name, instrument")
    .ilike("first_name", "%Nina%")
    .ilike("last_name", "%Acayan%")
    .limit(1);

  if (searchError || !students || students.length === 0) {
    console.error("Could not find Nina Acayan:", searchError?.message || "Not found");
    process.exit(1);
  }

  const student = students[0];
  console.log(`Found Nina Acayan (ID: ${student.id})`);

  // 2. Fetch Progress Data manually to avoid imports
  console.log("Fetching goals...");
  const { data: goals } = await supabase.from("progress_goals").select("*").eq("student_id", student.id);
  console.log("Fetching skills...");
  const { data: skills } = await supabase.from("progress_skills").select("*").eq("student_id", student.id);
  console.log("Fetching checkpoints...");
  const { data: checkpoints } = await supabase.from("progress_checkpoints").select("*").eq("student_id", student.id);
  console.log("Fetching evidence...");
  const { data: evidence } = await supabase.from("progress_evidence").select("*").eq("student_id", student.id);

  const kpis = {
    totalGoals: goals?.length || 0,
    goalsCompleted: goals?.filter(g => g.status === 'completed').length || 0,
    totalSkills: skills?.length || 0,
    skillsMastered: skills?.filter(s => s.status === 'mastered').length || 0,
    totalCheckpoints: checkpoints?.length || 0,
    checkpointsPassed: checkpoints?.filter(c => c.status === 'passed').length || 0,
    evidenceCount: evidence?.length || 0
  };

  const shapedGoals = (goals || []).map(g => {
    const goalSkills = (skills || []).filter(s => s.goal_id === g.id);
    return {
      ...g,
      skills: goalSkills.map(s => {
        const skillCheckpoints = (checkpoints || []).filter(c => c.skill_id === s.id);
        return {
          ...s,
          checkpoints: skillCheckpoints.map(c => {
            const cpEvidence = (evidence || []).filter(e => e.checkpoint_id === c.id);
            return { ...c, evidence: cpEvidence };
          })
        };
      })
    };
  });

  const surface = {
    studentId: student.id,
    tenantId: TENANT_ID,
    student: student,
    generatedAt: new Date().toISOString(),
    kpis,
    goals: shapedGoals
  };

  // 3. Generate PDF
  const dataPath = path.join("/tmp", `report_${student.id}.json`);
  const pdfPath = path.join("/tmp", `report_${student.id}.pdf`);
  fs.writeFileSync(dataPath, JSON.stringify(surface));

  console.log("Generating PDF via Python script...");
  execSync(`python3 /home/ubuntu/ziro-work-fresh/scripts/generate_report_pdf.py ${dataPath} ${pdfPath}`);

  // 4. Upload File
  console.log("Uploading PDF...");
  const uploadOutput = execSync(`manus-upload-file ${pdfPath}`).toString();
  const fileUrl = uploadOutput.trim();
  console.log(`Uploaded: ${fileUrl}`);

  // 5. Save to DB
  console.log("Saving report to database...");
  const { error: insertError } = await supabase.from("championship_reports").insert({
    tenant_id: TENANT_ID,
    student_id: student.id,
    report_type: "monthly",
    file_url: fileUrl,
    content: { framing: "Championship-Level", status: "Top-Tier", generated_at: new Date().toISOString() },
    created_at: new Date().toISOString()
  });

  if (insertError) {
    console.error("Failed to save to DB:", insertError.message);
    process.exit(1);
  }

  console.log("SUCCESS: Nina Acayan's report is live.");
}

run().catch(console.error);
