var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { clientFor } from "@data/_client";
export async function executeTool(toolName, input, tenantId) {
    const supabase = clientFor(tenantId);
    switch (toolName) {
        case "update_student": {
            const _a = input, { student_id } = _a, fields = __rest(_a, ["student_id"]);
            if (!student_id)
                return { error: "student_id is required" };
            const updatePayload = { updated_at: new Date().toISOString() };
            if (fields.bio !== undefined)
                updatePayload.bio = fields.bio;
            if (fields.goals !== undefined)
                updatePayload.goals = fields.goals;
            if (fields.learning_style !== undefined)
                updatePayload.learning_style = fields.learning_style;
            if (fields.experience !== undefined)
                updatePayload.experience = fields.experience;
            if (fields.notes !== undefined)
                updatePayload.notes = fields.notes;
            if (fields.teacher_notes !== undefined)
                updatePayload.teacher_notes = fields.teacher_notes;
            const { data, error } = await supabase
                .from("students")
                .update(updatePayload)
                .eq("id", student_id)
                .eq("tenant_id", tenantId)
                .select("id, first_name, last_name, bio, goals, learning_style, experience, notes, teacher_notes")
                .single();
            if (error)
                return { error: error.message };
            return { success: true, student: data };
        }
        case "get_student": {
            const { student_id } = input;
            if (!student_id)
                return { error: "student_id is required" };
            const { data, error } = await supabase
                .from("students")
                .select("id, first_name, last_name, bio, goals, learning_style, experience, notes, teacher_notes, instrument, status, teacher_id, location_id")
                .eq("id", student_id)
                .eq("tenant_id", tenantId)
                .single();
            if (error)
                return { error: error.message };
            return data;
        }
        case "list_teacher_availability": {
            const { teacher_id, date_from, date_to } = input;
            const { data, error } = await supabase
                .from("teacher_availability")
                .select("*")
                .eq("teacher_id", teacher_id)
                .eq("tenant_id", tenantId)
                .gte("date", date_from)
                .lte("date", date_to)
                .order("date", { ascending: true });
            if (error)
                return { error: error.message };
            return { availability: data !== null && data !== void 0 ? data : [] };
        }
        case "reschedule_block": {
            const { block_id, new_start_time, new_end_time, new_teacher_id, reason } = input;
            if (!block_id)
                return { error: "block_id is required" };
            const updatePayload = {
                start_time: new_start_time,
                end_time: new_end_time,
                updated_at: new Date().toISOString(),
            };
            if (new_teacher_id)
                updatePayload.teacher_id = new_teacher_id;
            if (reason)
                updatePayload.reschedule_reason = reason;
            const { data, error } = await supabase
                .from("schedule_blocks")
                .update(updatePayload)
                .eq("id", block_id)
                .eq("tenant_id", tenantId)
                .select("id, start_time, end_time, teacher_id, student_id, status")
                .single();
            if (error)
                return { error: error.message };
            return { success: true, block: data };
        }
        case "list_schedule_blocks": {
            const { student_id, teacher_id, date_from, date_to } = input;
            let query = supabase
                .from("schedule_blocks")
                .select("id, start_time, end_time, teacher_id, student_id, status, location_id")
                .eq("tenant_id", tenantId)
                .gte("start_time", date_from)
                .lte("start_time", date_to)
                .order("start_time", { ascending: true })
                .limit(100);
            if (student_id)
                query = query.eq("student_id", student_id);
            if (teacher_id)
                query = query.eq("teacher_id", teacher_id);
            const { data, error } = await query;
            if (error)
                return { error: error.message };
            return { blocks: data !== null && data !== void 0 ? data : [] };
        }
        default:
            return { error: `Unknown tool: ${toolName}` };
    }
}
