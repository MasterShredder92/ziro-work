import { getServiceClient } from "@/lib/supabase";
function daysBetween(a, b) {
    const ms = a.getTime() - b.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
}
function isOverdueInvoice(inv, now) {
    var _a, _b, _c;
    const status = (_a = inv.status) !== null && _a !== void 0 ? _a : null;
    if (status === "overdue")
        return true;
    const dueAtRaw = (_b = inv.due_at) !== null && _b !== void 0 ? _b : null;
    const paidAtRaw = (_c = inv.paid_at) !== null && _c !== void 0 ? _c : null;
    if (!dueAtRaw)
        return false;
    if (paidAtRaw)
        return false;
    const dueAt = new Date(dueAtRaw);
    return Number.isFinite(dueAt.getTime()) && dueAt.getTime() < now.getTime();
}
function looksNegativeEventType(eventType) {
    const t = eventType.toLowerCase();
    return (t.includes("complaint") ||
        t.includes("refund") ||
        t.includes("cancel") ||
        t.includes("churn") ||
        t.includes("chargeback") ||
        t.startsWith("negative_"));
}
function hasTruthyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function parsePositiveNumber(value) {
    if (typeof value === "number" && Number.isFinite(value))
        return value;
    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            return parsed;
    }
    return 0;
}
function computeRiskScoreFromSignals(signals) {
    let score = 0;
    score += Math.min(40, signals.missedLessons30d * 10);
    score += Math.min(30, signals.overdueInvoices * 15);
    score += Math.min(20, signals.negativeEvents30d * 10);
    if (signals.inactivityDays != null)
        score += Math.min(30, Math.floor(signals.inactivityDays / 7) * 5);
    let band = "low";
    if (score >= 60)
        band = "high";
    else if (score >= 30)
        band = "medium";
    return { score, band };
}
/**
 * Build the unified lifecycle context for a given student id.
 * Uses service role client to keep this backend-only and deterministic.
 */
