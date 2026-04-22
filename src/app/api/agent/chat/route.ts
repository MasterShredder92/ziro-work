import { NextRequest } from "next/server";
import { streamText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getAgentDefinition } from "@/lib/ziro/agents/definitions";
import { executeTool } from "@/lib/ziro/agents/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * ZiroWork Agentic Chat Route — MODERN AGENTIC MODE
 * 
 * Uses streamText and toDataStreamResponse to support:
 * 1. Multi-step tool calling (maxSteps: 5)
 * 2. Real-time tool invocation visibility in the UI
 * 3. Standard AI SDK v6 protocol
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      agentId = "ziro",
      history = [],
    } = body;

    const agentDef = getAgentDefinition(agentId);
    if (!agentDef) {
      throw new Error(\`Agent "\${agentId}" not found\`);
    }

    // Map history to the format expected by AI SDK
    const messageHistory: any[] = [
      ...history.map((m: any) => ({
        role: m.role,
        content: m.content || m.text || "",
      })),
      { role: "user", content: message },
    ];

    const agentTools: any = {};

    // Define tools using the tool() helper with explicit inputSchema
    // 1. get_global_state (Ziro Only)
    if (agentDef.tools.includes("get_global_state")) {
      agentTools.get_global_state = tool({
        description: "Scan the business for gaps, callouts, and unpaid invoices.",
        parameters: z.object({
          scope: z.enum(["all", "schedule", "financials", "leads"]).optional(),
        }),
        execute: async (args) => await executeTool("get_global_state", args),
      });
    }

    // 2. delegate_to_agent (Ziro Only)
    if (agentDef.tools.includes("delegate_to_agent")) {
      agentTools.delegate_to_agent = tool({
        description: "Command a specialist agent (Ruby, Raven, Bub, Sid, Stewie, Star) to perform a task.",
        parameters: z.object({
          agentId: z.string().describe("The ID of the target agent"),
          toolName: z.string().describe("The name of the tool to execute"),
          parameters: z.record(z.string(), z.any()).describe("The input data for the tool"),
          reason: z.string().describe("Why this move is happening (Revenue, Operational, etc.)"),
        }),
        execute: async (args) => await executeTool("delegate_to_agent", args),
      });
    }

    // 3. Specialist Tools (Ruby's Scheduling)
    if (agentDef.tools.includes("read_schedule")) {
      agentTools.read_schedule = tool({
        description: "Read lesson schedule for a location.",
        parameters: z.object({
          locationName: z.string().describe("Bellevue, Elkhorn, Gretna, Omaha"),
          date: z.string().describe("YYYY-MM-DD"),
        }),
        execute: async (args) => await executeTool("read_schedule", args),
      });
    }

    if (agentDef.tools.includes("move_student")) {
      agentTools.move_student = tool({
        description: "Move a student between schedule blocks. Requires a reason.",
        parameters: z.object({
          sourceBlockId: z.string(),
          targetBlockId: z.string(),
          reason: z.string(),
        }),
        execute: async (args) => await executeTool("move_student", args),
      });
    }

    if (agentDef.tools.includes("handle_teacher_callout")) {
      agentTools.handle_teacher_callout = tool({
        description: "Resolve conflicts when a teacher calls out sick.",
        parameters: z.object({
          teacherName: z.string(),
          date: z.string(),
          locationName: z.string(),
        }),
        execute: async (args) => await executeTool("handle_teacher_callout", args),
      });
    }

    if (agentDef.tools.includes("find_booking_gaps")) {
      agentTools.find_booking_gaps = tool({
        description: "Scan for 'Swiss cheese' gaps to optimize revenue.",
        parameters: z.object({
          locationName: z.string(),
          date: z.string(),
        }),
        execute: async (args) => await executeTool("find_booking_gaps", args),
      });
    }

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = await streamText({
      model: openai("gpt-4.1-mini"),
      system: agentDef.systemPrompt,
      messages: messageHistory,
      tools: agentTools,
      maxSteps: 5, // Allow multi-step tool reasoning
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("[Agent Chat Error]:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
