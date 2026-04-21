export const STAR_ROUTING_VERSION = 2;
const KNOWN_ROUTE_KEYS = [
    "code",
    "ui",
    "crm",
    "outreach",
    "content",
    "analytics",
    "ops",
    "default",
];
function isRouteKey(k) {
    return KNOWN_ROUTE_KEYS.includes(k);
}
export const DEFAULT_STAR_ROUTING = {
    version: STAR_ROUTING_VERSION,
    routes: {
        code: { zirorb_slug: "core", agent_slug: "forge" },
        ui: { zirorb_slug: "core", agent_slug: "ui" },
        ops: { zirorb_slug: "core", agent_slug: "ops" },
        analytics: { zirorb_slug: "core", agent_slug: "qa" },
        outreach: { zirorb_slug: "core", agent_slug: "lead-qualifier" },
        crm: { zirorb_slug: "music-school", agent_slug: null },
        content: { zirorb_slug: "content", agent_slug: null },
        default: { zirorb_slug: "core", agent_slug: null },
    },
    fallback: { behavior: "star" },
    notes: "",
};
function cloneDefaultRouting() {
    return JSON.parse(JSON.stringify(DEFAULT_STAR_ROUTING));
}
export function parseStarRoutingRules(raw) {
    var _a, _b;
    const base = cloneDefaultRouting();
    if (!raw || typeof raw !== "object" || raw === null)
        return base;
    const o = raw;
    if (o.version === STAR_ROUTING_VERSION && o.routes && typeof o.routes === "object") {
        const routes = o.routes;
        for (const k of Object.keys(routes)) {
            if (!isRouteKey(k))
                continue;
            const row = routes[k];
            const prev = base.routes[k];
            if (row && typeof row === "object" && row !== null) {
                const r = row;
                base.routes[k] = {
                    zirorb_slug: typeof r.zirorb_slug === "string" || r.zirorb_slug === null
                        ? r.zirorb_slug
                        : (_a = prev === null || prev === void 0 ? void 0 : prev.zirorb_slug) !== null && _a !== void 0 ? _a : null,
                    agent_slug: typeof r.agent_slug === "string" || r.agent_slug === null
                        ? r.agent_slug
                        : (_b = prev === null || prev === void 0 ? void 0 : prev.agent_slug) !== null && _b !== void 0 ? _b : null,
                };
            }
        }
        if (o.fallback && typeof o.fallback === "object" && o.fallback !== null) {
            const f = o.fallback;
            if (f.behavior === "first_eligible" || f.behavior === "star") {
                base.fallback = {
                    behavior: f.behavior,
                    zirorb_slug: typeof f.zirorb_slug === "string" || f.zirorb_slug === null ? f.zirorb_slug : undefined,
                    agent_slug: typeof f.agent_slug === "string" || f.agent_slug === null ? f.agent_slug : undefined,
                };
            }
        }
        if (typeof o.notes === "string")
            base.notes = o.notes;
    }
    else if (typeof o.notes === "string") {
        base.notes = o.notes;
    }
    return base;
}
function eligibleAgent(a, approvedIds) {
    if (a.is_archived || !a.is_visible_in_ui)
        return false;
    if (!["active", "deployed", "idle", "build_now", "queued"].includes(a.status))
        return false;
    if (approvedIds && approvedIds.length > 0 && !approvedIds.includes(a.id))
        return false;
    return true;
}
function pickInZirorb(members, zirorbId, preferredSlug) {
    const inOrb = members.filter((m) => m.zirorb_id === zirorbId);
    if (preferredSlug) {
        const hit = inOrb.find((m) => m.slug === preferredSlug);
        if (hit)
            return hit;
    }
    return inOrb.sort((a, b) => { var _a, _b; return ((_a = a.zirorb_sort) !== null && _a !== void 0 ? _a : 0) - ((_b = b.zirorb_sort) !== null && _b !== void 0 ? _b : 0) || (a.slug || "").localeCompare(b.slug || ""); })[0] || null;
}
/**
 * Resolve specialist agent from Star Control + live Zirorbs/agents.
 * Returns null → caller should assign Star or use template path.
 */
export function resolveStarControlAgent(params) {
    var _a, _b;
    const { taskType, rules, zirorbs, agents, delegationMode, approvedAgentIds } = params;
    if (delegationMode === "disabled" || delegationMode === "explicit_only") {
        return null;
    }
    const activeZirorbs = zirorbs.filter((z) => z.is_active !== false);
    const zBySlug = new Map(activeZirorbs.map((z) => [z.slug, z]));
    const target = rules.routes[taskType] || rules.routes.default || DEFAULT_STAR_ROUTING.routes.default;
    if (!target)
        return null;
    const tryOrb = (slug, agentSlug, label) => {
        if (!slug) {
            if (agentSlug) {
                const a = agents.find((x) => x.slug === agentSlug && eligibleAgent(x, approvedAgentIds));
                if (a)
                    return { agentId: a.id, reason: `${label}: agent @${agentSlug} (no Orb filter).` };
            }
            return null;
        }
        const z = zBySlug.get(slug);
        if (!z)
            return null;
        const picked = pickInZirorb(agents, z.id, agentSlug !== null && agentSlug !== void 0 ? agentSlug : null);
        if (!picked || !eligibleAgent(picked, approvedAgentIds))
            return null;
        return {
            agentId: picked.id,
            reason: `${label}: ${picked.name} (@${picked.slug}) in Zirorb "${slug}".`,
        };
    };
    const primary = tryOrb(target.zirorb_slug, target.agent_slug, "Star routing");
    if (primary)
        return primary;
    const fb = rules.fallback;
    if ((fb === null || fb === void 0 ? void 0 : fb.behavior) === "first_eligible") {
        const fbHit = tryOrb((_a = fb.zirorb_slug) !== null && _a !== void 0 ? _a : null, (_b = fb.agent_slug) !== null && _b !== void 0 ? _b : null, "Fallback");
        if (fbHit)
            return fbHit;
        const any = agents.find((a) => eligibleAgent(a, approvedAgentIds) && a.slug !== "star");
        if (any)
            return { agentId: any.id, reason: `Fallback: first eligible agent @${any.slug}.` };
    }
    return null;
}
/** Agent ids eligible to run Lessonpreneur-style worker tasks (Star + anyone placed in a Zirorb). */
export async function loadTaskExecutorAgentIds(supabase, businessContext = "music_school") {
    const { data, error } = await supabase
        .from("agents")
        .select("id, slug, zirorb_id, is_archived")
        .eq("business_context", businessContext)
        .eq("is_archived", false);
    if (error || !data) {
        console.error("[ROUTING] loadTaskExecutorAgentIds:", error === null || error === void 0 ? void 0 : error.message);
        return [];
    }
    const ids = new Set();
    for (const row of data) {
        if (row.slug === "star" || row.zirorb_id)
            ids.add(row.id);
    }
    return [...ids];
}
