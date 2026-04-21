import { getServiceClient } from "@/lib/supabase";
export const STATIC_AGENT_MANIFEST = {
    ziro: {
        slug: "ziro",
        name: "Ziro",
        role: "Plain-English helper",
        description: "Explains screens and next clicks in simple words — no jargon.",
    },
    star: {
        slug: "star",
        name: "STAR",
        role: "Pipeline coach",
        description: "Tells you what to open first: leads, trials, and new sign-ups.",
    },
    ruby: {
        slug: "ruby",
        name: "Ruby",
        role: "Schedule & calendar",
        description: "Finds open times, spots conflicts, and keeps lessons from colliding.",
    },
    stewie: {
        slug: "stewie",
        name: "Stewie",
        role: "Follow-ups & onboarding",
        description: "Tracks who still needs a call or a next step so nobody slips away.",
    },
    vader: {
        slug: "vader",
        name: "Vader",
        role: "Messages for families & staff",
        description: "Pulls teacher and family chatter together so replies stay in one place.",
    },
    bub: {
        slug: "bub",
        name: "Bub",
        role: "Money & invoices",
        description: "Shows who owes you, what was paid, and what is still out.",
    },
    sid: {
        slug: "sid",
        name: "Sid",
        role: "Retention & at-risk students",
        description: "Highlights families who might quit before you lose the tuition.",
    },
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value) {
    return UUID_RE.test(value);
}
function rowToResolved(row, staticEntry) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const source = staticEntry ? "merged" : "db";
    return {
        id: row.id,
        slug: row.slug,
        name: (_b = (_a = row.name) !== null && _a !== void 0 ? _a : staticEntry === null || staticEntry === void 0 ? void 0 : staticEntry.name) !== null && _b !== void 0 ? _b : row.slug,
        role: (_d = (_c = row.role) !== null && _c !== void 0 ? _c : staticEntry === null || staticEntry === void 0 ? void 0 : staticEntry.role) !== null && _d !== void 0 ? _d : null,
        description: (_f = (_e = row.purpose) !== null && _e !== void 0 ? _e : staticEntry === null || staticEntry === void 0 ? void 0 : staticEntry.description) !== null && _f !== void 0 ? _f : null,
        instructions: (_g = row.instructions) !== null && _g !== void 0 ? _g : null,
        systemPrompt: (_h = row.system_prompt) !== null && _h !== void 0 ? _h : null,
        businessContext: (_j = row.business_context) !== null && _j !== void 0 ? _j : null,
        mode: (_k = row.mode) !== null && _k !== void 0 ? _k : null,
        status: (_l = row.status) !== null && _l !== void 0 ? _l : null,
        isArchived: !!row.is_archived,
        source,
    };
}
function staticToResolved(entry) {
    return {
        id: null,
        slug: entry.slug,
        name: entry.name,
        role: entry.role,
        description: entry.description,
        instructions: null,
        systemPrompt: null,
        businessContext: null,
        mode: null,
        status: null,
        isArchived: false,
        source: "static",
    };
}
export async function listAgents(opts = {}) {
    var _a;
    const supabase = getServiceClient();
    let query = supabase
        .from("agents")
        .select("id, slug, name, role, status, system_prompt, instructions, purpose, business_context, is_archived, mode");
    if (!opts.includeArchived)
        query = query.eq("is_archived", false);
    if (opts.businessContext)
        query = query.eq("business_context", opts.businessContext);
    const { data, error } = await query.order("slug", { ascending: true });
    if (error)
        throw error;
    const rows = (data !== null && data !== void 0 ? data : []);
    const bySlug = new Map();
    for (const row of rows) {
        const manifest = (_a = STATIC_AGENT_MANIFEST[row.slug]) !== null && _a !== void 0 ? _a : null;
        bySlug.set(row.slug, rowToResolved(row, manifest));
    }
    for (const entry of Object.values(STATIC_AGENT_MANIFEST)) {
        if (!bySlug.has(entry.slug)) {
            bySlug.set(entry.slug, staticToResolved(entry));
        }
    }
    return Array.from(bySlug.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}
export async function resolveAgent(slugOrId, opts = {}) {
    var _a;
    if (!slugOrId)
        return null;
    const supabase = getServiceClient();
    const byUuid = isUuid(slugOrId);
    let query = supabase
        .from("agents")
        .select("id, slug, name, role, status, system_prompt, instructions, purpose, business_context, is_archived, mode")
        .limit(1);
    if (byUuid) {
        query = query.eq("id", slugOrId);
    }
    else {
        query = query.eq("slug", slugOrId);
        if (opts.businessContext)
            query = query.eq("business_context", opts.businessContext);
    }
    const { data, error } = await query.maybeSingle();
    if (error)
        throw error;
    if (data) {
        const row = data;
        const manifest = (_a = STATIC_AGENT_MANIFEST[row.slug]) !== null && _a !== void 0 ? _a : null;
        return rowToResolved(row, manifest);
    }
    const fallback = STATIC_AGENT_MANIFEST[slugOrId];
    return fallback ? staticToResolved(fallback) : null;
}
