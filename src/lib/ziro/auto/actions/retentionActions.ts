import type { SessionLog, Student } from "@/lib/types/entities";
import { listStudents } from "@data/students";
import { listSessionLog } from "@data/sessionLog";
import type {
  AutoActionDefinition,
  AutoActionPack,
  AutoActionResult,
} from "../types";

const ATTENDANCE_WINDOW_DAYS = 30;
const ATTENDANCE_THRESHOLD = 0.7;
const CHURN_WINDOW_DAYS = 21;

function toDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function studentName(student: Student): string {
  const first = typeof student.first_name === "string" ? student.first_name : "";
  const last = typeof student.last_name === "string" ? student.last_name : "";
  const name = `${first} ${last}`.trim();
  return name.length > 0 ? name : student.id;
}

async function activeStudents(tenantId: string): Promise<Student[]> {
  const rows = await listStudents(
    tenantId,
    { status: "active" },
    { limit: 1000, ascending: true },
  );
  return rows as Student[];
}

async function sessionsInWindow(
  tenantId: string,
  now: Date,
  days: number,
): Promise<SessionLog[]> {
  const start = toDateKey(addDays(now, -days));
  const end = toDateKey(now);
  const sessions = await listSessionLog(
    tenantId,
    { date_from: start, date_to: end },
    { limit: 2000, ascending: false },
  );
  return sessions as SessionLog[];
}

function isCompletedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const lower = status.toLowerCase();
  return lower === "completed" || lower === "attended" || lower === "present";
}

function isMissedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const lower = status.toLowerCase();
  return (
    lower === "canceled" ||
    lower === "cancelled" ||
    lower === "no_show" ||
    lower === "noshow" ||
    lower === "absent"
  );
}

export const detectAtRiskStudents: AutoActionDefinition = {
  key: "detectAtRiskStudents",
  description: "Flag active students with attendance below threshold.",
  async handler(ctx): Promise<AutoActionResult> {
    const [students, sessions] = await Promise.all([
      activeStudents(ctx.tenantId),
      sessionsInWindow(ctx.tenantId, ctx.now, ATTENDANCE_WINDOW_DAYS),
    ]);

    const stats = new Map<
      string,
      { total: number; completed: number; missed: number }
    >();
    for (const session of sessions) {
      if (!session.student_id) continue;
      const entry = stats.get(session.student_id) ?? {
        total: 0,
        completed: 0,
        missed: 0,
      };
      entry.total += 1;
      if (isCompletedStatus(session.status)) entry.completed += 1;
      else if (isMissedStatus(session.status)) entry.missed += 1;
      stats.set(session.student_id, entry);
    }

    const atRisk = students
      .map((student) => {
        const entry = stats.get(student.id);
        if (!entry || entry.total === 0) return null;
        const rate = entry.completed / entry.total;
        if (rate >= ATTENDANCE_THRESHOLD) return null;
        return {
          studentId: student.id,
          studentName: studentName(student),
          familyId: student.family_id ?? null,
          teacherId: student.teacher_id ?? null,
          attendanceRate: Number(rate.toFixed(3)),
          completed: entry.completed,
          missed: entry.missed,
          total: entry.total,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
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

export const detectChurnSignals: AutoActionDefinition = {
  key: "detectChurnSignals",
  description: "Flag active students with no lessons in the recent window.",
  async handler(ctx): Promise<AutoActionResult> {
    const [students, sessions] = await Promise.all([
      activeStudents(ctx.tenantId),
      sessionsInWindow(ctx.tenantId, ctx.now, CHURN_WINDOW_DAYS),
    ]);

    const touched = new Set<string>();
    const lastSessionDate = new Map<string, string>();
    for (const session of sessions) {
      if (!session.student_id) continue;
      touched.add(session.student_id);
      const existing = lastSessionDate.get(session.student_id);
      if (!existing || session.block_date > existing) {
        lastSessionDate.set(session.student_id, session.block_date);
      }
    }

    const churning = students
      .filter((student) => !touched.has(student.id))
      .map((student) => ({
        studentId: student.id,
        studentName: studentName(student),
        familyId: student.family_id ?? null,
        teacherId: student.teacher_id ?? null,
        lastSessionDate: lastSessionDate.get(student.id) ?? null,
      }));

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

export const autoNotifyFamily: AutoActionDefinition = {
  key: "autoNotifyFamily",
  description: "Build family notification payloads for at-risk students.",
  async handler(ctx): Promise<AutoActionResult> {
    const risk = await detectAtRiskStudents.handler(ctx);
    const riskDetails = risk.details ?? {};
    const riskStudents = Array.isArray(riskDetails.students)
      ? (riskDetails.students as Array<Record<string, unknown>>)
      : [];

    const churn = await detectChurnSignals.handler(ctx);
    const churnDetails = churn.details ?? {};
    const churnStudents = Array.isArray(churnDetails.students)
      ? (churnDetails.students as Array<Record<string, unknown>>)
      : [];

    const byFamily = new Map<string, Array<Record<string, unknown>>>();
    const pushEntry = (
      familyId: string | null,
      entry: Record<string, unknown>,
    ) => {
      if (!familyId) return;
      const list = byFamily.get(familyId) ?? [];
      list.push(entry);
      byFamily.set(familyId, list);
    };

    for (const entry of riskStudents) {
      pushEntry((entry.familyId as string | null) ?? null, {
        ...entry,
        reason: "at_risk",
      });
    }
    for (const entry of churnStudents) {
      pushEntry((entry.familyId as string | null) ?? null, {
        ...entry,
        reason: "churn_signal",
      });
    }

    const notifications = Array.from(byFamily.entries()).map(
      ([familyId, students]) => ({ familyId, students }),
    );

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

export const retentionAutoActions: AutoActionPack = {
  key: "retention",
  description: "Student retention automations.",
  actions: [detectAtRiskStudents, detectChurnSignals, autoNotifyFamily],
};