export async function buildLifecycleContext(studentId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const supabase = getServiceClient();
    const now = new Date();
    const { data: student, error: studentErr } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();
    if (studentErr)
        throw studentErr;
    if (!student) {
        throw new Error(`Student not found: ${studentId}`);
    }
    const tenantId = (_a = student.tenant_id) !== null && _a !== void 0 ? _a : "";
    if (!tenantId)
        throw new Error(`Student missing tenant_id: ${studentId}`);
    // Schema-compatible field resolution: these columns differ across migrations.
    const leadId = (_c = (_b = student.lead_id) !== null && _b !== void 0 ? _b : student.crm_lead_id) !== null && _c !== void 0 ? _c : null;
    const teacherId = (_e = (_d = student.teacher_id) !== null && _d !== void 0 ? _d : student.assigned_teacher_id) !== null && _e !== void 0 ? _e : null;
    const [{ data: lead }, { data: trialRows }, { data: invoiceRows }, { data: eventRows }, { data: attendanceRows }] = await Promise.all([
        leadId
            ? supabase.from("leads").select("*").eq("tenant_id", tenantId).eq("id", leadId).maybeSingle()
            : Promise.resolve({ data: null }),
        leadId
            ? supabase
                .from("trials")
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("lead_id", leadId)
                .order("scheduled_at", { ascending: false })
                .limit(1)
            : Promise.resolve({ data: [] }),
        supabase
            .from("invoices")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("student_id", studentId)
            .order("created_at", { ascending: false })
            .limit(200),
        supabase
            .from("events")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("entity_type", "student")
            .eq("entity_id", studentId)
            .order("created_at", { ascending: false })
            .limit(500),
        supabase
            .from("attendance")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("student_id", studentId)
            .order("lesson_date", { ascending: false })
            .limit(200),
    ]);
    const trial = Array.isArray(trialRows) && trialRows.length > 0
        ? trialRows[0]
        : null;
    const invoices = (invoiceRows !== null && invoiceRows !== void 0 ? invoiceRows : []);
    const events = (eventRows !== null && eventRows !== void 0 ? eventRows : []);
    const attendance = (attendanceRows !== null && attendanceRows !== void 0 ? attendanceRows : []);
    const teacherAssigned = Boolean(teacherId);
    const trialStatus = (_f = trial === null || trial === void 0 ? void 0 : trial.status) !== null && _f !== void 0 ? _f : null;
    const studentStatus = ((_g = student.status) !== null && _g !== void 0 ? _g : "").toLowerCase();
    const hasStartDate = hasTruthyString(student.start_date);
    const hasFirstLessonDate = hasTruthyString(student.first_lesson_date);
    const hasLessonDay = hasTruthyString(student.lesson_day_of_week);
    const blocksPerWeek = parsePositiveNumber(student.blocks_per_week);
    const totalLessonsTaken = parsePositiveNumber(student.total_lessons_taken);
    const scheduled = trialStatus === "scheduled" ||
        trialStatus === "confirmed" ||
        (typeof (trial === null || trial === void 0 ? void 0 : trial.scheduled_at) === "string" && new Date(trial.scheduled_at).getTime() > now.getTime()) ||
        (teacherAssigned && (hasLessonDay || blocksPerWeek > 0));
    const enrolled = Boolean(student.enrollment_date) ||
        hasStartDate ||
        hasFirstLessonDate ||
        studentStatus === "active" ||
        studentStatus === "enrolled";
    const serviceStarted = attendance.length > 0 || totalLessonsTaken > 0 || hasFirstLessonDate || hasStartDate;
    // Missed lessons in last 30 days
    const last30 = attendance.filter((r) => {
        var _a;
        const d = new Date((_a = r.lesson_date) !== null && _a !== void 0 ? _a : "");
        if (!Number.isFinite(d.getTime()))
            return false;
        const diff = now.getTime() - d.getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        return days >= 0 && days <= 30;
    });
    const missedLessons30d = last30.filter((r) => r.present === false).length;
    const overdueInvoices = invoices.filter((inv) => isOverdueInvoice(inv, now)).length;
    const negativeEvents30d = events.filter((e) => {
        var _a, _b;
        const createdAtRaw = (_a = e.created_at) !== null && _a !== void 0 ? _a : null;
        const t = (_b = e.event_type) !== null && _b !== void 0 ? _b : "";
        if (!createdAtRaw)
            return false;
        const createdAt = new Date(createdAtRaw);
        if (!Number.isFinite(createdAt.getTime()))
            return false;
        const days = daysBetween(now, createdAt);
        return days >= 0 && days <= 30 && looksNegativeEventType(t);
    }).length;
    // Inactivity: prefer explicit last_attendance_at; else derive from most recent attendance.
    const lastAttendanceRaw = (_m = (_l = (_h = student.last_attendance_at) !== null && _h !== void 0 ? _h : ((_k = (_j = attendance[0]) === null || _j === void 0 ? void 0 : _j.lesson_date) !== null && _k !== void 0 ? _k : null)) !== null && _l !== void 0 ? _l : (hasTruthyString(student.first_lesson_date) ? student.first_lesson_date : null)) !== null && _m !== void 0 ? _m : (hasTruthyString(student.start_date) ? student.start_date : null);
    const inactivityDays = lastAttendanceRaw
        ? (() => {
            const d = new Date(lastAttendanceRaw);
            return Number.isFinite(d.getTime()) ? daysBetween(now, d) : null;
        })()
        : null;
    const signals = { missedLessons30d, overdueInvoices, negativeEvents30d, inactivityDays };
    const { score: riskScore, band: riskBand } = computeRiskScoreFromSignals(signals);
    return {
        tenantId,
        studentId,
        student: student,
        lead: (_o = lead) !== null && _o !== void 0 ? _o : null,
        trial,
        invoices,
        events,
        attendance,
        teacherAssigned,
        scheduled,
        enrolled,
        serviceStarted,
        riskScore,
        riskBand,
        signals,
    };
}
