import { NextRequest, NextResponse } from "next/server";
import { orchestrator } from "@/lib/ziro/agents/orchestrator";

export const dynamic = "force-dynamic";

/**
 * Get task status and results
 * 
 * The client polls this endpoint to check if the agent has completed the task.
 * Returns the current status and any results or approval requests.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    const task = await orchestrator.getTask(taskId);
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // If task is awaiting approval, return approval request to client
    if (task.status === "awaiting_approval") {
      return NextResponse.json({
        taskId: task.id,
        status: "awaiting_approval",
        approvalRequired: true,
        pendingTool: task.context?.pendingTool,
        pendingInput: task.context?.pendingInput,
        message: `Approval required for: ${task.context?.pendingTool}`,
      });
    }

    // If task is completed, return the result
    if (task.status === "completed") {
      return NextResponse.json({
        taskId: task.id,
        status: "completed",
        result: task.context?.finalResult,
        message: "Task completed successfully",
      });
    }

    // If task failed, return the error
    if (task.status === "failed") {
      return NextResponse.json({
        taskId: task.id,
        status: "failed",
        error: task.context?.error,
        message: "Task failed",
      });
    }

    // Otherwise, task is still processing
    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      manusTaskId: task.manusTaskId,
      message: `${task.agentId} is still working...`,
    });

  } catch (error: any) {
    console.error("[Task Status Error]:", error);
    return NextResponse.json(
      { error: "Failed to retrieve task status" },
      { status: 500 }
    );
  }
}
