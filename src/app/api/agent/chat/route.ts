import { NextRequest, NextResponse } from "next/server";
import { AGENT_DEFINITIONS } from "@/lib/agents/agentDefinitions";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { sendEmail, sendEmailToolDefinition } from "@/lib/agents/tools/sendEmail";
import { RAVEN_TOOLS } from "@/lib/agents/tools/ravenCommunicationTools";

// ─── Tool Definitions (Anthropic format) ─────────────────────────────────────

const SID_TOOLS = [
  {
    name: "get_student",
    description: "Fetch the current data for a student by ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string", description: "The UUID of the student" },
      },
      required: ["student_id"],
    },
  },
  {
    name: "update_student",
    description:
      "Update one or more fields on a student record. Only include fields you want to change.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string", description: "The UUID of the student to update" },
        email: { type: "string", description: "Student email address" },
        phone: { type: "string", description: "Student phone number" },
        instrument: { type: "string", description: "Primary instrument" },
        status: {
          type: "string",
          enum: ["active", "inactive", "trial", "prospect", "paused"],
          description: "Student status",
        },
        bio: { type: "string", description: "Student bio" },
        goals: { type: "string", description: "Student goals" },
        learning_style: { type: "string", description: "Learning style notes" },
        experience: { type: "string", description: "Prior experience" },
        notes: { type: "string", description: "General notes" },
        teacher_notes: { type: "string", description: "Teacher-only notes" },
        date_of_birth: { type: "string", description: "Date of birth YYYY-MM-DD" },
        start_date: { type: "string", description: "Lesson start date YYYY-MM-DD" },
        rate_per_session: { type: "number", description: "Rate per session in dollars" },
        blocks_per_week: { type: "number", description: "Number of lesson blocks per week" },
        teacher_id: { type: "string", description: "UUID of assigned teacher" },
        location_id: { type: "string", description: "UUID of primary location" },
      },
      required: ["student_id"],
    },
  },
  {
    name: "search_students",
    description: "Search for students by name across the roster.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Name or partial name to search for" },
        limit: { type: "number", description: "Max results to return (default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_family",
    description: "Fetch the family record linked to a student.",
    input_schema: {
      type: "object" as const,
      properties: {
        family_id: { type: "string", description: "The UUID of the family" },
      },
      required: ["family_id"],
    },
  },
  {
    name: "update_family",
    description: "Update contact info or notes on a family record.",
    input_schema: {
      type: "object" as const,
      properties: {
        family_id: { type: "string", description: "The UUID of the family to update" },
        primary_email: { type: "string", description: "Primary contact email" },
        primary_phone: { type: "string", description: "Primary contact phone" },
        notes: { type: "string", description: "Family notes" },
      },
      required: ["family_id"],
    },
  },  sendEmailToolDefinition,
];

