import "server-only";
import { listAttendanceRecords, } from "@data/attendanceRecords";
import { listAttendanceSessions, getAttendanceSessionById, } from "@data/attendanceSessions";
const EMPTY_KPIS = {
    totalRecords: 0,
    presentCount: 0,
    absentCount: 0,
    tardyCount: 0,
    excusedCount: 0,
    makeupCount: 0,
    noShowCount: 0,
    attendanceRate: 0,
    punctualityRate: 0,
};
function clampPct(v) {
    if (!Number.isFinite(v))
        return 0;
    if (v < 0)
        return 0;
    if (v > 100)
        return 100;
    return Math.round(v);
}
/**
 * Compute KPIs across a batch of attendance records. Counts `present`, `tardy`, `makeup`,
 * and `excused` as "counted attended" for the attendance rate; punctuality only counts
 * true `present` against all attended records.
 */
export function computeKpis(records) {
    if (records.length === 0)
        return Object.assign({}, EMPTY_KPIS);
    let present = 0;
    let absent = 0;
    let tardy = 0;
    let excused = 0;
    let makeup = 0;
    let noShow = 0;
    for (const r of records) {
        switch (r.status) {
            case "present":
                present += 1;
                break;
            case "absent":
                absent += 1;
                break;
            case "tardy":
                tardy += 1;
                break;
            case "excused":
                excused += 1;
                break;
            case "makeup":
                makeup += 1;
                break;
            case "no_show":
                noShow += 1;
                break;
        }
    }
    const total = records.length;
    const attended = present + tardy + makeup + excused;
    const attendanceRate = clampPct((attended / total) * 100);
    const punctualityBase = present + tardy;
    const punctualityRate = punctualityBase === 0 ? 0 : clampPct((present / punctualityBase) * 100);
    return {
        totalRecords: total,
        presentCount: present,
        absentCount: absent,
        tardyCount: tardy,
        excusedCount: excused,
        makeupCount: makeup,
        noShowCount: noShow,
        attendanceRate,
        punctualityRate,
    };
}
function recordsDescByDate(records, sessionsById) {
    return [...records].sort((a, b) => {
        var _a, _b, _c, _d;
        const da = (_b = (_a = sessionsById.get(a.session_id)) === null || _a === void 0 ? void 0 : _a.session_date) !== null && _b !== void 0 ? _b : "";
        const db = (_d = (_c = sessionsById.get(b.session_id)) === null || _c === void 0 ? void 0 : _c.session_date) !== null && _d !== void 0 ? _d : "";
        if (da !== db)
            return db.localeCompare(da);
        return b.created_at.localeCompare(a.created_at);
    });
}
function streaksFor(records, sessionsById) {
    const ordered = recordsDescByDate(records, sessionsById);
    let currentPresent = 0;
    let currentAbsent = 0;
    let longestPresent = 0;
    let longestAbsent = 0;
    let presentRun = 0;
    let absentRun = 0;
    let seenFirstPresent = false;
    let seenFirstAbsent = false;
    let stillCountingPresentFromLatest = true;
    let stillCountingAbsentFromLatest = true;
    for (let i = 0; i < ordered.length; i++) {
        const r = ordered[i];
        const isPresentLike = r.status === "present" || r.status === "tardy";
        const isAbsentLike = r.status === "absent" || r.status === "no_show";
        if (isPresentLike) {
            presentRun += 1;
            longestPresent = Math.max(longestPresent, presentRun);
            if (stillCountingPresentFromLatest) {
                currentPresent = presentRun;
                seenFirstPresent = true;
            }
            absentRun = 0;
            if (seenFirstAbsent)
                stillCountingAbsentFromLatest = false;
        }
        else if (isAbsentLike) {
            absentRun += 1;
            longestAbsent = Math.max(longestAbsent, absentRun);
            if (stillCountingAbsentFromLatest) {
                currentAbsent = absentRun;
                seenFirstAbsent = true;
            }
            presentRun = 0;
            if (seenFirstPresent)
                stillCountingPresentFromLatest = false;
        }
        else {
            stillCountingPresentFromLatest =
                stillCountingPresentFromLatest && !seenFirstAbsent;
            stillCountingAbsentFromLatest =
                stillCountingAbsentFromLatest && !seenFirstPresent;
            presentRun = 0;
            absentRun = 0;
        }
    }
    return {
        currentPresent,
        currentAbsent,
        longestPresent,
        longestAbsent,
    };
}
/**
 * Compute a risk score in [0, 100] based on KPIs + streaks + recency.
 * Higher score = higher dropout/attention risk.
 */
