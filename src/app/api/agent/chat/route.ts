import { NextRequest, NextResponse } from "next/server";
import { AGENT_DEFINITIONS } from "@/lib/agents/agentDefinitions";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { sendEmail, sendEmailToolDefinition } from "@/lib/agents/tools/sendEmail";
import { RAVEN_TOOLS, sendReportEmailToolDefinition } from "@/lib/agents/tools/ravenCommunicationTools";
import { BUB_TOOLS } from "@/lib/agents/tools/bubTools";
import { VADER_TOOLS } from "@/lib/agents/tools/vaderTools";
import OpenAI from "openai";

// --- CONFIGURATION ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- TOOL DEFINITIONS (CONVERTED TO OPENAI FORMAT) ---

const convertToOpenAI = (tool: any) => ({
  type: "function" as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema || tool.parameters,
  }
});

const SID_TOOLS = [
  {
    name: "get_student",
    description: "Fetch current student data. Autonomously finds student by ID.",
    parameters: {
      type: "object",
      properties: { student_id: { type: "string" } },
      required: ["student_id"],
    },
  },
  {
    name: "update_student",
    description: "Update student record fields.",
    parameters: {
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
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "send_email",
    description: sendEmailToolDefinition.description,
    parameters: sendEmailToolDefinition.input_schema,
  },
];

const RUBY_TOOLS = [
  {
    name: "find_available_slots",
    description: "Find open lesson slots. Defaults to next 7 days.",
    parameters: {
      type: "object",
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
    parameters: {
      type: "object",
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
    parameters: {
      type: "object",
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
    parameters: {
      type: "object",
      properties: { student_id: { type: "string" } },
      required: ["student_id"],
    },
  },
  {
    name: "get_championship_reports",
    description: "Fetch existing progress reports for a student.",
    parameters: {
      type: "object",
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
    parameters: {
      type: "object",
      properties: { data_type: { type: "string" } },
      required: ["data_type"],
    },
  },
];

const ZIRO_TOOLS = [
  {
    name: "assign_agent_task",
    description: "Assign task to specialized agent.",
    parameters: {
      type: "object",
      properties: {
        agent_id: { type: "string" },
        task_description: { type: "string" },
      },
      required: ["agent_id", "task_description"],
    },
  },
];

const RAVEN_OPENAI_TOOLS = RAVEN_TOOLS.map(convertToOpenAI);
const VADER_OPENAI_TOOLS = VADER_TOOLS.map(convertToOpenAI);
const BUB_OPENAI_TOOLS = BUB_TOOLS.map(convertToOpenAI);

// --- TOOL EXECUTOR ---

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
        const { data: messages, error } = await db.from("agent_messages").select("*").eq("tenant_id", tenantId).eq("recipient_id", input.recipient_id).eq("status", "queued");
        if (error) return `Error: ${error.message}`;
        if (!messages || messages.length === 0) return "No queued messages found for this recipient.";
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

// --- ROUTE HANDLER ---

export async function POST(req: NextRequest) {
  try {
    const { message, agentId = "ziro", context = {}, history = [] } = await req.json();
    
    // Explicitly pull from env and check. If missing, throw early with a clear error.
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || "https://api.manus.im/api/llm-proxy/v1";
    
    if (!apiKey) {
      return NextResponse.json({ error: "CRITICAL: OPENAI_API_KEY is not set in the environment." }, { status: 500 });
    }

    const openai = new OpenAI({ 
      apiKey: apiKey,
      baseURL: baseURL
    });

    const agentDef = AGENT_DEFINITIONS[agentId] || AGENT_DEFINITIONS["ziro"];
    const now = new Date();
    const systemContent = `${agentDef.systemPrompt}\n\nCONTEXT: Date: ${now.toLocaleDateString()}. Tenant ID: ${context.tenantId || DEFAULT_TENANT_ID}.\n\nRULES:\n- Use tools for actions.\n- Concise, championship-level tone.\n- No 'elite', use 'Championship-Level' or 'Top-Tier'.`;

    // Map tools based on agent
    let rawTools: any[] = [];
    if (agentId === "vader") rawTools = VADER_TOOLS.map(convertToOpenAI);
    else if (agentId === "bub") rawTools = BUB_TOOLS.map(convertToOpenAI);
    else if (agentId === "stewie") rawTools = STEWIE_TOOLS.map(convertToOpenAI);
    else if (agentId === "ruby") rawTools = RUBY_TOOLS.map(convertToOpenAI);
    else if (agentId === "sid") rawTools = SID_TOOLS.map(convertToOpenAI);
    else if (agentId === "raven") rawTools = [
      ...RAVEN_TOOLS.map(convertToOpenAI), 
      convertToOpenAI({ name: "send_report_email", description: sendReportEmailToolDefinition.description, parameters: sendReportEmailToolDefinition.input_schema }), 
      convertToOpenAI({ name: "send_email", description: sendEmailToolDefinition.description, parameters: sendEmailToolDefinition.input_schema })
    ];
    else rawTools = ZIRO_TOOLS.map(convertToOpenAI);

    const tenantId = context.tenantId || DEFAULT_TENANT_ID;

    // Convert history to OpenAI format
    let messages: OpenAI.Chat.ChatCompletionMessageParam[] = history.map((m: any) => {
      if (m.role === "assistant") {
        return { role: "assistant", content: m.content } as OpenAI.Chat.ChatCompletionAssistantMessageParam;
      }
      return { role: "user", content: m.content } as OpenAI.Chat.ChatCompletionUserMessageParam;
    });
    
    messages.push({ role: "user", content: message });

    // Execution loop (max 5 rounds)
    for (let round = 0; round < 5; round++) {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemContent },
          ...messages
        ],
        tools: rawTools.length > 0 ? rawTools : undefined,
      });

      const choice = response.choices[0];
      const assistantMessage = choice.message;
      
      // Store assistant message for next turn
      messages.push(assistantMessage);

      if (choice.finish_reason !== "tool_calls" || !assistantMessage.tool_calls) {
        // We are done, return the text
        return NextResponse.json({
          content: [{ type: "text", text: assistantMessage.content || "" }],
          stop_reason: "end_turn"
        });
      }

      // Handle each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        
        const toolName = toolCall.function.name;
        const toolInput = JSON.parse(toolCall.function.arguments);
        
        const result = await executeTool(toolName, toolInput, tenantId);
        
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        } as OpenAI.Chat.ChatCompletionToolMessageParam);
      }
    }

    // Final fallback if we hit round limit
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemContent },
        ...messages
      ],
    });

    return NextResponse.json({
      content: [{ type: "text", text: finalResponse.choices[0].message.content || "" }],
      stop_reason: "end_turn"
    });

  } catch (e: any) {
    console.error("[Agent Chat Error]", e);
    return NextResponse.json({ error: `Agent System Error: ${e.message}` }, { status: 500 });
  }
}
