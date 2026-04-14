"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Bot,
  Plus,
  X,
  Check,
  Pencil,
  Power,
  PowerOff,
  Copy,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Zap,
  Eye,
  EyeOff,
  Search,
  Trash2,
  ArrowLeft,
  Sparkles,
  Orbit,
} from "lucide-react";

// ── Types ──

interface AgentRecord {
  id: string;
  slug: string;
  name: string;
  role: string;
  status: string;
  system_prompt: string | null;
  color: string;
  mode: string;
  position_x: number;
  position_y: number;
  template_id: string | null;
  current_load: number;
  last_heartbeat_at: string | null;
  created_by: string | null;
  reason_created: string | null;
  approved_by: string | null;
  is_visible_in_ui: boolean;
  is_archived: boolean;
  business_context: string;
  updated_at: string | null;
  created_at: string;
  // Profile fields
  purpose: string | null;
  instructions: string | null;
  usage_triggers: string[];
  auto_use_by_star: boolean;
  profile_summary: string | null;
  owner_type: string;
  zirorb_id: string | null;
}

interface ZirorbRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  family: "core" | "vertical";
  accent_color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface SkillRecord {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  preferred_runtime: string;
  is_active: boolean;
  approval_status: string;
}

interface AgentSkillLink {
  id: string;
  agent_id: string;
  skill_id: string;
  priority: number;
  created_at: string;
  skills: SkillRecord;
}

type Tab = "all" | "active" | "idle" | "retired" | "user" | "system";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  active: { color: "#00ff88", label: "Active" },
  deployed: { color: "#00ff88", label: "Deployed" },
  running: { color: "#3b82f6", label: "Running" },
  build_now: { color: "#f59e0b", label: "Building" },
  idle: { color: "#909098", label: "Idle" },
  queued: { color: "#f59e0b", label: "Queued" },
  retired: { color: "#ff4444", label: "Retired" },
};

const MODE_COLORS: Record<string, string> = {
  persistent: "#a855f7",
  ephemeral: "#3b82f6",
};

// ── Main Component ──

