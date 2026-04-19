import type {
  Student,
  ScheduleBlock,
  SessionLog,
  AIConversation,
} from "@/lib/types/entities";
import type { Teacher } from "@data/teachers";

export interface TeacherDashboardData {
  teacher: Teacher | null;
  schedule: ScheduleBlock[];
  students: Student[];
  lessons: SessionLog[];
  messages: AIConversation[];
}

export interface TeacherDisplayProfile {
  id: string;
  fullName: string;
  email: string | null;
  photoUrl: string | null;
  initials: string;
}

export function toTeacherDisplayProfile(
  teacher: Teacher | null,
): TeacherDisplayProfile | null {
  if (!teacher) return null;
  const first = (teacher["first_name"] as string | undefined) ?? "";
  const last = (teacher["last_name"] as string | undefined) ?? "";
  const display = (teacher["display_name"] as string | undefined) ?? "";
  const email = (teacher["email"] as string | undefined) ?? null;
  const photoUrl = (teacher["photo_url"] as string | undefined) ?? null;
  const fullName =
    display.trim() ||
    `${first} ${last}`.trim() ||
    email ||
    teacher.id;
  const initials =
    (first ? first[0] : "") + (last ? last[0] : "") ||
    (display ? display[0] : "") ||
    "T";
  return {
    id: teacher.id,
    fullName,
    email,
    photoUrl,
    initials: initials.toUpperCase().slice(0, 2),
  };
}
