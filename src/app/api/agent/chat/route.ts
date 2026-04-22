import { NextRequest, NextResponse } from "next/server";
import { getZiroContext } from "@/lib/ziro/context";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentId = "ziro", context: clientContext = {}, history = [] } = body;

    // Get real context for the agent
    const ziroContext = await getZiroContext();
    
    // Build the system prompt based on agent identity
    const systemPrompt = `You are ${agentId.toUpperCase()}, an AI operator for ZiroWork.
Your goal is to help the user manage their music school.
Current context: ${JSON.stringify(ziroContext)}
Be direct, tactical, and execution-oriented.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message }
    ];

    const apiKey = process.env.OPENAI_API_KEY || "";
    const baseURL = process.env.OPENAI_BASE_URL || "https://api.manus.im/api/llm-proxy/v1";
    const endpoint = `${baseURL.replace(/\/$/, "")}/chat/completions`;

    console.log(`[Relay] Sending request to ${endpoint} for agent ${agentId}`);

    const relayResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey.startsWith("sk-") ? `Bearer ${apiKey}` : apiKey,
        "X-API-Key": apiKey,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Origin": "https://app.zirowork.com",
        "Referer": "https://app.zirowork.com/"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        temperature: 0.7,
        stream: false
      })
    });

    if (!relayResponse.ok) {
      const errorText = await relayResponse.text();
      console.error(`[Relay] Error: ${relayResponse.status}`, errorText);
      return NextResponse.json(
        { error: `Agent Error: ${relayResponse.status} ${errorText}` },
        { status: relayResponse.status }
      );
    }

    const responseData = await relayResponse.json();
    const reply = responseData.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("[Agent API Error]:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
