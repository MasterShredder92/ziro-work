import "server-only";
import { getStudentById, listStudents } from "@data/students";
import { getFamilyById } from "@data/families";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listSessionLog } from "@data/sessionLog";
import { listAIConversations } from "@data/aiConversations";
import { listSquareInvoices } from "@data/squareInvoices";
import { getTenantContext } from "@data/getTenantContext";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import type {
  AIConversation,
  Family,
  ScheduleBlock,
  SessionLog,
  SquareInvoice,
  Student,
} from "@/lib/types/entities";

export async function resolvePortalTenantId(): Promise<string> {
  const ctx = await getTenantContext();
  if (ctx.tenantId) return ctx.tenantId;
  const session = await getSession();
  if (session?.tenantId) return session.tenantId;
  return DEFAULT_TENANT_ID;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function scheduleWindow(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 14);
  const to = new Date(now);
  to.setDate(to.getDate() + 60);
  return { from: isoDate(from), to: isoDate(to) };
}

export async function getStudentProfile(
  studentId: string,
): Promise<Student | null> {
  const tenantId = await resolvePortalTenantId();
  return getStudentById(studentId, tenantId);
}

export async function getStudentSchedule(
  studentId: string,
): Promise<ScheduleBlock[]> {
  const tenantId = await resolvePortalTenantId();
  const { from, to } = scheduleWindow();
  return listScheduleBlocks(
    tenantId,
    { student_id: studentId, date_from: from, date_to: to },
    { orderBy: "block_date", ascending: true, limit: 500 },
  );
}

export async function getStudentLessons(
  studentId: string,
): Promise<SessionLog[]> {
  const tenantId = await resolvePortalTenantId();
  return listSessionLog(
    tenantId,
    { student_id: studentId },
    { orderBy: "block_date", ascending: false, limit: 100 },
  );
}

export async function getStudentMessages(
  studentId: string,
): Promise<AIConversation[]> {
  const tenantId = await resolvePortalTenantId();
  const student = await getStudentById(studentId, tenantId);
  const profileId =
    (student?.profile_id as string | null | undefined) ?? undefined;
  if (!profileId) return [];
  return listAIConversations(
    tenantId,
    { profile_id: profileId },
    { orderBy: "updated_at", ascending: false, limit: 50 },
  );
}

export async function getStudentInvoices(
  studentId: string,
): Promise<SquareInvoice[]> {
  const tenantId = await resolvePortalTenantId();
  const student = await getStudentById(studentId, tenantId);
  const familyId =
    (student?.family_id as string | null | undefined) ?? undefined;
  if (!familyId) return [];
  return listSquareInvoices(
    tenantId,
    { customer_id: undefined },
    { orderBy: "invoice_date", ascending: false, limit: 100 },
  ).then((rows) =>
    rows.filter(
      (r) => (r.family_id as string | null | undefined) === familyId,
    ),
  );
}

export async function getFamilyProfile(
  familyId: string,
): Promise<Family | null> {
  const tenantId = await resolvePortalTenantId();
  return getFamilyById(familyId, tenantId) as Promise<Family | null>;
}

export async function getFamilyStudents(familyId: string): Promise<Student[]> {
  const tenantId = await resolvePortalTenantId();
  return listStudents(
    tenantId,
    { family_id: familyId },
    { orderBy: "first_name", ascending: true, limit: 100 },
  );
}

export async function getFamilySchedule(
  familyId: string,
): Promise<ScheduleBlock[]> {
  const tenantId = await resolvePortalTenantId();
  const students = await listStudents(
    tenantId,
    { family_id: familyId },
    { limit: 100 },
  );
  const ids = students.map((s) => s.id);
  if (ids.length === 0) return [];
  const { from, to } = scheduleWindow();
  const all = await Promise.all(
    ids.map((id) =>
      listScheduleBlocks(
        tenantId,
        { student_id: id, date_from: from, date_to: to },
        { orderBy: "block_date", ascending: true, limit: 500 },
      ),
    ),
  );
  const flat = all.flat();
  flat.sort((a, b) => {
    const da = a.block_date ?? "";
    const db = b.block_date ?? "";
    if (da !== db) return da.localeCompare(db);
    const ta = a.start_time ?? "";
    const tb = b.start_time ?? "";
    return ta.localeCompare(tb);
  });
  return flat;
}

export async function getFamilyInvoices(
  familyId: string,
): Promise<SquareInvoice[]> {
  const tenantId = await resolvePortalTenantId();
  const rows = await listSquareInvoices(tenantId, undefined, {
    orderBy: "invoice_date",
    ascending: false,
    limit: 500,
  });
  return rows.filter(
    (r) => (r.family_id as string | null | undefined) === familyId,
  );
}

export async function getFamilyMessages(
  familyId: string,
): Promise<AIConversation[]> {
  const tenantId = await resolvePortalTenantId();
  const family = (await getFamilyById(familyId, tenantId)) as
    | (Family & { profile_id?: string | null })
    | null;
  const profileId =
    (family?.profile_id as string | null | undefined) ?? undefined;
  if (!profileId) return [];
  return listAIConversations(
    tenantId,
    { profile_id: profileId },
    { orderBy: "updated_at", ascending: false, limit: 50 },
  );
}

export async function resolveCurrentStudentId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  const tenantId = session.tenantId || (await resolvePortalTenantId());
  const matches = await listStudents(
    tenantId,
    undefined,
    { limit: 500 },
  );
  const mine = matches.find(
    (s) =>
      (s.profile_id as string | null | undefined) === session.userId,
  );
  return mine?.id ?? null;
}

export async function resolveCurrentFamilyId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  const tenantId = session.tenantId || (await resolvePortalTenantId());
  const { listFamilies } = await import("@data/families");
  const matches = await listFamilies(
    tenantId,
    { profile_id: session.userId },
    { limit: 5 },
  );
  const first = matches[0];
  return first ? (first.id as string) : null;
}
