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
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const filtered = agents.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) ||
      (a.purpose || "").toLowerCase().includes(q)
    );
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "idle", label: "Idle" },
    { key: "retired", label: "Retired" },
    { key: "user", label: "User-Created" },
    { key: "system", label: "System" },
  ];

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#f0f0f0]">Specialist Agents</h2>
          <p className="text-sm text-[#606068] mt-1">
            Create and manage specialist agents that Star delegates tasks to. Star itself is configured in Star Config.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowCreate(true);
              setEditingId(null);
            }}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors"
          >
            <Plus size={14} />
            New Agent
          </button>
          <span className="text-sm text-[#606068]">{filtered.length} agents</span>
        </div>
      </div>

      {/* Tab bar + Search */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                tab === t.key
                  ? "bg-white/10 text-[#f0f0f0]"
                  : "text-[#606068] hover:text-[#a0a0a8]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-[#101012] border border-[#1c1c1e] rounded-xl px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <Search size={14} className="text-[#606068]" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-[15px] text-[#f0f0f0] placeholder-[#606068] outline-none w-48"
          />
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showCreate && (
        <AgentForm
          agent={editingId ? agents.find((a) => a.id === editingId) || null : null}
          onClose={() => {
            setShowCreate(false);
            setEditingId(null);
          }}
          onSaved={() => {
            setShowCreate(false);
            setEditingId(null);
            loadAgents();
          }}
        />
      )}

      {/* Agent List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-[#505055]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <Bot size={32} className="mx-auto text-[#3a3a3e] mb-3" />
          <p className="text-[#707078] text-[15px]">No agents found</p>
          <p className="text-[#505055] text-sm mt-1">
            Create an agent to get started
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
                className="bg-[#101012] border border-[#1c1c1e] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
              >
                {/* Row header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#151517] transition-colors"
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#f0f0f0]">
                        {agent.name}
                      </span>
                      <span className="text-xs text-[#505055] font-mono">
                        {agent.slug}
                      </span>
                    </div>
                    <p className="text-xs text-[#707078] mt-0.5 truncate">
                      {agent.purpose || agent.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Auto-use badge */}
                    {agent.auto_use_by_star ? (
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded text-[#f59e0b] bg-[#f59e0b15]">
                        <Eye size={10} /> Auto
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded text-[#606068] bg-[#60606815]">
                        <EyeOff size={10} /> Explicit
                      </span>
                    )}
                    {/* Owner type */}
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full"
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
                    {/* Mode */}
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full"
                      style={{
                        color: modeColor,
                        backgroundColor: `${modeColor}15`,
                      }}
                    >
                      {agent.mode}
                    </span>
                    {/* Status */}
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full capitalize"
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
                  <div className="border-t border-[#1c1c1e] px-5 pb-5 pt-4 space-y-5">
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

                    {/* Profile details grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                        <div className="text-sm text-[#a0a0a8] bg-[#080808] border border-[#1c1c1e] rounded-lg p-4">
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
                        <div className="text-sm text-[#a0a0a8] whitespace-pre-wrap bg-[#080808] border border-[#1c1c1e] rounded-lg p-4 max-h-[200px] overflow-y-auto">
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
                        <div className="text-sm text-[#a0a0a8] bg-[#080808] border border-[#1c1c1e] rounded-lg p-4">
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
                                className="text-xs px-2 py-0.5 rounded bg-[#1c1c1e] text-[#909098]"
                              >
                                {String(trigger)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* System Prompt (read-only, composed) */}
                    {agent.system_prompt && (
                      <div>
                        <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                          System Prompt (composed)
                        </div>
                        <div className="text-sm text-[#707078] whitespace-pre-wrap bg-[#080808] border border-[#1c1c1e] rounded-lg p-4 max-h-[150px] overflow-y-auto font-mono">
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
    </div>
  );
}

// ── Sub-components ──

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#080808] border border-[#1c1c1e] rounded-lg px-4 py-2.5">
      <div className="text-[11px] text-[#606068] uppercase tracking-wider">
        {label}
      </div>
      <div className="text-sm text-[#ccc] mt-0.5">{value}</div>
    </div>
  );
}

// ── Agent Create/Edit Form ──

interface AgentFormProps {
  agent: AgentRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

function AgentForm({ agent, onClose, onSaved }: AgentFormProps) {
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-12 overflow-y-auto">
      <div className="bg-[#0c0c0e] border border-[#232326] rounded-xl w-full max-w-2xl mx-4 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1e]">
          <h3 className="text-xl font-extrabold text-[#f0f0f0]">
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
        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-[#ff4444] bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-xl px-4 py-2.5">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-3 gap-4">
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1c1c1e]">
          <button
            onClick={onClose}
            className="text-[15px] px-5 py-2.5 rounded-xl text-[#a0a0a8] hover:text-[#f0f0f0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-[15px] px-5 py-2.5 rounded-xl bg-[#00ff88] text-black font-medium hover:bg-[#33ffaa] transition-colors disabled:opacity-50"
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
