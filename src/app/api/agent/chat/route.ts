import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getAgentDefinition } from "@/lib/ziro/agents/definitions";
import { executeTool } from "@/lib/ziro/agents/tools";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, agentId = "ziro", history = [] } = body;

    const agentDef = getAgentDefinition(agentId);
    if (!agentDef) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const messageHistory: any[] = [
      ...history.map((m: any) => ({ role: m.role, content: m.content || m.text || "" })),
      { role: "user", content: message },
    ];

    const agentTools: any = {};

    if (agentDef.tools.includes("get_global_state")) {
      agentTools.get_global_state = tool({
        description: "Scan the business for gaps, callouts, and unpaid invoices.",
        parameters: z.object({ scope: z.string().optional() }),
        execute: async (args: any) => await executeTool("get_global_state", args),
      } as any);
    }

    if (agentDef.tools.includes("delegate_to_agent")) {
      agentTools.delegate_to_agent = tool({
        description: "Command a specialist agent (Ruby, Raven, Bub, Sid, Stewie, Star) to perform a task.",
        parameters: z.object({
          agentId: z.string(),
          toolName: z.string(),
          toolArgs: z.record(z.string(), z.any()),
          reason: z.string(),
        }),
        execute: async (args: any) => {
          const { toolArgs, ...rest } = args;
          return await executeTool("delegate_to_agent", { ...rest, parameters: toolArgs });
        },
      } as any);
    }

    if (agentDef.tools.includes("read_schedule")) {
      agentTools.read_schedule = tool({
        description: "Read lesson schedule for a location.",
        parameters: z.object({
          locationName: z.string(),
          date: z.string(),
        }),
        execute: async (args: any) => await executeTool("read_schedule", args),
      } as any);
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
      } as any);
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
      } as any);
    }

    if (agentDef.tools.includes("find_booking_gaps")) {
      agentTools.find_booking_gaps = tool({
        description: "Scan for gaps in the schedule to optimize revenue.",
        parameters: z.object({
          locationName: z.string(),
          date: z.string(),
        }),
        execute: async (args: any) => await executeTool("find_booking_gaps", args),
      } as any);
    }

    if (agentDef.tools.includes("send_sms")) {
      agentTools.send_sms = tool({
        description: "Send an SMS to a student.",
        parameters: z.object({ studentId: z.string(), message: z.string() }),
        execute: async (args: any) => await executeTool("send_sms", args),
      } as any);
    }

    if (agentDef.tools.includes("send_email")) {
      agentTools.send_email = tool({
        description: "Send an email to a student.",
        parameters: z.object({ studentId: z.string(), subject: z.string(), body: z.string() }),
        execute: async (args: any) => await executeTool("send_email", args),
      } as any);
    }

    if (agentDef.tools.includes("read_student")) {
      agentTools.read_student = tool({
        description: "Read a student profile by ID or name.",
        parameters: z.object({ studentId: z.string().optional(), studentName: z.string().optional() }),
        execute: async (args: any) => await executeTool("read_student", args),
      } as any);
    }

    if (agentDef.tools.includes("read_instructor")) {
      agentTools.read_instructor = tool({
        description: "Read a teacher profile by ID or name.",
        parameters: z.object({ teacherId: z.string().optional(), teacherName: z.string().optional() }),
        execute: async (args: any) => await executeTool("read_instructor", args),
      } as any);
    }

    if (agentDef.tools.includes("predict_churn")) {
      agentTools.predict_churn = tool({
        description: "Identify students at risk of churning.",
        parameters: z.object({}),
        execute: async (args: any) => await executeTool("predict_churn", args),
      } as any);
    }

    if (agentDef.tools.includes("analyze_trends")) {
      agentTools.analyze_trends = tool({
        description: "Analyze attendance, revenue, or new student trends.",
        parameters: z.object({ metric: z.string(), days: z.number().optional() }),
        execute: async (args: any) => await executeTool("analyze_trends", args),
      } as any);
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: agentDef.systemPrompt,
      messages: messageHistory,
      tools: agentTools,
      maxSteps: 5,
    } as any);

    return NextResponse.json({
      content: [{ type: "text", text: result.text }],
      reply: result.text,
      toolResults: result.toolResults,
      agentId,
    });

  } catch (error: any) {
    console.error("[Agent Chat Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
