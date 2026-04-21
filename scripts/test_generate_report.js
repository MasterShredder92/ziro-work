
require("dotenv").config({ path: ".env.local" });
const { getProgressSurface } = require("../src/lib/progress/service");
const { getServiceClient } = require("../src/lib/supabase");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

async function testGenerateReport(studentId) {
  const tenantId = "f7f20626-4c06-4877-8521-0305a1e8e412"; // Default tenant ID
  const db = getServiceClient();

  try {
    console.log(`--- [1/5] Fetching progress surface for student: ${studentId}`)
    const surface = await getProgressSurface(studentId, tenantId);
    console.log("Progress surface fetched successfully.");

    const dataPath = path.join("/tmp", `report_${studentId}.json`);
    const pdfPath = path.join("/tmp", `report_${studentId}.pdf`);

    fs.writeFileSync(dataPath, JSON.stringify(surface));
    console.log(`--- [2/5] Wrote report data to ${dataPath}`);

    console.log("--- [3/5] Generating PDF...");
    execSync(`python3 /home/ubuntu/ziro-work-fresh/scripts/generate_report_pdf.py ${dataPath} ${pdfPath}`);
    console.log(`PDF generated at ${pdfPath}`);

    console.log("--- [4/5] Uploading PDF to S3...");
    const uploadOutput = execSync(`manus-upload-file ${pdfPath}`).toString();
    const fileUrl = uploadOutput.trim();
    console.log(`PDF uploaded to S3: ${fileUrl}`);

    console.log("--- [5/5] Saving report to database...");
    const { data, error } = await db.from("championship_reports").insert({
      tenant_id: tenantId,
      student_id: studentId,
      report_type: "monthly",
      file_url: fileUrl,
      content: {
        framing: "Championship-Level",
        status: "Top-Tier",
        generated_at: new Date().toISOString(),
        summary: `Championship-Level Progress Mirror for ${surface.student?.first_name}.`,
        metrics: {
          goals: `${surface.kpis.goalsCompleted}/${surface.kpis.totalGoals}`,
          skills: `${surface.kpis.skillsMastered}/${surface.kpis.totalSkills}`,
          checkpoints: `${surface.kpis.checkpointsPassed}/${surface.kpis.totalCheckpoints}`,
        }
      },
      created_at: new Date().toISOString()
    }).select().single();

    if (error) {
      console.error("Error saving report record:", error.message);
      return;
    }

    console.log("SUCCESS: Report generated and saved successfully.", data);

  } catch (e) {
    console.error("Error generating report:", e.message);
  }
}

const studentId = process.argv[2];
if (!studentId) {
  console.error("Please provide a student ID.");
  process.exit(1);
}

testGenerateReport(studentId);
