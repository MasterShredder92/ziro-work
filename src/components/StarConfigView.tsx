"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Loader2,
  Star,
  Save,
  AlertTriangle,
  Bot,
  Zap,
  Check,
  Orbit,
  Map as MapIcon,
  Users,
  Layers,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Power,
  PowerOff,
  Network,
} from "lucide-react";
import clsx from "clsx";
import ZirorbFormModal, { type ZirorbRecord } from "@/components/ZirorbFormModal";
import {
  parseStarRoutingRules,
  STAR_ROUTING_VERSION,
  type StarRoutingRulesV2,
  type StarRoutingTaskKey,
} from "@/lib/routing/starRouting";

// ── Types ──

interface StarConfig {
  id: string;
  business_context: string;
  instructions: string | null;
  routing_rules: Record<string, unknown>;
  default_skill_ids: string[];
  approved_agent_ids: string[];
  delegation_mode: "auto" | "explicit_only" | "disabled";
  created_at: string;
  updated_at: string;
}

interface AgentRow {
  id: string;
  name: string;
  slug: string;
  role: string;
  status: string;
  auto_use_by_star: boolean;
  color: string;
  zirorb_id: string | null;
  is_archived?: boolean;
}

interface SkillOption {
  id: string;
  name: string;
  key: string;
  is_active: boolean;
}

const TASK_ROUTE_EDIT_KEYS: StarRoutingTaskKey[] = [
  "code",
  "ui",
  "crm",
  "outreach",
  "content",
  "analytics",
  "ops",
];

const TASK_ROUTE_LABELS: Record<string, string> = {
  code: "Code / build / deploy",
  ui: "UI / layout / polish",
  crm: "Music school (enrollment, billing, families)",
  outreach: "Leads & outreach",
  content: "Content & narrative",
  analytics: "Reports & QA-style checks",
  ops: "Operations & scheduling",
  default: "Everything else",
};

export type StarControlNavProps = {
  /** Open Organization map; optionally focus a Zirorb overlay (or Unassigned). */
  onOpenOrganization: (focusZirorbId?: string | "unassigned" | null) => void;
  /** Open Agents list; optionally pre-filter to a Zirorb. */
  onOpenAgents: (filterZirorbId?: string | null) => void;
};

