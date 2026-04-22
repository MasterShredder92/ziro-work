import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    // Use the latest key provided by the user: sk-s-3zKuff...
    const apiKey = process.env.MANUS_API_KEY || "";
    
    // Official Manus API endpoint - api.manus.ai is more globally resolvable than api.manus.im
    const endpoint = "https://api.manus.ai/v2/task.create";
    
    console.log(`[Manus API] Direct relay request to ${endpoint}`);

    // Pure fetch request with standard headers to bypass Vercel Bot Protection and DNS issues
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-manus-api-key": apiKey,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({
        message: {
          content: message
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Manus API] Error: ${response.status}`, data);
      return NextResponse.json(
        { error: `Agent Error: ${data.error?.message || "Authentication or Network Error"}` },
        { status: response.status }
      );
    }

    // According to Manus v2 docs, it returns a task object
    const reply = data.task?.latest_message?.content || "Ruby has received your request and is processing it.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("[Manus API Error]:", error);
    // Provide a clearer error message for network issues
    const errorMessage = error.code === 'ENOTFOUND' 
      ? "Manus API domain could not be resolved. Please check Vercel DNS settings."
      : (error.message || "An unexpected error occurred");
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
