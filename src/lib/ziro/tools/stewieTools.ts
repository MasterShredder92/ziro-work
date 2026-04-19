import {
  createStudentFollowup,
  listStudentFollowups,
  type StudentFollowupFilter,
} from "@data/studentFollowups";
import type {
  StudentFollowup,
  StudentFollowupInsert,
} from "@/lib/types/entities";
import type { ToolDefinition, ToolInput, ToolOutput } from "./types";
import { validateFollowupInput, type FollowupArgs } from "./validators";

function requireTenant(input: ToolInput): string {
  if (!input.tenantId || input.tenantId.trim().length === 0) {
    throw new Error("tenantId is required");
  }
  return input.tenantId;
}

function buildFollowupInsert(
  args: FollowupArgs,
  createdBy: string | null,
): Omit<StudentFollowupInsert, "tenant_id"> {
  return {
    student_id: args.student_id as string,
    family_id: args.family_id as string,
    followup_date: args.followup_date as string,
    reason: args.reason,
    status: args.status,
    notes: args.notes,
    created_by: createdBy,
  };
}

export const createFollowupTool: ToolDefinition = {
  name: "createFollowup",
  description:
    "Create a student follow-up record. Requires student_id, family_id, followup_date, and reason.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const { args, errors } = validateFollowupInput(input.args ?? input.raw);

    if (errors.length > 0) {
      return {
        result: { ok: false, errors },
        metadata: { validation_failed: true },
      };
    }

    const row = await createStudentFollowup(
      tenantId,
      buildFollowupInsert(args, input.profileId ?? null),
    );

    return {
      result: { ok: true, followup: row },
      metadata: {
        entity: "student_followup",
        action: "create",
        followup_id: row.id,
      },
    };
  },
};

export const listFollowupsTool: ToolDefinition = {
  name: "listFollowups",
  description:
    "List student follow-ups for a tenant. Supports filters on student_id, family_id, status, reason, and date range.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const rawObj =
      typeof input.args === "object" && input.args !== null
        ? (input.args as Record<string, unknown>)
        : safeParse(input.raw);

    const filter: StudentFollowupFilter = {};
    const studentId = pickString(rawObj, ["student_id", "studentId"]);
    const familyId = pickString(rawObj, ["family_id", "familyId"]);
    const status = pickString(rawObj, ["status"]);
    const reason = pickString(rawObj, ["reason"]);
    const dueFrom = pickString(rawObj, ["due_from", "from"]);
    const dueTo = pickString(rawObj, ["due_to", "to"]);

    if (studentId) filter.student_id = studentId;
    if (familyId) filter.family_id = familyId;
    if (status) filter.status = status;
    if (reason) filter.reason = reason;
    if (dueFrom) filter.due_from = dueFrom;
    if (dueTo) filter.due_to = dueTo;

    const limit =
      typeof rawObj.limit === "number"
        ? rawObj.limit
        : typeof rawObj.limit === "string"
          ? Number.parseInt(rawObj.limit, 10)
          : 100;

    const rows = await listStudentFollowups(tenantId, filter, {
      limit,
      orderBy: "followup_date",
      ascending: true,
    });

    return {
      result: { ok: true, count: rows.length, followups: rows },
      metadata: {
        entity: "student_followup",
        action: "list",
        count: rows.length,
      },
    };
  },
};

export const summarizeFollowupsTool: ToolDefinition = {
  name: "summarizeFollowups",
  description:
    "Summarize student follow-ups for a tenant. Groups by status and reason, counts overdue items, and returns the next upcoming items.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const rawObj =
      typeof input.args === "object" && input.args !== null
        ? (input.args as Record<string, unknown>)
        : safeParse(input.raw);

    const horizonDays =
      typeof rawObj.horizon_days === "number"
        ? rawObj.horizon_days
        : typeof rawObj.horizon_days === "string"
          ? Number.parseInt(rawObj.horizon_days, 10)
          : 30;

    const today = new Date();
    const horizon = new Date(today.getTime() + horizonDays * 86400000);
    const from = today.toISOString().slice(0, 10);
    const to = horizon.toISOString().slice(0, 10);

    const rows = await listStudentFollowups(
      tenantId,
      { due_from: from, due_to: to },
      { limit: 500, orderBy: "followup_date", ascending: true },
    );

    const byStatus: Record<string, number> = {};
    const byReason: Record<string, number> = {};
    let overdue = 0;

    const todayIso = from;
    for (const row of rows) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
      const reason = row.reason ?? "unspecified";
      byReason[reason] = (byReason[reason] ?? 0) + 1;
      if (row.status !== "sent" && row.followup_date < todayIso) overdue += 1;
    }

    const upcoming = rows
      .filter((r) => r.status !== "sent")
      .slice(0, 10)
      .map((r: StudentFollowup) => ({
        id: r.id,
        student_id: r.student_id,
        family_id: r.family_id,
        followup_date: r.followup_date,
        reason: r.reason,
        status: r.status,
      }));

    return {
      result: {
        ok: true,
        window: { from, to, horizon_days: horizonDays },
        totals: {
          total: rows.length,
          overdue,
          pending: byStatus.pending ?? 0,
          sent: byStatus.sent ?? 0,
        },
        by_status: byStatus,
        by_reason: byReason,
        upcoming,
      },
      metadata: {
        entity: "student_followup",
        action: "summarize",
        total: rows.length,
      },
    };
  },
};

function pickString(
  obj: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object" && !Array.isArray(p))
      return p as Record<string, unknown>;
  } catch {
    // ignore
  }
  return {};
}
