import type {
  AttendanceRecordRow,
  AttendanceStatus,
} from "@data/attendanceRecords";
import type {
  AttendanceSessionRow,
  AttendanceSessionStatus,
} from "@data/attendanceSessions";
import type {
  AttendanceReasonCategory,
  AttendanceReasonRow,
} from "@data/attendanceReasons";
import type { Student, Teacher } from "@/lib/types/entities";

export type AttendanceRecord = AttendanceRecordRow;
export type AttendanceSession = AttendanceSessionRow;
export type AttendanceReason = AttendanceReasonRow;

export type {
  AttendanceStatus,
  AttendanceSessionStatus,
  AttendanceReasonCategory,
};

export type AttendanceDateRange = {
  start: string;
  end: string;
};

export type AttendanceFlag =
  | "chronic_absence"
  | "chronic_tardy"
  | "recent_no_show"
  | "streak_absent"
  | "needs_follow_up"
  | "watch";

export type AttendanceRiskLevel = "none" | "low" | "moderate" | "high" | "critical";

export type AttendanceKpis = {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  tardyCount: number;
  excusedCount: number;
  makeupCount: number;
  noShowCount: number;
  attendanceRate: number;
  punctualityRate: number;
};

export type AttendanceSummary = {
  studentId: string;
  tenantId: string;
  generatedAt: string;
  windowStart: string | null;
  windowEnd: string | null;
  kpis: AttendanceKpis;
  currentPresentStreak: number;
  currentAbsentStreak: number;
  longestPresentStreak: number;
  longestAbsentStreak: number;
  riskScore: number;
  riskLevel: AttendanceRiskLevel;
  flags: AttendanceFlag[];
  recentRecords: AttendanceRecord[];
};

export type AttendanceSessionWithRoster = AttendanceSession & {
  records: AttendanceRecord[];
  students: Student[];
  teacher: Teacher | null;
};

export type AttendanceDailySummary = {
  studentId: string;
  tenantId: string;
  date: string;
  records: AttendanceRecord[];
  kpis: AttendanceKpis;
  status: AttendanceStatus | "none";
};

export type AttendanceStudentRow = {
  student: Student;
  summary: AttendanceSummary;
};

export type AttendanceDashboardData = {
  tenantId: string;
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  totals: AttendanceKpis;
  students: AttendanceStudentRow[];
  upcomingSessions: AttendanceSession[];
  atRisk: AttendanceStudentRow[];
};