function computeRisk(input) {
    const flags = [];
    const { kpis, currentAbsentStreak, recentNoShow, recentRecordsCount } = input;
    if (recentRecordsCount === 0) {
        return { score: 0, level: "none", flags };
    }
    let score = 0;
    const absenceRate = 100 - kpis.attendanceRate;
    if (absenceRate >= 30) {
        score += 35;
        flags.push("chronic_absence");
    }
    else if (absenceRate >= 15) {
        score += 20;
        flags.push("watch");
    }
    else if (absenceRate >= 8) {
        score += 10;
    }
    const tardinessShare = kpis.totalRecords === 0 ? 0 : (kpis.tardyCount / kpis.totalRecords) * 100;
    if (tardinessShare >= 25) {
        score += 15;
        flags.push("chronic_tardy");
    }
    else if (tardinessShare >= 10) {
        score += 8;
    }
    if (currentAbsentStreak >= 3) {
        score += 30;
        flags.push("streak_absent");
    }
    else if (currentAbsentStreak >= 2) {
        score += 15;
    }
    if (recentNoShow) {
        score += 15;
        flags.push("recent_no_show");
    }
    if (score >= 50)
        flags.push("needs_follow_up");
    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    const level = clamped >= 75
        ? "critical"
        : clamped >= 50
            ? "high"
            : clamped >= 25
                ? "moderate"
                : clamped > 0
                    ? "low"
                    : "none";
    return { score: clamped, level, flags };
}
/**
 * List attendance records for a student, optionally within a date range.
 * If a range is supplied, resolves sessions within that window first, then
 * filters records by the resulting session IDs.
 */
export async function listAttendance(studentId, dateRange, tenantId) {
    let sessionRows = [];
    if ((dateRange === null || dateRange === void 0 ? void 0 : dateRange.start) || (dateRange === null || dateRange === void 0 ? void 0 : dateRange.end)) {
        sessionRows = await listAttendanceSessions({
            date_from: dateRange === null || dateRange === void 0 ? void 0 : dateRange.start,
            date_to: dateRange === null || dateRange === void 0 ? void 0 : dateRange.end,
        }, tenantId, { limit: 2000 });
    }
    const allRecords = await listAttendanceRecords({ student_id: studentId }, tenantId, { limit: 2000 });
    if (sessionRows.length === 0 && !(dateRange === null || dateRange === void 0 ? void 0 : dateRange.start) && !(dateRange === null || dateRange === void 0 ? void 0 : dateRange.end)) {
        const sessionIds = Array.from(new Set(allRecords.map((r) => r.session_id)));
        const lookups = await Promise.all(sessionIds.map((id) => getAttendanceSessionById(id, tenantId)));
        sessionRows = lookups.filter((s) => !!s);
    }
    const sessionIds = new Set(sessionRows.map((s) => s.id));
    const records = sessionRows.length > 0
        ? allRecords.filter((r) => sessionIds.has(r.session_id))
        : allRecords;
    return {
        records: records,
        sessions: sessionRows,
    };
}
/**
 * Get the daily summary for a student on a given date (defaults to today).
 */
export async function getDailySummary(studentId, tenantId, date) {
    const targetDate = date !== null && date !== void 0 ? date : new Date().toISOString().slice(0, 10);
    const sessions = await listAttendanceSessions({ session_date: targetDate }, tenantId, { limit: 500 });
    const sessionIds = new Set(sessions.map((s) => s.id));
    const records = await listAttendanceRecords({ student_id: studentId }, tenantId, { limit: 500 });
    const dayRecords = records.filter((r) => sessionIds.has(r.session_id));
    const kpis = computeKpis(dayRecords);
    const status = dayRecords.length === 0 ? "none" : dayRecords[0].status;
    return {
        studentId,
        tenantId: tenantId !== null && tenantId !== void 0 ? tenantId : "",
        date: targetDate,
        records: dayRecords,
        kpis,
        status,
    };
}
/**
 * Retrieve a session by id, returning null if not found.
 */
export async function getSession(sessionId, tenantId) {
    const row = await getAttendanceSessionById(sessionId, tenantId);
    return row;
}
/**
 * Compute an attendance summary for a student, optionally scoped to a date window.
 * Includes attendance rate, streaks, flags, and a composite risk score.
 */
export async function getStudentAttendanceSummary(studentId, tenantId, dateRange) {
    var _a, _b;
    const { records, sessions } = await listAttendance(studentId, dateRange !== null && dateRange !== void 0 ? dateRange : null, tenantId);
    const sessionsById = new Map();
    for (const s of sessions)
        sessionsById.set(s.id, s);
    const kpis = computeKpis(records);
    const streaks = streaksFor(records, sessionsById);
    const ordered = recordsDescByDate(records, sessionsById);
    const recent = ordered.slice(0, 10);
    const recentNoShow = ordered
        .slice(0, 5)
        .some((r) => r.status === "no_show" || r.status === "absent");
    const risk = computeRisk({
        kpis,
        currentAbsentStreak: streaks.currentAbsent,
        recentNoShow,
        recentRecordsCount: records.length,
    });
    return {
        studentId,
        tenantId: tenantId !== null && tenantId !== void 0 ? tenantId : "",
        generatedAt: new Date().toISOString(),
        windowStart: (_a = dateRange === null || dateRange === void 0 ? void 0 : dateRange.start) !== null && _a !== void 0 ? _a : null,
        windowEnd: (_b = dateRange === null || dateRange === void 0 ? void 0 : dateRange.end) !== null && _b !== void 0 ? _b : null,
        kpis,
        currentPresentStreak: streaks.currentPresent,
        currentAbsentStreak: streaks.currentAbsent,
        longestPresentStreak: streaks.longestPresent,
        longestAbsentStreak: streaks.longestAbsent,
        riskScore: risk.score,
        riskLevel: risk.level,
        flags: risk.flags,
        recentRecords: recent,
    };
}
export { streaksFor as _streaksFor, computeRisk as _computeRisk };
