import type { TaskCategory } from "@/types/orchestrator";
import type { SupabaseClient } from "@supabase/supabase-js";

export const STAR_ROUTING_VERSION = 2 as const;

/** Keys match classifyTask categories plus default. */
export type StarRoutingTaskKey = TaskCategory | "default";

const KNOWN_ROUTE_KEYS: StarRoutingTaskKey[] = [
  "code",
  "ui",
  "crm",
  "outreach",
  "content",
  "analytics",
  "ops",
  "default",
];

function isRouteKey(k: string): k is StarRoutingTaskKey {
  return (KNOWN_ROUTE_KEYS as string[]).includes(k);
}

export interface StarRouteTarget {
  zirorb_slug: string | null;
  agent_slug: string | null;
}

export interface StarRoutingRulesV2 {
  version: typeof STAR_ROUTING_VERSION;
  routes: Partial<Record<StarRoutingTaskKey, StarRouteTarget>>;
  fallback: {
    behavior: "star" | "first_eligible";
    zirorb_slug?: string | null;
    agent_slug?: string | null;
  };
  notes?: string;
}

export const DEFAULT_STAR_ROUTING: StarRoutingRulesV2 = {
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

function cloneDefaultRouting(): StarRoutingRulesV2 {
  return JSON.parse(JSON.stringify(DEFAULT_STAR_ROUTING)) as StarRoutingRulesV2;
}

export function parseStarRoutingRules(raw: unknown): StarRoutingRulesV2 {
  const base = cloneDefaultRouting();
  if (!raw || typeof raw !== "object" || raw === null) return base;
  const o = raw as Record<string, unknown>;
  if (o.version === STAR_ROUTING_VERSION && o.routes && typeof o.routes === "object") {
    const routes = o.routes as Record<string, unknown>;
    for (const k of Object.keys(routes)) {
      if (!isRouteKey(k)) continue;
      const row = routes[k];
      const prev = base.routes[k];
      if (row && typeof row === "object" && row !== null) {
        const r = row as Record<string, unknown>;
        base.routes[k] = {
          zirorb_slug:
            typeof r.zirorb_slug === "string" || r.zirorb_slug === null
              ? (r.zirorb_slug as string | null)
              : prev?.zirorb_slug ?? null,
          agent_slug:
            typeof r.agent_slug === "string" || r.agent_slug === null
              ? (r.agent_slug as string | null)
              : prev?.agent_slug ?? null,
        };
      }
    }
    if (o.fallback && typeof o.fallback === "object" && o.fallback !== null) {
      const f = o.fallback as Record<string, unknown>;
      if (f.behavior === "first_eligible" || f.behavior === "star") {
        base.fallback = {
          behavior: f.behavior,
          zirorb_slug: typeof f.zirorb_slug === "string" || f.zirorb_slug === null ? (f.zirorb_slug as string | null) : undefined,
          agent_slug: typeof f.agent_slug === "string" || f.agent_slug === null ? (f.agent_slug as string | null) : undefined,
        };
      }
    }
    if (typeof o.notes === "string") base.notes = o.notes;
  } else if (typeof o.notes === "string") {
    base.notes = o.notes;
  }
  return base;
}

export type StarControlRow = {
  id: string;
  slug: string;
  zirorb_id: string | null;
  zirorb_sort?: number | null;
  name?: string;
  status: string;
  is_archived: boolean;
  is_visible_in_ui: boolean;
  mode: string | null;
};

export type ZirorbRow = { id: string; slug: string; is_active: boolean | null };

function eligibleAgent(a: StarControlRow, approvedIds: string[] | null | undefined): boolean {
  if (a.is_archived || !a.is_visible_in_ui) return false;
  if (!["active", "deployed", "idle", "build_now", "queued"].includes(a.status)) return false;
  if (approvedIds && approvedIds.length > 0 && !approvedIds.includes(a.id)) return false;
  return true;
}

function pickInZirorb(
  members: StarControlRow[],
  zirorbId: string,
  preferredSlug: string | null
): StarControlRow | null {
  const inOrb = members.filter((m) => m.zirorb_id === zirorbId);
  if (preferredSlug) {
    const hit = inOrb.find((m) => m.slug === preferredSlug);
    if (hit) return hit;
  }
  return inOrb.sort((a, b) => (a.zirorb_sort ?? 0) - (b.zirorb_sort ?? 0) || (a.slug || "").localeCompare(b.slug || ""))[0] || null;
}

/**
 * Resolve specialist agent from Star Control + live Zirorbs/agents.
 * Returns null → caller should assign Star or use template path.
 */
export function resolveStarControlAgent(params: {
  taskType: TaskCategory;
  rules: StarRoutingRulesV2;
  zirorbs: ZirorbRow[];
  agents: StarControlRow[];
  delegationMode: string;
  approvedAgentIds: string[] | null | undefined;
}): { agentId: string; reason: string } | null {
  const { taskType, rules, zirorbs, agents, delegationMode, approvedAgentIds } = params;

  if (delegationMode === "disabled" || delegationMode === "explicit_only") {
    return null;
  }

  const activeZirorbs = zirorbs.filter((z) => z.is_active !== false);
  const zBySlug = new Map(activeZirorbs.map((z) => [z.slug, z]));

  const target = rules.routes[taskType] || rules.routes.default || DEFAULT_STAR_ROUTING.routes.default;
  if (!target) return null;

  const tryOrb = (slug: string | null | undefined, agentSlug: string | null | undefined, label: string): { agentId: string; reason: string } | null => {
    if (!slug) {
      if (agentSlug) {
        const a = agents.find((x) => x.slug === agentSlug && eligibleAgent(x, approvedAgentIds));
        if (a) return { agentId: a.id, reason: `${label}: agent @${agentSlug} (no Orb filter).` };
      }
      return null;
    }
    const z = zBySlug.get(slug);
    if (!z) return null;
    const picked = pickInZirorb(agents, z.id, agentSlug ?? null);
    if (!picked || !eligibleAgent(picked, approvedAgentIds)) return null;
    return {
      agentId: picked.id,
      reason: `${label}: ${picked.name} (@${picked.slug}) in Zirorb "${slug}".`,
    };
  };

  const primary = tryOrb(target.zirorb_slug, target.agent_slug, "Star routing");
  if (primary) return primary;

  const fb = rules.fallback;
  if (fb?.behavior === "first_eligible") {
    const fbHit = tryOrb(fb.zirorb_slug ?? null, fb.agent_slug ?? null, "Fallback");
    if (fbHit) return fbHit;
    const any = agents.find((a) => eligibleAgent(a, approvedAgentIds) && a.slug !== "star");
    if (any) return { agentId: any.id, reason: `Fallback: first eligible agent @${any.slug}.` };
  }

  return null;
}

/** Agent ids eligible to run Lessonpreneur-style worker tasks (Star + anyone placed in a Zirorb). */
export async function loadTaskExecutorAgentIds(
  supabase: SupabaseClient,
  businessContext = "music_school"
): Promise<string[]> {
  const { data, error } = await supabase
    .from("agents")
    .select("id, slug, zirorb_id, is_archived")
    .eq("business_context", businessContext)
    .eq("is_archived", false);

  if (error || !data) {
    console.error("[ROUTING] loadTaskExecutorAgentIds:", error?.message);
    return [];
  }
  const ids = new Set<string>();
  for (const row of data as { id: string; slug: string; zirorb_id: string | null }[]) {
    if (row.slug === "star" || row.zirorb_id) ids.add(row.id);
  }
  return [...ids];
}
