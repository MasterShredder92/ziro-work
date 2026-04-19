import {
  createLead,
  getLeadById,
  updateLead,
  type LeadFilter,
} from "@data/leads";
import type { LeadInsert, LeadUpdate } from "@/lib/types/entities";
import type { ToolDefinition, ToolInput, ToolOutput } from "./types";
import { validateLeadInput } from "./validators";

function requireTenant(input: ToolInput): string {
  if (!input.tenantId || input.tenantId.trim().length === 0) {
    throw new Error("tenantId is required");
  }
  return input.tenantId;
}

function buildLeadInsert(
  args: ReturnType<typeof validateLeadInput>["args"],
): Omit<LeadInsert, "tenant_id"> {
  return {
    first_name: args.first_name ?? "Unknown",
    last_name: args.last_name,
    email: args.email,
    phone: args.phone,
    source: args.source,
    notes: args.notes,
    tags: args.tags.length > 0 ? args.tags : null,
    stage: (args.stage as LeadInsert["stage"]) ?? undefined,
    assigned_to: args.assigned_to,
    location_id: args.location_id,
    ai_context: args.metadata as LeadInsert["ai_context"],
  };
}

export const createLeadTool: ToolDefinition = {
  name: "createLead",
  description:
    "Create a new lead from unstructured input. Validates and normalizes name, email, and phone before insert.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const { args, errors } = validateLeadInput(input.args ?? input.raw);

    if (errors.length > 0) {
      return {
        result: { ok: false, errors },
        metadata: { validation_failed: true },
      };
    }

    const lead = await createLead(tenantId, buildLeadInsert(args));

    return {
      result: { ok: true, lead },
      metadata: { entity: "lead", action: "create", lead_id: lead.id },
    };
  },
};

export const qualifyLeadTool: ToolDefinition = {
  name: "qualifyLead",
  description:
    "Update the qualification stage, notes, and follow-up time for an existing lead.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const rawObj =
      typeof input.args === "object" && input.args !== null
        ? input.args
        : safeParse(input.raw);
    const errors: string[] = [];

    const leadId =
      pickString(rawObj, ["lead_id", "leadId", "id"]) ?? null;
    const stage = pickString(rawObj, ["stage"]) ?? null;
    const qualification = pickString(rawObj, ["qualification", "score"]) ?? null;
    const notes = pickString(rawObj, ["notes", "reason"]) ?? null;
    const nextAction = pickString(rawObj, ["next_action", "nextAction"]) ?? null;
    const nextFollowupAt =
      pickString(rawObj, ["next_follow_up_at", "nextFollowUpAt", "followup_at"]) ??
      null;

    if (!leadId) errors.push("lead_id is required");
    if (!stage && !qualification && !notes && !nextAction && !nextFollowupAt)
      errors.push(
        "at least one of stage, qualification, notes, next_action, or next_follow_up_at is required",
      );

    if (errors.length > 0) {
      return { result: { ok: false, errors }, metadata: { validation_failed: true } };
    }

    const patch: LeadUpdate = {};
    if (stage) (patch as { stage?: string }).stage = stage;
    if (notes) patch.notes = notes;
    if (nextAction) patch.next_action = nextAction;
    if (nextFollowupAt) patch.next_follow_up_at = nextFollowupAt;
    if (qualification) {
      const n = Number.parseFloat(qualification);
      if (Number.isFinite(n)) patch.compatibility_score = n;
    }

    const lead = await updateLead(leadId as string, tenantId, patch);

    return {
      result: { ok: true, lead },
      metadata: { entity: "lead", action: "qualify", lead_id: lead.id },
    };
  },
};

