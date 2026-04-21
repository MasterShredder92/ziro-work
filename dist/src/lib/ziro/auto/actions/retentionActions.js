import { listStudents } from "@data/students";
import { listSessionLog } from "@data/sessionLog";
const ATTENDANCE_WINDOW_DAYS = 30;
const ATTENDANCE_THRESHOLD = 0.7;
const CHURN_WINDOW_DAYS = 21;
function toDateKey(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
function studentName(student) {
    const first = typeof student.first_name === "string" ? student.first_name : "";
    const last = typeof student.last_name === "string" ? student.last_name : "";
    const name = `${first} ${last}`.trim();
    return name.length > 0 ? name : student.id;
}
async function activeStudents(tenantId) {
    const rows = await listStudents(tenantId, { status: "active" }, { limit: 1000, ascending: true });
    return rows;
}
async function sessionsInWindow(tenantId, now, days) {
    const start = toDateKey(addDays(now, -days));
    const end = toDateKey(now);
    const sessions = await listSessionLog(tenantId, { date_from: start, date_to: end }, { limit: 2000, ascending: false });
    return sessions;
}
function isCompletedStatus(status) {
    if (!status)
        return false;
    const lower = status.toLowerCase();
    return lower === "completed" || lower === "attended" || lower === "present";
}
function isMissedStatus(status) {
    if (!status)
        return false;
    const lower = status.toLowerCase();
    return (lower === "canceled" ||
        lower === "cancelled" ||
        lower === "no_show" ||
        lower === "noshow" ||
        lower === "absent");
}
export const detectAtRiskStudents = {
    key: "detectAtRiskStudents",
    description: "Flag active students with attendance below threshold.",
    async handler(ctx) {
        var _a;
        const [students, sessions] = await Promise.all([
            activeStudents(ctx.tenantId),
            sessionsInWindow(ctx.tenantId, ctx.now, ATTENDANCE_WINDOW_DAYS),
        ]);
        const stats = new Map();
        for (const session of sessions) {
            if (!session.student_id)
                continue;
            const entry = (_a = stats.get(session.student_id)) !== null && _a !== void 0 ? _a : {
                total: 0,
                completed: 0,
                missed: 0,
            };
            entry.total += 1;
            if (isCompletedStatus(session.status))
                entry.completed += 1;
            else if (isMissedStatus(session.status))
                entry.missed += 1;
            stats.set(session.student_id, entry);
        }
        const atRisk = students
            .map((student) => {
            var _a, _b;
            const entry = stats.get(student.id);
            if (!entry || entry.total === 0)
                return null;
            const rate = entry.completed / entry.total;
            if (rate >= ATTENDANCE_THRESHOLD)
                return null;
            return {
                studentId: student.id,
                studentName: studentName(student),
                familyId: (_a = student.family_id) !== null && _a !== void 0 ? _a : null,
                teacherId: (_b = student.teacher_id) !== null && _b !== void 0 ? _b : null,
                attendanceRate: Number(rate.toFixed(3)),
                completed: entry.completed,
                missed: entry.missed,
                total: entry.total,
            };
        })
            .filter((entry) => entry !== null)
            .sort((a, b) => a.attendanceRate - b.attendanceRate);
        return {
            triggered: atRisk.length > 0,
            details: {
                windowDays: ATTENDANCE_WINDOW_DAYS,
                threshold: ATTENDANCE_THRESHOLD,
                count: atRisk.length,
                students: atRisk,
            },
        };
    },
};
export const detectChurnSignals = {
    key: "detectChurnSignals",
    description: "Flag active students with no lessons in the recent window.",
    async handler(ctx) {
        const [students, sessions] = await Promise.all([
            activeStudents(ctx.tenantId),
            sessionsInWindow(ctx.tenantId, ctx.now, CHURN_WINDOW_DAYS),
        ]);
        const touched = new Set();
        const lastSessionDate = new Map();
        for (const session of sessions) {
            if (!session.student_id)
                continue;
            touched.add(session.student_id);
            const existing = lastSessionDate.get(session.student_id);
            if (!existing || session.block_date > existing) {
                lastSessionDate.set(session.student_id, session.block_date);
            }
        }
        const churning = students
            .filter((student) => !touched.has(student.id))
            .map((student) => {
            var _a, _b, _c;
            return ({
                studentId: student.id,
                studentName: studentName(student),
                familyId: (_a = student.family_id) !== null && _a !== void 0 ? _a : null,
                teacherId: (_b = student.teacher_id) !== null && _b !== void 0 ? _b : null,
                lastSessionDate: (_c = lastSessionDate.get(student.id)) !== null && _c !== void 0 ? _c : null,
            });
        });
        return {
            triggered: churning.length > 0,
            details: {
                windowDays: CHURN_WINDOW_DAYS,
                count: churning.length,
                students: churning,
            },
        };
    },
};
export const autoNotifyFamily = {
    key: "autoNotifyFamily",
    description: "Build family notification payloads for at-risk students.",
    async handler(ctx) {
        var _a, _b, _c, _d;
        const risk = await detectAtRiskStudents.handler(ctx);
        const riskDetails = (_a = risk.details) !== null && _a !== void 0 ? _a : {};
        const riskStudents = Array.isArray(riskDetails.students)
            ? riskDetails.students
            : [];
        const churn = await detectChurnSignals.handler(ctx);
        const churnDetails = (_b = churn.details) !== null && _b !== void 0 ? _b : {};
        const churnStudents = Array.isArray(churnDetails.students)
            ? churnDetails.students
            : [];
        const byFamily = new Map();
        const pushEntry = (familyId, entry) => {
            var _a;
            if (!familyId)
                return;
            const list = (_a = byFamily.get(familyId)) !== null && _a !== void 0 ? _a : [];
            list.push(entry);
            byFamily.set(familyId, list);
        };
        for (const entry of riskStudents) {
            pushEntry((_c = entry.familyId) !== null && _c !== void 0 ? _c : null, Object.assign(Object.assign({}, entry), { reason: "at_risk" }));
        }
        for (const entry of churnStudents) {
            pushEntry((_d = entry.familyId) !== null && _d !== void 0 ? _d : null, Object.assign(Object.assign({}, entry), { reason: "churn_signal" }));
        }
        const notifications = Array.from(byFamily.entries()).map(([familyId, students]) => ({ familyId, students }));
        return {
            triggered: notifications.length > 0,
            details: {
                mode: "metadata",
                count: notifications.length,
                notifications,
            },
        };
    },
};
export const retentionAutoActions = {
    key: "retention",
    description: "Student retention automations.",
    actions: [detectAtRiskStudents, detectChurnSignals, autoNotifyFamily],
};
