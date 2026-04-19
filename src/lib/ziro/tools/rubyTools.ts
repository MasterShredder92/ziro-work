import {
  createScheduleBlock,
  findConflictingBlocks,
  listScheduleBlocks,
} from "@data/scheduleBlocks";
import type {
  ScheduleBlock,
  ScheduleBlockInsert,
} from "@/lib/types/entities";
import type { ToolDefinition, ToolInput, ToolOutput } from "./types";
import { validateScheduleInput, type ScheduleArgs } from "./validators";

function requireTenant(input: ToolInput): string {
  if (!input.tenantId || input.tenantId.trim().length === 0) {
    throw new Error("tenantId is required");
  }
  return input.tenantId;
}

function buildBlockInsert(
  args: ScheduleArgs,
): Omit<ScheduleBlockInsert, "tenant_id"> {
  return {
    teacher_id: args.teacher_id as string,
    student_id: args.student_id,
    location_id: args.location_id as string,
    room_id: args.room_id,
    block_date: args.block_date as string,
    start_time: args.start_time as string,
    end_time: args.end_time as string,
    block_type: (args.block_type as ScheduleBlockInsert["block_type"]) ?? undefined,
    status: (args.status as ScheduleBlockInsert["status"]) ?? undefined,
    notes: args.notes,
  };
}

export const createBlockTool: ToolDefinition = {
  name: "createBlock",
  description:
    "Create a schedule block for a teacher on a given date. Validates times and requires teacher_id and location_id.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const { args, errors } = validateScheduleInput(input.args ?? input.raw);

    if (errors.length > 0) {
      return {
        result: { ok: false, errors },
        metadata: { validation_failed: true },
      };
    }

    const conflicts = await findConflictingBlocks(
      tenantId,
      args.teacher_id as string,
      args.block_date as string,
      args.start_time as string,
      args.end_time as string,
    );

    if (conflicts.length > 0) {
      return {
        result: {
          ok: false,
          errors: ["schedule conflict"],
          conflicts,
        },
        metadata: {
          entity: "schedule_block",
          action: "create",
          conflict_count: conflicts.length,
        },
      };
    }

    const block = await createScheduleBlock(tenantId, buildBlockInsert(args));

    return {
      result: { ok: true, block },
      metadata: {
        entity: "schedule_block",
        action: "create",
        block_id: block.id,
      },
    };
  },
};

export const detectConflictsTool: ToolDefinition = {
  name: "detectConflicts",
  description:
    "Detect schedule conflicts for a teacher on a given date between start_time and end_time.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const { args, errors } = validateScheduleInput(input.args ?? input.raw);

    const required = ["teacher_id", "block_date", "start_time", "end_time"];
    const missing = required.filter((f) => !(args as Record<string, unknown>)[f]);
    const allErrors = [...errors, ...missing.map((f) => `${f} is required`)];

    const deduped = Array.from(new Set(allErrors));

    if (deduped.some((e) => required.some((f) => e.includes(f)))) {
      return {
        result: { ok: false, errors: deduped },
        metadata: { validation_failed: true },
      };
    }

    const conflicts = await findConflictingBlocks(
      tenantId,
      args.teacher_id as string,
      args.block_date as string,
      args.start_time as string,
      args.end_time as string,
    );

    return {
      result: {
        ok: true,
        has_conflicts: conflicts.length > 0,
        count: conflicts.length,
        conflicts,
      },
      metadata: {
        entity: "schedule_block",
        action: "detect_conflicts",
        conflict_count: conflicts.length,
      },
    };
  },
};

function toMinutes(hhmmss: string): number {
  const [h, m] = hhmmss.split(":");
  return Number.parseInt(h, 10) * 60 + Number.parseInt(m, 10);
}

function toClock(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
}

export const suggestScheduleTool: ToolDefinition = {
  name: "suggestSchedule",
  description:
    "Suggest open time slots for a teacher on a given date. Reads existing blocks and returns gaps of the requested length.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const rawObj =
      typeof input.args === "object" && input.args !== null
        ? (input.args as Record<string, unknown>)
        : safeParse(input.raw);
    const errors: string[] = [];

    const teacherId =
      pickString(rawObj, ["teacher_id", "teacherId"]) ?? null;
    const blockDate =
      pickString(rawObj, ["block_date", "date", "day"]) ?? null;
    const windowStart =
      pickString(rawObj, ["window_start", "from", "start"]) ?? "09:00:00";
    const windowEnd =
      pickString(rawObj, ["window_end", "to", "end"]) ?? "20:00:00";
    const durationMinutesRaw = rawObj.duration_minutes ?? rawObj.duration ?? 30;
    const durationMinutes =
      typeof durationMinutesRaw === "number"
        ? durationMinutesRaw
        : Number.parseInt(String(durationMinutesRaw), 10);

    if (!teacherId) errors.push("teacher_id is required");
    if (!blockDate) errors.push("block_date is required");
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0)
      errors.push("duration_minutes must be a positive integer");

    if (errors.length > 0) {
      return {
        result: { ok: false, errors },
        metadata: { validation_failed: true },
      };
    }

    const existing = await listScheduleBlocks(
      tenantId,
      {
        teacher_id: teacherId as string,
        date_from: blockDate as string,
        date_to: blockDate as string,
      },
      { orderBy: "start_time", ascending: true, limit: 200 },
    );

    const busy: ScheduleBlock[] = existing.filter(
      (b): b is ScheduleBlock => !!b.start_time && !!b.end_time,
    );

    const ws = toMinutes(normalizeClock(windowStart));
    const we = toMinutes(normalizeClock(windowEnd));
    const suggestions: Array<{ start: string; end: string }> = [];

    let cursor = ws;
    const sortedBusy = busy
      .map((b) => ({
        start: toMinutes(normalizeClock(b.start_time)),
        end: toMinutes(normalizeClock(b.end_time)),
      }))
      .sort((a, b) => a.start - b.start);

    for (const slot of sortedBusy) {
      if (slot.start >= we) break;
      const gapEnd = Math.min(slot.start, we);
      while (cursor + durationMinutes <= gapEnd) {
        suggestions.push({
          start: toClock(cursor),
          end: toClock(cursor + durationMinutes),
        });
        cursor += durationMinutes;
      }
      cursor = Math.max(cursor, slot.end);
    }
    while (cursor + durationMinutes <= we) {
      suggestions.push({
        start: toClock(cursor),
        end: toClock(cursor + durationMinutes),
      });
      cursor += durationMinutes;
    }

    return {
      result: {
        ok: true,
        block_date: blockDate,
        teacher_id: teacherId,
        duration_minutes: durationMinutes,
        suggestions,
        busy_count: busy.length,
      },
      metadata: {
        entity: "schedule_block",
        action: "suggest",
        suggestion_count: suggestions.length,
      },
    };
  },
};

function normalizeClock(t: string): string {
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{1,2}:\d{2}$/.test(t)) return `${t}:00`;
  return t;
}

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
