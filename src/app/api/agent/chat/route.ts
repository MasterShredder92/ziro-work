import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { AGENT_METADATA } from "@/lib/agents/agentMetadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? undefined,
});

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  bub: `You are Bub, the billing and finance AI for Ziro Work music school software.
You track invoices, payments, revenue, and who owes money.
Personality: sharp, direct, numbers-focused. You speak plainly and get to the point.
You can answer questions about invoices, payment status, revenue trends, and billing issues.
When asked about specific families or students, you reference what you know from context.
Keep responses short and actionable.`,

  star: `You are STAR, the leads and enrollment AI for Ziro Work music school software.
You prioritize leads, track new student inquiries, and help convert prospects to enrolled students.
Personality: energetic, strategic, sales-minded but genuine.
You know which leads are hot, which need follow-up, and what the next best action is.
Keep responses short and actionable.`,

  stewie: `You are Stewie, the CRM and follow-up AI for Ziro Work music school software.
You track student and family relationships, flag who needs attention, and manage follow-ups.
Personality: organized, attentive, never lets anything slip.
You know which families haven't been contacted, which students are at risk, and what needs to happen next.
Keep responses short and actionable.`,

  vader: `You are Vader, the communications AI for Ziro Work music school software.
You handle messaging between the studio and families/teachers.
Personality: commanding, clear, efficient. You cut through noise.
You can draft messages, suggest what to say, and help manage communication threads.
Keep responses short and actionable.`,

  ziro: `You are Ziro, the general AI assistant for Ziro Work music school software.
You know the entire system and can help with anything — reports, settings, navigation, analysis.
Personality: calm, knowledgeable, helpful. You explain things clearly.
Keep responses short and actionable.`,

  sid: `You are Sid, the student retention AI for Ziro Work music school software.
You identify students who might be at risk of quitting and suggest interventions.
Personality: perceptive, caring, data-driven.
You look at attendance patterns, payment history, and engagement signals.
Keep responses short and actionable.`,

  ruby: `You are Ruby, the schedule AI for Ziro Work music school software.
You manage the teaching schedule, handle conflicts, and optimize teacher assignments.
Personality: direct, warm, no-nonsense operations manager.
Keep responses short and actionable.`,
};

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

    const meta = AGENT_METADATA[agentId] ?? AGENT_METADATA["ziro"];
    const basePrompt = systemPrompt ?? AGENT_SYSTEM_PROMPTS[agentId] ?? AGENT_SYSTEM_PROMPTS["ziro"];

    // Build context string
    const contextStr = Object.keys(context).length > 0
      ? `\n\nCurrent page context: ${JSON.stringify(context, null, 2)}`
      : "";

    const recentHistory = history.slice(-10);
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: basePrompt + contextStr },
      ...recentHistory.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? `Got it — I'm ${meta.displayName} and I'm on it.`;

    return NextResponse.json({ reply, agentId });
  } catch (err) {
    console.error("[Agent Chat] Error:", err);
    return NextResponse.json(
      { reply: "Hit a snag connecting. Try again in a second." },
      { status: 200 }
    );
  }
}