export default function AgentProfilesView() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [zirorbs, setZirorbs] = useState<ZirorbRecord[]>([]);
  const [zirorbsLoading, setZirorbsLoading] = useState(true);
  const [starAgent, setStarAgent] = useState<AgentRecord | null>(null);
  const [drillZirorbId, setDrillZirorbId] = useState<string | "unassigned" | null>(null);
  const [zirorbModal, setZirorbModal] = useState<"create" | ZirorbRecord | null>(null);
  const [createAgentDefaultZirorbId, setCreateAgentDefaultZirorbId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadZirorbs = useCallback(async () => {
    setZirorbsLoading(true);
    const res = await fetch("/api/zirorbs");
    const data = await res.json();
    setZirorbs(Array.isArray(data) ? data : []);
    setZirorbsLoading(false);
  }, []);

  const loadStar = useCallback(async () => {
    const res = await fetch(`/api/agents?context=music_school`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setStarAgent((list as AgentRecord[]).find((a) => a.slug === "star") || null);
  }, []);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ context: "music_school", exclude_star: "true" });

    if (tab === "active") params.set("status", "active");
    else if (tab === "idle") params.set("status", "idle");
    else if (tab === "retired") params.set("status", "retired");
    else if (tab === "user") params.set("owner_type", "user");
    else if (tab === "system") params.set("owner_type", "system");

    if (tab === "retired") params.set("include_archived", "true");

    const res = await fetch(`/api/agents?${params}`);
    const data = await res.json();
    setAgents(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  useEffect(() => {
    loadZirorbs();
    loadStar();
  }, [loadZirorbs, loadStar]);

  async function performAction(agentId: string, action: string) {
    setActionLoading(`${agentId}-${action}`);
    await fetch("/api/agents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: agentId, action }),
    });
    await loadAgents();
    setActionLoading(null);
  }

  async function deleteAgent(agentId: string) {
    if (!confirm("Permanently delete this agent? This cannot be undone.")) return;
    setActionLoading(`${agentId}-delete`);
    await fetch("/api/agents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: agentId }),
    });
    setExpanded(null);
    await loadAgents();
    setActionLoading(null);
  }

  async function deleteDrilledZirorb() {
    if (!drillZirorbId || drillZirorbId === "unassigned") return;
    if (!confirm("Delete this Zirorb? Its agents move to Unassigned.")) return;
    const res = await fetch("/api/zirorbs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: drillZirorbId }),
    });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error || "Failed to delete Zirorb");
      return;
    }
    setDrillZirorbId(null);
    setSearch("");
    await Promise.all([loadZirorbs(), loadAgents()]);
  }

  const drillAgents =
    drillZirorbId === null
      ? agents
      : agents.filter((a) =>
          drillZirorbId === "unassigned" ? !(a.zirorb_id ?? null) : a.zirorb_id === drillZirorbId
        );

  const filtered = drillAgents.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) ||
      (a.purpose || "").toLowerCase().includes(q)
    );
  });

  const countInZirorb = (zid: string) => agents.filter((a) => a.zirorb_id === zid).length;
  const unassignedCount = agents.filter((a) => !(a.zirorb_id ?? null)).length;
  const coreZirorbs = zirorbs.filter((z) => z.family === "core");
  const verticalZirorbs = zirorbs.filter((z) => z.family === "vertical");

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "idle", label: "Idle" },
    { key: "retired", label: "Retired" },
    { key: "user", label: "User-Created" },
    { key: "system", label: "System" },
  ];

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-[#f0f0f0]">Specialist Agents</h2>
          <p className="text-xs text-[#606068] mt-0.5">
            Zirorbs group specialists under Star. Skills stay on each agent.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
          <button
            type="button"
            onClick={() => setZirorbModal("create")}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-[#a0a0a8] border border-[#2a2a2e] hover:border-[#505055] hover:text-[#f0f0f0] transition-colors"
          >
            <Orbit size={12} />
            New Zirorb
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateAgentDefaultZirorbId(
                drillZirorbId && drillZirorbId !== "unassigned" ? drillZirorbId : null
              );
              setShowCreate(true);
              setEditingId(null);
            }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors"
          >
            <Plus size={12} />
            New Agent
          </button>
          <span className="text-xs text-[#606068]">
            {drillZirorbId ? `${filtered.length} in view` : `${agents.length} specialists`}
          </span>
        </div>
      </div>

      {/* Tab bar + Search (search when drilled into a Zirorb) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "bg-white/10 text-[#f0f0f0]"
                  : "text-[#606068] hover:text-[#a0a0a8]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {drillZirorbId ? (
          <div className="flex items-center gap-2 bg-[#101012] border border-[#1c1c1e] rounded-lg px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            <Search size={12} className="text-[#606068] shrink-0" />
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-[#f0f0f0] placeholder-[#606068] outline-none w-full sm:w-40"
            />
          </div>
        ) : (
          <div className="text-[11px] text-[#505055] sm:text-right">
            Tabs filter counts on Zirorbs and the roster below.
          </div>
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
            loadZirorbs();
          }}
        />
      )}

      {/* Create / Edit Modal */}
      {showCreate && (
        <AgentForm
          agent={editingId ? agents.find((a) => a.id === editingId) || null : null}
          zirorbs={zirorbs}
          defaultZirorbId={createAgentDefaultZirorbId}
          onClose={() => {
            setShowCreate(false);
            setEditingId(null);
            setCreateAgentDefaultZirorbId(null);
          }}
          onSaved={() => {
            setShowCreate(false);
            setEditingId(null);
            setCreateAgentDefaultZirorbId(null);
            loadAgents();
            loadZirorbs();
          }}
        />
      )}

      {/* Constellation or drilled roster */}
      {loading || zirorbsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-[#505055]" />
        </div>
      ) : !drillZirorbId ? (
        <div className="relative space-y-10 pb-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-5%,rgba(0,255,136,0.1),transparent)]" />

          <div className="relative flex flex-col items-center text-center px-2">
            <div className="relative mb-5">
              <div
                className="absolute inset-0 rounded-full scale-[1.6] opacity-30"
                style={{
                  background: "radial-gradient(circle, rgba(245,158,11,0.35) 0%, transparent 70%)",
                }}
              />
              <div className="relative w-[5.5rem] h-[5.5rem] sm:w-28 sm:h-28 rounded-full border border-[#f59e0b]/35 bg-gradient-to-br from-[#1c1610] via-[#0f0f12] to-[#080808] flex items-center justify-center shadow-[0_0_48px_rgba(245,158,11,0.12)]">
                <Sparkles className="text-[#f59e0b] w-9 h-9 sm:w-11 sm:h-11" strokeWidth={1.2} />
              </div>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f59e0b]/75 mb-1">
              Orchestrator
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#f0f0f0] tracking-tight">
              {starAgent?.name || "Star"}
            </h3>
            <p className="text-sm text-[#707078] max-w-md mt-2 leading-relaxed">
              {starAgent?.role ||
                "Routes work, composes context, and coordinates specialists inside Zirorbs."}
            </p>
          </div>

          {zirorbs.length === 0 ? (
            <div className="relative bg-[#101012]/90 border border-[#1c1c1e] rounded-2xl p-10 text-center max-w-lg mx-auto">
              <Orbit className="mx-auto text-[#505055] mb-3" size={36} strokeWidth={1.25} />
              <p className="text-[#a0a0a8] text-sm mb-1">No Zirorbs yet</p>
              <p className="text-[#505055] text-xs mb-5 leading-relaxed">
                Create a Zirorb to organize agents into modular intelligence clusters under Star.
              </p>
              <button
                type="button"
                onClick={() => setZirorbModal("create")}
                className="text-xs px-4 py-2 rounded-xl bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/25 hover:bg-[#00ff88]/18 transition-colors"
              >
                Create first Zirorb
              </button>
            </div>
          ) : (
            <div className="relative space-y-10">
              <section>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4 px-0.5">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[#f59e0b]/90">
                      Core systems
                    </h4>
                    <p className="text-[11px] text-[#505055] mt-0.5">
                      Reliability, product velocity, and shared platform intelligence.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {coreZirorbs.map((z) => (
                    <ZirorbOrbCard
                      key={z.id}
                      z={z}
                      count={countInZirorb(z.id)}
                      onClick={() => {
                        setDrillZirorbId(z.id);
                        setSearch("");
                      }}
                    />
                  ))}
                </div>
              </section>

              <section>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4 px-0.5">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[#a855f7]/90">
                      Verticals & business
                    </h4>
                    <p className="text-[11px] text-[#505055] mt-0.5">
                      Domain clusters for go-to-market and operations.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {verticalZirorbs.map((z) => (
                    <ZirorbOrbCard
                      key={z.id}
                      z={z}
                      count={countInZirorb(z.id)}
                      onClick={() => {
                        setDrillZirorbId(z.id);
                        setSearch("");
                      }}
                    />
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 px-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[#606068]">
                    Fallback
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  <UnassignedOrbCard
                    count={unassignedCount}
                    onClick={() => {
                      setDrillZirorbId("unassigned");
                      setSearch("");
                    }}
                  />
                </div>
              </section>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                setDrillZirorbId(null);
                setSearch("");
              }}
              className="inline-flex items-center gap-1.5 self-start text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2e] text-[#a0a0a8] hover:text-[#f0f0f0] hover:border-[#505055] transition-colors"
            >
              <ArrowLeft size={14} />
              All Zirorbs
            </button>
            <div className="flex-1 min-w-0 lg:order-first lg:mr-auto">
              <h3 className="text-base sm:text-lg font-extrabold text-[#f0f0f0] truncate">
                {drillZirorbId === "unassigned"
                  ? "Unassigned"
                  : zirorbs.find((z) => z.id === drillZirorbId)?.name || "Zirorb"}
              </h3>
              <p className="text-xs text-[#606068] line-clamp-2 mt-0.5">
                {drillZirorbId === "unassigned"
                  ? "Agents without a Zirorb stay here until you assign them."
                  : zirorbs.find((z) => z.id === drillZirorbId)?.description || ""}
              </p>
            </div>
            {drillZirorbId !== "unassigned" && (
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const z = zirorbs.find((x) => x.id === drillZirorbId);
                    if (z) setZirorbModal(z);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-[#2a2a2e] text-[#a0a0a8] hover:text-[#f0f0f0] transition-colors"
                >
                  <Pencil size={12} className="inline mr-1" />
                  Edit Zirorb
                </button>
                <button
                  type="button"
                  onClick={deleteDrilledZirorb}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#ff4444]/10 border border-[#ff4444]/25 text-[#ff8888] hover:bg-[#ff4444]/15 transition-colors"
                >
                  <Trash2 size={12} className="inline mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              <Bot size={32} className="mx-auto text-[#3a3a3e] mb-3" />
              <p className="text-[#707078] text-[15px]">No agents in this view</p>
              <p className="text-[#505055] text-sm mt-1">
                {drillZirorbId === "unassigned"
                  ? "Assign agents to a Zirorb from each profile, or create a new specialist."
                  : "Add an agent to this Zirorb or relax your tab filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
          {filtered.map((agent) => {
            const isExpanded = expanded === agent.id;
            const statusCfg = STATUS_CONFIG[agent.status] || {
              color: "#909098",
              label: agent.status,
            };
            const modeColor = MODE_COLORS[agent.mode] || "#909098";
            const isAL = (id: string) => actionLoading?.startsWith(id);

            return (
              <div
                key={agent.id}
                className="bg-[#101012] border border-[#1c1c1e] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.4)] min-w-0"
              >
                {/* Row header */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#151517] transition-colors overflow-hidden"
                  onClick={() =>
                    setExpanded(isExpanded ? null : agent.id)
                  }
                >
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-[#606068] shrink-0" />
                  ) : (
                    <ChevronRight
                      size={14}
                      className="text-[#606068] shrink-0"
                    />
                  )}
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: agent.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-bold text-[#f0f0f0] truncate">
                        {agent.name}
                      </span>
                      <span className="text-xs text-[#505055] font-mono truncate hidden sm:inline">
                        {agent.slug}
                      </span>
                    </div>
                    <p className="text-xs text-[#707078] mt-0.5 truncate">
                      {agent.purpose || agent.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Auto-use badge — hidden on mobile */}
                    {agent.auto_use_by_star ? (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded text-[#f59e0b] bg-[#f59e0b15]">
                        <Eye size={9} /> Auto
                      </span>
                    ) : (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded text-[#606068] bg-[#60606815]">
                        <EyeOff size={9} /> Explicit
                      </span>
                    )}
                    {/* Owner type — hidden on mobile */}
                    <span
                      className="hidden md:inline text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        color: agent.owner_type === "user" ? "#a855f7" : "#606068",
                        backgroundColor:
                          agent.owner_type === "user"
                            ? "#a855f715"
                            : "#60606815",
                      }}
                    >
                      {agent.owner_type}
                    </span>
                    {/* Mode — hidden on mobile */}
                    <span
                      className="hidden md:inline text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        color: modeColor,
                        backgroundColor: `${modeColor}15`,
                      }}
                    >
                      {agent.mode}
                    </span>
                    {/* Status — always visible */}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                      style={{
                        color: statusCfg.color,
                        backgroundColor: `${statusCfg.color}15`,
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#1c1c1e] px-4 pb-4 pt-3 space-y-4 overflow-hidden min-w-0">
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(agent.id);
                          setShowCreate(true);
                        }}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-[#a0a0a8] hover:text-[#f0f0f0] transition-colors"
                      >
                        <Pencil size={12} /> Edit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          performAction(agent.id, "clone");
                        }}
                        disabled={!!isAL(agent.id)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-[#a0a0a8] hover:text-[#f0f0f0] transition-colors"
                      >
                        <Copy size={12} /> Clone
                      </button>

                      {agent.status !== "active" &&
                        agent.status !== "deployed" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              performAction(agent.id, "activate");
                            }}
                            disabled={!!isAL(agent.id)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors"
                          >
                            <Power size={12} /> Activate
                          </button>
                        )}

                      {(agent.status === "active" ||
                        agent.status === "deployed") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            performAction(agent.id, "idle");
                          }}
                          disabled={!!isAL(agent.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 transition-colors"
                        >
                          <PowerOff size={12} /> Idle
                        </button>
                      )}

                      {agent.status !== "retired" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            performAction(agent.id, "retire");
                          }}
                          disabled={!!isAL(agent.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#ff4444]/10 text-[#ff4444] hover:bg-[#ff4444]/20 transition-colors"
                        >
                          <PowerOff size={12} /> Retire
                        </button>
                      )}

                      {!agent.is_archived ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            performAction(agent.id, "archive");
                          }}
                          disabled={!!isAL(agent.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-[#707078] hover:text-[#f0f0f0] transition-colors"
                        >
                          <Archive size={12} /> Archive
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            performAction(agent.id, "unarchive");
                          }}
                          disabled={!!isAL(agent.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-[#707078] hover:text-[#f0f0f0] transition-colors"
                        >
                          <ArchiveRestore size={12} /> Unarchive
                        </button>
                      )}

                      {agent.owner_type === "user" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAgent(agent.id);
                          }}
                          disabled={!!isAL(agent.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#ff4444]/10 text-[#ff4444] hover:bg-[#ff4444]/20 transition-colors ml-auto"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>

                    <div className="max-w-md">
                      <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1.5">
                        Zirorb
                      </div>
                      <select
                        value={agent.zirorb_id || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={async (e) => {
                          e.stopPropagation();
                          const next = e.target.value || null;
                          setActionLoading(`${agent.id}-zirorb`);
                          await fetch("/api/agents", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: agent.id, zirorb_id: next }),
                          });
                          await loadAgents();
                          await loadZirorbs();
                          setActionLoading(null);
                        }}
                        disabled={!!actionLoading?.startsWith(agent.id)}
                        className="w-full bg-[#080808] border border-[#1c1c1e] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/40"
                      >
                        <option value="">Unassigned</option>
                        {zirorbs.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Profile details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <DetailCell label="Role" value={agent.role} />
                      <DetailCell label="Mode" value={agent.mode} />
                      <DetailCell label="Owner" value={agent.owner_type} />
                      <DetailCell
                        label="Star Auto-Use"
                        value={agent.auto_use_by_star ? "Yes" : "No"}
                      />
                      <DetailCell
                        label="Created By"
                        value={agent.created_by || "\u2014"}
                      />
                      <DetailCell
                        label="Created"
                        value={new Date(agent.created_at).toLocaleDateString()}
                      />
                      <DetailCell
                        label="Last Updated"
                        value={
                          agent.updated_at
                            ? new Date(agent.updated_at).toLocaleDateString()
                            : "\u2014"
                        }
                      />
                      <DetailCell
                        label="Current Load"
                        value={String(agent.current_load)}
                      />
                    </div>

                    {/* Purpose */}
                    {agent.purpose && (
                      <div>
                        <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                          Purpose
                        </div>
                        <div className="text-sm text-[#a0a0a8] bg-[#080808] border border-[#1c1c1e] rounded-lg p-3 break-words overflow-hidden" style={{ overflowWrap: 'anywhere' }}>
                          {agent.purpose}
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    {agent.instructions && (
                      <div>
                        <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                          Instructions
                        </div>
                        <div className="text-sm text-[#a0a0a8] whitespace-pre-wrap break-words bg-[#080808] border border-[#1c1c1e] rounded-lg p-3 max-h-[200px] overflow-y-auto overflow-x-hidden" style={{ overflowWrap: 'anywhere' }}>
                          {agent.instructions}
                        </div>
                      </div>
                    )}

                    {/* Profile Summary */}
                    {agent.profile_summary && (
                      <div>
                        <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                          Profile Summary
                        </div>
                        <div className="text-sm text-[#a0a0a8] bg-[#080808] border border-[#1c1c1e] rounded-lg p-3 break-words overflow-hidden" style={{ overflowWrap: 'anywhere' }}>
                          {agent.profile_summary}
                        </div>
                      </div>
                    )}

                    {/* Usage Triggers */}
                    {agent.usage_triggers &&
                      agent.usage_triggers.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                            Usage Triggers
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {agent.usage_triggers.map((trigger, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded bg-[#1c1c1e] text-[#909098] break-words max-w-full"
                              >
                                {String(trigger)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Attached Skills */}
                    <AgentSkillsPanel agentId={agent.id} />

                    {/* System Prompt (read-only, composed) */}
                    {agent.system_prompt && (
                      <div>
                        <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                          System Prompt (composed)
                        </div>
                        <div className="text-sm text-[#707078] whitespace-pre-wrap break-words bg-[#080808] border border-[#1c1c1e] rounded-lg p-3 max-h-[150px] overflow-y-auto overflow-x-hidden font-mono" style={{ overflowWrap: 'anywhere' }}>
                          {agent.system_prompt}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Zirorb UI pieces ──

function ZirorbOrbCard({
  z,
  count,
  onClick,
}: {
  z: ZirorbRecord;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left w-full rounded-2xl border border-white/[0.06] bg-[#0c0c0e]/90 hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)] overflow-hidden min-h-[120px] p-4 sm:p-5"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl group-hover:opacity-40 transition-opacity"
        style={{ backgroundColor: z.accent_color }}
      />
      <div className="relative flex flex-col h-full min-h-[88px]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10"
            style={{
              boxShadow: `0 0 24px ${z.accent_color}33`,
              background: `linear-gradient(145deg, ${z.accent_color}22, transparent)`,
            }}
          >
            <Orbit size={18} style={{ color: z.accent_color }} strokeWidth={1.5} />
          </div>
          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-white/10 text-[#a0a0a8] tabular-nums"
            style={{ color: z.accent_color, borderColor: `${z.accent_color}44` }}
          >
            {count} agents
          </span>
        </div>
        <div className="font-bold text-[#f0f0f0] text-sm sm:text-base leading-snug">{z.name}</div>
        {z.description && (
          <p className="text-[11px] sm:text-xs text-[#606068] mt-1.5 line-clamp-2 leading-relaxed">{z.description}</p>
        )}
        <span className="mt-auto pt-3 text-[10px] uppercase tracking-wider text-[#505055] opacity-0 group-hover:opacity-100 transition-opacity">
          Open cluster
        </span>
      </div>
    </button>
  );
}

function UnassignedOrbCard({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left w-full rounded-2xl border border-dashed border-[#3a3a3e] bg-[#080808]/80 hover:border-[#606068] hover:bg-[#0a0a0c] transition-all duration-300 p-4 sm:p-5 min-h-[120px]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2a2a2e] bg-[#101012]">
          <Bot size={18} className="text-[#606068]" />
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-[#2a2a2e] text-[#909098] tabular-nums">
          {count} agents
        </span>
      </div>
      <div className="font-bold text-[#e8e8e8] text-sm sm:text-base">Unassigned</div>
      <p className="text-[11px] sm:text-xs text-[#606068] mt-1.5 leading-relaxed">
        Default bucket for specialists not yet placed in a Zirorb.
      </p>
    </button>
  );
}

function ZirorbFormModal({
  mode,
  zirorb,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  zirorb: ZirorbRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(zirorb?.name || "");
  const [description, setDescription] = useState(zirorb?.description || "");
  const [family, setFamily] = useState<"core" | "vertical">(zirorb?.family || "vertical");
  const [accent_color, setAccentColor] = useState(zirorb?.accent_color || "#00ff88");
  const [sort_order, setSortOrder] = useState(String(zirorb?.sort_order ?? 100));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    const payload =
      mode === "create"
        ? {
            name: name.trim(),
            description: description.trim() || null,
            family,
            accent_color,
            sort_order: Number(sort_order) || 0,
          }
        : {
            id: zirorb!.id,
            name: name.trim(),
            description: description.trim() || null,
            family,
            accent_color,
            sort_order: Number(sort_order) || 0,
          };

    const res = await fetch("/api/zirorbs", {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(j.error || "Request failed");
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-start justify-center pt-6 md:pt-16 overflow-y-auto px-3">
      <div className="bg-[#0c0c0e] border border-[#232326] rounded-xl w-full max-w-md mb-10 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c1c1e]">
          <h3 className="text-base font-extrabold text-[#f0f0f0]">
            {mode === "create" ? "New Zirorb" : "Edit Zirorb"}
          </h3>
          <button type="button" onClick={onClose} className="text-[#606068] hover:text-[#f0f0f0]">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 text-xs text-[#ff4444] bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-lg px-3 py-2">
              <AlertTriangle size={12} />
              {error}
            </div>
          )}
          <div>
            <label className="block text-[11px] text-[#707078] uppercase tracking-wider mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/40"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#707078] uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none bg-[#0a0a0c] border border-[#232326] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-[#707078] uppercase tracking-wider mb-1">Family</label>
              <select
                value={family}
                onChange={(e) => setFamily(e.target.value as "core" | "vertical")}
                className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] outline-none"
              >
                <option value="core">Core</option>
                <option value="vertical">Vertical / business</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#707078] uppercase tracking-wider mb-1">Sort order</label>
              <input
                type="number"
                value={sort_order}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-[#707078] uppercase tracking-wider mb-1">Accent</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accent_color}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-12 rounded-lg border border-[#232326] bg-transparent cursor-pointer"
              />
              <input
                value={accent_color}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 bg-[#0a0a0c] border border-[#232326] rounded-xl px-3 py-2 text-sm font-mono text-[#f0f0f0] outline-none"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#1c1c1e]">
          <button type="button" onClick={onClose} className="text-sm px-3 py-2 text-[#a0a0a8] hover:text-white">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-[#00ff88] text-black font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Agent Skills Panel (toggle-list, matches Star Config UX) ──

function AgentSkillsPanel({ agentId }: { agentId: string }) {
  const [attachedIds, setAttachedIds] = useState<Set<string>>(new Set());
  const [allSkills, setAllSkills] = useState<SkillRecord[]>([]);
  const [starDefaultIds, setStarDefaultIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [attachedRes, skillsRes, starRes] = await Promise.all([
      fetch(`/api/agents/skills?agent_id=${agentId}`),
      fetch("/api/skills?status=active&context=music_school"),
      fetch("/api/star-config?context=music_school"),
    ]);
    const attachedData = await attachedRes.json();
    const skillsData = await skillsRes.json();
    const starData = await starRes.json();

    setAttachedIds(
      new Set(
        Array.isArray(attachedData)
          ? attachedData.map((a: AgentSkillLink) => a.skill_id)
          : []
      )
    );
    setAllSkills(Array.isArray(skillsData) ? skillsData : []);
    setStarDefaultIds(
      new Set(Array.isArray(starData?.default_skill_ids) ? starData.default_skill_ids : [])
    );
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function toggleSkill(skillId: string) {
    setActionLoading(skillId);
    const isAttached = attachedIds.has(skillId);

    if (isAttached) {
      await fetch("/api/agents/skills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, skill_id: skillId }),
      });
      setAttachedIds((prev) => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    } else {
      await fetch("/api/agents/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, skill_id: skillId }),
      });
      setAttachedIds((prev) => new Set(prev).add(skillId));
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="py-3 flex items-center gap-2 text-xs text-[#606068]">
        <Loader2 size={12} className="animate-spin" /> Loading skills...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#00ff88]" />
          <span className="text-xs font-semibold text-[#606068] uppercase tracking-wider">
            Skills
          </span>
        </div>
        <span className="text-xs text-[#505055]">
          {attachedIds.size} / {allSkills.length} attached
        </span>
      </div>
      <p className="text-[11px] text-[#505055] mb-2">
        Toggle skills on or off for this agent. Skills marked with a star are Star defaults.
      </p>

      {allSkills.length === 0 ? (
        <div className="text-xs text-[#505055] bg-[#0a0a0c] border border-[#1c1c1e] rounded-lg px-3 py-3 text-center">
          No active skills. Create and approve skills in the Skills Manager.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[250px] overflow-y-auto overflow-x-hidden">
          {allSkills.map((skill) => {
            const isAttached = attachedIds.has(skill.id);
            const isStarDefault = starDefaultIds.has(skill.id);
            const isLoading = actionLoading === skill.id;

            return (
              <button
                key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                disabled={isLoading}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all min-w-0 overflow-hidden ${
                  isAttached
                    ? "border-[#00ff88]/30 bg-[#00ff88]/5"
                    : "border-[#1c1c1e] bg-[#0a0a0c] hover:border-[#3a3a3e]"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                    isAttached
                      ? "bg-[#00ff88] text-black"
                      : "bg-[#1c1c1e] text-[#3a3a3e]"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={8} className="animate-spin" />
                  ) : (
                    isAttached && <Check size={8} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-[#f0f0f0] truncate">
                      {skill.name}
                    </span>
                    {isStarDefault && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] shrink-0">
                        star
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#505055] font-mono block truncate">
                    {skill.key}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#080808] border border-[#1c1c1e] rounded-lg px-4 py-2.5 min-w-0 overflow-hidden">
      <div className="text-[11px] text-[#606068] uppercase tracking-wider truncate">
        {label}
      </div>
      <div className="text-sm text-[#ccc] mt-0.5 truncate">{value}</div>
    </div>
  );
}

// ── Agent Create/Edit Form ──

interface AgentFormProps {
  agent: AgentRecord | null;
  zirorbs: ZirorbRecord[];
  defaultZirorbId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

function AgentForm({ agent, zirorbs, defaultZirorbId, onClose, onSaved }: AgentFormProps) {
  const isEdit = !!agent;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(agent?.name || "");
  const [slug, setSlug] = useState(agent?.slug || "");
  const [role, setRole] = useState(agent?.role || "");
  const [purpose, setPurpose] = useState(agent?.purpose || "");
  const [instructions, setInstructions] = useState(agent?.instructions || "");
  const [mode, setMode] = useState(agent?.mode || "ephemeral");
  const [ownerType, setOwnerType] = useState(agent?.owner_type || "user");
  const [color, setColor] = useState(agent?.color || "#00ff88");
  const [autoUse, setAutoUse] = useState(agent?.auto_use_by_star ?? true);
  const [profileSummary, setProfileSummary] = useState(
    agent?.profile_summary || ""
  );
  const [triggersStr, setTriggersStr] = useState(
    (agent?.usage_triggers || []).map(String).join(", ")
  );
  const [zirorbId, setZirorbId] = useState(() => agent?.zirorb_id || defaultZirorbId || "");

  // Auto-generate slug from name for new agents
  useEffect(() => {
    if (!isEdit && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  }, [name, isEdit]);

  async function handleSave() {
    setError(null);
    if (!name || !role) {
      setError("Name and role are required");
      return;
    }

    setSaving(true);
    const usage_triggers = triggersStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (isEdit) {
      const res = await fetch("/api/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agent!.id,
          name,
          role,
          purpose: purpose || null,
          instructions: instructions || null,
          mode,
          owner_type: ownerType,
          color,
          auto_use_by_star: autoUse,
          profile_summary: profileSummary || null,
          usage_triggers,
          zirorb_id: zirorbId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        setSaving(false);
        return;
      }
    } else {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          role,
          purpose: purpose || null,
          instructions: instructions || null,
          mode,
          owner_type: ownerType,
          color,
          auto_use_by_star: autoUse,
          profile_summary: profileSummary || null,
          usage_triggers,
          zirorb_id: zirorbId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create");
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSaved();
  }

  const presetColors = [
    "#00ff88",
    "#3b82f6",
    "#a855f7",
    "#f59e0b",
    "#ff4444",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-4 md:pt-12 overflow-y-auto">
      <div className="bg-[#0c0c0e] border border-[#232326] rounded-xl w-full max-w-2xl mx-3 md:mx-4 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[#1c1c1e]">
          <h3 className="text-base md:text-lg font-extrabold text-[#f0f0f0]">
            {isEdit ? "Edit Agent Profile" : "Create New Agent"}
          </h3>
          <button
            onClick={onClose}
            className="text-[#606068] hover:text-[#f0f0f0] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 md:p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-[#ff4444] bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-xl px-4 py-2.5">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Name"
              value={name}
              onChange={setName}
              placeholder="Lead Qualifier"
            />
            <FormField
              label="Slug"
              value={slug}
              onChange={setSlug}
              placeholder="lead-qualifier"
              disabled={isEdit}
            />
          </div>

          <FormField
            label="Role"
            value={role}
            onChange={setRole}
            placeholder="What this agent does in one line"
          />

          <FormField
            label="Purpose"
            value={purpose}
            onChange={setPurpose}
            placeholder="Detailed purpose and scope of this agent..."
            multiline
          />

          <FormField
            label="Instructions"
            value={instructions}
            onChange={setInstructions}
            placeholder="Custom instructions that guide this agent's behavior..."
            multiline
            rows={5}
          />

          <FormField
            label="Profile Summary"
            value={profileSummary}
            onChange={setProfileSummary}
            placeholder="Brief summary for display in lists and Star context..."
            multiline
            rows={2}
          />

          <div>
            <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1.5">
              Zirorb
            </label>
            <select
              value={zirorbId}
              onChange={(e) => setZirorbId(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/50"
            >
              <option value="">Unassigned</option>
              {zirorbs.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#505055] mt-1">
              Organize this specialist under a Zirorb. Skills are still configured per agent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1.5">
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/50"
              >
                <option value="persistent">Persistent</option>
                <option value="ephemeral">Ephemeral</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1.5">
                Owner Type
              </label>
              <select
                value={ownerType}
                onChange={(e) => setOwnerType(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/50"
              >
                <option value="user">User</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1.5">
                Star Auto-Use
              </label>
              <button
                onClick={() => setAutoUse(!autoUse)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                  autoUse
                    ? "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b]"
                    : "bg-[#0a0a0c] border-[#232326] text-[#707078]"
                }`}
              >
                {autoUse ? (
                  <>
                    <Eye size={14} /> Auto
                  </>
                ) : (
                  <>
                    <EyeOff size={14} /> Explicit Only
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs text-[#707078] uppercase tracking-wider mb-2">
              Agent Color
            </label>
            <div className="flex items-center gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#fff" : "transparent",
                    transform: color === c ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
              />
            </div>
          </div>

          <FormField
            label="Usage Triggers (comma-separated task types)"
            value={triggersStr}
            onChange={setTriggersStr}
            placeholder="outreach, content, crm, analytics"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 md:px-6 py-3 md:py-4 border-t border-[#1c1c1e]">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-xl text-[#a0a0a8] hover:text-[#f0f0f0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-[#00ff88] text-black font-medium hover:bg-[#33ffaa] transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {isEdit ? "Save Changes" : "Create Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  rows = 3,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
}) {
  const cls =
    "w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/50 placeholder-[#505055] disabled:opacity-50";
  return (
    <div>
      <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cls}
        />
      )}
    </div>
  );
}
