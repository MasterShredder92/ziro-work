import { createLead, getLeadById, updateLead, } from "@data/leads";
import { validateLeadInput } from "./validators";
function requireTenant(input) {
    if (!input.tenantId || input.tenantId.trim().length === 0) {
        throw new Error("tenantId is required");
    }
    return input.tenantId;
}
function buildLeadInsert(args) {
    var _a, _b;
    return {
        first_name: (_a = args.first_name) !== null && _a !== void 0 ? _a : "Unknown",
        last_name: args.last_name,
        email: args.email,
        phone: args.phone,
        source: args.source,
        notes: args.notes,
        tags: args.tags.length > 0 ? args.tags : null,
        stage: (_b = args.stage) !== null && _b !== void 0 ? _b : undefined,
        assigned_to: args.assigned_to,
        location_id: args.location_id,
        ai_context: args.metadata,
    };
}
export const createLeadTool = {
    name: "createLead",
    description: "Create a new lead from unstructured input. Validates and normalizes name, email, and phone before insert.",
    handler: async (input) => {
        var _a;
        const tenantId = requireTenant(input);
        const { args, errors } = validateLeadInput((_a = input.args) !== null && _a !== void 0 ? _a : input.raw);
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
export const qualifyLeadTool = {
    name: "qualifyLead",
    description: "Update the qualification stage, notes, and follow-up time for an existing lead.",
    handler: async (input) => {
        var _a, _b, _c, _d, _e, _f;
        const tenantId = requireTenant(input);
        const rawObj = typeof input.args === "object" && input.args !== null
            ? input.args
            : safeParse(input.raw);
        const errors = [];
        const leadId = (_a = pickString(rawObj, ["lead_id", "leadId", "id"])) !== null && _a !== void 0 ? _a : null;
        const stage = (_b = pickString(rawObj, ["stage"])) !== null && _b !== void 0 ? _b : null;
        const qualification = (_c = pickString(rawObj, ["qualification", "score"])) !== null && _c !== void 0 ? _c : null;
        const notes = (_d = pickString(rawObj, ["notes", "reason"])) !== null && _d !== void 0 ? _d : null;
        const nextAction = (_e = pickString(rawObj, ["next_action", "nextAction"])) !== null && _e !== void 0 ? _e : null;
        const nextFollowupAt = (_f = pickString(rawObj, ["next_follow_up_at", "nextFollowUpAt", "followup_at"])) !== null && _f !== void 0 ? _f : null;
        if (!leadId)
            errors.push("lead_id is required");
        if (!stage && !qualification && !notes && !nextAction && !nextFollowupAt)
            errors.push("at least one of stage, qualification, notes, next_action, or next_follow_up_at is required");
        if (errors.length > 0) {
            return { result: { ok: false, errors }, metadata: { validation_failed: true } };
        }
        const patch = {};
        if (stage)
            patch.stage = stage;
        if (notes)
            patch.notes = notes;
        if (nextAction)
            patch.next_action = nextAction;
        if (nextFollowupAt)
            patch.next_follow_up_at = nextFollowupAt;
        if (qualification) {
            const n = Number.parseFloat(qualification);
            if (Number.isFinite(n))
                patch.compatibility_score = n;
        }
        const lead = await updateLead(leadId, tenantId, patch);
        return {
            result: { ok: true, lead },
            metadata: { entity: "lead", action: "qualify", lead_id: lead.id },
        };
    },
};
export const mergeLeadTool = {
    name: "mergeLead",
    description: "Merge a source lead into a target lead. Notes are appended and the source is marked as merged via converted_student_id.",
    handler: async (input) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const tenantId = requireTenant(input);
        const rawObj = typeof input.args === "object" && input.args !== null
            ? input.args
            : safeParse(input.raw);
        const errors = [];
        const sourceId = (_a = pickString(rawObj, ["source_id", "from", "source"])) !== null && _a !== void 0 ? _a : null;
        const targetId = (_b = pickString(rawObj, ["target_id", "into", "target"])) !== null && _b !== void 0 ? _b : null;
        const mergeNote = (_c = pickString(rawObj, ["note", "reason"])) !== null && _c !== void 0 ? _c : null;
        if (!sourceId)
            errors.push("source_id is required");
        if (!targetId)
            errors.push("target_id is required");
        if (sourceId && targetId && sourceId === targetId)
            errors.push("source and target cannot be the same lead");
        if (errors.length > 0) {
            return { result: { ok: false, errors }, metadata: { validation_failed: true } };
        }
        const [source, target] = await Promise.all([
            getLeadById(sourceId, tenantId),
            getLeadById(targetId, tenantId),
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
            (_d = target.notes) !== null && _d !== void 0 ? _d : "",
            (_e = source.notes) !== null && _e !== void 0 ? _e : "",
            mergeNote ? `Merged from ${source.id}: ${mergeNote}` : `Merged from ${source.id}`,
        ]
            .filter((v) => v.length > 0)
            .join("\n\n");
        const mergedTags = Array.from(new Set([...((_f = target.tags) !== null && _f !== void 0 ? _f : []), ...((_g = source.tags) !== null && _g !== void 0 ? _g : [])]));
        const [updatedTarget, updatedSource] = await Promise.all([
            updateLead(target.id, tenantId, {
                notes: combinedNotes,
                tags: mergedTags.length > 0 ? mergedTags : null,
            }),
            updateLead(source.id, tenantId, {
                stage: "lost",
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
export const tagLeadTool = {
    name: "tagLead",
    description: "Append or replace tags on a lead. Accepts { lead_id, tags, mode: 'add' | 'replace' }.",
    handler: async (input) => {
        var _a, _b, _c, _d, _e;
        const tenantId = requireTenant(input);
        const rawObj = typeof input.args === "object" && input.args !== null
            ? input.args
            : safeParse(input.raw);
        const errors = [];
        const leadId = (_a = pickString(rawObj, ["lead_id", "leadId", "id"])) !== null && _a !== void 0 ? _a : null;
        const rawTags = ((_b = rawObj.tags) !== null && _b !== void 0 ? _b : rawObj.tag);
        const tags = Array.isArray(rawTags)
            ? rawTags.filter((t) => typeof t === "string" && t.trim().length > 0)
            : typeof rawTags === "string" && rawTags.trim().length > 0
                ? rawTags.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
                : [];
        const modeRaw = (_c = rawObj.mode) !== null && _c !== void 0 ? _c : "add";
        const mode = modeRaw === "replace" ? "replace" : "add";
        if (!leadId)
            errors.push("lead_id is required");
        if (tags.length === 0)
            errors.push("tags is required and must be non-empty");
        if (errors.length > 0) {
            return { result: { ok: false, errors }, metadata: { validation_failed: true } };
        }
        const existing = await getLeadById(leadId, tenantId);
        if (!existing) {
            return {
                result: { ok: false, errors: [`lead ${leadId} not found`] },
                metadata: { validation_failed: true },
            };
        }
        const nextTags = mode === "replace"
            ? Array.from(new Set(tags))
            : Array.from(new Set([...((_d = existing.tags) !== null && _d !== void 0 ? _d : []), ...tags]));
        const updated = await updateLead(existing.id, tenantId, {
            tags: nextTags,
        });
        return {
            result: { ok: true, lead: updated, tags: (_e = updated.tags) !== null && _e !== void 0 ? _e : [] },
            metadata: {
                entity: "lead",
                action: "tag",
                mode,
                lead_id: updated.id,
            },
        };
    },
};
function pickString(obj, keys) {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === "string" && v.trim().length > 0)
            return v.trim();
    }
    return null;
}
function safeParse(raw) {
    try {
        const p = JSON.parse(raw);
        if (p && typeof p === "object" && !Array.isArray(p))
            return p;
    }
    catch (_a) {
        // ignore
    }
    return {};
}
