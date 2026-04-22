import { NextRequest, NextResponse } from "next/server";
import { orchestrator } from "@/lib/ziro/agents/orchestrator";

export const dynamic = "force-dynamic";

/**
 * Human-in-the-Loop Approval Endpoint
 * 
 * When an agent needs approval to execute a tool (e.g., move_lesson, update_student),
 * the client sends the approval decision here.
 * 
 * This implements the Approval Gate pattern from the AI SDK documentation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, approved } = body;

    if (!taskId || approved === undefined) {
      return NextResponse.json(
        { error: "Missing taskId or approved status" },
        { status: 400 }
      );
    }

    // Update the task with the approval decision
    await orchestrator.respondToApproval(taskId, approved);

    if (approved) {
      return NextResponse.json({
        status: "approved",
        message: "Tool execution approved. Agent will proceed.",
      });
    } else {
      return NextResponse.json({
        status: "denied",
        message: "Tool execution denied. Agent will not proceed.",
      });
    }

  } catch (error: any) {
    console.error("[Approval Error]:", error);
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
