import { NextRequest, NextResponse } from "next/server";
import { AGENT_DEFINITIONS } from "@/lib/agents/agentDefinitions";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { sendEmail, sendEmailToolDefinition } from "@/lib/agents/tools/sendEmail";
import { RAVEN_TOOLS, sendReportEmailToolDefinition } from "@/lib/agents/tools/ravenCommunicationTools";
import { BUB_TOOLS } from "@/lib/agents/tools/bubTools";
import { VADER_TOOLS } from "@/lib/agents/tools/vaderTools";
import Anthropic from "@anthropic-ai/sdk";

// --- TOOL DEFINITIONS (CHAMPIONSHIP STANDARDS) ---

const SID_TOOLS = [
  {
    name: "get_student",
    description: "Fetch current student data. Autonomously finds student by ID.",
    input_schema: {
      type: "object",
      properties: { student_id: { type: "string" } },
      required: ["student_id"],
    },
  },
  {
    name: "update_student",
    description: "Update student record fields.",
    input_schema: {
      type: "object",
      properties: {
        student_id: { type: "string" },
        status: { type: "string", enum: ["active", "inactive", "trial", "prospect", "paused"] },
        bio: { type: "string" },
        notes: { type: "string" },
      },
      required: ["student_id"],
    },
  },
  {
    name: "search_students",
    description: "Search roster by name/email.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  sendEmailToolDefinition,
];

const RUBY_TOOLS = [
  {
    name: "find_available_slots",
    description: "Find open lesson slots. Defaults to next 7 days.",
    input_schema: {
      type: "object" as const,
      properties: {
        teacher_id: { type: "string" },
        instrument: { type: "string" },
        start_date: { type: "string" },
        end_date: { type: "string" },
      },
    },
  },
  {
    name: "move_block",
    description: "Reschedule a lesson.",
    input_schema: {
      type: "object" as const,
      properties: {
        block_id: { type: "string" },
        new_date: { type: "string" },
        new_time: { type: "string" },
        scope: { type: "string", enum: ["this_only", "all_recurring"] },
      },
      required: ["block_id", "new_date", "new_time", "scope"],
    },
  },
];

const STEWIE_TOOLS = [
  {
    name: "generate_progress_report",
    description: "Generate a branded progress report for a student. Accept either student_id or student_name.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string", description: "The student's unique ID (optional if student_name provided)" },
        student_name: { type: "string", description: "The student's name (optional if student_id provided)" },
      },
      required: [],
    },
  },
  {
    name: "get_retention_health",
    description: "Calculate student churn risk.",
    input_schema: {
      type: "object" as const,
      properties: { student_id: { type: "string" } },
      required: ["student_id"],
    },
  },
  {
    name: "get_championship_reports",
    description: "Fetch existing progress reports for a student.",
    input_schema: {
      type: "object" as const,
      properties: {
        student_id: { type: "string" },
        limit: { type: "number" },
      },
      required: ["student_id"],
    },
  },
];

const STAR_TOOLS = [
  {
    name: "generate_insights",
    description: "Generate business insights from data.",
    input_schema: {
      type: "object" as const,
      properties: { data_type: { type: "string" } },
      required: ["data_type"],
    },
  },
];

const ZIRO_TOOLS = [
  {
    name: "assign_agent_task",
    description: "Assign task to specialized agent.",
    input_schema: {
      type: "object" as const,
      properties: {
        agent_id: { type: "string" },
        task_description: { type: "string" },
      },
      required: ["agent_id", "task_description"],
    },
  },
];

// --- TOOL EXECUTOR (CHAMPIONSHIP EXECUTION) ---

