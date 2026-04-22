import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentId = "ziro" } = body;

    const apiKey = process.env.MANUS_API_KEY || "";
    
    // We'll try the most likely working endpoint first: 
    // The OpenAI-compatible proxy for Manus.
    const proxyEndpoint = "https://api.manus.im/api/llm-proxy/v1/chat/completions";
    
    console.log(`[Manus API] Trying OpenAI-compatible proxy for agent ${agentId}`);

    const proxyResponse = await fetch(proxyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini", // Standard Manus model
        messages: [{ role: "user", content: message }]
      })
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      const reply = data.choices?.[0]?.message?.content || "Ruby is thinking...";
      return NextResponse.json({ reply });
    }

    // If proxy fails, try the official Manus task API as a fallback
    console.log(`[Manus API] Proxy failed with ${proxyResponse.status}. Trying native Task API...`);
    
    const taskEndpoint = "https://api.manus.ai/v2/task.create";
    const taskResponse = await fetch(taskEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-manus-api-key": apiKey
      },
      body: JSON.stringify({
        message: { content: message }
      })
    });

    if (taskResponse.ok) {
      const data = await taskResponse.json();
      const reply = data.task?.latest_message?.content || "Task created successfully.";
      return NextResponse.json({ reply });
    }

    // Both failed
    const errorData = await taskResponse.json().catch(() => ({}));
    return NextResponse.json(
      { error: `Agent Error: ${errorData.error?.message || "All endpoints failed"}` },
      { status: taskResponse.status }
    );

  } catch (error: any) {
    console.error("[Manus API Error]:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