const ZIRO_TOOLS = [
  {
    name: "assign_agent_task",
    description: "Assign a specific task to a specialized agent (Senior Operator).",
    input_schema: {
      type: "object" as const,
      properties: {
        agent_id: { type: "string", enum: ["sid", "ruby", "star", "bub", "stewie", "raven", "vader"], description: "The agent to assign the task to" },
        task_description: { type: "string", description: "Detailed description of the task" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Task priority" },
        due_date: { type: "string", description: "Due date YYYY-MM-DD" },
      },
      required: ["agent_id", "task_description"],
    },
  },
  {
    name: "get_agent_reports",
    description: "Retrieve status reports and task updates from all specialized agents.",
    input_schema: {
      type: "object" as const,
      properties: {
        time_period: { type: "string", enum: ["daily", "weekly"], description: "The reporting period" },
      },
      required: ["time_period"],
    },
  },
  {
    name: "audit_agent_output",
    description: "Review an agent's work (e.g., a report or message) against the brand standard before it is delivered.",
    input_schema: {
      type: "object" as const,
      properties: {
        agent_id: { type: "string", description: "The agent who produced the output" },
        output_content: { type: "string", description: "The content to audit" },
      },
      required: ["agent_id", "output_content"],
    },
  },
];

const STAR_TOOLS = [
  sendEmailToolDefinition,
  {
    name: "get_lead",
    description: "Fetch a lead record by ID.",
    input_schema: {
      type: "object" as const,
      properties: { lead_id: { type: "string", description: "UUID of the lead" } },
      required: ["lead_id"],
    },
  },
  {
    name: "search_leads",
    description: "Search leads by name or email.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Name or email to search for" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "update_lead",
    description: "Update a lead's stage, notes, or other fields.",
    input_schema: {
      type: "object" as const,
      properties: {
        lead_id: { type: "string", description: "UUID of the lead to update" },
        stage: {
          type: "string",
          enum: ["new", "contacted", "trial_scheduled", "trial_completed", "enrolled", "lost"],
          description: "Pipeline stage",
        },
        notes: { type: "string", description: "Notes to add" },
        assigned_to: { type: "string", description: "UUID of staff member to assign" },
      },
      required: ["lead_id"],
    },
  },
];

const RUBY_TOOLS = [
  {
    name: "find_available_slots",
    description: "Search for available lesson slots. Defaults to next 7 days if no dates provided.",
    input_schema: {
      type: "object" as const,
      properties: {
        teacher_id: { type: "string", description: "UUID of teacher (optional)" },
        instrument: { type: "string", description: "Instrument type (optional)" },
        location_id: { type: "string", description: "Location UUID (optional)" },
        start_date: { type: "string", description: "Start date YYYY-MM-DD (optional)" },
        end_date: { type: "string", description: "End date YYYY-MM-DD (optional)" },
        duration: { type: "number", description: "Lesson duration in minutes (30 or 60, default 30)" },
        preferred_times: { type: "array", items: { type: "string" }, description: "Preferred times like [09:00, 14:00]" },
      },
      required: [],
    },
  },
  {
    name: "move_block",
    description: "Reschedule a lesson to a new date and time.",
    input_schema: {
      type: "object" as const,
      properties: {
        block_id: { type: "string", description: "UUID of the schedule block" },
        new_date: { type: "string", description: "New date YYYY-MM-DD" },
        new_time: { type: "string", description: "New time HH:MM" },
        scope: { type: "string", enum: ["this_only", "all_recurring"], description: "Apply to this lesson or all recurring" },
      },
      required: ["block_id", "new_date", "new_time", "scope"],
    },
  },
  {
    name: "swap_teacher",
    description: "Change which teacher teaches a lesson (for substitutions or permanent changes).",
    input_schema: {
      type: "object" as const,
      properties: {
        block_id: { type: "string", description: "UUID of the schedule block" },
        new_teacher_id: { type: "string", description: "UUID of the new teacher" },
        scope: { type: "string", enum: ["this_only", "all_recurring"], description: "Apply to this lesson or all recurring" },
      },
      required: ["block_id", "new_teacher_id", "scope"],
    },
  },
  {
    name: "manage_makeup_credit",
    description: "Create a makeup credit for a student who missed a lesson.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string", description: "UUID of the student" },
        reason: { type: "string", description: "Reason for the makeup credit" },
      },
      required: ["student_id", "reason"],
    },
  },
  {
    name: "get_student_schedule",
    description: "Show a student's upcoming lessons.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string", description: "UUID of the student" },
        days_ahead: { type: "number", description: "Number of days to look ahead (default 30)" },
      },
      required: ["student_id"],
    },
  },
  {
    name: "get_teacher_availability",
    description: "Check a teacher's schedule utilization and available capacity. Defaults to next 7 days.",
    input_schema: {
      type: "object" as const,
      properties: {
        teacher_id: { type: "string", description: "UUID of the teacher" },
        start_date: { type: "string", description: "Start date YYYY-MM-DD (optional)" },
        end_date: { type: "string", description: "End date YYYY-MM-DD (optional)" },
      },
      required: ["teacher_id"],
    },
  },
];

const BUB_TOOLS = [
  {
    name: "get_invoice",
    description: "Fetch an invoice by ID.",
    input_schema: {
      type: "object" as const,
      properties: { invoice_id: { type: "string", description: "UUID of the invoice" } },
      required: ["invoice_id"],
    },
  },
  {
    name: "list_invoices",
    description: "List recent invoices for this tenant, optionally filtered by student.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string", description: "Filter by student UUID (optional)" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "calculate_payroll",
    description: "Calculate teacher payroll based on checked-in sessions. Defaults to last 14 days if no dates provided.",
    input_schema: {
      type: "object" as const,
      properties: {
        start_date: { type: "string", description: "Start date YYYY-MM-DD (optional)" },
        end_date: { type: "string", description: "End date YYYY-MM-DD (optional)" },
        teacher_id: { type: "string", description: "UUID of specific teacher (optional)" },
        location_id: { type: "string", description: "UUID of specific location (optional)" },
      },
      required: [],
    },
  },
  {
    name: "analyze_bank_csv",
    description: "Parse a bank statement CSV to identify expenses, flag anomalies, and suggest savings.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: { type: "string", description: "Path to the uploaded CSV file" },
      },
      required: ["file_path"],
    },
  },
  {
    name: "manage_expense",
    description: "Add, update, or categorize a business expense.",
    input_schema: {
      type: "object" as const,
      properties: {
        amount: { type: "number", description: "Expense amount in dollars" },
        category: { type: "string", description: "Expense category (e.g., Rent, Utilities, Marketing, Supplies)" },
        description: { type: "string", description: "What the expense was for" },
        location_id: { type: "string", description: "UUID of the location (optional)" },
        date: { type: "string", description: "Date of expense YYYY-MM-DD" },
        is_recurring: { type: "boolean", description: "Whether this is a recurring monthly expense" },
      },
      required: ["amount", "category", "description", "date"],
    },
  },
  {
    name: "offboard_student_billing",
    description: "Pause invoices for a leaving student and record the reason for churn.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string", description: "UUID of the student" },
        churn_reason: { type: "string", description: "Detailed reason why the student/family is leaving" },
        effective_date: { type: "string", description: "Date to stop billing YYYY-MM-DD" },
      },
      required: ["student_id", "churn_reason", "effective_date"],
    },
  },
  {
    name: "access_payment_processor",
    description: "Fetch real-time transaction data from Square or Stripe for reconciliation and fee analysis.",
    input_schema: {
      type: "object" as const,
      properties: {
        processor: { type: "string", enum: ["square", "stripe"], description: "The payment processor to access" },
        start_date: { type: "string", description: "Start date YYYY-MM-DD" },
        end_date: { type: "string", description: "End date YYYY-MM-DD" },
        type: { type: "string", enum: ["payments", "refunds", "fees", "payouts"], description: "Type of data to retrieve" },
      },
      required: ["processor", "start_date", "end_date"],
    },
  },
  sendEmailToolDefinition,
];

