import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const SYSTEM_PROMPT = `You are Ruby, the schedule AI assistant for Ziro Work music school management software.
You have direct access to the schedule and can take real actions on it.

Your personality: direct, warm, no-nonsense. You speak like a sharp operations manager who actually cares.
You use short sentences. You never say "I cannot" — you either do it or explain exactly what you need to do it.

ACTIONS YOU CAN TAKE:
- Change a block's type (e.g. make it "booked_session", "open", "call_out", "makeup_session", "virtual")
- You can identify blocks by teacher name + time slot
- When asked to change block types for a teacher's students, you update all their booked blocks
- Move a student from one block to another. If the user doesn't specify the current time, you look it up automatically.

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
ACTION:{"type":"move_student","studentName":"Riley Whitaker","toTeacher":"Noah Zywiec","toTime":"4:30 PM"}

Always confirm what you did in plain language after the action.
If you need more info to complete an action, ask one specific question.`;
async function executeAction(actionStr, context) {
    var _a, _b;
    try {
        const action = JSON.parse(actionStr);
        const tenantId = (_a = context.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
        const db = getServiceClient();
        if (action.type === "update_blocks") {
            const nameParts = action.teacherName.toLowerCase().split(/\s+/);
            const { data: teachers } = await db
                .from("teachers")
                .select("id, first_name, last_name, display_name")
                .eq("tenant_id", tenantId)
                .eq("is_active", true);
            const teacher = (teachers !== null && teachers !== void 0 ? teachers : []).find((t) => {
                var _a, _b, _c;
                const full = `${(_a = t.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = t.last_name) !== null && _b !== void 0 ? _b : ""}`.toLowerCase().trim();
                const display = ((_c = t.display_name) !== null && _c !== void 0 ? _c : "").toLowerCase();
                return nameParts.every((p) => full.includes(p) || display.includes(p));
            });
            if (!teacher) {
                return { success: false, message: `I couldn't find a teacher named "${action.teacherName}". Check the spelling and try again.` };
            }
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
            if (action.scope === "today_only" && context.selectedDate) {
                query = query.eq("block_date", context.selectedDate);
            }
            else if (action.scope === "specific_date" && action.date) {
                query = query.eq("block_date", action.date);
            }
            if (action.blockType !== "open") {
                query = query.not("student_id", "is", null);
            }
            const { data: updatedRows, error } = await query.select("id");
            const count = (_b = updatedRows === null || updatedRows === void 0 ? void 0 : updatedRows.length) !== null && _b !== void 0 ? _b : 0;
            if (error) {
                console.error("[Ruby Action] update_blocks error:", error);
                return { success: false, message: `Hit a snag updating those blocks: ${error.message}` };
            }
            return {
                success: true,
                message: `Done — updated ${count} blocks for ${action.teacherName} to ${action.blockType.replace(/_/g, " ")}.`,
                count,
            };
        }
        if (action.type === "move_student") {
            const studentName = action.studentName.toLowerCase();
            const toTeacherName = action.toTeacher.toLowerCase();
            const toTime = action.toTime; // e.g. "4:30 PM"
            const date = context.selectedDate || new Date().toISOString().split("T")[0];
            // 1. Find Student
            const { data: students } = await db
                .from("students")
                .select("id, first_name, last_name")
                .eq("tenant_id", tenantId);
            const student = (students !== null && students !== void 0 ? students : []).find(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentName));
            if (!student)
                return { success: false, message: `I couldn't find a student named "${action.studentName}".` };
            // 2. Find Destination Teacher
            const { data: teachers } = await db
                .from("teachers")
                .select("id, first_name, last_name, display_name")
                .eq("tenant_id", tenantId);
            const teacher = (teachers !== null && teachers !== void 0 ? teachers : []).find(t => `${t.first_name} ${t.last_name}`.toLowerCase().includes(toTeacherName) ||
                (t.display_name && t.display_name.toLowerCase().includes(toTeacherName)));
            if (!teacher)
                return { success: false, message: `I couldn't find a teacher named "${action.toTeacher}".` };
            // 3. Find current block for the student on this date (to clear it)
            const { data: currentBlocks } = await db
                .from("schedule_blocks")
                .select("id, start_time, teacher_id")
                .eq("tenant_id", tenantId)
                .eq("student_id", student.id)
                .eq("block_date", date);
            // 4. Find target block (must be open_time)
            // Note: start_time in DB is usually "16:30:00" format. We need to convert "4:30 PM" to that.
            let targetTimeStr = toTime;
            if (toTime.includes("PM") || toTime.includes("AM")) {
                const [time, modifier] = toTime.split(" ");
                let [hours, minutes] = time.split(":");
                if (hours === "12")
                    hours = "00";
                if (modifier === "PM")
                    hours = (parseInt(hours, 10) + 12).toString();
                targetTimeStr = `${hours.padStart(2, "0")}:${minutes}:00`;
            }
            const { data: targetBlocks } = await db
                .from("schedule_blocks")
                .select("id")
                .eq("tenant_id", tenantId)
                .eq("teacher_id", teacher.id)
                .eq("block_date", date)
                .eq("start_time", targetTimeStr)
                .limit(1);
            if (!targetBlocks || targetBlocks.length === 0) {
                return { success: false, message: `I couldn't find an available slot for ${action.toTeacher} at ${toTime} today.` };
            }
            // 5. Perform the move (transaction-like)
            // Clear old block
            if (currentBlocks && currentBlocks.length > 0) {
                await db.from("schedule_blocks").update({
                    student_id: null,
                    block_type: "open",
                    updated_at: new Date().toISOString()
                }).eq("id", currentBlocks[0].id);
            }
            // Update new block
            const { error: moveError } = await db.from("schedule_blocks").update({
                student_id: student.id,
                block_type: "booked_session",
                updated_at: new Date().toISOString()
            }).eq("id", targetBlocks[0].id);
            if (moveError)
                return { success: false, message: `Failed to move the lesson: ${moveError.message}` };
            return {
                success: true,
                message: `Successfully moved ${student.first_name} ${student.last_name} to ${teacher.first_name}'s ${toTime} slot today.`
            };
        }
        return { success: false, message: "I don't know how to do that action yet." };
    }
    catch (err) {
        console.error("[Ruby Action] parse error:", err);
        return { success: false, message: "Something went wrong executing that action." };
    }
}
export async function POST(req) {
    var _a, _b, _c, _d;
    try {
        const body = await req.json();
        const { message, context = {}, history = [] } = body;
        if (!(message === null || message === void 0 ? void 0 : message.trim())) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }
        // Lazy-initialize Anthropic inside the handler — never at module load time
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const recentHistory = history.slice(-10);
        const messages = [
            ...recentHistory,
            {
                role: "user",
                content: `[Context: Location=${(_a = context.locationName) !== null && _a !== void 0 ? _a : "Unknown"}, Date=${(_b = context.selectedDate) !== null && _b !== void 0 ? _b : "today"}]\n\n${message}`,
            },
        ];
        const response = await anthropic.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 400,
            system: SYSTEM_PROMPT,
            messages,
        });
        const rawReply = (_d = (_c = response.content[0]) === null || _c === void 0 ? void 0 : _c.text) !== null && _d !== void 0 ? _d : "Got it.";
        // Check if reply contains an action
        const actionMatch = rawReply.match(/ACTION:(\{[^}]+\})/);
        let reply = rawReply;
        let actionResult = null;
        if (actionMatch) {
            reply = rawReply.replace(/ACTION:\{[^}]+\}\n?/, "").trim();
            actionResult = await executeAction(actionMatch[1], context);
            if (actionResult.success) {
                reply = actionResult.message + (reply ? `\n\n${reply}` : "");
            }
            else {
                reply = actionResult.message;
            }
        }
        return NextResponse.json({ reply, action: actionResult });
    }
    catch (err) {
        console.error("[Ruby Chat] Error:", err);
        return NextResponse.json({ reply: "I'm having trouble connecting right now. Try again in a second." }, { status: 200 });
    }
}
