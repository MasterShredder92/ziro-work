import type {
  AIConversation,
  Family,
  ScheduleBlock,
  SessionLog,
  SquareInvoice,
  Student,
} from "@/lib/types/entities";

export interface StudentPortalData {
  student: Student;
  schedule: ScheduleBlock[];
  lessons: SessionLog[];
  messages: AIConversation[];
  invoices: SquareInvoice[];
}

export interface FamilyPortalData {
  family: Family;
  students: Student[];
  schedule: ScheduleBlock[];
  invoices: SquareInvoice[];
  messages: AIConversation[];
}
