import { listLeads as listLeadsData, getLeadById as getLeadByIdData, } from "@data/leads";
import { listAIConversations } from "@data/aiConversations";
import { listStudents, getStudentById } from "@data/students";
import { listFamilies, getFamilyById } from "@data/families";
const DAY_MS = 1000 * 60 * 60 * 24;
const ACTIVE_STAGES = new Set([
    "new",
    "contacted",
    "qualified",
    "trial",
    "negotiating",
    "assigned",
    "intake",
]);
function daysBetween(fromIso, to) {
    if (!fromIso)
        return 0;
    const from = new Date(fromIso).getTime();
    if (!Number.isFinite(from))
        return 0;
    return Math.max(0, Math.floor((to.getTime() - from) / DAY_MS));
}
function toLeadFilter(filters) {
    if (!filters)
        return undefined;
    const f = {};
    if (filters.stage)
        f.stage = filters.stage;
    if (filters.source)
        f.source = filters.source;
    if (filters.assignedTo)
        f.assigned_to = filters.assignedTo;
    if (filters.locationId)
        f.location_id = filters.locationId;
    return Object.keys(f).length > 0 ? f : undefined;
}
function matchesSearch(lead, search) {
    if (!search)
        return true;
    const q = search.trim().toLowerCase();
    if (!q)
        return true;
    const row = lead;
    const haystack = [
        row.first_name,
        row.last_name,
        row.parent_name,
        row.student_name,
        row.email,
        row.phone,
        row.instrument,
        row.source,
        row.how_heard,
    ]
        .filter((v) => typeof v === "string" && v.length > 0)
        .map((v) => v.toLowerCase());
    return haystack.some((h) => h.includes(q));
}
function scoreLead(lead, meta) {
    var _a, _b;
    const row = lead;
    const hasEmail = typeof row.email === "string" && row.email.length > 0;
    const hasPhone = typeof row.phone === "string" && row.phone.length > 0;
    const hasName = typeof row.first_name === "string" && row.first_name.length > 0;
    const hasInstrument = typeof row.instrument === "string" && row.instrument.length > 0;
    const hasGoals = typeof row.goals === "string" && row.goals.length > 0;
    const hasPreferredTimes = (Array.isArray(row.preferred_days) && row.preferred_days.length > 0) ||
        (typeof row.preferred_times === "string" &&
            row.preferred_times.length > 0);
    const lastContact = (_b = (_a = row.last_contact_at) !== null && _a !== void 0 ? _a : meta.lastActivityAt) !== null && _b !== void 0 ? _b : null;
    const respondedRecently = lastContact
        ? daysBetween(lastContact, new Date()) <= 7
        : false;
    const signals = {
        hasEmail,
        hasPhone,
        hasName,
        hasInstrument,
        hasGoals,
        hasPreferredTimes,
        respondedRecently,
        engagedConversations: meta.conversationCount,
    };
    const weight = {
        hasEmail: 10,
        hasPhone: 10,
        hasName: 5,
        hasInstrument: 15,
        hasGoals: 15,
        hasPreferredTimes: 10,
        respondedRecently: 20,
        engagedConversations: 0,
    };
    let score = 0;
    Object.keys(weight).forEach((key) => {
        const value = signals[key];
        if (key === "engagedConversations") {
            score += Math.min(15, Number(value) * 5);
        }
        else if (value) {
            score += weight[key];
        }
    });
    score = Math.min(100, score);
    const tier = score >= 80 ? "hot" : score >= 50 ? "warm" : "cold";
    const recommendedAction = tier === "hot"
        ? "promote_to_student"
        : tier === "warm"
            ? "schedule_followup"
            : hasEmail || hasPhone
                ? "nurture"
                : "needs_info";
    const reasons = [];
    if (!hasEmail)
        reasons.push("No email on file");
    if (!hasPhone)
        reasons.push("No phone on file");
    if (!hasInstrument)
        reasons.push("Instrument not captured");
    if (!hasGoals)
        reasons.push("Goals/motivation not captured");
    if (!respondedRecently)
        reasons.push("No recent contact in last 7 days");
    if (meta.conversationCount === 0)
        reasons.push("No conversations recorded yet");
    return {
        leadId: lead.id,
        score,
        tier,
        signals,
        recommendedAction,
        scoredAt: new Date().toISOString(),
        reasons,
    };
}
function lastActivityAt(lead, conversations) {
    var _a, _b;
    const row = lead;
    const candidates = [
        row.last_contact_at,
        row.updated_at,
        row.created_at,
    ];
    for (const c of conversations) {
        candidates.push((_b = (_a = c.updated_at) !== null && _a !== void 0 ? _a : c.created_at) !== null && _b !== void 0 ? _b : null);
    }
    let best = null;
    for (const v of candidates) {
        if (!v)
            continue;
        const t = new Date(v).getTime();
        if (!Number.isFinite(t))
            continue;
        if (best == null || t > best)
            best = t;
    }
    return best != null ? new Date(best).toISOString() : null;
}
export async function listLeads(tenantId, filters) {
    const rows = await listLeadsData(tenantId, toLeadFilter(filters), {
        orderBy: "created_at",
        ascending: false,
        limit: 500,
    });
    const filtered = rows.filter((l) => matchesSearch(l, filters === null || filters === void 0 ? void 0 : filters.search));
    const now = new Date();
    return filtered.map((lead) => {
        const qualification = scoreLead(lead, {
            conversationCount: 0,
            lastActivityAt: null,
        });
        return Object.assign(Object.assign({}, lead), { age_days: daysBetween(lead.created_at, now), last_activity_at: lastActivityAt(lead, []), qualification_tier: qualification.tier, qualification_score: qualification.score });
    });
}
export async function getLeadById(leadId, tenantId) {
    return getLeadByIdData(leadId, tenantId);
}
export async function getLeadConversations(leadId, lead, tenantId) {
    var _a, _b;
    const rows = await listAIConversations(tenantId, undefined, { orderBy: "updated_at", ascending: false, limit: 50 });
    const row = lead;
    const email = (_a = row.email) !== null && _a !== void 0 ? _a : null;
    const phone = (_b = row.phone) !== null && _b !== void 0 ? _b : null;
    return rows.filter((c) => {
        const ctx = c.context;
        if (ctx && typeof ctx === "object") {
            const ctxRec = ctx;
            if (ctxRec.leadId === leadId)
                return true;
            if (email && ctxRec.email === email)
                return true;
            if (phone && ctxRec.phone === phone)
                return true;
        }
        const title = c.title;
        if (typeof title === "string" && title.includes(leadId))
            return true;
        return false;
    });
}
export async function getLeadTimeline(leadId, tenantId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
    const lead = await getLeadById(leadId, tenantId);
    if (!lead)
        return [];
    const conversations = await getLeadConversations(leadId, lead, tenantId);
    const row = lead;
    const items = [];
    if (lead.created_at) {
        items.push({
            id: `${leadId}:created`,
            leadId,
            tenantId,
            type: "lead_created",
            at: lead.created_at,
            title: "Lead created",
            detail: (_b = (_a = row.source) !== null && _a !== void 0 ? _a : row.how_heard) !== null && _b !== void 0 ? _b : null,
            source: (_c = row.source) !== null && _c !== void 0 ? _c : null,
            actorId: null,
            metadata: { stage: (_d = row.stage) !== null && _d !== void 0 ? _d : null },
        });
    }
    if (lead.updated_at && lead.updated_at !== lead.created_at) {
        items.push({
            id: `${leadId}:updated`,
            leadId,
            tenantId,
            type: "lead_updated",
            at: lead.updated_at,
            title: "Lead updated",
            detail: null,
            source: null,
            actorId: (_e = row.assigned_to) !== null && _e !== void 0 ? _e : null,
            metadata: {},
        });
    }
    const notes = (_f = row.notes) !== null && _f !== void 0 ? _f : null;
    if (notes && notes.trim().length > 0) {
        items.push({
            id: `${leadId}:note`,
            leadId,
            tenantId,
            type: "note",
            at: (_h = (_g = lead.updated_at) !== null && _g !== void 0 ? _g : lead.created_at) !== null && _h !== void 0 ? _h : new Date().toISOString(),
            title: "Note",
            detail: notes,
            source: "leads.notes",
            actorId: (_j = row.assigned_to) !== null && _j !== void 0 ? _j : null,
            metadata: {},
        });
    }
    const personality = (_k = row.personality_notes) !== null && _k !== void 0 ? _k : null;
    if (personality && personality.trim().length > 0) {
        items.push({
            id: `${leadId}:personality`,
            leadId,
            tenantId,
            type: "note",
            at: (_m = (_l = lead.updated_at) !== null && _l !== void 0 ? _l : lead.created_at) !== null && _m !== void 0 ? _m : new Date().toISOString(),
            title: "Personality notes",
            detail: personality,
            source: "leads.personality_notes",
            actorId: null,
            metadata: {},
        });
    }
    const lastContactAt = (_o = row.last_contact_at) !== null && _o !== void 0 ? _o : null;
    if (lastContactAt) {
        items.push({
            id: `${leadId}:last-contact`,
            leadId,
            tenantId,
            type: "follow_up",
            at: lastContactAt,
            title: "Most recent contact",
            detail: (_p = row.next_action) !== null && _p !== void 0 ? _p : "Follow-up completed",
            source: "leads.last_contact_at",
            actorId: (_q = row.assigned_to) !== null && _q !== void 0 ? _q : null,
            metadata: {
                followUpCount: (_r = row.follow_up_count) !== null && _r !== void 0 ? _r : 0,
            },
        });
    }
    const nextFollowUpAt = (_s = row.next_follow_up_at) !== null && _s !== void 0 ? _s : null;
    if (nextFollowUpAt) {
        items.push({
            id: `${leadId}:next-follow-up`,
            leadId,
            tenantId,
            type: "follow_up",
            at: nextFollowUpAt,
            title: "Next follow-up",
            detail: (_t = row.next_action) !== null && _t !== void 0 ? _t : "Follow-up scheduled",
            source: "leads.next_follow_up_at",
            actorId: (_u = row.assigned_to) !== null && _u !== void 0 ? _u : null,
            metadata: { scheduled: true },
        });
    }
    if (lead.converted_student_id) {
        items.push({
            id: `${leadId}:converted`,
            leadId,
            tenantId,
            type: "conversion",
            at: (_v = lead.updated_at) !== null && _v !== void 0 ? _v : new Date().toISOString(),
            title: "Converted to student",
            detail: `Student ${lead.converted_student_id}`,
            source: "leads.converted_student_id",
            actorId: (_w = row.assigned_to) !== null && _w !== void 0 ? _w : null,
            metadata: { studentId: lead.converted_student_id },
        });
    }
    for (const conv of conversations) {
        const convRow = conv;
        const title = (_y = (_x = convRow.title) !== null && _x !== void 0 ? _x : convRow.source) !== null && _y !== void 0 ? _y : "Conversation";
        items.push({
            id: `${leadId}:conv:${conv.id}`,
            leadId,
            tenantId,
            type: "conversation",
            at: (_0 = (_z = convRow.updated_at) !== null && _z !== void 0 ? _z : convRow.created_at) !== null && _0 !== void 0 ? _0 : new Date().toISOString(),
            title,
            detail: (_1 = convRow.client_route) !== null && _1 !== void 0 ? _1 : null,
            source: "ai_conversations",
            actorId: (_2 = convRow.profile_id) !== null && _2 !== void 0 ? _2 : null,
            metadata: { conversationId: conv.id },
        });
    }
    items.sort((a, b) => {
        const ta = new Date(a.at).getTime();
        const tb = new Date(b.at).getTime();
        if (!Number.isFinite(ta) && !Number.isFinite(tb))
            return 0;
        if (!Number.isFinite(ta))
            return 1;
        if (!Number.isFinite(tb))
            return -1;
        return tb - ta;
    });
    return items;
}
export async function getLeadSourceStats(tenantId) {
    var _a, _b, _c, _d;
    const rows = await listLeadsData(tenantId, undefined, {
        orderBy: "created_at",
        ascending: false,
        limit: 1000,
    });
    const map = new Map();
    for (const lead of rows) {
        const r = lead;
        const src = (_b = (_a = r.source) !== null && _a !== void 0 ? _a : r.how_heard) !== null && _b !== void 0 ? _b : "unknown";
        const stage = (_c = r.stage) !== null && _c !== void 0 ? _c : "new";
        const stat = (_d = map.get(src)) !== null && _d !== void 0 ? _d : {
            source: src,
            total: 0,
            open: 0,
            converted: 0,
            lost: 0,
            conversionRate: 0,
        };
        stat.total += 1;
        if (lead.converted_student_id)
            stat.converted += 1;
        else if (stage === "lost")
            stat.lost += 1;
        else if (ACTIVE_STAGES.has(stage))
            stat.open += 1;
        map.set(src, stat);
    }
    const bySource = Array.from(map.values()).map((s) => (Object.assign(Object.assign({}, s), { conversionRate: s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0 })));
    bySource.sort((a, b) => b.total - a.total);
    return {
        total: rows.length,
        bySource,
        generatedAt: new Date().toISOString(),
    };
}
export async function getLeadQualification(leadId, tenantId) {
    const lead = await getLeadByIdData(leadId, tenantId);
    if (!lead)
        return null;
    const conversations = await getLeadConversations(leadId, lead, tenantId);
    return scoreLead(lead, {
        conversationCount: conversations.length,
        lastActivityAt: lastActivityAt(lead, conversations),
    });
}
export async function getLeadFamily(lead, tenantId) {
    var _a;
    const familyId = lead.family_id;
    if (!familyId)
        return null;
    try {
        const fam = await getFamilyById(familyId, tenantId);
        return (_a = fam) !== null && _a !== void 0 ? _a : null;
    }
    catch (_b) {
        return null;
    }
}
export async function getLeadConvertedStudent(lead, tenantId) {
    if (!lead.converted_student_id)
        return null;
    try {
        return await getStudentById(lead.converted_student_id, tenantId);
    }
    catch (_a) {
        return null;
    }
}
export async function listLeadFamilies(tenantId) {
    return listFamilies(tenantId, undefined, { limit: 500 });
}
export async function listLeadStudents(tenantId) {
    return listStudents(tenantId, undefined, { limit: 500 });
}
export { scoreLead, lastActivityAt, };
