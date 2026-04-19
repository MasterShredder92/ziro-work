import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? undefined,
});

const SYSTEM_PROMPT = `You are Ruby, the schedule AI assistant for Ziro Work music school management software.
You have direct access to the schedule and can take real actions on it.

Your personality: direct, warm, no-nonsense. You speak like a sharp operations manager who actually cares.
You use short sentences. You never say "I cannot" — you either do it or explain exactly what you need to do it.

ACTIONS YOU CAN TAKE:
- Change a block's type (e.g. make it "booked_session", "open", "call_out", "makeup_session", "virtual")
- You can identify blocks by teacher name + time slot
- When asked to change block types for a teacher's students, you update all their booked blocks

LOCATION COLORS:
- Bellevue: purple (#7C3AED)
- Elkhorn: blue (#0EA5E9)  
- Gretna: green (#16A34A)
- Omaha: red (#DC2626)

BLOCK TYPE COLORS:
- booked_session: orange/amber (the standard lesson color)
- open: dark green (available slot)
- call_out: gray (student called out)
- makeup_session: blue
- virtual: blue-purple
- locked: dark gray (not bookable)

When you take an action, respond with a JSON action block followed by your message:
ACTION:{"type":"update_blocks","teacherName":"Angelica Gonzalez","blockType":"booked_session","scope":"all_teacher_blocks"}

Always confirm what you did in plain language after the action.
If you need more info to complete an action, ask one specific question.`;

interface ChatContext {
  locationName?: string;
  selectedDate?: string;
  recentEvent?: unknown;
  tenantId?: string;
}

interface ActionResult {
  success: boolean;
  message: string;
  count?: number;
}

async function executeAction(
  actionStr: string,
  context: ChatContext
): Promise<ActionResult> {
  try {
    const action = JSON.parse(actionStr);
    const tenantId = context.tenantId ?? DEFAULT_TENANT_ID;
    const db = getServiceClient();

    if (action.type === "update_blocks") {
      // Find teacher by name
      const nameParts = (action.teacherName as string).toLowerCase().split(/\s+/);
      const { data: teachers } = await db
        .from("teachers")
        .select("id, first_name, last_name, display_name")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      const teacher = (teachers ?? []).find((t) => {
        const full = `${t.first_name ?? ""} ${t.last_name ?? ""}`.toLowerCase().trim();
        const display = (t.display_name ?? "").toLowerCase();
        return nameParts.every((p: string) => full.includes(p) || display.includes(p));
      });

      if (!teacher) {
        return { success: false, message: `I couldn't find a teacher named "${action.teacherName}". Check the spelling and try again.` };
      }

      // Build update query
      let query = db
        .from("schedule_blocks")
        .update({
          block_type: action.blockType,
          is_family_callout: false,
          is_makeup_session: action.blockType === "makeup_session",
          is_virtual: action.blockType === "virtual",
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .eq("teacher_id", teacher.id);

      // Scope: all_teacher_blocks, today_only, or specific date
      if (action.scope === "today_only" && context.selectedDate) {
        query = query.eq("date", context.selectedDate);
      } else if (action.scope === "specific_date" && action.date) {
        query = query.eq("date", action.date);
      }

      // Only update blocks that have students (not open/locked)
      if (action.blockType !== "open") {
        query = query.not("student_id", "is", null);
      }

      const { error, count } = await query.select("id", { count: "exact", head: false });

      if (error) {
        console.error("[Ruby Action] update_blocks error:", error);
        return { success: false, message: `Hit a snag updating those blocks: ${error.message}` };
      }

      return {
        success: true,
        message: `Done — updated ${count ?? "all"} blocks for ${action.teacherName} to ${action.blockType.replace(/_/g, " ")}.`,
        count: count ?? 0,
      };
    }

    return { success: false, message: "I don't know how to do that action yet." };
  } catch (err) {
    console.error("[Ruby Action] parse error:", err);
    return { success: false, message: "Something went wrong executing that action." };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context = {}, history = [] } = body as {
      message: string;
      context: ChatContext;
      history: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Build conversation history (last 10 messages for context)
    const recentHistory = history.slice(-10);
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentHistory.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      {
        role: "user",
        content: `[Context: Location=${context.locationName ?? "Unknown"}, Date=${context.selectedDate ?? "today"}]\n\n${message}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });

    const rawReply = completion.choices[0]?.message?.content ?? "Got it.";

    // Check if reply contains an action
    const actionMatch = rawReply.match(/ACTION:(\{[^}]+\})/);
    let reply = rawReply;
    let actionResult: ActionResult | null = null;

    if (actionMatch) {
      // Strip the ACTION: line from the visible reply
      reply = rawReply.replace(/ACTION:\{[^}]+\}\n?/, "").trim();
      actionResult = await executeAction(actionMatch[1], context);

      if (actionResult.success) {
        reply = actionResult.message + (reply ? `\n\n${reply}` : "");
      } else {
        reply = actionResult.message;
      }
    }

    return NextResponse.json({
      reply,
      action: actionResult,
    });
  } catch (err) {
    console.error("[Ruby Chat] Error:", err);
    return NextResponse.json(
      { reply: "I'm having trouble connecting right now. Try again in a second." },
      { status: 200 } // Return 200 so the UI shows the message, not an error
    );
  }
}
