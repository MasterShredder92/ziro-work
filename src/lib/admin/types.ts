import type {
  Lead,
  Student,
  ScheduleBlock,
  SquareInvoice,
} from "@/lib/types/entities";
import type { Teacher } from "@data/teachers";

export type AdminRole = "owner" | "director" | "admin" | "manager" | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  tenant_id: string;
  location_ids: string[];
  avatar_url?: string | null;
}

export interface Location {
  id: string;
  tenant_id: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  timezone?: string | null;
  active?: boolean;
}

export interface AdminKpis {
  tenantId: string;
  activeStudents: number;
  totalStudents: number;
  activeLeads: number;
  convertedLeadsThisMonth: number;
  totalTeachers: number;
  scheduledLessonsThisWeek: number;
  outstandingInvoiceAmountCents: number;
  paidInvoiceAmountThisMonthCents: number;
  overdueInvoiceCount: number;
  generatedAt: string;
}

export interface InvoiceAgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  count: number;
  totalAmountCents: number;
}

export interface ScheduleHeatmapCell {
  day: number;
  hour: number;
  count: number;
}

export interface TeacherLoadEntry {
  teacherId: string;
  teacherName: string;
  studentCount: number;
  lessonCount: number;
  hoursScheduled: number;
}

export interface AdminDashboardData {
  kpis: AdminKpis;
  leads: Lead[];
  students: Student[];
  teachers: Teacher[];
  invoices: SquareInvoice[];
  schedule: ScheduleBlock[];
  aging: InvoiceAgingBucket[];
  heatmap: ScheduleHeatmapCell[];
  teacherLoad: TeacherLoadEntry[];
}
