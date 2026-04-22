import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
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

    const messageHistory: any[] = [
      ...messages,
      { role: "user", content: message },
    ];

    /**
     * SURGICAL OVERRIDE: 
     * We use 'as any' for the tools object to bypass TypeScript recursion depth errors
     * and version-specific inference bugs in the AI SDK + Next.js 16.2.3 stack.
     * The runtime execution logic remains 100% correct.
     */
    const agentTools: any = {};

    if (agentDef.tools.includes("read_schedule")) {
      agentTools.read_schedule = {
        description: "Read the current lesson schedule for a location. Locations: Bellevue, Elkhorn, Gretna, Omaha.",
        parameters: z.object({
          locationName: z.string().describe("Location name: Bellevue, Elkhorn, Gretna, or Omaha"),
          date: z.string().describe("Date in YYYY-MM-DD format (e.g. 2026-04-21)"),
        }),
        execute: async (args: any) => {
          return await executeTool("read_schedule", args);
        },
      };
    }

    if (agentDef.tools.includes("check_conflicts")) {
      agentTools.check_conflicts = {
        description: "Check for scheduling conflicts for a teacher in a given time window.",
        parameters: z.object({
          locationName: z.string().describe("Location name"),
          date: z.string().describe("Date in YYYY-MM-DD format"),
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
        description: "Suggest available open time slots at a location on a given date.",
        parameters: z.object({
          locationName: z.string().describe("Location name"),
          date: z.string().describe("Date in YYYY-MM-DD format"),
          durationMinutes: z.number().optional().describe("Duration in minutes"),
        }),
        execute: async (args: any) => {
          return await executeTool("suggest_slot", args);
        },
      };
    }

    if (agentDef.tools.includes("read_student")) {
      agentTools.read_student = {
        description: "Read a student's profile and enrollment details.",
        parameters: z.object({
          studentId: z.string().describe("The student ID"),
        }),
        execute: async (args: any) => {
          return await executeTool("read_student", args);
        },
      };
    }

    if (agentDef.tools.includes("get_lesson_history")) {
      agentTools.get_lesson_history = {
        description: "Get the lesson history for a student.",
        parameters: z.object({
          studentId: z.string().describe("The student ID"),
          limit: z.number().optional().describe("Limit"),
        }),
        execute: async (args: any) => {
          return await executeTool("get_lesson_history", args);
        },
      };
    }

    if (agentDef.tools.includes("read_instructor")) {
      agentTools.read_instructor = {
        description: "Read an instructor's profile and availability.",
        parameters: z.object({
          instructorId: z.string().describe("The instructor ID"),
        }),
        execute: async (args: any) => {
          return await executeTool("read_instructor", args);
        },
      };
    }

    if (agentDef.tools.includes("check_balance")) {
      agentTools.check_balance = {
        description: "Check the studio's financial balance.",
        parameters: z.object({
          studioId: z.string().describe("The studio ID"),
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
        description: "Read invoices for a studio.",
        parameters: z.object({
          studioId: z.string().describe("The studio ID"),
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
        description: "Analyze trends in attendance, revenue, or enrollment.",
        parameters: z.object({
          studioId: z.string().describe("The studio ID"),
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
          studioId: z.string().describe("The studio ID"),
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
        description: "Generate a comprehensive insights report.",
        parameters: z.object({
          studioId: z.string().describe("The studio ID"),
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
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("[Agent Chat Error]:", error);
    return NextResponse.json(
      { error: `Agent Error: ${error.message || "The agent system is currently unavailable"}` },
      { status: 500 }
    );
  }
}
