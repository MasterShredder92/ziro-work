"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Star,
  Save,
  AlertTriangle,
  Bot,
  Zap,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";

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

interface AgentOption {
  id: string;
  name: string;
  slug: string;
  role: string;
  status: string;
  auto_use_by_star: boolean;
  color: string;
}

interface SkillOption {
  id: string;
  name: string;
  key: string;
  is_active: boolean;
}

// ── Main Component ──

export default function StarConfigView() {
  const [config, setConfig] = useState<StarConfig | null>(null);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable state
  const [instructions, setInstructions] = useState("");
  const [delegationMode, setDelegationMode] = useState<string>("auto");
  const [approvedAgentIds, setApprovedAgentIds] = useState<string[]>([]);
  const [defaultSkillIds, setDefaultSkillIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [configRes, agentsRes, skillsRes] = await Promise.all([
      fetch("/api/star-config?context=music_school"),
      fetch("/api/agents?context=music_school&status=all"),
      fetch("/api/skills?status=active&context=music_school"),
    ]);

    const configData = await configRes.json();
    const agentsData = await agentsRes.json();
    const skillsData = await skillsRes.json();

    if (configData) {
      setConfig(configData);
      setInstructions(configData.instructions || "");
      setDelegationMode(configData.delegation_mode || "auto");
      setApprovedAgentIds(configData.approved_agent_ids || []);
      setDefaultSkillIds(configData.default_skill_ids || []);
    }

    setAgents(
      Array.isArray(agentsData)
        ? agentsData.filter(
            (a: AgentOption) => a.slug !== "star" && a.status !== "retired"
          )
        : []
    );
    setSkills(Array.isArray(skillsData) ? skillsData : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/star-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_context: "music_school",
        instructions: instructions || null,
        delegation_mode: delegationMode,
        approved_agent_ids: approvedAgentIds,
        default_skill_ids: defaultSkillIds,
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

  function toggleAgent(agentId: string) {
    setApprovedAgentIds((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  }

  function toggleSkill(skillId: string) {
    setDefaultSkillIds((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
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
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Star size={18} className="text-[#f59e0b] shrink-0" fill="#f59e0b" />
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-[#f0f0f0]">Star Configuration</h2>
            <p className="text-xs text-[#606068] mt-0.5">
              Single source of truth for the STAR orchestrator
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#00ff88] text-black rounded-lg text-sm font-medium hover:bg-[#33ffaa] transition-colors disabled:opacity-50 shrink-0"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[#ff4444] bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-lg px-4 py-2.5 mb-6">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      <div className="max-w-4xl space-y-6">
        {/* Star Instructions */}
        <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-[#f59e0b]" />
            <span className="text-[15px] font-medium text-[#f0f0f0]">
              Star Instructions
            </span>
          </div>
          <p className="text-xs text-[#606068] mb-3">
            The canonical prompt Star uses at runtime. This is the only place Star reads its instructions from — there is no second source.
          </p>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="You are STAR, the orchestrator for a music school business. Route tasks to the most capable specialist agent..."
            rows={10}
            className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/50 placeholder-[#505055] resize-none"
          />
        </div>

        {/* Delegation Mode */}
        <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={16} className="text-[#3b82f6]" />
            <span className="text-[15px] font-medium text-[#f0f0f0]">
              Delegation Mode
            </span>
          </div>
          <p className="text-xs text-[#606068] mb-4">
            Controls how Star delegates tasks to agents.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                {
                  value: "auto",
                  label: "Auto",
                  desc: "Star auto-delegates to agents marked for auto-use when route matches",
                  color: "#00ff88",
                },
                {
                  value: "explicit_only",
                  label: "Explicit Only",
                  desc: "Star only delegates when the user explicitly selects an agent",
                  color: "#f59e0b",
                },
                {
                  value: "disabled",
                  label: "Disabled",
                  desc: "Star handles all tasks directly — no agent delegation",
                  color: "#ff4444",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDelegationMode(opt.value)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  delegationMode === opt.value
                    ? "border-[#00ff88]/40 bg-[#00ff88]/5"
                    : "border-[#1c1c1e] bg-[#0a0a0c] hover:border-[#3a3a3e]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        delegationMode === opt.value ? "#fff" : "#a0a0a8",
                    }}
                  >
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs text-[#606068]">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Approved Agents */}
        <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-[#a855f7]" />
              <span className="text-[15px] font-medium text-[#f0f0f0]">
                Approved Agents
              </span>
            </div>
            <span className="text-xs text-[#606068]">
              {approvedAgentIds.length} / {agents.length} attached
            </span>
          </div>
          <p className="text-xs text-[#606068] mb-4">
            Agents Star can delegate to. Only agents checked here are eligible for routing. Manage profiles and skills in Agents.
          </p>

          {agents.length === 0 ? (
            <div className="text-sm text-[#505055] py-4 text-center">
              No agents available. Create agents in the Agents view.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {agents.map((agent) => {
                const isApproved = approvedAgentIds.includes(agent.id);
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      isApproved
                        ? "border-[#a855f7]/30 bg-[#a855f7]/5"
                        : "border-[#1c1c1e] bg-[#0a0a0c] hover:border-[#3a3a3e]"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: agent.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#f0f0f0]">
                          {agent.name}
                        </span>
                        {agent.auto_use_by_star && (
                          <span className="text-[11px] px-1 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b]">
                            auto
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#606068] truncate">
                        {agent.role}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${
                        isApproved
                          ? "bg-[#a855f7] text-white"
                          : "bg-[#1c1c1e] text-[#3a3a3e]"
                      }`}
                    >
                      {isApproved && <Check size={12} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Default Skills */}
        <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#00ff88]" />
              <span className="text-[15px] font-medium text-[#f0f0f0]">
                Default Skills
              </span>
            </div>
            <span className="text-xs text-[#606068]">
              {defaultSkillIds.length} / {skills.length} selected
            </span>
          </div>
          <p className="text-xs text-[#606068] mb-4">
            Skills Star always has available when handling tasks directly. Agent-specific skills are configured per agent in Agents.
          </p>

          {skills.length === 0 ? (
            <div className="text-sm text-[#505055] py-4 text-center">
              No active skills. Create and approve skills in the Skills Manager.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto">
              {skills.map((skill) => {
                const isSelected = defaultSkillIds.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-[#00ff88]/30 bg-[#00ff88]/5"
                        : "border-[#1c1c1e] bg-[#0a0a0c] hover:border-[#3a3a3e]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-[#00ff88] text-black"
                          : "bg-[#1c1c1e] text-[#3a3a3e]"
                      }`}
                    >
                      {isSelected && <Check size={10} />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[#f0f0f0] block truncate">
                        {skill.name}
                      </span>
                      <span className="text-xs text-[#505055] font-mono block truncate">
                        {skill.key}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Last Updated */}
        {config && (
          <div className="text-xs text-[#505055] text-right">
            Last updated:{" "}
            {new Date(config.updated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
