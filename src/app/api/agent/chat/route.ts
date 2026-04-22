import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getAgentDefinition } from "@/lib/ziro/agents/definitions";
import { executeTool } from "@/lib/ziro/agents/tools";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * ZiroWork Agentic Chat Route — TRUE SOVEREIGN COMPLIANCE
 * * 1. Uses tool() wrapper to ensure OpenAI parses a valid JSON Schema.
 * * 2. Casts execution args safely to bypass Turbopack's strict Zod 4 type mismatches without triggering ESLint warnings.
 * * 3. Uses generateText & NextResponse to ensure the custom UI receives standard JSON.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      message,
      agentId = "ziro",
      history = [],
    } = body;

    const agentDef = getAgentDefinition(agentId);
    if (!agentDef) {
      return NextResponse.json({ error: `Agent "${agentId}" not found` }, { status: 404 });
    }

    const messageHistory: any[] = [
      ...history.map((m: any) => ({
        role: m.role,
        content: m.content || m.text || "",
      })),
      { role: "user", content: message },
    ];

    const agentTools: any = {};

    if (agentDef.tools.includes("get_global_state")) {
      agentTools.get_global_state = tool({
        description: "Scan the business for gaps, callouts, and unpaid invoices.",
        parameters: z.object({
          scope: z.enum(["all", "schedule", "financials", "leads"]).optional(),
        }),
        execute: async (args: any) => await executeTool("get_global_state", args),
      });
    }

    if (agentDef.tools.includes("delegate_to_agent")) {
      agentTools.delegate_to_agent = tool({
        description: "Command a specialist agent (Ruby, Raven, Bub, Sid, Stewie, Star) to perform a task.",
        parameters: z.object({
          agentId: z.string().describe("The ID of the target agent"),
          toolName: z.string().describe("The name of the tool to execute"),
          toolArgs: z.record(z.string(), z.any()).describe("The input data for the tool"),
          reason: z.string().describe("Why this move is happening (Revenue, Operational, etc.)"),
        }),
        execute: async (args: any) => {
          const { toolArgs, ...rest } = args;
          return await executeTool("delegate_to_agent", { ...rest, parameters: toolArgs });
        },
      });
    }

    if (agentDef.tools.includes("read_schedule")) {
      agentTools.read_schedule = tool({
        description: "Read lesson schedule for a location.",
        parameters: z.object({
          locationName: z.string().describe("Bellevue, Elkhorn, Gretna, Omaha"),
          date: z.string().describe("YYYY-MM-DD"),
        }),
        execute: async (args: any) => await executeTool("read_schedule", args),
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
        execute: async (args: any) => await executeTool("move_student", args),
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
        execute: async (args: any) => await executeTool("handle_teacher_callout", args),
      });
    }

    if (agentDef.tools.includes("find_booking_gaps")) {
      agentTools.find_booking_gaps = tool({
        description: "Scan for 'Swiss cheese' gaps to optimize revenue.",
        parameters: z.object({
          locationName: z.string(),
          date: z.string(),
        }),
        execute: async (args: any) => await executeTool("find_booking_gaps", args),
      });
    }

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Cast as 'any' to shield against the Turbopack CallSettings type failure while maintaining the 5-step loop
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: agentDef.systemPrompt,
      messages: messageHistory,
      tools: agentTools,
      maxSteps: 5,
    } as any);

    // Matches the custom UI parsing logic (AgentFullChat, AgentCommandHub, RubySidebar)
    return NextResponse.json({
      content: [{ type: "text", text: result.text }],
      reply: result.text,
      toolResults: result.toolResults,
      agentId,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[Agent Chat Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}