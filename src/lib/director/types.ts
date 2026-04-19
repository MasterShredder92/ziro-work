import type {
  Lead,
  Student,
  ScheduleBlock,
  SquareInvoice,
  SquarePayment,
} from "@/lib/types/entities";

export type DirectorLocation = {
  id: string;
  name: string;
  tenant_id: string;
};

export type DirectorKpis = {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newStudentsThisMonth: number;
  totalLeads: number;
  openLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalTeachers: number;
  weeklyLessonCount: number;
  weeklyLessonMinutes: number;
  outstandingInvoiceAmountCents: number;
  paidInvoiceAmountCents: number;
  monthToDateRevenueCents: number;
};

export type DirectorLeadRow = Lead & {
  age_days: number;
};

export type DirectorStudentRow = Student & {
  days_since_created: number;
};

export type DirectorTeacherRow = {
  id: string;
  tenant_id?: string;
  name: string;
  email: string | null;
  status: string | null;
  activeStudents: number;
  weeklyLessons: number;
  weeklyMinutes: number;
  utilizationPct: number;
  [key: string]: unknown;
};

export type DirectorScheduleCell = {
  dayOfWeek: number;
  hour: number;
  count: number;
};

export type DirectorScheduleData = {
  startDate: string;
  endDate: string;
  blocks: ScheduleBlock[];
  heatmap: DirectorScheduleCell[];
  peakHour: number | null;
  peakDayOfWeek: number | null;
};

export type DirectorBillingData = {
  invoices: SquareInvoice[];
  payments: SquarePayment[];
  totalOutstandingCents: number;
  totalPaidCents: number;
  overdueCount: number;
  overdueAmountCents: number;
  monthToDateRevenueCents: number;
  averageInvoiceCents: number;
};

export type DirectorDashboardData = {
  location: DirectorLocation;
  kpis: DirectorKpis;
  leads: DirectorLeadRow[];
  students: DirectorStudentRow[];
  teachers: DirectorTeacherRow[];
  schedule: DirectorScheduleData;
  billing: DirectorBillingData;
  generatedAt: string;
};
