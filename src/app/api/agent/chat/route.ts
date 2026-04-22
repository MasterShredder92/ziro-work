import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Increase timeout for agentic tasks

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    // Use the latest key provided by the user: sk-s-...
    const apiKey = process.env.MANUS_API_KEY || "";
    
    // The specific OpenAI-compatible proxy endpoint for Manus that supports sk-s- keys
    const endpoint = "https://api.manus.im/api/llm-proxy/v1/chat/completions";
    
    console.log(`[Manus API] Definitive Relay: Handshaking with ${endpoint}`);

    // Standard Authorization: Bearer sk-s-... as per latest checklist
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "User-Agent": "ZiroWork/1.0 (Agentic-Handshake; Vercel)"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Manus API] Error: ${response.status}`, data);
      return NextResponse.json(
        { error: `Agent Error: ${data.error?.message || "Handshake or Proxy Error"}` },
        { status: response.status }
      );
    }

    const reply = data.choices?.[0]?.message?.content || "Ruby is processing your request.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("[Manus API Error]:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
