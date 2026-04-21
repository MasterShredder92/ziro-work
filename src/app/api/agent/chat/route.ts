import { NextRequest, NextResponse } from "next/server";
import { AGENT_DEFINITIONS } from "@/lib/agents/agentDefinitions";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { sendEmail, sendEmailToolDefinition } from "@/lib/agents/tools/sendEmail";
import { RAVEN_TOOLS, sendReportEmailToolDefinition } from "@/lib/agents/tools/ravenCommunicationTools";
import { BUB_TOOLS } from "@/lib/agents/tools/bubTools";
import { VADER_TOOLS } from "@/lib/agents/tools/vaderTools";
import { STEWIE_TOOLS } from "@/lib/agents/tools/stewieTools";
import Anthropic from "@anthropic-ai/sdk";

// --- CONFIGURATION ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- TOOL DEFINITIONS (CONVERTED TO ANTHROPIC FORMAT) ---

const SID_TOOLS = [
  {
    name: "get_student",
    description: "Fetch current student data. Autonomously finds student by ID.",
    input_schema: {
      type: "object" as const,
      properties: { student_id: { type: "string" } },
      required: ["student_id"],
    },
  },
  {
    name: "update_student",
    description: "Update student record fields.",
    input_schema: {
      type: "object" as const,
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
    input_schema: {
      type: "object" as const,
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "send_email",
    description: sendEmailToolDefinition.description,
    input_schema: sendEmailToolDefinition.input_schema,
  },
];

const RUBY_TOOLS = [
  {
    name: "get_schedule",
    description: "Fetch schedule for a specific teacher or location on a given date.",
    input_schema: {
      type: "object" as const,
      properties: {
        teacher_id: { type: "string", description: "Teacher UUID" },
        location_id: { type: "string", description: "Location UUID" },
        date: { type: "string", description: "Date in YYYY-MM-DD format. Defaults to today." },
      },
    },
  },
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
      },
      required: ["block_id", "new_date", "new_time"],
    },
  },
  {
    name: "book_student",
    description: "Book a student into a specific schedule block.",
    input_schema: {
      type: "object" as const,
      properties: {
        block_id: { type: "string" },
        student_id: { type: "string" },
        recurring: { type: "boolean", default: true },
        is_first_day: { type: "boolean", default: false },
      },
      required: ["block_id", "student_id"],
    },
  },
  {
    name: "cancel_session",
    description: "Cancel a student's lesson session.",
    input_schema: {
      type: "object" as const,
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
  {
    name: "get_operator_context",
    description: "Get the current operator's UI state (active location, date, view, and focused block). Use this to see what the user is looking at.",
    input_schema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string", description: "Optional user ID to fetch context for." }
      }
    }
  }
];

const SHARED_TOOLS = [
  {
    name: "search_teachers",
    description: "Search roster for teachers by name.",
    input_schema: {
      type: "object" as const,
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "search_students",
    description: "Search roster for students by name.",
    input_schema: {
      type: "object" as const,
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "get_schedule",
    description: "Fetch schedule for a specific teacher or location on a given date.",
    input_schema: {
      type: "object" as const,
      properties: {
        teacher_id: { type: "string", description: "Teacher UUID" },
        location_id: { type: "string", description: "Location UUID" },
        date: { type: "string", description: "Date in YYYY-MM-DD format. Defaults to today." },
      },
    },
  },
  {
    name: "get_operator_context",
    description: "Get the current operator's UI state (active location, date, view, and focused block). Use this to see what the user is looking at.",
    input_schema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string", description: "Optional user ID to fetch context for." }
      }
    }
  }
];

const ZIRO_TOOLS = [
  ...SID_TOOLS,
  ...RUBY_TOOLS,
  ...VADER_TOOLS,
  ...STEWIE_TOOLS,
  ...BUB_TOOLS,
  ...RAVEN_TOOLS,
];

// --- TOOL EXECUTION ENGINE ---

