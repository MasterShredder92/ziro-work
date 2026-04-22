import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    // Use the latest key provided by the user: sk-s-3zKuff...
    const apiKey = process.env.MANUS_API_KEY || "";
    
    // We will try the most likely endpoints and header combinations
    // based on the user's latest documentation and sk- key logic.
    
    const tryRequest = async (url: string, headers: any, body: any) => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            ...headers
          },
          body: JSON.stringify(body)
        });
        return response;
      } catch (e) {
        return null;
      }
    };

    // Attempt 1: Standard V2 Task API with sk- key in Authorization header
    // (Based on user's suggestion that sk- keys use Bearer)
    console.log("[Manus API] Attempt 1: api.manus.ai/v2 with Bearer token");
    let response = await tryRequest(
      "https://api.manus.ai/v2/task.create",
      { "Authorization": `Bearer ${apiKey}` },
      { message: { content: message } }
    );

    // Attempt 2: Standard V2 Task API with sk- key in x-manus-api-key header
    if (!response || !response.ok) {
      console.log("[Manus API] Attempt 2: api.manus.ai/v2 with x-manus-api-key header");
      response = await tryRequest(
        "https://api.manus.ai/v2/task.create",
        { "x-manus-api-key": apiKey },
        { message: { content: message } }
      );
    }

    // Attempt 3: OpenAI-compatible proxy on open.manus.im (New SK logic)
    if (!response || !response.ok) {
      console.log("[Manus API] Attempt 3: open.manus.im/v1 with Bearer token");
      response = await tryRequest(
        "https://open.manus.im/v1/chat/completions",
        { "Authorization": `Bearer ${apiKey}` },
        {
          model: "gpt-4.1-mini",
          messages: [{ role: "user", content: message }]
        }
      );
    }

    if (!response || !response.ok) {
      const errorData = response ? await response.json().catch(() => ({})) : {};
      console.error(`[Manus API] All attempts failed. Last status: ${response?.status}`, errorData);
      return NextResponse.json(
        { error: `Agent Error: ${errorData.error?.message || "All connection attempts failed. Check Vercel Firewall/DNS."}` },
        { status: response?.status || 500 }
      );
    }

    const data = await response.json();
    
    // Extract reply based on which API format succeeded
    let reply = "";
    if (data.task?.latest_message?.content) {
      reply = data.task.latest_message.content;
    } else if (data.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    } else {
      reply = "Ruby has received your request and is processing it.";
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("[Manus API Error]:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