export default function StarConfigView({ onOpenOrganization, onOpenAgents }: StarControlNavProps) {
  const [config, setConfig] = useState<StarConfig | null>(null);
  const [allAgents, setAllAgents] = useState<AgentRow[]>([]);
  const [starAgent, setStarAgent] = useState<AgentRow | null>(null);
  const [zirorbs, setZirorbs] = useState<ZirorbRecord[]>([]);
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zirorbModal, setZirorbModal] = useState<"create" | ZirorbRecord | null>(null);

  const [instructions, setInstructions] = useState("");
  const [delegationMode, setDelegationMode] = useState<string>("auto");
  const [approvedAgentIds, setApprovedAgentIds] = useState<string[]>([]);
  const [defaultSkillIds, setDefaultSkillIds] = useState<string[]>([]);
  const [routingNotes, setRoutingNotes] = useState("");
  const [routingV2, setRoutingV2] = useState<StarRoutingRulesV2>(() => parseStarRoutingRules(null));

  const loadData = useCallback(async () => {
    setLoading(true);
    const [configRes, agentsRes, skillsRes, zRes] = await Promise.all([
      fetch("/api/star-config?context=music_school"),
      fetch("/api/agents?context=music_school&status=all&include_archived=true"),
      fetch("/api/skills?status=active&context=music_school"),
      fetch("/api/zirorbs"),
    ]);

    const configData = await configRes.json();
    const agentsData = await agentsRes.json();
    const skillsData = await skillsRes.json();
    const zData = await zRes.json();

    if (configData && !configData.error) {
      setConfig(configData);
      setInstructions(configData.instructions || "");
      setDelegationMode(configData.delegation_mode || "auto");
      setApprovedAgentIds(configData.approved_agent_ids || []);
      setDefaultSkillIds(configData.default_skill_ids || []);
      const rr = configData.routing_rules;
      setRoutingV2(parseStarRoutingRules(rr));
      const notes =
        rr && typeof rr === "object" && rr !== null && "notes" in rr && typeof (rr as { notes?: unknown }).notes === "string"
          ? String((rr as { notes: string }).notes)
          : "";
      setRoutingNotes(notes);
    }

    const raw = Array.isArray(agentsData) ? agentsData : [];
    const rows: AgentRow[] = raw.map((a: AgentRow) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      role: a.role,
      status: a.status,
      auto_use_by_star: a.auto_use_by_star,
      color: a.color,
      zirorb_id: a.zirorb_id ?? null,
      is_archived: Boolean(a.is_archived),
    }));
    setStarAgent(rows.find((a) => a.slug === "star") || null);
    setAllAgents(rows.filter((a) => a.slug !== "star"));
    setSkills(Array.isArray(skillsData) ? skillsData : []);
    setZirorbs(Array.isArray(zData) ? zData : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const specialistAgents = useMemo(
    () => allAgents.filter((a) => !a.is_archived && a.status !== "retired"),
    [allAgents]
  );

  const agentsForApproval = specialistAgents;

  const agentCountByZirorbId = useMemo(() => {
    const m = new Map<string, number>();
    for (const z of zirorbs) m.set(String(z.id), 0);
    let unassigned = 0;
    for (const a of specialistAgents) {
      const rid = a.zirorb_id != null && String(a.zirorb_id).trim() !== "" ? String(a.zirorb_id).trim() : null;
      if (rid && m.has(rid)) m.set(rid, (m.get(rid) || 0) + 1);
      else unassigned += 1;
    }
    m.set("__unassigned__", unassigned);
    return m;
  }, [zirorbs, specialistAgents]);

  const totalSpecialistCount = specialistAgents.length;

  const agentsInZirorbSlug = useCallback(
    (slug: string | null | undefined) => {
      if (!slug) return [];
      const z = zirorbs.find((x) => x.slug === slug);
      if (!z) return [];
      return specialistAgents.filter((a) => String(a.zirorb_id) === String(z.id));
    },
    [zirorbs, specialistAgents]
  );

  const setRouteTarget = useCallback((key: StarRoutingTaskKey, next: { zirorb_slug?: string | null; agent_slug?: string | null }) => {
    setRoutingV2((prev) => {
      const cur = prev.routes[key] || { zirorb_slug: null, agent_slug: null };
      return {
        ...prev,
        routes: {
          ...prev.routes,
          [key]: {
            zirorb_slug: next.zirorb_slug !== undefined ? next.zirorb_slug : cur.zirorb_slug,
            agent_slug: next.agent_slug !== undefined ? next.agent_slug : cur.agent_slug,
          },
        },
      };
    });
  }, []);

  async function handleSave() {
    setError(null);
    setSaving(true);
    setSaved(false);

    const mergedRules: Record<string, unknown> = {
      ...(config?.routing_rules && typeof config.routing_rules === "object" ? { ...config.routing_rules } : {}),
      version: STAR_ROUTING_VERSION,
      routes: routingV2.routes,
      fallback: routingV2.fallback,
      notes: routingNotes || "",
    };

    const res = await fetch("/api/star-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_context: "music_school",
        instructions: instructions || null,
        delegation_mode: delegationMode,
        approved_agent_ids: approvedAgentIds,
        default_skill_ids: defaultSkillIds,
        routing_rules: mergedRules,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }

    const updated = await res.json();
    setConfig(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function setZirorbActive(z: ZirorbRecord, active: boolean) {
    const res = await fetch("/api/zirorbs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: z.id, is_active: active }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Could not update Zirorb");
      return;
    }
    await loadData();
  }

  async function deleteZirorb(z: ZirorbRecord) {
    if (!confirm(`Delete Zirorb “${z.name}”? Agents become Unassigned.`)) return;
    const res = await fetch("/api/zirorbs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: z.id }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Delete failed");
      return;
    }
    await loadData();
  }

  function toggleAgent(agentId: string) {
    setApprovedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  }

  function toggleSkill(skillId: string) {
    setDefaultSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-[#505055]" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#12121a] via-[#0c0c10] to-[#08080c] px-5 py-6 md:px-8 md:py-8 shadow-[0_0_0_1px_rgba(245,158,11,0.12),0_24px_80px_rgba(0,0,0,0.45)]">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, rgba(245,158,11,0.35), transparent 70%)" }}
          />
          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#f59e0b]/35 bg-[#f59e0b]/10">
                <Star size={22} className="text-[#f59e0b]" fill="#f59e0b" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#f4f4f5]">Star Control Center</h1>
                <p className="text-sm text-[#808088] mt-1 max-w-xl leading-relaxed">
                  One control layer for Star, Zirorbs, and routing — same data as Organization and Agents. Edit Orb
                  structure here or on the map; manage agents in Agents.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenOrganization(null)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#a855f7]/35 bg-[#a855f7]/10 px-4 py-2.5 text-sm font-semibold text-[#e9d5ff] hover:bg-[#a855f7]/18 transition-colors"
              >
                <MapIcon size={16} />
                Open Organization
              </button>
              <button
                type="button"
                onClick={() => onOpenAgents(null)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-[#e0e0e8] hover:bg-white/[0.08] transition-colors"
              >
                <Users size={16} />
                Open Agents
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00ff88] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#33ffaa] transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
                {saving ? "Saving…" : saved ? "Saved" : "Save Star config"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-[#ff9999] bg-[#ff4444]/10 border border-[#ff4444]/25 rounded-xl px-4 py-3">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Star Identity */}
          <section className="rounded-2xl border border-white/[0.06] bg-[#0a0a0e]/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 mb-4">
              <Star size={18} className="text-[#f59e0b]" />
              <h2 className="text-base font-bold text-[#f0f0f0]">Star identity</h2>
            </div>
            <p className="text-xs text-[#606068] mb-4">
              Live fields from the Star agent record; orchestration prompt is maintained here (single source for
              runtime instructions).
            </p>
            <div className="grid gap-3 sm:grid-cols-2 mb-4">
              <div className="rounded-xl border border-[#1c1c1e] bg-[#060608] px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-[#505058]">Name</div>
                <div className="text-sm font-medium text-[#f0f0f0] truncate">{starAgent?.name || "—"}</div>
              </div>
              <div className="rounded-xl border border-[#1c1c1e] bg-[#060608] px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-[#505058]">Status</div>
                <div className="text-sm font-medium text-[#a0a0a8]">{starAgent?.status || "—"}</div>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-[#1c1c1e] bg-[#060608] px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-[#505058]">Role</div>
                <div className="text-sm text-[#d0d0d8]">{starAgent?.role || "—"}</div>
              </div>
            </div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707078] mb-2">
              Instructions (canonical)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="You are STAR…"
              rows={8}
              className="w-full rounded-xl border border-[#232326] bg-[#050508] px-4 py-3 text-sm text-[#f0f0f0] outline-none focus:border-[#f59e0b]/40 placeholder-[#505055] resize-none"
            />
          </section>

          {/* Orb architecture */}
          <section className="rounded-2xl border border-white/[0.06] bg-[#0a0a0e]/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Layers size={18} className="text-[#a855f7] shrink-0" />
                <h2 className="text-base font-bold text-[#f0f0f0]">Orb architecture</h2>
              </div>
              <button
                type="button"
                onClick={() => setZirorbModal("create")}
                className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-[#00ff88]/25 bg-[#00ff88]/10 px-3 py-1.5 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/18"
              >
                <Plus size={14} />
                New Zirorb
              </button>
            </div>
            <p className="text-xs text-[#606068] mb-4">
              Same Zirorbs as Organization. Toggle active to dim a cluster on the map without deleting it.
            </p>
            <ul className="space-y-2">
              {zirorbs.map((z) => {
                const count = agentCountByZirorbId.get(String(z.id)) ?? 0;
                const active = z.is_active !== false;
                return (
                  <li
                    key={z.id}
                    className={clsx(
                      "flex flex-wrap items-center gap-3 rounded-xl border px-3 py-3 transition-colors",
                      active ? "border-white/[0.08] bg-[#060608]" : "border-[#3a3020] bg-[#0a0806] opacity-80"
                    )}
                  >
                    <span
                      className="h-9 w-9 shrink-0 rounded-lg border border-white/[0.08]"
                      style={{ backgroundColor: `${z.accent_color}22`, boxShadow: `inset 0 0 0 1px ${z.accent_color}44` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#f0f0f0] truncate">{z.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#808088] font-mono">{z.slug}</span>
                        {!active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f59e0b]/15 text-[#fbbf24]">Inactive</span>
                        )}
                      </div>
                      <div className="text-xs text-[#606068] mt-0.5">
                        {z.family === "core" ? "Core" : "Vertical"} · {count} agent{count === 1 ? "" : "s"}
                      </div>
                      {z.description && (
                        <p className="text-[11px] text-[#505058] mt-1 line-clamp-2">{z.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenOrganization(z.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] px-2 py-1 text-[11px] text-[#c0c0c8] hover:bg-white/5"
                      >
                        <MapIcon size={12} />
                        Map
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAgents(z.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] px-2 py-1 text-[11px] text-[#c0c0c8] hover:bg-white/5"
                      >
                        <Users size={12} />
                        Agents
                      </button>
                      <button
                        type="button"
                        onClick={() => setZirorbModal(z)}
                        className="p-1.5 rounded-lg text-[#707078] hover:bg-white/5 hover:text-[#f0f0f0]"
                        aria-label={`Edit ${z.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void setZirorbActive(z, !active)}
                        className="p-1.5 rounded-lg text-[#707078] hover:bg-white/5"
                        title={active ? "Deactivate" : "Activate"}
                      >
                        {active ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteZirorb(z)}
                        className="p-1.5 rounded-lg text-[#707078] hover:bg-[#ff4444]/15 hover:text-[#ff8888]"
                        aria-label={`Delete ${z.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Agent system access */}
        <section className="rounded-2xl border border-white/[0.06] bg-[#0a0a0e]/90 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Network size={18} className="text-[#34d399]" />
              <h2 className="text-base font-bold text-[#f0f0f0]">Agent system access</h2>
            </div>
            <button
              type="button"
              onClick={() => onOpenAgents(null)}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-[#34d399]/30 bg-[#34d399]/10 px-4 py-2 text-sm font-semibold text-[#a7f3d0] hover:bg-[#34d399]/18"
            >
              <ExternalLink size={16} />
              Manage all agents
            </button>
          </div>
          <p className="text-xs text-[#606068] mb-4">
            Totals mirror the Agents screen (non-retired specialists). Unassigned counts agents without a matching Zirorb.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-[#060608] px-4 py-3 text-center">
              <div className="text-2xl font-extrabold text-[#f0f0f0]">{totalSpecialistCount}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#505058] mt-1">Specialists</div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#060608] px-4 py-3 text-center">
              <div className="text-2xl font-extrabold text-[#fbbf24]">{agentCountByZirorbId.get("__unassigned__") ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#505058] mt-1">Unassigned</div>
            </div>
            {zirorbs.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => onOpenAgents(z.id)}
                className="rounded-xl border border-white/[0.08] bg-[#060608] px-3 py-3 text-left hover:border-[#a855f7]/35 transition-colors"
              >
                <div className="text-lg font-bold text-[#f0f0f0]">{agentCountByZirorbId.get(String(z.id)) ?? 0}</div>
                <div className="text-[11px] text-[#707078] truncate mt-0.5">{z.name}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Routing */}
        <section className="rounded-2xl border border-white/[0.06] bg-[#0a0a0e]/90 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Orbit size={18} className="text-[#60a5fa]" />
            <h2 className="text-base font-bold text-[#f0f0f0]">Routing & logic</h2>
          </div>
          <p className="text-xs text-[#606068] mb-4">
            Delegation mode decides whether these routes run. When Auto is on, Star sends work to the Orb and agent you
            pick here — inactive Orbs are skipped automatically. Same rules power the live <code className="text-[#909098]">routeTask</code>{" "}
            pipeline.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
            {(
              [
                { value: "auto", label: "Auto", desc: "Delegate when routes match approved agents.", color: "#00ff88" },
                {
                  value: "explicit_only",
                  label: "Explicit only",
                  desc: "Only when the user picks an agent.",
                  color: "#f59e0b",
                },
                { value: "disabled", label: "Disabled", desc: "Star handles work directly.", color: "#ff4444" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDelegationMode(opt.value)}
                className={clsx(
                  "p-4 rounded-xl border text-left transition-all",
                  delegationMode === opt.value
                    ? "border-[#00ff88]/40 bg-[#00ff88]/5"
                    : "border-[#1c1c1e] bg-[#060608] hover:border-[#3a3a3e]"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: opt.color }} />
                  <span className={clsx("text-sm font-semibold", delegationMode === opt.value ? "text-white" : "text-[#a0a0a8]")}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs text-[#606068]">{opt.desc}</p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#060608] overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#e4e4ea]">Task → Orb → agent</h3>
              <span className="text-[11px] text-[#606068]">“Anyone in Orb” picks the first eligible agent in that cluster.</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[#606068] border-b border-white/[0.06]">
                    <th className="px-4 py-2 font-medium">When the task looks like…</th>
                    <th className="px-4 py-2 font-medium">Orb</th>
                    <th className="px-4 py-2 font-medium">Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {TASK_ROUTE_EDIT_KEYS.map((key) => {
                    const row = routingV2.routes[key];
                    const slug = row?.zirorb_slug ?? "";
                    const members = agentsInZirorbSlug(slug);
                    return (
                      <tr key={key} className="border-b border-white/[0.04] last:border-0">
                        <td className="px-4 py-3 text-[#c8c8d0] align-top">
                          <div className="font-medium text-[#f0f0f0]">{TASK_ROUTE_LABELS[key] || key}</div>
                          <div className="text-[11px] text-[#505058] mt-0.5 font-mono">{key}</div>
                        </td>
                        <td className="px-4 py-3 align-top min-w-[140px]">
                          <select
                            value={slug}
                            onChange={(e) => {
                              const v = e.target.value || null;
                              setRouteTarget(key, { zirorb_slug: v, agent_slug: null });
                            }}
                            className="w-full max-w-[220px] rounded-lg border border-[#2a2a30] bg-[#0a0a0e] px-2 py-1.5 text-xs text-[#f0f0f0]"
                          >
                            <option value="">—</option>
                            {zirorbs.map((z) => (
                              <option key={z.id} value={z.slug}>
                                {z.name}
                                {z.is_active === false ? " (inactive)" : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 align-top min-w-[160px]">
                          <select
                            value={row?.agent_slug ?? ""}
                            onChange={(e) => setRouteTarget(key, { agent_slug: e.target.value || null })}
                            disabled={!slug}
                            className="w-full max-w-[240px] rounded-lg border border-[#2a2a30] bg-[#0a0a0e] px-2 py-1.5 text-xs text-[#f0f0f0] disabled:opacity-40"
                          >
                            <option value="">Anyone in this Orb</option>
                            {members.map((a) => (
                              <option key={a.id} value={a.slug}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="px-4 py-3 text-[#c8c8d0] align-top">
                      <div className="font-medium text-[#f0f0f0]">{TASK_ROUTE_LABELS.default}</div>
                      <div className="text-[11px] text-[#505058] mt-0.5 font-mono">default</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select
                        value={routingV2.routes.default?.zirorb_slug ?? ""}
                        onChange={(e) => {
                          const v = e.target.value || null;
                          setRouteTarget("default", { zirorb_slug: v, agent_slug: null });
                        }}
                        className="w-full max-w-[220px] rounded-lg border border-[#2a2a30] bg-[#0a0a0e] px-2 py-1.5 text-xs text-[#f0f0f0]"
                      >
                        <option value="">—</option>
                        {zirorbs.map((z) => (
                          <option key={z.id} value={z.slug}>
                            {z.name}
                            {z.is_active === false ? " (inactive)" : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select
                        value={routingV2.routes.default?.agent_slug ?? ""}
                        onChange={(e) => setRouteTarget("default", { agent_slug: e.target.value || null })}
                        disabled={!routingV2.routes.default?.zirorb_slug}
                        className="w-full max-w-[240px] rounded-lg border border-[#2a2a30] bg-[#0a0a0e] px-2 py-1.5 text-xs text-[#f0f0f0] disabled:opacity-40"
                      >
                        <option value="">Anyone in this Orb</option>
                        {agentsInZirorbSlug(routingV2.routes.default?.zirorb_slug ?? null).map((a) => (
                          <option key={a.id} value={a.slug}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#060608] px-4 py-4 mb-6 space-y-3">
            <h3 className="text-sm font-semibold text-[#e4e4ea]">If the primary target is missing</h3>
            <p className="text-xs text-[#606068]">
              Example: Orb is turned off, empty, or the agent is not approved — Star uses this backup instead of failing
              silently.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <select
                value={routingV2.fallback.behavior}
                onChange={(e) =>
                  setRoutingV2((prev) => ({
                    ...prev,
                    fallback: {
                      ...prev.fallback,
                      behavior: e.target.value as "star" | "first_eligible",
                    },
                  }))
                }
                className="rounded-lg border border-[#2a2a30] bg-[#0a0a0e] px-3 py-2 text-sm text-[#f0f0f0]"
              >
                <option value="star">Send to STAR</option>
                <option value="first_eligible">Try another Orb / first specialist</option>
              </select>
              {routingV2.fallback.behavior === "first_eligible" && (
                <>
                  <select
                    value={routingV2.fallback.zirorb_slug ?? ""}
                    onChange={(e) =>
                      setRoutingV2((prev) => ({
                        ...prev,
                        fallback: {
                          ...prev.fallback,
                          zirorb_slug: e.target.value || null,
                          agent_slug: null,
                        },
                      }))
                    }
                    className="rounded-lg border border-[#2a2a30] bg-[#0a0a0e] px-3 py-2 text-sm text-[#f0f0f0]"
                  >
                    <option value="">Any Orb</option>
                    {zirorbs.map((z) => (
                      <option key={z.id} value={z.slug}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={routingV2.fallback.agent_slug ?? ""}
                    onChange={(e) =>
                      setRoutingV2((prev) => ({
                        ...prev,
                        fallback: { ...prev.fallback, agent_slug: e.target.value || null },
                      }))
                    }
                    className="rounded-lg border border-[#2a2a30] bg-[#0a0a0e] px-3 py-2 text-sm text-[#f0f0f0]"
                  >
                    <option value="">Anyone in fallback Orb</option>
                    {agentsInZirorbSlug(routingV2.fallback.zirorb_slug ?? null).map((a) => (
                      <option key={a.id} value={a.slug}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707078] mb-2">
            Playbook notes (optional reminders)
          </label>
          <textarea
            value={routingNotes}
            onChange={(e) => setRoutingNotes(e.target.value)}
            placeholder="Short reminders for humans (not parsed as rules)."
            rows={3}
            className="w-full rounded-xl border border-[#232326] bg-[#050508] px-4 py-3 text-sm text-[#f0f0f0] outline-none focus:border-[#60a5fa]/40 placeholder-[#505055] resize-none"
          />
        </section>

        {/* Approved agents */}
        <section className="rounded-2xl border border-white/[0.06] bg-[#0a0a0e]/90 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-[#a855f7]" />
              <h2 className="text-base font-bold text-[#f0f0f0]">Approved for delegation</h2>
            </div>
            <span className="text-xs text-[#606068]">
              {approvedAgentIds.length} / {agentsForApproval.length}
            </span>
          </div>
          <p className="text-xs text-[#606068] mb-4">
            Star may only route to checked agents (in addition to Orb membership on the board). Edit profiles in Agents.
          </p>
          {agentsForApproval.length === 0 ? (
            <div className="text-sm text-[#505055] py-6 text-center rounded-xl border border-dashed border-[#2a2a30]">
              No agents. Create them in Agents.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {agentsForApproval.map((agent) => {
                const isApproved = approvedAgentIds.includes(agent.id);
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => toggleAgent(agent.id)}
                    className={clsx(
                      "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                      isApproved ? "border-[#a855f7]/35 bg-[#a855f7]/8" : "border-[#1c1c1e] bg-[#060608] hover:border-[#3a3a3e]"
                    )}
                  >
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: agent.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#f0f0f0] truncate">{agent.name}</span>
                        {agent.auto_use_by_star && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-[#f59e0b]/15 text-[#fbbf24]">auto</span>
                        )}
                      </div>
                      <p className="text-xs text-[#606068] truncate">{agent.role}</p>
                    </div>
                    <div
                      className={clsx(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                        isApproved ? "bg-[#a855f7] border-[#a855f7] text-white" : "border-[#2a2a30] text-[#3a3a3e]"
                      )}
                    >
                      {isApproved && <Check size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Default skills */}
        <section className="rounded-2xl border border-white/[0.06] bg-[#0a0a0e]/90 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-[#00ff88]" />
              <h2 className="text-base font-bold text-[#f0f0f0]">Default skills</h2>
            </div>
            <span className="text-xs text-[#606068]">
              {defaultSkillIds.length} / {skills.length}
            </span>
          </div>
          <p className="text-xs text-[#606068] mb-4">Skills Star keeps available when operating directly (not per-agent skills).</p>
          {skills.length === 0 ? (
            <div className="text-sm text-[#505055] py-6 text-center">No active skills.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
              {skills.map((skill) => {
                const isSelected = defaultSkillIds.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className={clsx(
                      "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                      isSelected ? "border-[#00ff88]/35 bg-[#00ff88]/8" : "border-[#1c1c1e] bg-[#060608] hover:border-[#3a3a3e]"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border",
                        isSelected ? "bg-[#00ff88] border-[#00ff88] text-black" : "border-[#2a2a30] text-[#3a3a3e]"
                      )}
                    >
                      {isSelected && <Check size={12} />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[#f0f0f0] block truncate">{skill.name}</span>
                      <span className="text-xs text-[#505055] font-mono truncate block">{skill.key}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {config && (
          <p className="text-xs text-[#505055] text-right pb-4">Last updated: {new Date(config.updated_at).toLocaleString()}</p>
        )}
      </div>

      {zirorbModal && (
        <ZirorbFormModal
          key={zirorbModal === "create" ? "create" : zirorbModal.id}
          mode={zirorbModal === "create" ? "create" : "edit"}
          zirorb={zirorbModal === "create" ? null : zirorbModal}
          onClose={() => setZirorbModal(null)}
          onSaved={() => {
            setZirorbModal(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
