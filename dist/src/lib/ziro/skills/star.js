import { hasKeyword, parseTokens } from "./parse";
function baseMeta(args, extra = {}) {
    return Object.assign({ tenantId: args.tenantId, profileId: args.profileId, conversationId: args.conversationId }, extra);
}
const addLead = {
    title: "Add Lead",
    description: "Capture a new lead from a natural-language description.",
    async handler(args) {
        const tokens = parseTokens(args.input);
        const lead = {
            name: tokens.name,
            email: tokens.email,
            phone: tokens.phone,
            notes: tokens.raw || null,
            source: "chat",
            status: "new",
            capturedBy: args.profileId,
            tenantId: args.tenantId,
        };
        const required = ["name", "email", "phone"];
        const missing = required.filter((k) => !lead[k]);
        return {
            result: {
                action: "add_lead",
                status: missing.length === 0 ? "captured" : "needs_info",
                lead,
                missing,
            },
            metadata: baseMeta(args, { tokens }),
        };
    },
};
const hotLeads = {
    title: "Hot Leads",
    description: "Summarize the most engaged leads for follow-up prioritization.",
    async handler(args) {
        const tokens = parseTokens(args.input);
        const windowDays = tokens.keywords.includes("month") ? 30 : tokens.keywords.includes("week") ? 7 : 14;
        return {
            result: {
                action: "hot_leads",
                criteria: {
                    windowDays,
                    signalKeywords: tokens.keywords,
                    minEngagementScore: 70,
                },
                ordering: [
                    { field: "engagement_score", direction: "desc" },
                    { field: "last_touch_at", direction: "desc" },
                ],
            },
            metadata: baseMeta(args, { tokens }),
        };
    },
};
const qualifyLead = {
    title: "Qualify Lead",
    description: "Score a lead against qualification criteria and recommend next action.",
    async handler(args) {
        const tokens = parseTokens(args.input);
        const signals = {
            hasEmail: !!tokens.email,
            hasPhone: !!tokens.phone,
            hasName: !!tokens.name,
            mentionsBudget: hasKeyword(tokens.raw, ["budget", "afford", "pay", "price"]),
            mentionsTimeline: hasKeyword(tokens.raw, ["soon", "week", "month", "asap", "today"]),
            mentionsInterest: hasKeyword(tokens.raw, ["interested", "want", "ready", "lesson", "class"]),
        };
        const weight = {
            hasEmail: 10,
            hasPhone: 10,
            hasName: 5,
            mentionsBudget: 25,
            mentionsTimeline: 25,
            mentionsInterest: 25,
        };
        const score = Object.keys(signals)
            .reduce((acc, k) => acc + (signals[k] ? weight[k] : 0), 0);
        const tier = score >= 80 ? "hot" : score >= 50 ? "warm" : "cold";
        const nextAction = tier === "hot" ? "promote_to_student" : tier === "warm" ? "schedule_followup" : "nurture";
        return {
            result: {
                action: "qualify_lead",
                leadId: tokens.id,
                score,
                tier,
                signals,
                nextAction,
            },
            metadata: baseMeta(args, { tokens }),
        };
    },
};
const promoteLead = {
    title: "Promote Lead",
    description: "Promote a qualified lead to a student and prepare onboarding intent.",
    async handler(args) {
        const tokens = parseTokens(args.input);
        const ready = !!tokens.id || (!!tokens.name && (!!tokens.email || !!tokens.phone));
        return {
            result: {
                action: "promote_lead",
                status: ready ? "ready" : "needs_lead_reference",
                leadId: tokens.id,
                target: {
                    name: tokens.name,
                    email: tokens.email,
                    phone: tokens.phone,
                    tenantId: args.tenantId,
                },
                onboarding: {
                    createStudent: true,
                    createFamily: !!tokens.name,
                    scheduleIntro: true,
                },
            },
            metadata: baseMeta(args, { tokens }),
        };
    },
};
const findLeadDuplicates = {
    title: "Find Lead Duplicates",
    description: "Identify candidate duplicates using email, phone, and name similarity.",
    async handler(args) {
        const tokens = parseTokens(args.input);
        const checks = [];
        if (tokens.email)
            checks.push({ field: "email", value: tokens.email, strategy: "exact_lower" });
        if (tokens.phone)
            checks.push({ field: "phone", value: tokens.phone.replace(/\D/g, ""), strategy: "digits_only" });
        if (tokens.name)
            checks.push({ field: "name", value: tokens.name, strategy: "trigram_similarity" });
        return {
            result: {
                action: "find_lead_duplicates",
                checks,
                threshold: 0.7,
                scope: { tenantId: args.tenantId },
            },
            metadata: baseMeta(args, { tokens }),
        };
    },
};
export const star = {
    addLead,
    hotLeads,
    qualifyLead,
    promoteLead,
    findLeadDuplicates,
};
export default star;
