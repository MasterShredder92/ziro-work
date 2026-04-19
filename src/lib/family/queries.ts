import "server-only";
import { listStudents } from "@data/students";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import {
  listSquareInvoices,
  listSquarePayments,
} from "@data/squareInvoices";
import { listAIConversations } from "@data/aiConversations";
import { getFamilyById, listFamilies } from "@data/families";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import type {
  AIConversation,
  Family,
  SquarePayment,
} from "@/lib/types/entities";
import {
  studentDisplayName,
  studentInitials,
  type FamilyBillingItem,
  type FamilyMessageItem,
  type FamilyScheduleItem,
  type FamilyStudentRow,
} from "./types";

const SCHEDULE_WINDOW_PAST_DAYS = 2;
const SCHEDULE_WINDOW_FUTURE_DAYS = 60;

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function resolveTenantForFamily(
  familyId: string,
  tenantId?: string,
): Promise<string> {
  if (tenantId && tenantId.trim().length > 0) return tenantId;
  const family = (await getFamilyById(familyId)) as
    | { tenant_id?: string | null }
    | null;
  const t = (family?.tenant_id as string | undefined) ?? DEFAULT_TENANT_ID;
  return t;
}

export async function getFamilyProfile(
  profileId: string,
): Promise<Family | null> {
  if (!profileId) return null;
  const tenantId = DEFAULT_TENANT_ID;
  const matches = await listFamilies(
    tenantId,
    { profile_id: profileId },
    { limit: 5 },
  );
  if (matches.length > 0) return (matches[0] ?? null) as Family | null;
  const fallback = await getFamilyById(profileId);
  return (fallback as unknown as Family | null) ?? null;
}

export async function getFamilyRecord(
  familyId: string,
  tenantId?: string,
): Promise<Family | null> {
  const family = await getFamilyById(familyId, tenantId);
  return (family as unknown as Family | null) ?? null;
}

export async function getFamilyStudents(
  familyId: string,
  tenantId?: string,
): Promise<FamilyStudentRow[]> {
  const tid = await resolveTenantForFamily(familyId, tenantId);
  const rows = await listStudents(
    tid,
    { family_id: familyId },
    { orderBy: "first_name", ascending: true, limit: 100 },
  );
  return rows.map((s) => {
    const raw = s as unknown as Record<string, unknown>;
    return {
      id: s.id,
      tenant_id: (raw["tenant_id"] as string | undefined) ?? tid,
      family_id: (raw["family_id"] as string | null | undefined) ?? null,
      first_name: (raw["first_name"] as string | null | undefined) ?? null,
      last_name: (raw["last_name"] as string | null | undefined) ?? null,
      display_name: studentDisplayName(s),
      initials: studentInitials(s),
      instrument: (raw["instrument"] as string | null | undefined) ?? null,
      status: (raw["status"] as string | null | undefined) ?? null,
      enrollment_type:
        (raw["enrollment_type"] as string | null | undefined) ?? null,
      teacher_name:
        (raw["first_teacher_name"] as string | null | undefined) ??
        (raw["last_teacher_name"] as string | null | undefined) ??
        null,
      raw: s,
    } satisfies FamilyStudentRow;
  });
}

