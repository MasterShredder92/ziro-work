import { NextRequest, NextResponse } from "next/server";
import { streamText, tool, CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getAgentDefinition } from "@/lib/ziro/agents/definitions";
import { executeTool } from "@/lib/ziro/agents/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * ZiroWork Agentic Chat Route
 *
 * Architecture: Vercel AI SDK Tool Loop (Observe → Think → Act → Verify)
 * Model: OpenAI gpt-4.1-mini (direct, no proxy — stable, fast, no DNS issues)
 * Tools: ZiroWork database tools (Ruby=schedule, Sid=students, Vader=finance, Raven=analytics)
 * Max Steps: 5 (agent loops up to 5 times to complete a task)
 *
 * Manus sk-s- key is reserved for future deep research / autonomous browsing tasks.
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

    // Load agent definition (system prompt + allowed tools)
    const agentDef = getAgentDefinition(agentId);
    if (!agentDef) {
      return NextResponse.json(
        { error: `Agent "${agentId}" not found` },
        { status: 404 }
      );
    }

    // Build message history for multi-turn conversation
    const messageHistory: CoreMessage[] = [
      ...messages,
      { role: "user", content: message },
    ];

    // Build tool definitions based on agent's allowed tools
    const agentTools: Record<string, any> = {};

    // ─── RUBY TOOLS (Scheduling) ───────────────────────────────────────────────
    if (agentDef.tools.includes("read_schedule")) {
      agentTools.read_schedule = tool({
        description:
          "Read the current lesson schedule for a location. Use this to answer questions about what lessons are scheduled, who is teaching, and when. Locations: Bellevue, Elkhorn, Gretna, Omaha.",
        parameters: z.object({
          locationName: z.string().describe("Location name: Bellevue, Elkhorn, Gretna, or Omaha"),
          date: z.string().describe("Date in YYYY-MM-DD format (e.g. 2026-04-21)"),
        }),
        execute: async (params: { locationName: string; date: string }) => {
          return await executeTool("read_schedule", params);
        },
      });
    }

    if (agentDef.tools.includes("check_conflicts")) {
      agentTools.check_conflicts = tool({
        description:
          "Check for scheduling conflicts for a teacher in a given time window on a specific date.",
        parameters: z.object({
          locationName: z.string().describe("Location name: Bellevue, Elkhorn, Gretna, or Omaha"),
          date: z.string().describe("Date in YYYY-MM-DD format"),
          startTime: z.string().describe("Start time in HH:MM:SS format (e.g. 14:00:00)"),
          endTime: z.string().describe("End time in HH:MM:SS format (e.g. 15:00:00)"),
          teacherId: z.string().optional().describe("Teacher ID to check (optional)"),
        }),
        execute: async (params: { 
          locationName: string; 
          date: string; 
          startTime: string; 
          endTime: string; 
          teacherId?: string 
        }) => {
          return await executeTool("check_conflicts", params);
        },
      });
    }

    if (agentDef.tools.includes("suggest_slot")) {
      agentTools.suggest_slot = tool({
        description:
          "Suggest available open time slots at a location on a given date.",
        parameters: z.object({
          locationName: z.string().describe("Location name: Bellevue, Elkhorn, Gretna, or Omaha"),
          date: z.string().describe("Date in YYYY-MM-DD format"),
          durationMinutes: z.number().optional().describe("Lesson duration in minutes (default 30)"),
        }),
        execute: async (params: { 
          locationName: string; 
          date: string; 
          durationMinutes?: number 
        }) => {
          return await executeTool("suggest_slot", params);
        },
      });
    }

    // ─── SID TOOLS (Student & Instructor Data) ────────────────────────────────
    if (agentDef.tools.includes("read_student")) {
      agentTools.read_student = tool({
        description:
          "Read a student's profile, contact info, and enrollment details.",
        parameters: z.object({
          studentId: z.string().describe("The student ID"),
        }),
        execute: async (params: { studentId: string }) => {
          return await executeTool("read_student", params);
        },
      });
    }

    if (agentDef.tools.includes("get_lesson_history")) {
      agentTools.get_lesson_history = tool({
        description:
          "Get the lesson history for a student — past lessons, attendance, and progress.",
        parameters: z.object({
          studentId: z.string().describe("The student ID"),
          limit: z
            .number()
            .optional()
            .describe("Number of lessons to return (default 20)"),
        }),
        execute: async (params: { studentId: string; limit?: number }) => {
          return await executeTool("get_lesson_history", params);
        },
      });
    }

    if (agentDef.tools.includes("read_instructor")) {
      agentTools.read_instructor = tool({
        description:
          "Read an instructor's profile, availability, and assigned students.",
        parameters: z.object({
          instructorId: z.string().describe("The instructor ID"),
        }),
        execute: async (params: { instructorId: string }) => {
          return await executeTool("read_instructor", params);
        },
      });
    }

    // ─── VADER TOOLS (Financial) ──────────────────────────────────────────────
    if (agentDef.tools.includes("check_balance")) {
      agentTools.check_balance = tool({
        description:
          "Check the studio's financial balance — revenue, outstanding invoices, and overdue amounts.",
        parameters: z.object({
          studioId: z.string().describe("The studio ID"),
        }),
        execute: async (params: { studioId: string }) => {
          return await executeTool("check_balance", {
            studioId: params.studioId || studioId,
          });
        },
      });
    }

    if (agentDef.tools.includes("read_invoices")) {
      agentTools.read_invoices = tool({
        description:
          "Read invoices for a studio — filter by status (paid, unpaid, overdue).",
        parameters: z.object({
          studioId: z.string().describe("The studio ID"),
          status: z
            .enum(["paid", "unpaid", "overdue", "all"])
            .optional()
            .describe("Filter by invoice status"),
        }),
        execute: async (params: { studioId: string; status?: "paid" | "unpaid" | "overdue" | "all" }) => {
          return await executeTool("read_invoices", {
            ...params,
            studioId: params.studioId || studioId,
          });
        },
      });
    }

    // ─── RAVEN TOOLS (Analytics) ──────────────────────────────────────────────
    if (agentDef.tools.includes("analyze_trends")) {
      agentTools.analyze_trends = tool({
        description:
          "Analyze trends in attendance, revenue, or student enrollment over a time period.",
        parameters: z.object({
          studioId: z.string().describe("The studio ID"),
          metric: z
            .enum(["attendance", "revenue", "new_students", "cancellations"])
            .describe("The metric to analyze"),
          days: z
            .number()
            .optional()
            .describe("Number of days to look back (default 30)"),
        }),
        execute: async (params: { 
          studioId: string; 
          metric: "attendance" | "revenue" | "new_students" | "cancellations"; 
          days?: number 
        }) => {
          return await executeTool("analyze_trends", {
            ...params,
            studioId: params.studioId || studioId,
          });
        },
      });
    }

    if (agentDef.tools.includes("predict_churn")) {
      agentTools.predict_churn = tool({
        description:
          "Identify students at risk of churning (no lessons in 30+ days).",
        parameters: z.object({
          studioId: z.string().describe("The studio ID"),
        }),
        execute: async (params: { studioId: string }) => {
          return await executeTool("predict_churn", {
            studioId: params.studioId || studioId,
          });
        },
      });
    }

    if (agentDef.tools.includes("generate_insights")) {
      agentTools.generate_insights = tool({
        description:
          "Generate a comprehensive insights report — attendance, churn risk, and recommendations.",
        parameters: z.object({
          studioId: z.string().describe("The studio ID"),
        }),
        execute: async (params: { studioId: string }) => {
          return await executeTool("generate_insights", {
            studioId: params.studioId || studioId,
          });
        },
      });
    }

    // ─── STREAM THE RESPONSE ──────────────────────────────────────────────────
    const result = streamText({
      model: openai("gpt-4.1-mini"),
      system: agentDef.systemPrompt,
      messages: messageHistory,
      tools: agentTools,
      maxSteps: 5, // Tool loop: Observe → Think → Act → Verify (up to 5 steps)
      onStepFinish: ({ stepType, toolCalls }) => {
        if (process.env.NODE_ENV !== "production") {
          console.log(`[${agentDef.name}] Step: ${stepType}`, {
            tools: toolCalls?.map((t) => t.toolName),
          });
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("[Agent Chat Error]:", error);
    return NextResponse.json(
      {
        error: `Agent Error: ${
          error.message || "The agent system is currently unavailable"
        }`,
      },
      { status: 500 }
    );
  }
}