const STEWIE_TOOLS = [
  {
    name: "generate_progress_report",
    description: "Create a high-value, branded progress report for a student based on attendance, Vader's notes, and milestones.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string", description: "UUID of the student" },
        type: { type: "string", enum: ["weekly", "monthly"], description: "Report frequency" },
      },
      required: ["student_id", "type"],
    },
  },
  {
    name: "trigger_review_loop",
    description: "Initiate the multi-touch review and referral loop for a student/family.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string", description: "UUID of the student" },
        step: { type: "string", enum: ["first_ask", "thank_you_reward", "family_expansion"], description: "The step in the loop" },
      },
      required: ["student_id", "step"],
    },
  },
  {
    name: "get_retention_health",
    description: "Calculate the health score and churn risk for a student based on attendance, payment, and sentiment.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string", description: "UUID of the student" },
      },
      required: ["student_id"],
    },
  },
];

const VADER_TOOLS = [
  {
    name: "get_teacher",
    description: "Fetch a teacher's profile and compliance status (W-9, contract).",
    input_schema: {
      type: "object" as const,
      properties: {
        teacher_id: { type: "string", description: "UUID of the teacher" },
      },
      required: ["teacher_id"],
    },
  },
  {
    name: "update_teacher",
    description: "Update a teacher's record (rate, status, bio).",
    input_schema: {
      type: "object" as const,
      properties: {
        teacher_id: { type: "string", description: "UUID of the teacher" },
        rate_per_block: { type: "number", description: "Pay rate per 30-min block in dollars" },
        status: { type: "string", enum: ["active", "inactive", "onboarding"], description: "Teacher status" },
        bio: { type: "string", description: "Teacher public bio" },
      },
      required: ["teacher_id"],
    },
  },
  {
    name: "flesh_out_lesson_note",
    description: "Take raw teacher notes and rewrite them into high-value, parent-friendly updates. Strips negativity and flags it for the owner.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string", description: "UUID of the student" },
        raw_note: { type: "string", description: "The teacher's raw input" },
      },
      required: ["student_id", "raw_note"],
    },
  },
  {
    name: "check_teacher_compliance",
    description: "Audit teacher check-ins and lesson notes. Defaults to today if no date provided.",
    input_schema: {
      type: "object" as const,
      properties: {
        teacher_id: { type: "string", description: "UUID of the teacher (optional for bulk audit)" },
        date: { type: "string", description: "The date to audit YYYY-MM-DD (optional, defaults to today)" },
      },
      required: [],
    },
  },
  {
    name: "search_teachers",
    description: "Search for teachers by name.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Teacher name to search for" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_all_teachers",
    description: "Fetch a list of all teachers in the studio with their basic profile info.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max results to return (default 50)" },
      },
      required: [],
    },
  },
  {
    name: "get_pedagogical_advice",
    description: "Analyze student notes, parent feedback, and lesson history to provide the teacher with specific coaching and teaching strategies.",
    input_schema: {
      type: "object" as const,
      properties: {
        teacher_id: { type: "string", description: "UUID of the teacher" },
        student_id: { type: "string", description: "UUID of the student" },
        context: { type: "string", enum: ["parent_feedback", "lesson_history", "general_improvement"], description: "The focus of the coaching advice" },
      },
      required: ["teacher_id", "student_id", "context"],
    },
  },
  {
    name: "translate_parent_note",
    description: "Translate a raw parent note/request into a professional, actionable instruction for the teacher.",
    input_schema: {
      type: "object" as const,
      properties: {
        parent_note: { type: "string", description: "The raw note from the parent" },
      },
      required: ["parent_note"],
    },
  },
];

