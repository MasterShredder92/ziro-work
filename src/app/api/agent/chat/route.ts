import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max duration for Vercel Hobby/Pro to allow agent execution

/**
 * ZiroWork Agentic Relay
 * Based on the Manus v2 Task Architecture (Ivan Leo, Manus AI)
 * This route transforms a simple chat prompt into an autonomous Manus Task.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentId = "ruby" } = body;

    // Use the latest sk-s- key provided by the user
    const apiKey = process.env.MANUS_API_KEY || "";
    
    // Official Manus v2 Task Creation Endpoint
    const endpoint = "https://api.manus.ai/v2/task.create";
    
    console.log(`[ZiroWork Agent] Initializing ${agentId} task: "${message.substring(0, 30)}..."`);

    // We use the exact structure described in the Manus v2 documentation
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-manus-api-key": apiKey,
        "User-Agent": "ZiroWork-Agentic-Orchestrator/1.0"
      },
      body: JSON.stringify({
        message: {
          content: message
        },
        // Optional: We can provide tool definitions here in the future
        // for Ruby to actually "touch" the schedule.
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Manus API] Task Creation Failed: ${response.status}`, data);
      return NextResponse.json(
        { error: `Agent Error: ${data.error?.message || "Failed to initialize agent task"}` },
        { status: response.status }
      );
    }

    // The v2 API returns a task object. 
    // For a seamless chat experience, we return the latest message content.
    // If it's a long-running task, the first response might be an acknowledgment.
    const reply = data.task?.latest_message?.content || 
                  data.task?.status === 'processing' ? 
                  "I'm looking into that for you right now..." : 
                  "Task initialized. I'm on it.";

    return NextResponse.json({ 
      reply,
      taskId: data.task?.id,
      status: data.task?.status
    });

  } catch (error: any) {
    console.error("[ZiroWork Agent Error]:", error);
    return NextResponse.json(
      { error: "The agent is currently unavailable. Please check your connection." },
      { status: 500 }
    );
  }
}
