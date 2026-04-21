import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ensureFamilyAccess } from "../guard";
import { getFamilyStudents, resolveCurrentFamilyId, } from "@/lib/portal/queries";
import { getStudentAttendanceSummary, listAttendance } from "@/lib/attendance/queries";
import { logAudit } from "@/lib/audit/log";
import { AttendanceKpiCards, AttendanceRecordTable, AttendanceSummaryWidget, } from "../../attendance/components";
export const dynamic = "force-dynamic";
function displayName(student) {
    if (!student || typeof student !== "object")
        return "Student";
    const row = student;
    const first = typeof row.first_name === "string" ? row.first_name : "";
    const last = typeof row.last_name === "string" ? row.last_name : "";
    const full = `${first} ${last}`.trim();
    return full.length > 0 ? full : "Student";
}
export default async function FamilyAttendancePage() {
    const session = await ensureFamilyAccess();
    const familyId = await resolveCurrentFamilyId();
    if (!familyId) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "No family record linked to your account yet." }));
    }
    const students = await getFamilyStudents(familyId);
    const data = await Promise.all(students.map(async (s) => {
        var _a;
        const tenantId = (_a = s.tenant_id) !== null && _a !== void 0 ? _a : session.tenantId;
        const [summary, combined] = await Promise.all([
            getStudentAttendanceSummary(s.id, tenantId),
            listAttendance(s.id, null, tenantId),
        ]);
        return { student: s, summary, records: combined.records, sessions: combined.sessions };
    }));
    await logAudit("attendance.family.view", {
        tenantId: session.tenantId,
        profileId: session.userId,
        role: session.role,
        familyId,
        students: students.length,
        source: "family_portal",
    });
    if (students.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "No students linked to your family yet." }));
    }
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-5xl flex-col gap-8", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Student attendance" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Your students' attendance history, streaks, and punctuality." })] }), data.map((row) => (_jsxs("section", { className: "space-y-3", children: [_jsx("header", { className: "flex items-baseline justify-between", children: _jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: displayName(row.student) }) }), _jsx(AttendanceSummaryWidget, { summary: row.summary }), _jsx(AttendanceKpiCards, { kpis: row.summary.kpis }), _jsx(AttendanceRecordTable, { records: row.records, sessions: row.sessions })] }, row.summary.studentId)))] }));
}