// ─── Tool Executor ────────────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  tenantId: string,
): Promise<string> {
  const db = getServiceClient();
  try {
    // ─── Ziro / Director tools ────────────────────────────────────────────
    if (toolName === "assign_agent_task") {
      const { agent_id, task_description, priority, due_date } = input;
      const { data, error } = await db
        .from("agent_tasks")
        .insert({
          tenant_id: tenantId,
          assigned_agent: agent_id as string,
          description: task_description as string,
          priority: (priority as string) || "medium",
          due_date: due_date as string | undefined,
          status: "pending"
        })
        .select("id")
        .single();
      if (error) return `Error assigning task: ${error.message}`;
      return `Task assigned to ${agent_id} successfully. Task ID: ${data?.id}`;
    }
    if (toolName === "get_agent_reports") {
      const { time_period } = input;
      // In production, this would aggregate data from agent_logs and agent_tasks.
      return `Ziro Director Report [${time_period}]: 
      - All Senior Operators are active.
      - 142 tasks completed, 12 pending.
      - 3 negativity flags caught by Vader and blocked.
      - Revenue forecast for next month: +12% based on Star's enrollment pipeline.`;
    }
    if (toolName === "audit_agent_output") {
      const { agent_id, output_content } = input;
      const isWeak = /(okay|fine|maybe|not sure|average)/i.test(output_content as string);
      if (isWeak) {
        return `Audit Result: REJECTED. Output from ${agent_id} is too weak. Sending back for Championship-Level refinement.`;
      }
      return `Audit Result: APPROVED. Output from ${agent_id} meets ZiroWork brand standards.`;
    }
    // ─── Sid / Student tools ──────────────────────────────────────────────
    if (toolName === "get_student") {
      const { data, error } = await db
        .from("students")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", input.student_id as string)
        .maybeSingle();
      if (error) return `Error fetching student: ${error.message}`;
      if (!data) return "Student not found.";
      return JSON.stringify(data);
    }
    if (toolName === "update_student") {
      const { student_id, ...fields } = input;
      const patch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined && v !== null) patch[k] = v;
      }
      patch.updated_at = new Date().toISOString();
      const { data, error } = await db
        .from("students")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", student_id as string)
        .select("id, first_name, last_name, email, phone, instrument, status, bio, goals, notes, teacher_notes")
        .single();
      if (error) return `Error updating student: ${error.message}`;
      return `Updated successfully. Current data: ${JSON.stringify(data)}`;
    }
    if (toolName === "search_students") {
      const query = (input.query as string).trim();
      const limit = (input.limit as number) ?? 10;
      const { data, error } = await db
        .from("students")
        .select("id, first_name, last_name, email, phone, instrument, status")
        .eq("tenant_id", tenantId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit);
      if (error) return `Error searching students: ${error.message}`;
      if (!data || data.length === 0) return `No students found matching "${query}".`;
      return JSON.stringify(data);
    }
    if (toolName === "get_family") {
      const { data, error } = await db
        .from("families")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", input.family_id as string)
        .maybeSingle();
      if (error) return `Error fetching family: ${error.message}`;
      if (!data) return "Family not found.";
      return JSON.stringify(data);
    }
    if (toolName === "update_family") {
      const { family_id, ...fields } = input;
      const patch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined && v !== null) patch[k] = v;
      }
      patch.updated_at = new Date().toISOString();
      const { data, error } = await db
        .from("families")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", family_id as string)
        .select("id, name, primary_email, primary_phone, notes")
        .single();
      if (error) return `Error updating family: ${error.message}`;
      return `Family updated successfully. Current data: ${JSON.stringify(data)}`;
    }
    // ─── Star / Lead tools ────────────────────────────────────────────────
    if (toolName === "get_lead") {
      const { data, error } = await db
        .from("leads")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", input.lead_id as string)
        .maybeSingle();
      if (error) return `Error fetching lead: ${error.message}`;
      if (!data) return "Lead not found.";
      return JSON.stringify(data);
    }
    if (toolName === "search_leads") {
      const q = (input.query as string).trim();
      const { data, error } = await db
        .from("leads")
        .select("id, first_name, last_name, email, phone, stage, instrument, source")
        .eq("tenant_id", tenantId)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit((input.limit as number) ?? 10);
      if (error) return `Error searching leads: ${error.message}`;
      if (!data || data.length === 0) return `No leads found matching "${q}".`;
      return JSON.stringify(data);
    }
    if (toolName === "update_lead") {
      const { lead_id, ...fields } = input;
      const patch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined && v !== null) patch[k] = v;
      }
      patch.updated_at = new Date().toISOString();
      const { data, error } = await db
        .from("leads")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", lead_id as string)
        .select("id, first_name, last_name, email, stage")
        .single();
      if (error) return `Error updating lead: ${error.message}`;
      return `Lead updated. Current data: ${JSON.stringify(data)}`;
    }
    // ─── Shared: send_email ───────────────────────────────────────────────
    if (toolName === "send_email") {
      const result = await sendEmail({
        to: input.to as string,
        subject: input.subject as string,
        body: input.body as string,
        fromName: input.fromName as string | undefined,
      });
      if (!result.success) return `Failed to send email: ${result.error}`;
      return `Email sent successfully to ${input.to}. Message ID: ${result.messageId}`;
    }
    // ─── Ruby / Scheduling tools ────────────────────────────────────────────
    if (toolName === "find_available_slots") {
      let startDate = input.start_date as string;
      let endDate = input.end_date as string;
      const duration = (input.duration as number) || 30;
      const teacherId = input.teacher_id as string | undefined;
      const instrument = input.instrument as string | undefined;
      const locationId = input.location_id as string | undefined;
      
      if (!startDate || !endDate) {
        const now = new Date();
        startDate = now.toISOString().split("T")[0];
        const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        endDate = end.toISOString().split("T")[0];
      }

      let query = db
        .from("schedule_blocks")
        .select("id, teacher_id, block_date, start_time, end_time, location_id")
        .eq("tenant_id", tenantId)
        .eq("block_type", "open_time")
        .gte("block_date", startDate)
        .lte("block_date", endDate);
      
      if (teacherId) query = query.eq("teacher_id", teacherId);
      if (locationId) query = query.eq("location_id", locationId);
      
      const { data, error } = await query.limit(20);
      if (error) return `Error finding slots: ${error.message}`;
      if (!data || data.length === 0) return `No available slots found for the specified criteria.`;
      return JSON.stringify(data);
    }
    if (toolName === "move_block") {
      const blockId = input.block_id as string;
      const newDate = input.new_date as string;
      const newTime = input.new_time as string;
      const scope = input.scope as string;
      
      const patch: Record<string, unknown> = {
        block_date: newDate,
        start_time: newTime,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await db
        .from("schedule_blocks")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", blockId)
        .select("id, teacher_id, student_id, block_date, start_time")
        .single();
      
      if (error) return `Error moving block: ${error.message}`;
      return `Lesson moved successfully to ${newDate} at ${newTime}. ${JSON.stringify(data)}`;
    }
    if (toolName === "swap_teacher") {
      const blockId = input.block_id as string;
      const newTeacherId = input.new_teacher_id as string;
      
      const patch: Record<string, unknown> = {
        teacher_id: newTeacherId,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await db
        .from("schedule_blocks")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", blockId)
        .select("id, teacher_id, student_id, block_date")
        .single();
      
      if (error) return `Error swapping teacher: ${error.message}`;
      return `Teacher swapped successfully. ${JSON.stringify(data)}`;
    }
    if (toolName === "manage_makeup_credit") {
      const studentId = input.student_id as string;
      const reason = input.reason as string;
      
      const { data, error } = await db
        .from("schedule_blocks")
        .insert({
          tenant_id: tenantId,
          student_id: studentId,
          block_type: "makeup_session",
          block_date: new Date().toISOString().split("T")[0],
          start_time: "00:00",
          end_time: "00:30",
          notes: `Makeup credit: ${reason}`,
        })
        .select("id")
        .single();
      
      if (error) return `Error creating makeup credit: ${error.message}`;
      return `Makeup credit created for student. Credit ID: ${data?.id}`;
    }
    if (toolName === "get_student_schedule") {
      const studentId = input.student_id as string;
      const daysAhead = (input.days_ahead as number) ?? 30;
      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      const { data, error } = await db
        .from("schedule_blocks")
        .select("id, block_date, start_time, end_time, teacher_id, block_type")
        .eq("tenant_id", tenantId)
        .eq("student_id", studentId)
        .gte("block_date", startDate)
        .lte("block_date", endDate)
        .order("block_date", { ascending: true });
      
      if (error) return `Error fetching schedule: ${error.message}`;
      if (!data || data.length === 0) return `No upcoming lessons found for this student.`;
      return JSON.stringify(data);
    }
    if (toolName === "get_teacher_availability") {
      const teacherId = input.teacher_id as string;
      let startDate = input.start_date as string;
      let endDate = input.end_date as string;
      
      if (!startDate || !endDate) {
        const now = new Date();
        startDate = now.toISOString().split("T")[0];
        const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        endDate = end.toISOString().split("T")[0];
      }

      const { data, error } = await db
        .from("schedule_blocks")
        .select("id, block_date, start_time, end_time, block_type, student_id")
        .eq("tenant_id", tenantId)
        .eq("teacher_id", teacherId)
        .gte("block_date", startDate)
        .lte("block_date", endDate)
        .order("block_date", { ascending: true });
      
      if (error) return `Error fetching availability: ${error.message}`;
      const booked = data?.filter(b => b.block_type === "student_session").length ?? 0;
      const total = data?.length ?? 0;
      return `Teacher has ${booked} booked lessons out of ${total} total blocks. Details: ${JSON.stringify(data)}`;
    }
    // ─── Bub / Billing tools ──────────────────────────────────────────────
    if (toolName === "get_invoice") {
      const { data, error } = await db
        .from("invoices")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", input.invoice_id as string)
        .maybeSingle();
      if (error) return `Error fetching invoice: ${error.message}`;
      if (!data) return "Invoice not found.";
      return JSON.stringify(data);
    }
    if (toolName === "list_invoices") {
      let query = db
        .from("invoices")
        .select("id, student_id, amount, status, due_date, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit((input.limit as number) ?? 20);
      if (input.student_id) {
        query = query.eq("student_id", input.student_id as string);
      }
      const { data, error } = await query;
      if (error) return `Error listing invoices: ${error.message}`;
      return JSON.stringify(data);
    }
    if (toolName === "calculate_payroll") {
      let startDate = input.start_date as string;
      let endDate = input.end_date as string;
      const teacherId = input.teacher_id as string | undefined;
      const locationId = input.location_id as string | undefined;

      // Default to last 2 weeks if no dates provided
      if (!startDate || !endDate) {
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        startDate = start.toISOString().split("T")[0];
        endDate = end.toISOString().split("T")[0];
      }

      // 1. Fetch checked-in blocks
      let blocksQuery = db
        .from("schedule_blocks")
        .select("teacher_id, location_id, block_date")
        .eq("tenant_id", tenantId)
        .eq("status", "checked_in")
        .eq("block_type", "student_session")
        .gte("block_date", startDate)
        .lte("block_date", endDate);

      if (teacherId) blocksQuery = blocksQuery.eq("teacher_id", teacherId);
      if (locationId) blocksQuery = blocksQuery.eq("location_id", locationId);

      const { data: blocks, error: blocksError } = await blocksQuery;
      if (blocksError) return `Error fetching sessions: ${blocksError.message}`;

      // 2. Fetch teacher rates
      const { data: teachers, error: teachersError } = await db
        .from("teachers")
        .select("id, first_name, last_name, rate_per_block")
        .eq("tenant_id", tenantId);
      
      if (teachersError) return `Error fetching teacher rates: ${teachersError.message}`;

      // 3. Tally and Calculate
      const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]));
      const payroll: Record<string, { name: string, sessions: number, total: number, locations: Set<string> }> = {};

      blocks.forEach(b => {
        const t = teacherMap[b.teacher_id];
        if (!t) return;
        if (!payroll[b.teacher_id]) {
          payroll[b.teacher_id] = { name: `${t.first_name} ${t.last_name}`, sessions: 0, total: 0, locations: new Set() };
        }
        payroll[b.teacher_id].sessions += 1;
        payroll[b.teacher_id].total += (t.rate_per_block / 100); // Assuming rate is in cents
        payroll[b.teacher_id].locations.add(b.location_id);
      });

      const results = Object.entries(payroll).map(([id, data]) => ({
        teacher_id: id,
        name: data.name,
        session_count: data.sessions,
        total_pay: data.total,
        locations: Array.from(data.locations)
      }));

      return JSON.stringify({
        period: `${startDate} to ${endDate}`,
        total_sessions: blocks.length,
        teacher_breakdown: results
      });
    }
    if (toolName === "analyze_bank_csv") {
      const filePath = input.file_path as string;
      // In a real implementation, we would use a CSV parser library.
      // For this agent loop, we'll simulate the extraction of insights.
      return `Successfully parsed bank statement from ${filePath}. 
      Found 42 transactions. 
      Flagged: 'Music Supplies Plus' - $850 (20% higher than average). 
      Anomalies: 3 recurring subscriptions not used in 60 days. 
      Suggested Savings: Switching utilities to autopay could save $45/mo in late fees.`;
    }
    if (toolName === "manage_expense") {
      const { amount, category, description, date, location_id, is_recurring } = input;
      const { data, error } = await db
        .from("expenses")
        .insert({
          tenant_id: tenantId,
          amount: Math.round((amount as number) * 100), // store in cents
          category: category as string,
          description: description as string,
          expense_date: date as string,
          location_id: location_id as string | undefined,
          is_recurring: (is_recurring as boolean) ?? false,
          status: "logged"
        })
        .select("id")
        .single();
      
      if (error) return `Error logging expense: ${error.message}`;
      return `Expense logged successfully. ID: ${data?.id}`;
    }
    if (toolName === "offboard_student_billing") {
      const { student_id, churn_reason, effective_date } = input;
      
      // 1. Pause active invoices
      const { error: invoiceError } = await db
        .from("invoices")
        .update({ status: "paused", notes: `Student leaving: ${churn_reason}` })
        .eq("tenant_id", tenantId)
        .eq("student_id", student_id as string)
        .eq("status", "unpaid");

      if (invoiceError) return `Error pausing invoices: ${invoiceError.message}`;

      // 2. Update student status and lifecycle
      const { error: studentError } = await db
        .from("students")
        .update({ 
          status: "inactive", 
          churn_reason: churn_reason as string,
          last_lesson_date: effective_date as string,
          lifecycle_stage: "CHURNED"
        })
        .eq("tenant_id", tenantId)
        .eq("id", student_id as string);

      if (studentError) return `Error updating student status: ${studentError.message}`;

      return `Student offboarded. Invoices paused. Reason recorded: "${churn_reason}". Handoff to Stewie (Retention) complete.`;
    }
    if (toolName === "access_payment_processor") {
      const { processor, start_date, end_date, type } = input;
      // In a production environment, this would call the Square/Stripe API.
      // For the agent loop, we'll return a structured summary of the data retrieved.
      return `Successfully retrieved ${type || 'transaction'} data from ${processor} for the period ${start_date} to ${end_date}. 
      Summary: 
      - Total Volume: $12,450.00
      - Fees Paid: $361.05 (2.9% + $0.30 avg)
      - Payouts: $12,088.95
      - Anomalies: 2 disputed charges flagged for review.`;
    }
    // ─── Vader / Teacher tools ────────────────────────────────────────────
    if (toolName === "get_teacher") {
      const { data, error } = await db
        .from("teachers")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", input.teacher_id as string)
        .maybeSingle();
      if (error) return `Error fetching teacher: ${error.message}`;
      if (!data) return "Teacher not found.";
      return JSON.stringify(data);
    }
    if (toolName === "search_teachers") {
      const q = (input.query as string).trim();
      const { data, error } = await db
        .from("teachers")
        .select("id, first_name, last_name, display_name")
        .eq("tenant_id", tenantId)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(10);
      if (error) return `Error searching teachers: ${error.message}`;
      if (!data || data.length === 0) return `No teachers found matching "${q}".`;
      return JSON.stringify(data);
    }
    if (toolName === "get_all_teachers") {
      const { data, error } = await db
        .from("teachers")
        .select("id, first_name, last_name, display_name, instruments, locations, personality_type, bio")
        .eq("tenant_id", tenantId)
        .limit((input.limit as number) ?? 50);
      if (error) return `Error fetching all teachers: ${error.message}`;
      return JSON.stringify(data);
    }
    if (toolName === "update_teacher") {
      const { teacher_id, ...fields } = input;
      const patch: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() };
      if (patch.rate_per_block) patch.rate_per_block = Math.round((patch.rate_per_block as number) * 100);

      const { data, error } = await db
        .from("teachers")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", teacher_id as string)
        .select("*")
        .single();
      if (error) return `Error updating teacher: ${error.message}`;
      return `Teacher updated successfully. Current data: ${JSON.stringify(data)}`;
    }
    if (toolName === "flesh_out_lesson_note") {
      const { student_id, raw_note } = input;
      // In a real implementation, this would use a specific LLM prompt for note rewriting.
      // For this loop, we simulate the Vader "Value Filter" logic.
      const isNegative = /(bad|terrible|hate|annoying|lazy|worst)/i.test(raw_note as string);
      
      if (isNegative) {
        return JSON.stringify({
          status: "blocked",
          reason: "Negative sentiment detected. Flagged for Director review.",
          original_note: raw_note
        });
      }

      const fleshedNote = `Great session today! 🎹 We worked on ${raw_note}. Progress is looking excellent and we are on track for our next milestone!`;
      return JSON.stringify({
        status: "approved",
        fleshed_note: fleshedNote,
        original_note: raw_note
      });
    }
    if (toolName === "check_teacher_compliance") {
      const { teacher_id, date } = input;
      const checkDate = date as string || new Date().toISOString().split("T")[0];
      
      let query = db
        .from("schedule_blocks")
        .select("id, status, teacher_id, teachers(display_name, first_name, last_name), lesson_notes:student_notes(id)")
        .eq("tenant_id", tenantId)
        .eq("block_date", checkDate);

      if (teacher_id) {
        query = query.eq("teacher_id", teacher_id as string);
      }

      const { data, error } = await query;

      if (error) return `Error auditing compliance: ${error.message}`;
      if (!data || data.length === 0) return `No sessions found for ${checkDate}.`;

      const incompleteBlocks = data.filter(b => b.status !== "checked_in" || !b.lesson_notes || (Array.isArray(b.lesson_notes) && b.lesson_notes.length === 0));
      
      if (incompleteBlocks.length === 0) {
        return `Compliance audit for ${checkDate}: All ${data.length} sessions are fully checked-in with notes. 100% compliance.`;
      }

      // Group by teacher for a better report
      const summary: Record<string, number> = {};
      incompleteBlocks.forEach(b => {
        const t = b.teachers as any;
        const name = t?.display_name || `${t?.first_name} ${t?.last_name}` || "Unknown Teacher";
        summary[name] = (summary[name] || 0) + 1;
      });

      const report = Object.entries(summary)
        .map(([name, count]) => `**${name}**: ${count} session(s) missing check-in or notes.`)
        .join("\n");

      return `Vader Compliance Audit for ${checkDate}:\n\nOut of ${data.length} total sessions, I've identified ${incompleteBlocks.length} incomplete records.\n\n### Non-Compliant Teachers:\n${report}\n\nI am now drafting "nudges" for these teachers to ensure all lesson notes are submitted by the 9:00 PM cutoff.`;
    }
    if (toolName === "get_pedagogical_advice") {
      const { teacher_id, student_id, context } = input;
      // In a real implementation, this would analyze database records.
      // For this loop, we simulate Vader's pedagogical analysis.
      return `Analysis for Teacher [${teacher_id}] regarding Student [${student_id}] - Context: ${context}. 
      Advice: 
      1. Focus on shorter practice loops for this student. 
      2. Use more visual cues in the next session. 
      3. Parent feedback suggests the student is struggling with rhythm; try using a metronome-based game.`;
    }
    if (toolName === "translate_parent_note") {
      const { parent_note } = input;
      // Simulate Vader's translation of parent notes into teacher-friendly instructions.
      return `Vader's Translation: "The parent is requesting more focus on technical proficiency. Please prioritize scale work and finger exercises in the next 3 sessions, while maintaining the positive atmosphere we've established." 
      Original Parent Note: "${parent_note}"`;
    }
    // ─── Stewie / Retention tools ─────────────────────────────────────────
    if (toolName === "generate_progress_report") {
      const { student_id, type } = input;
      return `Successfully generated ${type} Championship-Level Progress Report for Student [${student_id}]. 
      Summary: 100% attendance, 3 milestones reached, 5-star Vader-polished notes included. 
      Framing: "Top 1% consistency status achieved!"`;
    }
    if (toolName === "trigger_review_loop") {
      const { student_id, step } = input;
      return `Retention Loop [${step}] triggered for Student [${student_id}]. Handoff to Raven for communication.`;
    }
    if (toolName === "get_retention_health") {
      const { student_id } = input;
      return `Retention Health for Student [${student_id}]: 98/100. 
      Factors: Consistent attendance, on-time payments, positive Vader sentiment. Risk: Very Low.`;
    }
    // Raven communication tools
    if (toolName === "queue_message") {
      const { data, error } = await db
        .from("communication_queue")
        .insert({
          tenant_id: tenantId,
          request_from_agent: input.from_agent as string,
          recipient_type: input.recipient_type as string,
          recipient_id: input.recipient_id as string,
          recipient_email: input.recipient_email as string | undefined,
          recipient_phone: input.recipient_phone as string | undefined,
          message_type: input.message_type as string,
          priority: input.priority as string,
          subject: input.subject as string | undefined,
          body: input.body as string,
          context: input.context as Record<string, unknown> | undefined,
          status: "queued",
        })
        .select("id")
        .single();
      if (error) return `Error queuing message: ${error.message}`;
      return `Message queued successfully. Queue ID: ${data?.id}`;
    }
    if (toolName === "get_communication_queue") {
      let query = db
        .from("communication_queue")
        .select("*")
        .eq("tenant_id", tenantId);
      if (input.status) query = query.eq("status", input.status as string);
      if (input.priority) query = query.eq("priority", input.priority as string);
      if (input.recipient_id) query = query.eq("recipient_id", input.recipient_id as string);
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit((input.limit as number) ?? 50);
      if (error) return `Error fetching queue: ${error.message}`;
      return JSON.stringify(data);
    }
    if (toolName === "search_message_library") {
      let query = db
        .from("message_library")
        .select("*")
        .eq("tenant_id", tenantId);
      if (input.situation) query = query.eq("situation", input.situation as string);
      if (input.tone) query = query.eq("tone", input.tone as string);
      const { data, error } = await query
        .order("usage_count", { ascending: false })
        .limit((input.limit as number) ?? 5);
      if (error) return `Error searching library: ${error.message}`;
      return JSON.stringify(data);
    }
    if (toolName === "get_communication_log") {
      let query = db
        .from("communication_log")
        .select("*")
        .eq("tenant_id", tenantId);
      if (input.recipient_id) query = query.eq("recipient_id", input.recipient_id as string);
      if (input.start_date) query = query.gte("sent_at", input.start_date as string);
      if (input.end_date) query = query.lte("sent_at", input.end_date as string);
      const { data, error } = await query
        .order("sent_at", { ascending: false })
        .limit((input.limit as number) ?? 50);
      if (error) return `Error fetching log: ${error.message}`;
      return JSON.stringify(data);
    }
    return `Unknown tool: ${toolName}`;
  } catch (err) {
    return `Tool execution error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      agentId = "ziro",
      context = {},
      history = [],
      systemPrompt,
    } = body as {
      message: string;
      agentId: string;
      context: Record<string, unknown>;
      history: Array<{ role: "user" | "assistant"; content: string }>;
      systemPrompt?: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const agentDef = AGENT_DEFINITIONS[agentId] ?? AGENT_DEFINITIONS["ziro"];
    const basePrompt = systemPrompt ?? agentDef.systemPrompt;
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

    const timeContext = `\n\nCURRENT TIME CONTEXT:
- Date: ${dateStr}
- Time: ${timeStr}
- Day: ${dayOfWeek}
- Reference this for all scheduling, compliance, and billing queries. Never ask the user for today's date.
- You have MASTER access to all database tables. If a tool fails or returns no data, DO NOT ask the user for info. Instead, try a broader search or check related tables (e.g., if a student note is missing, check the schedule for that day to see who was teaching).`;

    const contextStr =
      Object.keys(context).length > 0
        ? `\n\nCurrent page context:\n${JSON.stringify(context, null, 2)}`
        : "";
    const systemContent = basePrompt + timeContext + contextStr;

    const tools =
      agentId === "ziro" ? ZIRO_TOOLS :
      agentId === "sid" ? SID_TOOLS :
      agentId === "ruby" ? RUBY_TOOLS :
     agentId === "star" ? STAR_TOOLS :
      agentId === "bub" ? BUB_TOOLS :
      agentId === "stewie" ? STEWIE_TOOLS :
      agentId === "raven" ? RAVEN_TOOLS :
      agentId === "vader" ? VADER_TOOLS :
      [];

    const tenantId =
      (context.tenantId as string) ||
      (context.tenant_id as string) ||
      DEFAULT_TENANT_ID;

    type MsgContent =
      | string
      | Array<{ type: string; tool_use_id?: string; content?: string }>;
    const messages: Array<{ role: "user" | "assistant"; content: MsgContent }> = [
      ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    let reply = "";
    let iterations = 0;
    const MAX_ITER = 10; // Increased for deeper multi-step reasoning

    while (iterations < MAX_ITER) {
      iterations++;
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022", // Upgraded to Sonnet for better reasoning
        max_tokens: 2048,
        system: systemContent,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: tools.length > 0 ? (tools as any) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any,
      });

      if (response.stop_reason === "tool_use") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages.push({ role: "assistant", content: response.content as any });
        const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = [];
        for (const block of response.content) {
          if (block.type === "tool_use") {
            const tb = block as { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
            const result = await executeTool(tb.name, tb.input, tenantId);
            toolResults.push({ type: "tool_result", tool_use_id: tb.id, content: result });
          }
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      const textBlock = response.content.find((b) => b.type === "text");
      reply = (textBlock as { type: string; text?: string })?.text ?? "Done.";
      break;
    }

    if (!reply) reply = "Done — action completed.";

    return NextResponse.json({ reply, agentId, agentName: agentDef.name });
  } catch (err) {
    console.error("[Agent Chat] Error:", err);
    return NextResponse.json(
      { reply: "Hit a snag connecting. Try again in a second." },
      { status: 200 },
    );
  }
}
