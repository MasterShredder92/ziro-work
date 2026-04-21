export const VADER_TOOLS = [
  {
    name: "get_teacher_profile",
    description: "Fetch a teacher's full profile by their ID.",
    input_schema: {
      type: "object",
      properties: {
        teacher_id: { type: "string", description: "The unique ID of the teacher." }
      },
      required: ["teacher_id"]
    }
  },
  {
    name: "search_teachers",
    description: "Search for teachers by name, email, or specialty.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for teacher name, email, or specialty." }
      },
      required: ["query"]
    }
  },
  {
    name: "update_teacher_profile",
    description: "Update specific fields in a teacher's profile.",
    input_schema: {
      type: "object",
      properties: {
        teacher_id: { type: "string", description: "The unique ID of the teacher to update." },
        updates: {
          type: "object",
          properties: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            email: { type: "string" },
            specialty: { type: "string" },
            bio: { type: "string" }
          },
          description: "An object containing the fields to update and their new values."
        }
      },
      required: ["teacher_id", "updates"]
    }
  },
  {
    name: "check_teacher_compliance",
    description: "Check a teacher's compliance status for a given date (e.g., notes submitted, sessions checked in).",
    input_schema: {
      type: "object",
      properties: {
        teacher_id: { type: "string", description: "The unique ID of the teacher." },
        date: { type: "string", description: "The date to check compliance for (YYYY-MM-DD). Defaults to today." }
      },
      required: ["teacher_id"]
    }
  },
  {
    name: "calculate_teacher_payroll",
    description: "Calculate a teacher's payroll for a specified period.",
    input_schema: {
      type: "object",
      properties: {
        teacher_id: { type: "string", description: "The unique ID of the teacher." },
        start_date: { type: "string", description: "Start date for payroll calculation (YYYY-MM-DD). Defaults to 14 days ago." },
        end_date: { type: "string", description: "End date for payroll calculation (YYYY-MM-DD). Defaults to today." }
      },
      required: ["teacher_id"]
    }
  }
];