export async function getFamilySchedule(
  familyId: string,
  tenantId?: string,
): Promise<FamilyScheduleItem[]> {
  const tid = await resolveTenantForFamily(familyId, tenantId);
  const students = await listStudents(
    tid,
    { family_id: familyId },
    { limit: 100 },
  );
  const ids = students.map((s) => s.id);
  if (ids.length === 0) return [];

  const nameById = new Map<string, string>();
  for (const s of students) nameById.set(s.id, studentDisplayName(s));

  const dateFrom = isoDate(-SCHEDULE_WINDOW_PAST_DAYS);
  const dateTo = isoDate(SCHEDULE_WINDOW_FUTURE_DAYS);

  const all = await Promise.all(
    ids.map((id) =>
      listScheduleBlocks(
        tid,
        { student_id: id, date_from: dateFrom, date_to: dateTo },
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

  return flat.map((b) => ({
    id: b.id,
    tenant_id: (b.tenant_id as string | undefined) ?? tid,
    student_id: (b.student_id as string | null | undefined) ?? null,
    student_name: b.student_id
      ? (nameById.get(b.student_id) ?? null)
      : null,
    block_date: b.block_date ?? null,
    start_time: b.start_time ?? null,
    end_time: b.end_time ?? null,
    block_type: (b.block_type as string | null | undefined) ?? null,
    status: (b.status as string | null | undefined) ?? null,
    room: (b as unknown as { room?: string | null }).room ?? null,
    is_virtual:
      (b as unknown as { is_virtual?: boolean | null }).is_virtual ?? null,
    raw: b,
  }));
}

export async function getFamilyBilling(
  familyId: string,
  tenantId?: string,
): Promise<{ invoices: FamilyBillingItem[]; payments: SquarePayment[] }> {
  const tid = await resolveTenantForFamily(familyId, tenantId);

  const [rawInvoices, payments] = await Promise.all([
    listSquareInvoices(tid, undefined, {
      orderBy: "invoice_date",
      ascending: false,
      limit: 500,
    }),
    listSquarePayments(tid, {
      orderBy: "reporting_date",
      ascending: false,
      limit: 100,
    }),
  ]);

  const invoices = rawInvoices
    .filter(
      (r) =>
        (r as unknown as { family_id?: string | null }).family_id === familyId,
    )
    .map<FamilyBillingItem>((inv) => {
      const total =
        typeof inv.amount_cents === "number" ? inv.amount_cents : 0;
      const paid =
        typeof inv.amount_paid === "number" ? inv.amount_paid : 0;
      return {
        id: inv.id,
        tenant_id: inv.tenant_id,
        invoice_number: inv.invoice_number ?? null,
        title: inv.title ?? null,
        status: inv.status ?? null,
        invoice_date: inv.invoice_date ?? null,
        due_date: inv.due_date ?? null,
        amount_cents: total,
        amount_paid_cents: paid,
        balance_cents: Math.max(0, total - paid),
        raw: inv,
      };
    });

  return { invoices, payments };
}

export async function getFamilyMessages(
  familyId: string,
  tenantId?: string,
): Promise<FamilyMessageItem[]> {
  const tid = await resolveTenantForFamily(familyId, tenantId);
  const family = (await getFamilyById(familyId, tid)) as
    | (Record<string, unknown> & { profile_id?: string | null })
    | null;
  const profileId =
    (family?.profile_id as string | null | undefined) ?? undefined;
  if (!profileId) return [];

  const rows = await listAIConversations(
    tid,
    { profile_id: profileId },
    { orderBy: "updated_at", ascending: false, limit: 50 },
  );

  return rows.map(toMessageItem);
}

function toMessageItem(c: AIConversation): FamilyMessageItem {
  const meta = (c["metadata"] as Record<string, unknown> | null | undefined) ??
    {};
  const title =
    (meta["title"] as string | undefined) ??
    (meta["subject"] as string | undefined) ??
    ((c as unknown as { client_route?: string | null }).client_route ??
      undefined) ??
    ((c as unknown as { source?: string | null }).source ?? undefined) ??
    "Conversation";
  const preview =
    ((meta["last_message"] as string | undefined) ??
      (meta["preview"] as string | undefined) ??
      "") ||
    null;
  return {
    id: c.id,
    tenant_id: c.tenant_id,
    title,
    preview,
    source: (c as unknown as { source?: string | null }).source ?? null,
    client_route:
      (c as unknown as { client_route?: string | null }).client_route ?? null,
    updated_at: c.updated_at ?? null,
    created_at: c.created_at ?? null,
    raw: c,
  };
}

export async function resolveCurrentFamilyId(
  profileId: string,
  tenantId?: string,
): Promise<string | null> {
  if (!profileId) return null;
  const tid = tenantId ?? DEFAULT_TENANT_ID;
  const matches = await listFamilies(
    tid,
    { profile_id: profileId },
    { limit: 5 },
  );
  const first = matches[0];
  return first ? (first.id as string) : null;
}
