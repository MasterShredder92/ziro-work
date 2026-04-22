import { streamText, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getAgentDefinition } from "@/lib/ziro/agents/definitions";
import { executeTool } from "@/lib/ziro/agents/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * ZiroWork Agentic Chat Route — TRUE MULTI-STEP V6
 * * 1. Bypasses the AI SDK tool() generic inference bug by using raw objects.
 * * 2. Uses streamText for proper UI toolInvocation streaming.
 * * 3. Restores agentic reasoning using the modern stopWhen: stepCountIs(5) API.
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
      return new Response(JSON.stringify({ error: `Agent "${agentId}" not found` }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
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
      agentTools.get_global_state = {
        description: "Scan the business for gaps, callouts, and unpaid invoices.",
        parameters: z.object({
          scope: z.enum(["all", "schedule", "financials", "leads"]).optional(),
        }),
        execute: async (args: any) => await executeTool("get_global_state", args),
      };
    }

    if (agentDef.tools.includes("delegate_to_agent")) {
      agentTools.delegate_to_agent = {
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
      };
    }

    if (agentDef.tools.includes("read_schedule")) {
      agentTools.read_schedule = {
        description: "Read lesson schedule for a location.",
        parameters: z.object({
          locationName: z.string().describe("Bellevue, Elkhorn, Gretna, Omaha"),
          date: z.string().describe("YYYY-MM-DD"),
        }),
        execute: async (args: any) => await executeTool("read_schedule", args),
      };
    }

    if (agentDef.tools.includes("move_student")) {
      agentTools.move_student = {
        description: "Move a student between schedule blocks. Requires a reason.",
        parameters: z.object({
          sourceBlockId: z.string(),
          targetBlockId: z.string(),
          reason: z.string(),
        }),
        execute: async (args: any) => await executeTool("move_student", args),
      };
    }

    if (agentDef.tools.includes("handle_teacher_callout")) {
      agentTools.handle_teacher_callout = {
        description: "Resolve conflicts when a teacher calls out sick.",
        parameters: z.object({
          teacherName: z.string(),
          date: z.string(),
          locationName: z.string(),
        }),
        execute: async (args: any) => await executeTool("handle_teacher_callout", args),
      };
    }

    if (agentDef.tools.includes("find_booking_gaps")) {
      agentTools.find_booking_gaps = {
        description: "Scan for 'Swiss cheese' gaps to optimize revenue.",
        parameters: z.object({
          locationName: z.string(),
          date: z.string(),
        }),
        execute: async (args: any) => await executeTool("find_booking_gaps", args),
      };
    }

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: agentDef.systemPrompt,
      messages: messageHistory,
      tools: agentTools,
      stopWhen: stepCountIs(5), 
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("[Agent Chat Error]:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}// Final Golden Trigger: Wed Apr 22 08:31:35 EDT 2026
