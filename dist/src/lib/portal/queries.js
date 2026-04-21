import "server-only";
import { getStudentById, listStudents } from "@data/students";
import { getFamilyById } from "@data/families";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listSessionLog } from "@data/sessionLog";
import { listAIConversations } from "@data/aiConversations";
import { listSquareInvoices } from "@data/squareInvoices";
import { getTenantContext } from "@data/getTenantContext";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export async function resolvePortalTenantId() {
    const ctx = await getTenantContext();
    if (ctx.tenantId)
        return ctx.tenantId;
    const session = await getSession();
    if (session === null || session === void 0 ? void 0 : session.tenantId)
        return session.tenantId;
    return DEFAULT_TENANT_ID;
}
function isoDate(d) {
    return d.toISOString().slice(0, 10);
}
function scheduleWindow() {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 14);
    const to = new Date(now);
    to.setDate(to.getDate() + 60);
    return { from: isoDate(from), to: isoDate(to) };
}
export async function getStudentProfile(studentId) {
    const tenantId = await resolvePortalTenantId();
    return getStudentById(studentId, tenantId);
}
export async function getStudentSchedule(studentId) {
    const tenantId = await resolvePortalTenantId();
    const { from, to } = scheduleWindow();
    return listScheduleBlocks(tenantId, { student_id: studentId, date_from: from, date_to: to }, { orderBy: "block_date", ascending: true, limit: 500 });
}
export async function getStudentLessons(studentId) {
    const tenantId = await resolvePortalTenantId();
    return listSessionLog(tenantId, { student_id: studentId }, { orderBy: "block_date", ascending: false, limit: 100 });
}
export async function getStudentMessages(studentId) {
    var _a;
    const tenantId = await resolvePortalTenantId();
    const student = await getStudentById(studentId, tenantId);
    const profileId = (_a = student === null || student === void 0 ? void 0 : student.profile_id) !== null && _a !== void 0 ? _a : undefined;
    if (!profileId)
        return [];
    return listAIConversations(tenantId, { profile_id: profileId }, { orderBy: "updated_at", ascending: false, limit: 50 });
}
export async function getStudentInvoices(studentId) {
    var _a;
    const tenantId = await resolvePortalTenantId();
    const student = await getStudentById(studentId, tenantId);
    const familyId = (_a = student === null || student === void 0 ? void 0 : student.family_id) !== null && _a !== void 0 ? _a : undefined;
    if (!familyId)
        return [];
    return listSquareInvoices(tenantId, { customer_id: undefined }, { orderBy: "invoice_date", ascending: false, limit: 100 }).then((rows) => rows.filter((r) => r.family_id === familyId));
}
export async function getFamilyProfile(familyId) {
    const tenantId = await resolvePortalTenantId();
    return getFamilyById(familyId, tenantId);
}
export async function getFamilyStudents(familyId) {
    const tenantId = await resolvePortalTenantId();
    return listStudents(tenantId, { family_id: familyId }, { orderBy: "first_name", ascending: true, limit: 100 });
}
export async function getFamilySchedule(familyId) {
    const tenantId = await resolvePortalTenantId();
    const students = await listStudents(tenantId, { family_id: familyId }, { limit: 100 });
    const ids = students.map((s) => s.id);
    if (ids.length === 0)
        return [];
    const { from, to } = scheduleWindow();
    const all = await Promise.all(ids.map((id) => listScheduleBlocks(tenantId, { student_id: id, date_from: from, date_to: to }, { orderBy: "block_date", ascending: true, limit: 500 })));
    const flat = all.flat();
    flat.sort((a, b) => {
        var _a, _b, _c, _d;
        const da = (_a = a.block_date) !== null && _a !== void 0 ? _a : "";
        const db = (_b = b.block_date) !== null && _b !== void 0 ? _b : "";
        if (da !== db)
            return da.localeCompare(db);
        const ta = (_c = a.start_time) !== null && _c !== void 0 ? _c : "";
        const tb = (_d = b.start_time) !== null && _d !== void 0 ? _d : "";
        return ta.localeCompare(tb);
    });
    return flat;
}
export async function getFamilyInvoices(familyId) {
    const tenantId = await resolvePortalTenantId();
    const rows = await listSquareInvoices(tenantId, undefined, {
        orderBy: "invoice_date",
        ascending: false,
        limit: 500,
    });
    return rows.filter((r) => r.family_id === familyId);
}
export async function getFamilyMessages(familyId) {
    var _a;
    const tenantId = await resolvePortalTenantId();
    const family = (await getFamilyById(familyId, tenantId));
    const profileId = (_a = family === null || family === void 0 ? void 0 : family.profile_id) !== null && _a !== void 0 ? _a : undefined;
    if (!profileId)
        return [];
    return listAIConversations(tenantId, { profile_id: profileId }, { orderBy: "updated_at", ascending: false, limit: 50 });
}
export async function resolveCurrentStudentId() {
    var _a;
    const session = await getSession();
    if (!session)
        return null;
    const tenantId = session.tenantId || (await resolvePortalTenantId());
    const matches = await listStudents(tenantId, undefined, { limit: 500 });
    const mine = matches.find((s) => s.profile_id === session.userId);
    return (_a = mine === null || mine === void 0 ? void 0 : mine.id) !== null && _a !== void 0 ? _a : null;
}
export async function resolveCurrentFamilyId() {
    const session = await getSession();
    if (!session)
        return null;
    const tenantId = session.tenantId || (await resolvePortalTenantId());
    const { listFamilies } = await import("@data/families");
    const matches = await listFamilies(tenantId, { profile_id: session.userId }, { limit: 5 });
    const first = matches[0];
    return first ? first.id : null;
}
