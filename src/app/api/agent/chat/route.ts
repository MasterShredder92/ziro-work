import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentId = "ziro", history = [] } = body;

    const systemPrompt = `You are ${agentId.toUpperCase()}, an AI operator for ZiroWork.
Your goal is to help the user manage their music school.
Be direct, tactical, and execution-oriented.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message }
    ];

    const apiKey = process.env.OPENAI_API_KEY || "";
    
    // Try different endpoints to find the one that works
    const endpoints = [
      "https://api.manus.im/v1/chat/completions",
      "https://api.manus.im/api/llm-proxy/v1/chat/completions",
      "https://api.manus.im/v2/chat/completions"
    ];

    let lastError = "";
    
    for (const endpoint of endpoints) {
      try {
        console.log(`[Relay] Trying endpoint: ${endpoint}`);
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

        if (relayResponse.ok) {
          const responseData = await relayResponse.json();
          const reply = responseData.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";
          console.log(`[Relay] SUCCESS with ${endpoint}`);
          return NextResponse.json({ reply });
        } else {
          const errorText = await relayResponse.text();
          console.error(`[Relay] FAILED ${endpoint}: ${relayResponse.status}`, errorText);
          lastError = `${relayResponse.status} ${errorText}`;
        }
      } catch (err: any) {
        console.error(`[Relay] EXCEPTION ${endpoint}:`, err.message);
        lastError = err.message;
      }
    }

    return NextResponse.json(
      { error: `Agent Error: All endpoints failed. Last error: ${lastError}` },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("[Agent API Error]:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
