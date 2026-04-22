import { NextRequest, NextResponse } from "next/server";
import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getAgentDefinition } from "@/lib/ziro/agents/definitions";
import { executeTool } from "@/lib/ziro/agents/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * ZiroWork Agentic Chat Route — SOLID PRODUCTION MODE
 * 
 * 1. Resolves "type: None" via explicit tool() helper and Zod object schemas.
 * 2. Fixes "parameters" naming collision in delegation tool.
 * 3. Maintains "Legacy UI Compatibility" by returning a static JSON response.
 * 4. Enables "Agentic Reasoning" via maxSteps: 5.
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
      return NextResponse.json({ error: \`Agent "\${agentId}" not found\` }, { status: 404 });
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

    // 2. delegate_to_agent (Ziro Only) - FIX: Rename 'parameters' to 'toolArgs' to avoid collision
    if (agentDef.tools.includes("delegate_to_agent")) {
      agentTools.delegate_to_agent = tool({
        description: "Command a specialist agent (Ruby, Raven, Bub, Sid, Stewie, Star) to perform a task.",
        parameters: z.object({
          agentId: z.string().describe("The ID of the target agent"),
          toolName: z.string().describe("The name of the tool to execute"),
          toolArgs: z.record(z.string(), z.any()).describe("The input data for the tool"),
          reason: z.string().describe("Why this move is happening (Revenue, Operational, etc.)"),
        }),
        execute: async (args) => {
          // Map toolArgs back to parameters for the underlying execution if needed
          const { toolArgs, ...rest } = args;
          return await executeTool("delegate_to_agent", { ...rest, parameters: toolArgs });
        },
      });
    }

    // 3. read_schedule (Ruby)
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

    // 4. move_student (Ruby)
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

    // 5. handle_teacher_callout (Ruby)
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

    // 6. find_booking_gaps (Ruby)
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

    // FIX: Corrected model identifier to 'gpt-4o-mini'
    const { text, toolResults } = await generateText({
      model: openai("gpt-4o-mini"),
      system: agentDef.systemPrompt,
      messages: messageHistory,
      tools: agentTools,
      maxSteps: 5,
    });

    // Return exact structure expected by the Ruby UI
    return NextResponse.json({
      content: [{ text }],
      toolResults,
      agentId,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[Agent Chat Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
