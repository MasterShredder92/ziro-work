import { getServiceClient } from "@/lib/supabase";

export type StaticAgentManifestEntry = {
  slug: string;
  name: string;
  role: string;
  description: string;
};

export type ResolvedAgent = {
  id: string | null;
  slug: string;
  name: string;
  role: string | null;
  description: string | null;
  instructions: string | null;
  systemPrompt: string | null;
  businessContext: string | null;
  mode: string | null;
  status: string | null;
  isArchived: boolean;
  source: "db" | "static" | "merged";
};

type AgentRow = {
  id: string;
  slug: string;
  name: string | null;
  role: string | null;
  status: string | null;
  system_prompt: string | null;
  instructions: string | null;
  purpose: string | null;
  business_context: string | null;
  is_archived: boolean | null;
  mode: string | null;
};

export const STATIC_AGENT_MANIFEST: Record<string, StaticAgentManifestEntry> = {
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function rowToResolved(
  row: AgentRow,
  staticEntry: StaticAgentManifestEntry | null,
): ResolvedAgent {
  const source: ResolvedAgent["source"] = staticEntry ? "merged" : "db";
  return {
    id: row.id,
    slug: row.slug,
    name: row.name ?? staticEntry?.name ?? row.slug,
    role: row.role ?? staticEntry?.role ?? null,
    description: row.purpose ?? staticEntry?.description ?? null,
    instructions: row.instructions ?? null,
    systemPrompt: row.system_prompt ?? null,
    businessContext: row.business_context ?? null,
    mode: row.mode ?? null,
    status: row.status ?? null,
    isArchived: !!row.is_archived,
    source,
  };
}

function staticToResolved(entry: StaticAgentManifestEntry): ResolvedAgent {
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

export type ListAgentsOptions = {
  businessContext?: string | null;
  includeArchived?: boolean;
};

export async function listAgents(
  opts: ListAgentsOptions = {},
): Promise<ResolvedAgent[]> {
  const supabase = getServiceClient();
  let query = supabase
    .from("agents")
    .select(
      "id, slug, name, role, status, system_prompt, instructions, purpose, business_context, is_archived, mode",
    );

  if (!opts.includeArchived) query = query.eq("is_archived", false);
  if (opts.businessContext)
    query = query.eq("business_context", opts.businessContext);

  const { data, error } = await query.order("slug", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as AgentRow[];
  const bySlug = new Map<string, ResolvedAgent>();

  for (const row of rows) {
    const manifest = STATIC_AGENT_MANIFEST[row.slug] ?? null;
    bySlug.set(row.slug, rowToResolved(row, manifest));
  }

  for (const entry of Object.values(STATIC_AGENT_MANIFEST)) {
    if (!bySlug.has(entry.slug)) {
      bySlug.set(entry.slug, staticToResolved(entry));
    }
  }

  return Array.from(bySlug.values()).sort((a, b) =>
    a.slug.localeCompare(b.slug),
  );
}

export type ResolveAgentOptions = {
  businessContext?: string | null;
};

export async function resolveAgent(
  slugOrId: string,
  opts: ResolveAgentOptions = {},
): Promise<ResolvedAgent | null> {
  if (!slugOrId) return null;

  const supabase = getServiceClient();
  const byUuid = isUuid(slugOrId);

  let query = supabase
    .from("agents")
    .select(
      "id, slug, name, role, status, system_prompt, instructions, purpose, business_context, is_archived, mode",
    )
    .limit(1);

  if (byUuid) {
    query = query.eq("id", slugOrId);
  } else {
    query = query.eq("slug", slugOrId);
    if (opts.businessContext)
      query = query.eq("business_context", opts.businessContext);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;

  if (data) {
    const row = data as AgentRow;
    const manifest = STATIC_AGENT_MANIFEST[row.slug] ?? null;
    return rowToResolved(row, manifest);
  }

  const fallback = STATIC_AGENT_MANIFEST[slugOrId];
  return fallback ? staticToResolved(fallback) : null;
}
