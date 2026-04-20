import type Anthropic from "@anthropic-ai/sdk";

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "update_student",
    description:
      "Update a student's profile fields. Use this to save bio, goals, learning style, prior experience/notes, teacher notes, or any other writable student field. Always confirm what you wrote back to the user.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: {
          type: "string",
          description: "UUID of the student to update",
        },
        bio: {
          type: "string",
          description: "Short student bio (background, personality, what makes them tick as a student)",
        },
        goals: {
          type: "string",
          description: "What the student wants to achieve musically",
        },
        learning_style: {
          type: "string",
          description: "How the student learns best (visual, auditory, kinesthetic, etc.)",
        },
        experience: {
          type: "string",
          description: "Prior musical experience and background",
        },
        notes: {
          type: "string",
          description: "General notes about the student",
        },
        teacher_notes: {
          type: "string",
          description: "Internal notes for the teacher",
        },
      },
      required: ["student_id"],
    },
  },
  {
    name: "get_student",
    description:
      "Fetch a student's current profile data including bio, goals, learning style, experience, instrument, teacher, status, and notes.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: {
          type: "string",
          description: "UUID of the student to fetch",
        },
      },
      required: ["student_id"],
    },
  },
  {
    name: "list_teacher_availability",
    description:
      "Check a teacher's available time slots for a given date range. Use before rescheduling.",
    input_schema: {
      type: "object" as const,
      properties: {
        teacher_id: {
          type: "string",
          description: "UUID of the teacher",
        },
        date_from: {
          type: "string",
          description: "Start date in YYYY-MM-DD format",
        },
        date_to: {
          type: "string",
          description: "End date in YYYY-MM-DD format",
        },
      },
      required: ["teacher_id", "date_from", "date_to"],
    },
  },
  {
    name: "reschedule_block",
    description:
      "Move a schedule block to a new date/time or assign it to a different teacher. Use this when a student or teacher needs to reschedule a lesson.",
    input_schema: {
      type: "object" as const,
      properties: {
        block_id: {
          type: "string",
          description: "UUID of the schedule block to move",
        },
        new_start_time: {
          type: "string",
          description: "New start time in ISO 8601 format (e.g. 2026-04-21T14:00:00)",
        },
        new_end_time: {
          type: "string",
          description: "New end time in ISO 8601 format",
        },
        new_teacher_id: {
          type: "string",
          description: "UUID of the new teacher (optional, only if changing teacher)",
        },
        reason: {
          type: "string",
          description: "Reason for the reschedule",
        },
      },
      required: ["block_id", "new_start_time", "new_end_time"],
    },
  },
  {
    name: "list_schedule_blocks",
    description:
      "List schedule blocks for a student or teacher within a date range.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: {
          type: "string",
          description: "UUID of the student (optional)",
        },
        teacher_id: {
          type: "string",
          description: "UUID of the teacher (optional)",
        },
        date_from: {
          type: "string",
          description: "Start date in YYYY-MM-DD format",
        },
        date_to: {
          type: "string",
          description: "End date in YYYY-MM-DD format",
        },
      },
      required: ["date_from", "date_to"],
    },
  },
];

/** Tools available per agent name */
export const AGENT_TOOL_MAP: Record<string, string[]> = {
  sid: ["update_student", "get_student"],
  ruby: ["list_teacher_availability", "reschedule_block", "list_schedule_blocks", "get_student"],
  stewie: ["get_student", "list_schedule_blocks"],
  bub: ["get_student"],
  vader: ["get_student", "update_student"],
  star: ["get_student"],
  ziro: ["update_student", "get_student", "list_teacher_availability", "reschedule_block", "list_schedule_blocks"],
};

export function getToolsForAgent(agentName: string | null | undefined): Anthropic.Tool[] {
  if (!agentName) return [];
  const allowed = AGENT_TOOL_MAP[agentName.toLowerCase()] ?? [];
  return AGENT_TOOLS.filter((t) => allowed.includes(t.name));
}