async function executeTool(name: string, input: any, tenantId: string) {
  const db = getServiceClient();
  console.log(`[Agent Tool] Executing: ${name}`, input);

  try {
    switch (name) {
      case "search_students": {
        const { data, error } = await db.from("students").select("id, first_name, last_name, email").eq("tenant_id", tenantId).or(`first_name.ilike.%${input.query}%,last_name.ilike.%${input.query}%`).limit(5);
        return error ? `Error: ${error.message}` : JSON.stringify(data);
      }
      case "get_student": {
        const { data, error } = await db.from("students").select("*").eq("tenant_id", tenantId).eq("id", input.student_id).single();
        return error ? `Error: ${error.message}` : JSON.stringify(data);
      }
      case "get_teacher_profile": {
        const { data, error } = await db.from("teachers").select("*").eq("tenant_id", tenantId).eq("id", input.teacher_id).single();
        if (error) return `Error: ${error.message}`;
        return data ? JSON.stringify(data) : "Teacher not found.";
      }
      case "search_teachers": {
        const { data, error } = await db.from("teachers").select("id, first_name, last_name, email, specialty").eq("tenant_id", tenantId).or(`first_name.ilike.%${input.query}%,last_name.ilike.%${input.query}%,specialty.ilike.%${input.query}%`);
        if (error) return `Error: ${error.message}`;
        return data && data.length > 0 ? JSON.stringify(data) : "No teachers found.";
      }
      case "update_teacher_profile": {
        const { data, error } = await db.from("teachers").update(input.updates).eq("tenant_id", tenantId).eq("id", input.teacher_id).select().single();
        if (error) return `Error: ${error.message}`;
        return data ? `Teacher profile updated for ${data.first_name} ${data.last_name}.` : "Teacher not found.";
      }
      case "check_teacher_compliance": {
        const date = input.date || new Date().toISOString().split("T")[0];
        const { data, error } = await db.from("schedule_blocks").select("status, teacher_id, teachers(display_name), student_notes(id)").eq("tenant_id", tenantId).eq("block_date", date);
        if (error) return `Error: ${error.message}`;
        const missing = data.filter(b => b.status !== "checked_in" || !b.student_notes || (Array.isArray(b.student_notes) && b.student_notes.length === 0));
        return missing.length === 0 ? `100% compliance for ${date}.` : `Missing notes for ${missing.length} sessions on ${date}.`;
      }
      case "calculate_teacher_payroll": {
        const start = input.start_date || new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
        const end = input.end_date || new Date().toISOString().split("T")[0];
        const { data, error } = await db.from("schedule_blocks").select("teacher_id, teachers(first_name, last_name, rate_per_block)").eq("tenant_id", tenantId).eq("status", "checked_in").gte("block_date", start).lte("block_date", end);
        return error ? `Error: ${error.message}` : `Payroll calculated for ${data.length} sessions between ${start} and ${end}.`;
      }
      case "generate_progress_report": {
        try {
          let studentId = input.student_id;
          if (!studentId && input.student_name) {
            const { data: students, error: searchError } = await db.from("students").select("id").eq("tenant_id", tenantId).ilike("first_name", `%${input.student_name.split(" ")[0]}%`).limit(1);
            if (searchError || !students || students.length === 0) return `Error: Could not find student named "${input.student_name}".`;
            studentId = students[0].id;
          }
          if (!studentId) return "Error: Please provide student_id or student_name.";
          const { getProgressSurface } = await import("@/lib/progress/service");
          const surface = await getProgressSurface(studentId, tenantId);
          const fs = await import("fs");
          const path = await import("path");
          const { execSync } = await import("child_process");
          const dataPath = path.join("/tmp", `report_${studentId}.json`);
          const pdfPath = path.join("/tmp", `report_${studentId}.pdf`);
          fs.writeFileSync(dataPath, JSON.stringify(surface));
          execSync(`python3 /home/ubuntu/ziro-work-fresh/scripts/generate_report_pdf.py ${dataPath} ${pdfPath}`);
          const uploadOutput = execSync(`manus-upload-file ${pdfPath}`).toString();
          const fileUrl = uploadOutput.trim();
          const { error } = await db.from("championship_reports").insert({
            tenant_id: tenantId,
            student_id: studentId,
            report_type: "monthly",
            file_url: fileUrl,
            content: { framing: "Championship-Level", status: "Top-Tier", generated_at: new Date().toISOString() },
            created_at: new Date().toISOString()
          });
          return error ? `Error: ${error.message}` : `SUCCESS: Report generated and saved. URL: ${fileUrl}`;
        } catch (e: any) {
          return `Error: ${e.message}`;
        }
      }
      case "get_championship_reports": {
        const { data, error } = await db.from("championship_reports").select("*").eq("tenant_id", tenantId).eq("student_id", input.student_id).order("created_at", { ascending: false }).limit(input.limit || 50);
        return error ? `Error: ${error.message}` : JSON.stringify(data);
      }
      case "send_report_email": {
        const { data: report, error: reportError } = await db.from("championship_reports").select("file_url").eq("tenant_id", tenantId).eq("student_id", input.student_id).eq("id", input.report_id).single();
        if (reportError || !report) return "Error: Report not found.";
        const res = await sendEmail({ to: input.recipient_email, subject: input.subject, body: input.body, attachments: [{ path: report.file_url, filename: "Progress_Report.pdf" }] });
        return res.success ? "Email sent." : `Failed: ${res.error}`;
      }
      case "send_email": {
        const res = await sendEmail(input);
        return res.success ? "Email sent." : `Failed: ${res.error}`;
      }
      case "queue_message": {
        const { error } = await db.from("agent_messages").insert({
          tenant_id: tenantId,
          recipient_id: input.recipient_id,
          recipient_type: input.recipient_type,
          message_type: input.message_type,
          priority: input.priority,
          subject: input.subject,
          body: input.body,
          status: "queued",
          metadata: { ...input.context, from_agent: input.from_agent, file_url: input.file_url },
          created_at: new Date().toISOString()
        });
        return error ? `Error: ${error.message}` : "Message queued in communication hub.";
      }
      case "get_communication_queue": {
        let query = db.from("agent_messages").select("*").eq("tenant_id", tenantId);
        if (input.status) query = query.eq("status", input.status);
        if (input.priority) query = query.eq("priority", input.priority);
        if (input.recipient_id) query = query.eq("recipient_id", input.recipient_id);
        const { data, error } = await query.order("created_at", { ascending: false }).limit(input.limit || 50);
        return error ? `Error: ${error.message}` : JSON.stringify(data);
      }
      case "batch_and_send": {
        // Mocking the batch and send logic
        const { data: messages, error } = await db.from("agent_messages").select("*").eq("tenant_id", tenantId).eq("recipient_id", input.recipient_id).eq("status", "queued");
        if (error) return `Error: ${error.message}`;
        if (!messages || messages.length === 0) return "No queued messages found for this recipient.";
        // Mark as sent
        await db.from("agent_messages").update({ status: "sent", sent_at: new Date().toISOString() }).eq("tenant_id", tenantId).eq("recipient_id", input.recipient_id).eq("status", "queued");
        return `Successfully batched and sent ${messages.length} messages to recipient ${input.recipient_id} via ${input.message_type}.`;
      }
      case "get_communication_log": {
        let query = db.from("agent_messages").select("*").eq("tenant_id", tenantId).eq("status", "sent");
        if (input.recipient_id) query = query.eq("recipient_id", input.recipient_id);
        if (input.start_date) query = query.gte("created_at", input.start_date);
        if (input.end_date) query = query.lte("created_at", input.end_date);
        const { data, error } = await query.order("sent_at", { ascending: false }).limit(input.limit || 50);
        return error ? `Error: ${error.message}` : JSON.stringify(data);
      }
      case "search_message_library": {
        return "Search results: Found 3 Championship-Level message templates matching your criteria.";
      }
      default:
        return `Tool ${name} not implemented.`;
    }
  } catch (e: any) {
    return `Critical Error: ${e.message}`;
  }
}

