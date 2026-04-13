import { NextRequest } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { getServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { agentId, message } = await request.json();

    if (!agentId || !message) {
      return Response.json(
        { error: "agentId and message are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Pull agent row
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, name, system_prompt")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    // Pull conversation history (last 50 messages to keep context bounded)
    const { data: history } = await supabase
      .from("agent_conversations")
      .select("role, content")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: true })
      .limit(50);

    // Insert user message
    await supabase.from("agent_conversations").insert({
      agent_id: agentId,
      role: "user",
      content: message,
    });

    // Build messages array
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Call Anthropic
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: agent.system_prompt || `You are ${agent.name}, an AI agent.`,
      messages,
    });

    const responseText =
      completion.content[0].type === "text"
        ? completion.content[0].text
        : "No response generated.";

    // Insert assistant response
    await supabase.from("agent_conversations").insert({
      agent_id: agentId,
      role: "assistant",
      content: responseText,
    });

    return Response.json({ reply: responseText });
  } catch (err) {
    console.error("Chat API error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
