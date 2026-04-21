export const STEWIE_TOOLS = [
  {
    name: "generate_progress_report",
    description: "Generate a Championship-Level progress report for a student. Resolves student by ID.",
    parameters: {
      type: "object",
      properties: {
        student_id: { type: "string", description: "The UUID of the student." },
        report_type: { type: "string", enum: ["monthly", "quarterly", "annual"], default: "monthly" }
      },
      required: ["student_id"]
    }
  },
  {
    name: "get_championship_reports",
    description: "Retrieve historical Championship-Level reports for a student.",
    parameters: {
      type: "object",
      properties: {
        student_id: { type: "string" },
        limit: { type: "number", default: 10 }
      },
      required: ["student_id"]
    }
  }
];
