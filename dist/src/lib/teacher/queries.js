import { listStudents } from "@data/students";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listSessionLog } from "@data/sessionLog";
import { listAIConversations } from "@data/aiConversations";
import { getTeacherById } from "@data/teachers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getServiceClient } from "@/lib/supabase";
const SCHEDULE_WINDOW_PAST_DAYS = 2;
const SCHEDULE_WINDOW_FUTURE_DAYS = 14;
const LESSON_HISTORY_DAYS = 60;
function isoDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}
async function resolveTenantForTeacher(teacherId, tenantId) {
    var _a;
    if (tenantId && tenantId.trim().length > 0)
        return tenantId;
    const { data } = await getTeacherById(teacherId);
    const t = (_a = data === null || data === void 0 ? void 0 : data.tenant_id) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    return t;
}
export async function getTeacherProfile(teacherId) {
    const { data, error } = await getTeacherById(teacherId);
    if (error)
        throw new Error(error);
    return data !== null && data !== void 0 ? data : null;
}
export async function getTeacherByProfileId(profileId) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("profile_id", profileId)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
export async function getTeacherSchedule(teacherId, tenantId) {
    const tid = await resolveTenantForTeacher(teacherId, tenantId);
    return listScheduleBlocks(tid, {
        teacher_id: teacherId,
        date_from: isoDate(-SCHEDULE_WINDOW_PAST_DAYS),
        date_to: isoDate(SCHEDULE_WINDOW_FUTURE_DAYS),
    }, {
        orderBy: "block_date",
        ascending: true,
        limit: 500,
    });
}
export async function getTeacherStudents(teacherId, tenantId) {
    const tid = await resolveTenantForTeacher(teacherId, tenantId);
    return listStudents(tid, { teacher_id: teacherId }, {
        orderBy: "created_at",
        ascending: false,
        limit: 500,
    });
}
export async function getTeacherLessons(teacherId, tenantId) {
    const tid = await resolveTenantForTeacher(teacherId, tenantId);
    return listSessionLog(tid, {
        teacher_id: teacherId,
        date_from: isoDate(-LESSON_HISTORY_DAYS),
        date_to: isoDate(0),
    }, {
        orderBy: "block_date",
        ascending: false,
        limit: 200,
    });
}
export async function getTeacherMessages(teacherId, tenantId) {
    const tid = await resolveTenantForTeacher(teacherId, tenantId);
    const profileId = await resolveProfileIdForTeacher(teacherId);
    if (!profileId)
        return [];
    return listAIConversations(tid, { profile_id: profileId }, {
        orderBy: "updated_at",
        ascending: false,
        limit: 25,
    });
}
async function resolveProfileIdForTeacher(teacherId) {
    var _a;
    const { data } = await getTeacherById(teacherId);
    const pid = (_a = data === null || data === void 0 ? void 0 : data.profile_id) !== null && _a !== void 0 ? _a : null;
    return pid;
}
