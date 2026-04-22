import { NextRequest, NextResponse } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getAgentDefinition } from "@/lib/ziro/agents/definitions";
import { executeTool } from "@/lib/ziro/agents/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * ZiroWork Agentic Chat Route
 *
 * Architecture: Vercel AI SDK Tool Loop
 * Model: OpenAI gpt-4.1-mini
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
      return NextResponse.json(
        { error: `Agent "${agentId}" not found` },
        { status: 404 }
      );
    }

    /**
     * AI SDK v6 Alignment:
     * CoreMessage has been renamed to ModelMessage.
     */
    const messageHistory: ModelMessage[] = [
      ...messages,
      { role: "user", content: message },
    ];

    /**
     * Tools definition using the standard AI SDK pattern.
     * Cleaned up Zod descriptions for OpenAI schema validation.
     */
    const agentTools: any = {};

    if (agentDef.tools.includes("read_schedule")) {
      agentTools.read_schedule = {
        description: "Read lesson schedule for a location. Locations: Bellevue, Elkhorn, Gretna, Omaha.",
        parameters: z.object({
          locationName: z.string().describe("Location: Bellevue, Elkhorn, Gretna, or Omaha"),
          date: z.string().describe("Date (YYYY-MM-DD)"),
        }),
        execute: async (args: { locationName: string; date: string }) => {
          return await executeTool("read_schedule", args);
        },
      };
    }

    if (agentDef.tools.includes("check_conflicts")) {
      agentTools.check_conflicts = {
        description: "Check for teacher scheduling conflicts.",
        parameters: z.object({
          locationName: z.string().describe("Location name"),
          date: z.string().describe("Date (YYYY-MM-DD)"),
          startTime: z.string().describe("Start time (HH:MM:SS)"),
          endTime: z.string().describe("End time (HH:MM:SS)"),
          teacherId: z.string().optional().describe("Teacher ID"),
        }),
        execute: async (args: any) => {
          return await executeTool("check_conflicts", args);
        },
      };
    }

    if (agentDef.tools.includes("suggest_slot")) {
      agentTools.suggest_slot = {
        description: "Suggest open slots at a location.",
        parameters: z.object({
          locationName: z.string().describe("Location name"),
          date: z.string().describe("Date (YYYY-MM-DD)"),
          durationMinutes: z.number().optional().describe("Duration in minutes"),
        }),
        execute: async (args: any) => {
          return await executeTool("suggest_slot", args);
        },
      };
    }

    if (agentDef.tools.includes("read_student")) {
      agentTools.read_student = {
        description: "Read student profile.",
        parameters: z.object({
          studentId: z.string().describe("Student ID"),
        }),
        execute: async (args: any) => {
          return await executeTool("read_student", args);
        },
      };
    }

    if (agentDef.tools.includes("get_lesson_history")) {
      agentTools.get_lesson_history = {
        description: "Get lesson history for a student.",
        parameters: z.object({
          studentId: z.string().describe("Student ID"),
          limit: z.number().optional().describe("Limit"),
        }),
        execute: async (args: any) => {
          return await executeTool("get_lesson_history", args);
        },
      };
    }

    if (agentDef.tools.includes("read_instructor")) {
      agentTools.read_instructor = {
        description: "Read instructor profile.",
        parameters: z.object({
          instructorId: z.string().describe("Instructor ID"),
        }),
        execute: async (args: any) => {
          return await executeTool("read_instructor", args);
        },
      };
    }

    if (agentDef.tools.includes("check_balance")) {
      agentTools.check_balance = {
        description: "Check studio financial balance.",
        parameters: z.object({
          studioId: z.string().describe("Studio ID"),
        }),
        execute: async (args: any) => {
          return await executeTool("check_balance", {
            studioId: args.studioId || studioId,
          });
        },
      };
    }

    if (agentDef.tools.includes("read_invoices")) {
      agentTools.read_invoices = {
        description: "Read studio invoices.",
        parameters: z.object({
          studioId: z.string().describe("Studio ID"),
          status: z.enum(["paid", "unpaid", "overdue", "all"]).optional().describe("Status"),
        }),
        execute: async (args: any) => {
          return await executeTool("read_invoices", {
            ...args,
            studioId: args.studioId || studioId,
          });
        },
      };
    }

    if (agentDef.tools.includes("analyze_trends")) {
      agentTools.analyze_trends = {
        description: "Analyze attendance or revenue trends.",
        parameters: z.object({
          studioId: z.string().describe("Studio ID"),
          metric: z.enum(["attendance", "revenue", "new_students", "cancellations"]).describe("Metric"),
          days: z.number().optional().describe("Days back"),
        }),
        execute: async (args: any) => {
          return await executeTool("analyze_trends", {
            ...args,
            studioId: args.studioId || studioId,
          });
        },
      };
    }

    if (agentDef.tools.includes("predict_churn")) {
      agentTools.predict_churn = {
        description: "Identify students at risk of churning.",
        parameters: z.object({
          studioId: z.string().describe("Studio ID"),
        }),
        execute: async (args: any) => {
          return await executeTool("predict_churn", {
            studioId: args.studioId || studioId,
          });
        },
      };
    }

    if (agentDef.tools.includes("generate_insights")) {
      agentTools.generate_insights = {
        description: "Generate insights report.",
        parameters: z.object({
          studioId: z.string().describe("Studio ID"),
        }),
        execute: async (args: any) => {
          return await executeTool("generate_insights", {
            studioId: args.studioId || studioId,
          });
        },
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

    /**
     * The Protocol Fix for AI SDK v6:
     * Use toUIMessageStreamResponse() to ensure perfect synchronization
     * with the frontend useChat hook and maxSteps metadata.
     */
    // @ts-ignore
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("[Agent Chat Error]:", error);
    return NextResponse.json(
      { error: `Agent Error: ${error.message || "The agent system is currently unavailable"}` },
      { status: 500 }
    );
  }
}