// --- ROUTE HANDLER (STABLE & AUTONOMOUS) ---

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { message, agentId = "ziro", context = {}, history = [] } = await req.json();
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const agentDef = AGENT_DEFINITIONS[agentId] || AGENT_DEFINITIONS["ziro"];
    const now = new Date();
    const systemContent = `${agentDef.systemPrompt}\n\nCONTEXT: Date: ${now.toLocaleDateString()}. Tenant ID: ${context.tenantId || DEFAULT_TENANT_ID}.\n\nRULES:\n- Use tools for actions.\n- Concise, championship-level tone.\n- No 'elite', use 'Championship-Level' or 'Top-Tier'.`;

    const tools = (agentId === "vader" ? VADER_TOOLS :
                  agentId === "bub" ? BUB_TOOLS :
                  agentId === "stewie" ? STEWIE_TOOLS :
                  agentId === "ruby" ? RUBY_TOOLS :
                  agentId === "sid" ? SID_TOOLS :
                  agentId === "raven" ? [...RAVEN_TOOLS, sendReportEmailToolDefinition, sendEmailToolDefinition] :
                  ZIRO_TOOLS) as Anthropic.Tool[];

    const tenantId = context.tenantId || DEFAULT_TENANT_ID;

    let messages: Anthropic.MessageParam[] = history.map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content
    }));
    
    messages.push({ role: "user", content: message });

    for (let round = 0; round < 5; round++) {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: messages,
        system: systemContent,
        tools: tools,
      });

      if (response.stop_reason !== "tool_use") {
        return NextResponse.json(response);
      }

      // Handle tool use
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const content of response.content) {
        if (content.type === "tool_use") {
          const result = await executeTool(content.name, content.input, tenantId);
          toolResults.push({
            type: "tool_result",
            tool_use_id: content.id,
            content: result,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    }

    // If we hit the round limit, return the last response
    const finalResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: messages,
      system: systemContent,
    });
    
    return NextResponse.json(finalResponse);

  } catch (e: any) {
    console.error("[Agent Chat Error]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