export const mergeLeadTool: ToolDefinition = {
  name: "mergeLead",
  description:
    "Merge a source lead into a target lead. Notes are appended and the source is marked as merged via converted_student_id.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const rawObj =
      typeof input.args === "object" && input.args !== null
        ? input.args
        : safeParse(input.raw);
    const errors: string[] = [];

    const sourceId = pickString(rawObj, ["source_id", "from", "source"]) ?? null;
    const targetId = pickString(rawObj, ["target_id", "into", "target"]) ?? null;
    const mergeNote = pickString(rawObj, ["note", "reason"]) ?? null;

    if (!sourceId) errors.push("source_id is required");
    if (!targetId) errors.push("target_id is required");
    if (sourceId && targetId && sourceId === targetId)
      errors.push("source and target cannot be the same lead");

    if (errors.length > 0) {
      return { result: { ok: false, errors }, metadata: { validation_failed: true } };
    }

    const [source, target] = await Promise.all([
      getLeadById(sourceId as string, tenantId),
      getLeadById(targetId as string, tenantId),
    ]);

    if (!source) {
      return {
        result: { ok: false, errors: [`source lead ${sourceId} not found`] },
        metadata: { validation_failed: true },
      };
    }
    if (!target) {
      return {
        result: { ok: false, errors: [`target lead ${targetId} not found`] },
        metadata: { validation_failed: true },
      };
    }

    const combinedNotes = [
      target.notes ?? "",
      source.notes ?? "",
      mergeNote ? `Merged from ${source.id}: ${mergeNote}` : `Merged from ${source.id}`,
    ]
      .filter((v) => v.length > 0)
      .join("\n\n");

    const mergedTags = Array.from(
      new Set<string>([...(target.tags ?? []), ...(source.tags ?? [])]),
    );

    const [updatedTarget, updatedSource] = await Promise.all([
      updateLead(target.id, tenantId, {
        notes: combinedNotes,
        tags: mergedTags.length > 0 ? mergedTags : null,
      }),
      updateLead(source.id, tenantId, {
        stage: "lost" as LeadUpdate["stage"],
        lost_reason: `merged_into:${target.id}`,
      }),
    ]);

    return {
      result: { ok: true, target: updatedTarget, source: updatedSource },
      metadata: {
        entity: "lead",
        action: "merge",
        target_id: updatedTarget.id,
        source_id: updatedSource.id,
      },
    };
  },
};

export const tagLeadTool: ToolDefinition = {
  name: "tagLead",
  description:
    "Append or replace tags on a lead. Accepts { lead_id, tags, mode: 'add' | 'replace' }.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const rawObj =
      typeof input.args === "object" && input.args !== null
        ? input.args
        : safeParse(input.raw);
    const errors: string[] = [];

    const leadId = pickString(rawObj, ["lead_id", "leadId", "id"]) ?? null;
    const rawTags = (rawObj.tags ?? rawObj.tag) as unknown;
    const tags = Array.isArray(rawTags)
      ? rawTags.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      : typeof rawTags === "string" && rawTags.trim().length > 0
        ? rawTags.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
        : [];
    const modeRaw = (rawObj.mode as string | undefined) ?? "add";
    const mode = modeRaw === "replace" ? "replace" : "add";

    if (!leadId) errors.push("lead_id is required");
    if (tags.length === 0) errors.push("tags is required and must be non-empty");

    if (errors.length > 0) {
      return { result: { ok: false, errors }, metadata: { validation_failed: true } };
    }

    const existing = await getLeadById(leadId as string, tenantId);
    if (!existing) {
      return {
        result: { ok: false, errors: [`lead ${leadId} not found`] },
        metadata: { validation_failed: true },
      };
    }

    const nextTags =
      mode === "replace"
        ? Array.from(new Set(tags))
        : Array.from(new Set([...(existing.tags ?? []), ...tags]));

    const updated = await updateLead(existing.id, tenantId, {
      tags: nextTags,
    });

    return {
      result: { ok: true, lead: updated, tags: updated.tags ?? [] },
      metadata: {
        entity: "lead",
        action: "tag",
        mode,
        lead_id: updated.id,
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

export type _StarFilter = LeadFilter;
