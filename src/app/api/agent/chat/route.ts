import { NextRequest, NextResponse } from "next/server";
import { AGENT_DEFINITIONS } from "@/lib/agents/agentDefinitions";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { VADER_TOOLS } from "@/lib/agents/tools/vaderTools";
import { STEWIE_TOOLS } from "@/lib/agents/tools/stewieTools";
import { BUB_TOOLS } from "@/lib/agents/tools/bubTools";
import { RAVEN_TOOLS } from "@/lib/agents/tools/ravenCommunicationTools";
import OpenAI from "openai";

// --- CONFIGURATION ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- TOOL DEFINITIONS (OPENAI FORMAT) ---

const convertToOpenAI = (tool: any) => ({
  type: "function" as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema || tool.parameters || { type: "object", properties: {} },
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
    description: "Update student record fields (bio, status, notes).",
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
    description: "Search roster for students by name.",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
];

const RUBY_TOOLS = [
  {
    name: "get_schedule",
    description: "Fetch schedule for a specific teacher or location on a given date.",
    parameters: {
      type: "object",
      properties: {
        teacher_id: { type: "string", description: "Teacher UUID" },
        location_id: { type: "string", description: "Location UUID" },
        date: { type: "string", description: "Date in YYYY-MM-DD format. Defaults to today." },
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
      },
      required: ["block_id", "new_date", "new_time"],
    },
  },
  {
    name: "book_student",
    description: "Book a student into a specific schedule block.",
    parameters: {
      type: "object",
      properties: {
        block_id: { type: "string" },
        student_id: { type: "string" },
        recurring: { type: "boolean", default: true },
      },
      required: ["block_id", "student_id"],
    },
  },
  {
    name: "cancel_session",
    description: "Cancel a student's lesson session.",
    parameters: {
      type: "object",
      properties: {
        block_id: { type: "string" },
        block_date: { type: "string" },
        student_id: { type: "string" },
        reason: { type: "string" },
        scope: { type: "string", enum: ["single", "recurring"], default: "recurring" },
      },
      required: ["block_id", "student_id", "reason"],
    },
  },
];

const SHARED_TOOLS = [
  {
    name: "get_operator_context",
    description: "Get the current operator's UI state (active location, date, view, and focused block).",
    parameters: {
      type: "object",
      properties: { user_id: { type: "string" } }
    }
  },
  {
    name: "search_teachers",
    description: "Search roster for teachers by name.",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  }
];

// Deduplicate tools by name
const ALL_TOOLS_COMBINED = [
  ...SID_TOOLS,
  ...RUBY_TOOLS,
  ...VADER_TOOLS,
  ...STEWIE_TOOLS,
  ...BUB_TOOLS,
  ...RAVEN_TOOLS,
  ...SHARED_TOOLS
];

const toolNameSet = new Set<string>();
const ALL_TOOLS = ALL_TOOLS_COMBINED
  .filter(tool => {
    if (toolNameSet.has(tool.name)) return false;
    toolNameSet.add(tool.name);
    return true;
  })
  .map(convertToOpenAI);

// --- TOOL EXECUTION ENGINE ---

async function executeTool(name: string, input: any, tenantId: string, userId?: string) {
  const db = getServiceClient();
  try {
    switch (name) {
      case "get_operator_context": {
        const targetUserId = input.user_id || userId;
        if (!targetUserId) return "Error: No user ID available.";
        const { data, error } = await db.from("operator_sessions").select("*").eq("tenant_id", tenantId).eq("user_id", targetUserId).single();
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(data);
      }
      case "search_teachers": {
        const { data, error } = await db.from("teachers").select("id, first_name, last_name, instrument").eq("tenant_id", tenantId).or(`first_name.ilike.%${input.query}%,last_name.ilike.%${input.query}%`);
        return error ? `Error: ${error.message}` : JSON.stringify(data);
      }
      case "search_students": {
        const { data, error } = await db.from("students").select("id, first_name, last_name").eq("tenant_id", tenantId).or(`first_name.ilike.%${input.query}%,last_name.ilike.%${input.query}%`);
        return error ? `Error: ${error.message}` : JSON.stringify(data);
      }
      case "get_schedule": {
        let query = db.from("schedule_blocks").select("*").eq("tenant_id", tenantId);
        if (input.teacher_id) query = query.eq("teacher_id", input.teacher_id);
        if (input.location_id) query = query.eq("location_id", input.location_id);
        const targetDate = input.date || new Date().toISOString().split("T")[0];
        query = query.eq("block_date", targetDate);
        const { data, error } = await query.order("start_time");
        return error ? `Error: ${error.message}` : JSON.stringify(data);
      }
      case "get_student": {
        const { data, error } = await db.from("students").select("*").eq("tenant_id", tenantId).eq("id", input.student_id).single();
        return error ? `Error: ${error.message}` : JSON.stringify(data);
      }
      case "update_student": {
        const { error } = await db.from("students").update(input).eq("tenant_id", tenantId).eq("id", input.student_id);
        return error ? `Error: ${error.message}` : "Student updated successfully.";
      }
      case "book_student": {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://app.zirowork.com'}/api/schedule-blocks/book-student`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, tenant_id: tenantId })
        });
        const data = await res.json();
        return res.ok ? "Student booked successfully." : `Error: ${data.error || 'Booking failed'}`;
      }
      case "cancel_session": {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://app.zirowork.com'}/api/schedule-blocks/cancel-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, tenant_id: tenantId })
        });
        const data = await res.json();
        return res.ok ? "Session cancelled successfully." : `Error: ${data.error || 'Cancellation failed'}`;
      }
      case "move_block": {
        const { error } = await db.from("schedule_blocks").update({ block_date: input.new_date, start_time: input.new_time }).eq("tenant_id", tenantId).eq("id", input.block_id);
        return error ? `Error: ${error.message}` : "Block moved successfully.";
      }
      default:
        return `Tool ${name} not implemented.`;
    }
  } catch (e: any) {
    return `Critical Error: ${e.message}`;
  }
}

