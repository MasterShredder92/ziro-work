import { NextRequest, NextResponse } from "next/server";
import { AGENT_DEFINITIONS } from "@/lib/agents/agentDefinitions";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { sendEmail, sendEmailToolDefinition } from "@/lib/agents/tools/sendEmail";

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
  },
  sendEmailToolDefinition,
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
  sendEmailToolDefinition,
];

// ─── Tool Executor ────────────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  tenantId: string,
): Promise<string> {
  const db = getServiceClient();
  try {
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
    const contextStr =
      Object.keys(context).length > 0
        ? `\n\nCurrent page context:\n${JSON.stringify(context, null, 2)}`
        : "";
    const systemContent = basePrompt + contextStr;

    const tools =
      agentId === "sid" ? SID_TOOLS :
      agentId === "star" ? STAR_TOOLS :
      agentId === "bub" ? BUB_TOOLS :
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
    const MAX_ITER = 5;

    while (iterations < MAX_ITER) {
      iterations++;
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
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
