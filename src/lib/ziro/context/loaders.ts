import { getServiceClient } from "@/lib/supabase";

export type EntityContext = {
  id: string;
  name: string;
  status: string | null;
  metadata: Record<string, unknown>;
};

export type ContextLoaderName =
  | "lead"
  | "student"
  | "teacher"
  | "family"
  | "invoice";

function normalizeId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function firstString(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return null;
}

function joinedName(
  record: Record<string, unknown>,
  firstKeys: string[],
  lastKeys: string[],
): string | null {
  const first = firstString(record, firstKeys);
  const last = firstString(record, lastKeys);
  if (first && last) return `${first} ${last}`;
  return first ?? last;
}

function toMetadata(
  record: Record<string, unknown>,
  excluded: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (excluded.includes(key)) continue;
    out[key] = value;
  }
  return out;
}

export async function loadLeadContext(
  leadId: string | null | undefined,
): Promise<EntityContext | null> {
  const id = normalizeId(leadId);
  if (!id) return null;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const record = data as Record<string, unknown>;
  const name =
    firstString(record, ["name", "full_name", "display_name"]) ??
    joinedName(record, ["first_name"], ["last_name"]) ??
    firstString(record, ["email"]) ??
    id;
  const status =
    firstString(record, ["stage", "status", "pipeline_stage"]) ?? null;

  return {
    id,
    name,
    status,
    metadata: toMetadata(record, []),
  };
}

export async function loadStudentContext(
  studentId: string | null | undefined,
): Promise<EntityContext | null> {
  const id = normalizeId(studentId);
  if (!id) return null;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const record = data as Record<string, unknown>;
  const name =
    firstString(record, ["name", "full_name", "display_name"]) ??
    joinedName(record, ["first_name"], ["last_name"]) ??
    id;
  const status = firstString(record, ["status", "enrollment_status"]) ?? null;

  return {
    id,
    name,
    status,
    metadata: toMetadata(record, []),
  };
}

export async function loadTeacherContext(
  teacherId: string | null | undefined,
): Promise<EntityContext | null> {
  const id = normalizeId(teacherId);
  if (!id) return null;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const record = data as Record<string, unknown>;
  const name =
    firstString(record, ["name", "full_name", "display_name"]) ??
    joinedName(record, ["first_name"], ["last_name"]) ??
    id;
  const status =
    firstString(record, ["status", "employment_status", "availability_status"]) ??
    null;

  return {
    id,
    name,
    status,
    metadata: toMetadata(record, []),
  };
}

export async function loadFamilyContext(
  familyId: string | null | undefined,
): Promise<EntityContext | null> {
  const id = normalizeId(familyId);
  if (!id) return null;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("families")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const record = data as Record<string, unknown>;
  const name =
    firstString(record, ["name", "family_name", "display_name"]) ??
    firstString(record, ["primary_email", "primary_phone"]) ??
    id;
  const status =
    firstString(record, ["billing_status", "status", "account_status"]) ?? null;

  return {
    id,
    name,
    status,
    metadata: toMetadata(record, []),
  };
}

export async function loadInvoiceContext(
  invoiceId: string | null | undefined,
): Promise<EntityContext | null> {
  const id = normalizeId(invoiceId);
  if (!id) return null;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("square_invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const record = data as Record<string, unknown>;
  const name =
    firstString(record, ["title", "invoice_number", "public_url", "description"]) ??
    id;
  const status = firstString(record, ["status", "payment_status"]) ?? null;

  return {
    id,
    name,
    status,
    metadata: toMetadata(record, []),
  };
}

export type ContextLoaderFn = (
  id: string | null | undefined,
) => Promise<EntityContext | null>;

export const CONTEXT_LOADERS: Record<ContextLoaderName, ContextLoaderFn> = {
  lead: loadLeadContext,
  student: loadStudentContext,
  teacher: loadTeacherContext,
  family: loadFamilyContext,
  invoice: loadInvoiceContext,
};

export const CONTEXT_LOADER_ID_KEYS: Record<ContextLoaderName, string[]> = {
  lead: ["leadId", "lead_id", "lead"],
  student: ["studentId", "student_id", "student"],
  teacher: ["teacherId", "teacher_id", "teacher"],
  family: ["familyId", "family_id", "family"],
  invoice: ["invoiceId", "invoice_id", "invoice"],
};

export function isContextLoaderName(
  value: string,
): value is ContextLoaderName {
  return value in CONTEXT_LOADERS;
}
