import {
  normalizeDate,
  normalizeEmail,
  normalizeMoney,
  normalizeName,
  normalizePhone,
} from "./normalizers";
import type { ValidationResult } from "./types";

type RawInput = string | Record<string, unknown> | null | undefined;

function parseRaw(raw: RawInput): Record<string, unknown> {
  if (raw === null || raw === undefined) return {};
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return {};
  const trimmed = raw.trim();
  if (trimmed.length === 0) return {};
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return {};
}

function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}

function pickFirst(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (k in obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

export type LeadArgs = {
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  notes: string | null;
  tags: string[];
  stage: string | null;
  assigned_to: string | null;
  location_id: string | null;
  metadata: Record<string, unknown>;
};

function splitFullName(full: string | null): {
  first_name: string | null;
  last_name: string | null;
} {
  if (!full) return { first_name: null, last_name: null };
  const parts = full.split(" ").filter((p) => p.length > 0);
  if (parts.length === 0) return { first_name: null, last_name: null };
  if (parts.length === 1) return { first_name: parts[0], last_name: null };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

export function validateLeadInput(
  raw: RawInput,
): ValidationResult<LeadArgs> {
  const obj = parseRaw(raw);
  const errors: string[] = [];

  const firstRaw = normalizeName(pickFirst(obj, ["first_name", "firstName"]));
  const lastRaw = normalizeName(pickFirst(obj, ["last_name", "lastName"]));
  const fullRaw = normalizeName(pickFirst(obj, ["name", "full_name", "fullName"]));

  let first_name = firstRaw;
  let last_name = lastRaw;
  let full_name = fullRaw;

  if (!first_name && full_name) {
    const split = splitFullName(full_name);
    first_name = split.first_name;
    if (!last_name) last_name = split.last_name;
  }
  if (!full_name) {
    const composed = [first_name, last_name].filter((p) => p).join(" ").trim();
    full_name = composed.length > 0 ? composed : null;
  }

  const email = normalizeEmail(pickFirst(obj, ["email"]));
  const phone = normalizePhone(pickFirst(obj, ["phone", "phone_number"]));
  const source = str(pickFirst(obj, ["source"])) ?? null;
  const notes = str(pickFirst(obj, ["notes", "note"])) ?? null;
  const tags = strArray(pickFirst(obj, ["tags"]));
  const stage = str(pickFirst(obj, ["stage"])) ?? null;
  const assigned_to = str(pickFirst(obj, ["assigned_to", "assignedTo"])) ?? null;
  const location_id =
    str(pickFirst(obj, ["location_id", "locationId"])) ?? null;
  const metadata =
    (obj.metadata && typeof obj.metadata === "object"
      ? (obj.metadata as Record<string, unknown>)
      : {}) ?? {};

  if (!first_name) errors.push("first_name (or name) is required");
  if (!email && !phone) errors.push("email or phone is required");

  return {
    args: {
      full_name,
      first_name,
      last_name,
      email,
      phone,
      source,
      notes,
      tags,
      stage,
      assigned_to,
      location_id,
      metadata,
    },
    errors,
  };
}

export type ScheduleArgs = {
  teacher_id: string | null;
  student_id: string | null;
  location_id: string | null;
  room_id: string | null;
  block_date: string | null;
  start_time: string | null;
  end_time: string | null;
  block_type: string | null;
  status: string | null;
  notes: string | null;
};

function timeOnly(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
    const [h, m, s] = t.split(":");
    const hh = h.padStart(2, "0");
    const mm = m.padStart(2, "0");
    const ss = (s ?? "00").padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  return null;
}

function dateOnly(value: unknown): string | null {
  const iso = normalizeDate(value);
  if (!iso) return null;
  return iso.slice(0, 10);
}

export function validateScheduleInput(
  raw: RawInput,
): ValidationResult<ScheduleArgs> {
  const obj = parseRaw(raw);
  const errors: string[] = [];

  const teacher_id = str(pickFirst(obj, ["teacher_id", "teacherId"])) ?? null;
  const student_id = str(pickFirst(obj, ["student_id", "studentId"])) ?? null;
  const location_id =
    str(pickFirst(obj, ["location_id", "locationId"])) ?? null;
  const room_id = str(pickFirst(obj, ["room_id", "roomId"])) ?? null;
  const block_date = dateOnly(pickFirst(obj, ["block_date", "date", "day"]));
  const start_time = timeOnly(pickFirst(obj, ["start_time", "start", "startTime"]));
  const end_time = timeOnly(pickFirst(obj, ["end_time", "end", "endTime"]));
  const block_type =
    str(pickFirst(obj, ["block_type", "type", "blockType"])) ?? null;
  const status = str(pickFirst(obj, ["status"])) ?? null;
  const notes = str(pickFirst(obj, ["notes", "note"])) ?? null;

  if (!teacher_id) errors.push("teacher_id is required");
  if (!location_id) errors.push("location_id is required");
  if (!block_date) errors.push("block_date is required");
  if (!start_time) errors.push("start_time is required");
  if (!end_time) errors.push("end_time is required");
  if (start_time && end_time && start_time >= end_time)
    errors.push("start_time must be before end_time");

  return {
    args: {
      teacher_id,
      student_id,
      location_id,
      room_id,
      block_date,
      start_time,
      end_time,
      block_type,
      status,
      notes,
    },
    errors,
  };
}

export type InvoiceArgs = {
  customer_id: string | null;
  family_id: string | null;
  student_id: string | null;
  amount_cents: number | null;
  currency: string;
  due_date: string | null;
  description: string | null;
  invoice_number: string | null;
  metadata: Record<string, unknown>;
};

export function validateInvoiceInput(
  raw: RawInput,
): ValidationResult<InvoiceArgs> {
  const obj = parseRaw(raw);
  const errors: string[] = [];

  const customer_id =
    str(pickFirst(obj, ["customer_id", "customerId"])) ?? null;
  const family_id = str(pickFirst(obj, ["family_id", "familyId"])) ?? null;
  const student_id = str(pickFirst(obj, ["student_id", "studentId"])) ?? null;
  const money = normalizeMoney(
    pickFirst(obj, ["amount", "amount_cents", "total", "money"]),
  );
  const due = normalizeDate(pickFirst(obj, ["due_date", "dueDate", "due"]));
  const description = str(pickFirst(obj, ["description", "memo", "note"])) ?? null;
  const invoice_number =
    str(pickFirst(obj, ["invoice_number", "invoiceNumber", "number"])) ?? null;
  const metadata =
    (obj.metadata && typeof obj.metadata === "object"
      ? (obj.metadata as Record<string, unknown>)
      : {}) ?? {};

  if (!customer_id && !family_id && !student_id)
    errors.push("customer_id, family_id, or student_id is required");
  if (!money) errors.push("amount is required and must be numeric");
  else if (money.amountCents <= 0) errors.push("amount must be greater than zero");

  return {
    args: {
      customer_id,
      family_id,
      student_id,
      amount_cents: money?.amountCents ?? null,
      currency: money?.currency ?? "USD",
      due_date: due ? due.slice(0, 10) : null,
      description,
      invoice_number,
      metadata,
    },
    errors,
  };
}

export type MessageArgs = {
  audience: "family" | "teacher" | "student" | null;
  recipient_id: string | null;
  family_id: string | null;
  student_id: string | null;
  teacher_id: string | null;
  channel: string;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
};

export function validateMessageInput(
  raw: RawInput,
): ValidationResult<MessageArgs> {
  const obj = parseRaw(raw);
  const errors: string[] = [];

  const audienceRaw = str(pickFirst(obj, ["audience", "to_type", "recipient_type"]));
  const audience =
    audienceRaw === "family" ||
    audienceRaw === "teacher" ||
    audienceRaw === "student"
      ? audienceRaw
      : null;

  const recipient_id =
    str(pickFirst(obj, ["recipient_id", "to", "to_id"])) ?? null;
  const family_id = str(pickFirst(obj, ["family_id", "familyId"])) ?? null;
  const student_id = str(pickFirst(obj, ["student_id", "studentId"])) ?? null;
  const teacher_id = str(pickFirst(obj, ["teacher_id", "teacherId"])) ?? null;
  const channel = (str(pickFirst(obj, ["channel"])) ?? "email").toLowerCase();
  const subject = str(pickFirst(obj, ["subject", "title"])) ?? null;
  const body = str(pickFirst(obj, ["body", "message", "content", "text"])) ?? null;
  const metadata =
    (obj.metadata && typeof obj.metadata === "object"
      ? (obj.metadata as Record<string, unknown>)
      : {}) ?? {};

  if (!body) errors.push("body is required");
  if (!audience && !family_id && !student_id && !teacher_id && !recipient_id)
    errors.push("audience or a recipient id is required");
  if (!["email", "sms", "push", "in_app"].includes(channel))
    errors.push(`channel "${channel}" is not supported`);

  return {
    args: {
      audience,
      recipient_id,
      family_id,
      student_id,
      teacher_id,
      channel,
      subject,
      body,
      metadata,
    },
    errors,
  };
}

export type FollowupArgs = {
  student_id: string | null;
  family_id: string | null;
  followup_date: string | null;
  reason: string | null;
  status: string;
  notes: string | null;
  assigned_to: string | null;
};

export function validateFollowupInput(
  raw: RawInput,
): ValidationResult<FollowupArgs> {
  const obj = parseRaw(raw);
  const errors: string[] = [];

  const student_id = str(pickFirst(obj, ["student_id", "studentId"])) ?? null;
  const family_id = str(pickFirst(obj, ["family_id", "familyId"])) ?? null;
  const followup_date = dateOnly(
    pickFirst(obj, ["followup_date", "date", "due_date", "when"]),
  );
  const reason = str(pickFirst(obj, ["reason", "category"])) ?? null;
  const status =
    str(pickFirst(obj, ["status"]))?.toLowerCase() ?? "pending";
  const notes = str(pickFirst(obj, ["notes", "note", "body"])) ?? null;
  const assigned_to = str(pickFirst(obj, ["assigned_to", "assignedTo"])) ?? null;

  if (!student_id) errors.push("student_id is required");
  if (!family_id) errors.push("family_id is required");
  if (!followup_date) errors.push("followup_date is required");
  if (!reason) errors.push("reason is required");

  return {
    args: {
      student_id,
      family_id,
      followup_date,
      reason,
      status,
      notes,
      assigned_to,
    },
    errors,
  };
}
