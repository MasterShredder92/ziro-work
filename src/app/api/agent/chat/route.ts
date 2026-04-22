import { NextRequest, NextResponse } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getAgentDefinition } from "@/lib/ziro/agents/definitions";
import { executeTool } from "@/lib/ziro/agents/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * ZiroWork Agentic Chat Route — ORCHESTRATOR MODE
 * 
 * Missions:
 * 1. Conflict Arbiter (handle_teacher_callout)
 * 2. Revenue Optimizer (find_booking_gaps)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      agentId = "ruby",
      messages = [],
      studioId,
    } = body;

    const agentDef = getAgentDefinition(agentId);
    if (!agentDef) {
      return NextResponse.json({ error: `Agent "${agentId}" not found` }, { status: 404 });
    }

    const messageHistory: ModelMessage[] = [
      ...messages,
      { role: "user", content: message },
    ];

    const agentTools: any = {};

    // 1. read_schedule
    if (agentDef.tools.includes("read_schedule")) {
      agentTools.read_schedule = {
        description: "Read lesson schedule for a location (Bellevue, Elkhorn, Gretna, Omaha).",
        parameters: z.object({
          locationName: z.string().describe("Location: Bellevue, Elkhorn, Gretna, or Omaha"),
          date: z.string().describe("Date (YYYY-MM-DD)"),
        }),
        execute: async (args: any) => await executeTool("read_schedule", args),
      };
    }

    // 2. move_student
    if (agentDef.tools.includes("move_student")) {
      agentTools.move_student = {
        description: "Move a student from one schedule block to another. This reschedules the student.",
        parameters: z.object({
          sourceBlockId: z.string().describe("The ID of the block the student is currently in"),
          targetBlockId: z.string().describe("The ID of the available block to move the student into"),
          reason: z.string().optional().describe("Reason for moving the student"),
        }),
        execute: async (args: any) => await executeTool("move_student", args),
      };
    }

    // 3. handle_teacher_callout (MISSION 1)
    if (agentDef.tools.includes("handle_teacher_callout")) {
      agentTools.handle_teacher_callout = {
        description: "Find alternative slots for all students of a teacher who called out sick.",
        parameters: z.object({
          teacherName: z.string().describe("The name of the teacher who called out"),
          date: z.string().describe("Date of the callout (YYYY-MM-DD)"),
          locationName: z.string().describe("Location name"),
        }),
        execute: async (args: any) => await executeTool("handle_teacher_callout", args),
      };
    }

    // 4. find_booking_gaps (MISSION 2)
    if (agentDef.tools.includes("find_booking_gaps")) {
      agentTools.find_booking_gaps = {
        description: "Scan for 'Swiss cheese' gaps (single open 30-min slots) to optimize revenue.",
        parameters: z.object({
          locationName: z.string().describe("Location name"),
          date: z.string().describe("Date (YYYY-MM-DD)"),
        }),
        execute: async (args: any) => await executeTool("find_booking_gaps", args),
      };
    }

    const result = streamText({
      model: openai("gpt-4.1-mini"),
      system: agentDef.systemPrompt,
      messages: messageHistory,
      tools: agentTools,
      // @ts-ignore
      maxSteps: 5,
    });

    // @ts-ignore
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("[Agent Chat Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