// --- CHAT LOGIC ---

export async function POST(req: NextRequest) {
  try {
    // Initialize OpenAI client with explicit Manus configuration
    // Pass environment variables explicitly to ensure they're picked up on Vercel
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.manus.im/api/llm-proxy/v1"
    });
    
    const body = await req.json();
    const { message, agentId = "ziro", context: clientContext = {}, history = [] } = body;
    const session = await getSession();
    const tenantId = session?.tenantId || clientContext.tenantId || DEFAULT_TENANT_ID;
    const userId = session?.userId || clientContext.userId;

    const agentDef = AGENT_DEFINITIONS[agentId] || AGENT_DEFINITIONS["ziro"];
    const systemContent = `${agentDef.systemPrompt}\n\nCONTEXT: Date: ${new Date().toLocaleDateString()}. Tenant ID: ${tenantId}. User ID: ${userId || "Unknown"}.\n\nDIRECTIVE: You are a Senior Operator. Execute tools immediately. Use 'get_operator_context' to see the user's current view.`;

    let messages: any[] = [
      { role: "system", content: systemContent },
      ...history.map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ];

    for (let round = 0; round < 5; round++) {
      let response;
      try {
        response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: messages,
          tools: ALL_TOOLS,
          tool_choice: "auto",
        });
      } catch (apiError: any) {
        console.error("LLM API Error:", apiError);
        return NextResponse.json(
          { error: `LLM Error: ${apiError.message || JSON.stringify(apiError)}` },
          { status: 500 }
        );
      }

      const assistantMessage = response.choices[0].message;
      messages.push(assistantMessage);

      if (!assistantMessage.tool_calls) {
        return NextResponse.json({ 
          content: [{ type: "text", text: assistantMessage.content || "" }], 
          stop_reason: "end_turn" 
        });
      }

      // Handle tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        const result = await executeTool(
          toolCall.function.name, 
          JSON.parse(toolCall.function.arguments), 
          tenantId, 
          userId
        );
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result
        });
      }
    }

    return NextResponse.json({ 
      content: [{ type: "text", text: "I've performed several actions. Please let me know if you need anything else." }], 
      stop_reason: "end_turn" 
    });

  } catch (error: any) {
    console.error("Agent Error:", error);
    return NextResponse.json({ error: `Agent Error: ${error.message}` }, { status: 500 });
  }
}
