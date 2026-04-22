import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentId = "ziro" } = body;

    // The key provided by the user: sk-5OlP6N...
    const manusApiKey = process.env.MANUS_API_KEY || "";
    
    // Official Manus API endpoint from documentation
    const endpoint = "https://api.manus.ai/v2/task.create";

    console.log(`[Manus API] Creating task for agent ${agentId} at ${endpoint}`);

    // Official Manus API request format from documentation
    const relayResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-manus-api-key": manusApiKey
      },
      body: JSON.stringify({
        message: {
          content: message
        }
      })
    });

    const responseData = await relayResponse.json();

    if (!relayResponse.ok || !responseData.ok) {
      console.error(`[Manus API] Error: ${relayResponse.status}`, responseData);
      return NextResponse.json(
        { error: `Agent Error: ${responseData.error?.message || "Permission Denied"}` },
        { status: relayResponse.status }
      );
    }

    // The Manus API returns a task object. We need to extract the response.
    // Based on documentation, the initial response is a task creation confirmation.
    // For a simple chat relay, we'll return the task status or the initial message.
    const reply = responseData.task?.latest_message?.content || "Task created. Ruby is processing your request.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("[Manus API Error]:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