async function executeTool(name: string, input: any, tenantId: string, userId?: string) {
  const db = getServiceClient();
  try {
    switch (name) {
      case "get_operator_context": {
        const targetUserId = input.user_id || userId;
        if (!targetUserId) return "Error: No user ID available for context lookup.";
        
        const { data, error } = await db
          .from("operator_sessions")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("user_id", targetUserId)
          .single();
          
        if (error) return `Error fetching operator context: ${error.message}`;
        if (!data) return "No active operator session found. User might not be on the schedule page.";
        
        return JSON.stringify({
          active_location_id: data.active_location_id,
          active_date: data.active_date,
          active_view: data.active_view,
          active_modal: data.active_modal,
          focused_block_id: data.focused_block_id,
          last_updated: data.updated_at
        });
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
          body: JSON.stringify({
            block_id: input.block_id,
            student_id: input.student_id,
            recurring: input.recurring ?? true,
            is_first_day: input.is_first_day ?? false,
            tenant_id: tenantId
          })
        });
        const data = await res.json();
        return res.ok ? "Student booked successfully." : `Error: ${data.error || 'Booking failed'}`;
      }
      case "cancel_session": {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://app.zirowork.com'}/api/schedule-blocks/cancel-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            block_id: input.block_id,
            block_date: input.block_date,
            student_id: input.student_id,
            reason: input.reason,
            scope: input.scope ?? "recurring",
            tenant_id: tenantId
          })
        });
        const data = await res.json();
        return res.ok ? "Session cancelled successfully." : `Error: ${data.error || 'Cancellation failed'}`;
      }
      case "move_block": {
        const { error } = await db.from("schedule_blocks").update({
          block_date: input.new_date,
          start_time: input.new_time
        }).eq("tenant_id", tenantId).eq("id", input.block_id);
        return error ? `Error: ${error.message}` : "Block moved successfully.";
      }
      default:
        return `Tool ${name} not implemented.`;
    }
  } catch (e: any) {
    return `Critical Error: ${e.message}`;
  }
}

// --- CHAT LOGIC HELPER ---

async function handleAgentChat(
  client: Anthropic,
  agentId: string,
  message: string,
  history: any[],
  tenantId: string,
  userId?: string
) {
  try {
    const agentDef = AGENT_DEFINITIONS[agentId] || AGENT_DEFINITIONS["ziro"];
    const now = new Date();
    const systemContent = `${agentDef.systemPrompt}\n\nCONTEXT: Date: ${now.toLocaleDateString()}. Tenant ID: ${tenantId}. User ID: ${userId || "Unknown"}.\n\nRULES:\n- You are a Senior Operator. You NEVER ask for information that you can find yourself in the database.\n- ALWAYS use 'get_operator_context' first if the user asks about 'this' location, 'today', or 'this block' to see what they are looking at.\n- If a user asks about a person, schedule, or record, USE SEARCH AND GET TOOLS IMMEDIATELY.\n- Do not ask clarifying questions like "is this a teacher or student?" — search both rosters to find out.\n- Concise, championship-level tone. No filler.`;

    let rawTools: Anthropic.Tool[] = [];
    if (agentId === "ruby") rawTools = RUBY_TOOLS;
    else if (agentId === "sid") rawTools = SID_TOOLS;
    else rawTools = ZIRO_TOOLS;

    const finalTools = [...rawTools];
    SHARED_TOOLS.forEach(st => {
      if (!finalTools.find(ft => ft.name === st.name)) {
        finalTools.push(st);
      }
    });

    let messages: Anthropic.MessageParam[] = history.map((m: any) => ({
      role: m.role,
      content: m.content
    }));
    messages.push({ role: "user", content: message });

    for (let round = 0; round < 5; round++) {
      const response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemContent,
        tools: finalTools.length > 0 ? finalTools : undefined,
        messages: messages,
      });

      // Add assistant response to messages
      messages.push({
        role: "assistant",
        content: response.content,
      });

      // Check if we're done
      if (response.stop_reason === "end_turn") {
        const textContent = response.content.find(c => c.type === "text");
        return NextResponse.json({
          content: [{ type: "text", text: textContent && "text" in textContent ? textContent.text : "" }],
          stop_reason: "end_turn"
        });
      }

      // Process tool calls
      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(c => c.type === "tool_use");
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          if (toolUse.type !== "tool_use") continue;
          const result = await executeTool(toolUse.name, toolUse.input, tenantId, userId);
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: result,
          });
        }

        // Add tool results to messages
        messages.push({
          role: "user",
          content: toolResults,
        });
      }
    }

    // Final response after max rounds
    const finalResponse = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemContent,
      messages: messages,
    });

    const textContent = finalResponse.content.find(c => c.type === "text");
    return NextResponse.json({
      content: [{ type: "text", text: textContent && "text" in textContent ? textContent.text : "" }],
      stop_reason: "end_turn"
    });
  } catch (err: any) {
    console.error("Agent Loop Error:", err);
    return NextResponse.json({ 
      error: `Agent Error: ${err.message || "Failed to generate response"}`,
      details: err.stack 
    }, { status: 500 });
  }
}

// --- ROUTE HANDLER ---

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentId = "ziro", context: clientContext = {}, history = [] } = body;
    
    const session = await getSession();
    const tenantId = session?.tenantId || clientContext.tenantId || DEFAULT_TENANT_ID;
    const userId = session?.userId || clientContext.userId;

    // Initialize Anthropic client
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    return await handleAgentChat(client, agentId, message, history, tenantId, userId);
  } catch (error: any) {
    console.error("Agent Chat API Route Error:", error);
    return NextResponse.json({ 
      error: `API Route Error: ${error.message || "An unexpected error occurred."}`,
      stack: error.stack 
    }, { status: 500 });
  }
}
