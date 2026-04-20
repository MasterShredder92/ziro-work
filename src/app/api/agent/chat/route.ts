import { NextRequest, NextResponse } from "next/server";
import { AGENT_DEFINITIONS } from "@/lib/agents/agentDefinitions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      agentId = "ziro",
      context = {},
      history = [],
      systemPrompt,
    } = body as {
      message: string;
      agentId: string;
      context: Record<string, unknown>;
      history: Array<{ role: "user" | "assistant"; content: string }>;
      systemPrompt?: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Lazy-initialize Anthropic inside the handler — never at module load time
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Use the rich specialist system prompt from agentDefinitions
    const agentDef = AGENT_DEFINITIONS[agentId] ?? AGENT_DEFINITIONS["ziro"];
    const basePrompt = systemPrompt ?? agentDef.systemPrompt;

    // Append page context if provided
    const contextStr = Object.keys(context).length > 0
      ? `\n\nCurrent page context:\n${JSON.stringify(context, null, 2)}`
      : "";

    const systemContent = basePrompt + contextStr;
    const recentHistory = history.slice(-10);

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...recentHistory,
      { role: "user", content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      system: systemContent,
      messages,
    });

    const reply =
      (response.content[0] as { type: string; text?: string })?.text ??
      `I'm ${agentDef.name} — hit a snag, try again in a second.`;

    return NextResponse.json({ reply, agentId, agentName: agentDef.name });
  } catch (err) {
    console.error("[Agent Chat] Error:", err);
    return NextResponse.json(
      { reply: "Hit a snag connecting. Try again in a second." },
      { status: 200 }
    );
  }
}
