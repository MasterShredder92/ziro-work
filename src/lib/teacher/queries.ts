import { listStudents } from "@data/students";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listSessionLog } from "@data/sessionLog";
import { listAIConversations } from "@data/aiConversations";
import { getTeacherById, type Teacher } from "@data/teachers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
import type {
  Student,
  ScheduleBlock,
  SessionLog,
  AIConversation,
} from "@/lib/types/entities";

const SCHEDULE_WINDOW_PAST_DAYS = 2;
const SCHEDULE_WINDOW_FUTURE_DAYS = 14;
const LESSON_HISTORY_DAYS = 60;

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function resolveTenantForTeacher(
  teacherId: string,
  tenantId?: string,
): Promise<string> {
  if (tenantId && tenantId.trim().length > 0) return tenantId;
  const { data } = await getTeacherById(teacherId);
  const t = (data?.tenant_id as string | undefined) ?? DEFAULT_TENANT_ID;
  return t;
}

export async function getTeacherProfile(
  teacherId: string,
): Promise<Teacher | null> {
  const { data, error } = await getTeacherById(teacherId);
  if (error) throw new Error(error);
  return data ?? null;
}

export async function getTeacherByProfileId(
  profileId: string,
): Promise<Teacher | null> {
  assertServiceRoleAllowed("src/lib/teacher/queries.ts — service-role module; internal/background operations only");
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Teacher | null;
}

export async function getTeacherSchedule(
  teacherId: string,
  tenantId?: string,
): Promise<ScheduleBlock[]> {
  const tid = await resolveTenantForTeacher(teacherId, tenantId);
  return listScheduleBlocks(
    tid,
    {
      teacher_id: teacherId,
      date_from: isoDate(-SCHEDULE_WINDOW_PAST_DAYS),
      date_to: isoDate(SCHEDULE_WINDOW_FUTURE_DAYS),
    },
    {
      orderBy: "block_date",
      ascending: true,
      limit: 500,
    },
  );
}

export async function getTeacherStudents(
  teacherId: string,
  tenantId?: string,
): Promise<Student[]> {
  const tid = await resolveTenantForTeacher(teacherId, tenantId);
  return listStudents(
    tid,
    { teacher_id: teacherId },
    {
      orderBy: "created_at",
      ascending: false,
      limit: 500,
    },
  );
}

export async function getTeacherLessons(
  teacherId: string,
  tenantId?: string,
): Promise<SessionLog[]> {
  const tid = await resolveTenantForTeacher(teacherId, tenantId);
  return listSessionLog(
    tid,
    {
      teacher_id: teacherId,
      date_from: isoDate(-LESSON_HISTORY_DAYS),
      date_to: isoDate(0),
    },
    {
      orderBy: "block_date",
      ascending: false,
      limit: 200,
    },
  );
}

export async function getTeacherMessages(
  teacherId: string,
  tenantId?: string,
): Promise<AIConversation[]> {
  const tid = await resolveTenantForTeacher(teacherId, tenantId);
  const profileId = await resolveProfileIdForTeacher(teacherId);
  if (!profileId) return [];
  return listAIConversations(
    tid,
    { profile_id: profileId },
    {
      orderBy: "updated_at",
      ascending: false,
      limit: 25,
    },
  );
}

async function resolveProfileIdForTeacher(
  teacherId: string,
): Promise<string | null> {
  const { data } = await getTeacherById(teacherId);
  const pid = (data?.profile_id as string | null | undefined) ?? null;
  return pid;
}
