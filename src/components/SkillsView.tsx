"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Zap,
  Plus,
  X,
  Check,
  Ban,
  Send,
  Pencil,
  Power,
  PowerOff,
  Link2,
  Unlink,
  ChevronDown,
  ChevronRight,
  Shield,
  AlertTriangle,
} from "lucide-react";

// ── Types ──

interface SkillRecord {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  system_prompt_fragment: string;
  preferred_runtime: string;
  allowed_tools: string[];
  cost_tier: number;
  risk_tier: number;
  tags: string[];
  is_active: boolean;
  approval_status: string;
  proposed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  business_context: string;
  version: number;
  created_at: string;
  updated_at: string;
}

interface TemplateLink {
  agent_template_id: string;
  priority: number;
  agent_templates: { id: string; key: string; name: string; is_active: boolean; business_context: string } | null;
}

interface TemplateOption {
  id: string;
  key: string;
  name: string;
  is_active: boolean;
}

type Tab = "active" | "drafts" | "pending" | "inactive" | "all";

const RUNTIME_COLORS: Record<string, string> = {
  claude_code: "#00ff88",
  api: "#3b82f6",
  browser: "#f59e0b",
  manual: "#a855f7",
};

const TIER_LABELS: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High" };

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  approved: { color: "#00ff88", label: "Approved" },
  draft: { color: "#909098", label: "Draft" },
  pending_approval: { color: "#f59e0b", label: "Pending Approval" },
  rejected: { color: "#ff4444", label: "Rejected" },
};

// ── Main Component ──

export default function SkillsView() {
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");
  const [filterRuntime, setFilterRuntime] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [templateLinks, setTemplateLinks] = useState<TemplateLink[]>([]);
  const [allTemplates, setAllTemplates] = useState<TemplateOption[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    const statusMap: Record<string, string> = {
      active: "active",
      drafts: "draft",
      pending: "pending",
      inactive: "inactive",
      all: "all",
    };
    const params = new URLSearchParams({
      status: statusMap[tab],
      context: tab === "all" ? "all" : "music_school",
    });
    if (filterRuntime !== "all") params.set("runtime", filterRuntime);

    const res = await fetch(`/api/skills?${params}`);
    const data = await res.json();
    setSkills(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [tab, filterRuntime]);

  useEffect(() => { loadSkills(); }, [loadSkills]);

  // Load all active templates once for assignment dropdowns
  useEffect(() => {
    fetch("/api/skills/templates?skill_id=__list_templates__").catch(() => {});
    // Direct supabase call for template list (simpler)
    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .from("agent_templates")
        .select("id, key, name, is_active")
        .eq("is_active", true)
        .eq("business_context", "music_school")
        .order("name")
        .then(({ data }) => setAllTemplates(data || []));
    });
  }, []);

  async function toggleExpand(skillId: string) {
    if (expanded === skillId) {
      setExpanded(null);
      return;
    }
    setExpanded(skillId);
    setDetailLoading(true);
    const res = await fetch(`/api/skills/templates?skill_id=${skillId}`);
    const data = await res.json();
    setTemplateLinks(Array.isArray(data) ? data : []);
    setDetailLoading(false);
  }

  async function performAction(skillId: string, action: string) {
    setActionLoading(`${skillId}-${action}`);
    await fetch("/api/skills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: skillId, action }),
    });
    await loadSkills();
    setActionLoading(null);
  }

  async function assignTemplate(skillId: string, templateId: string) {
    setActionLoading(`${skillId}-assign`);
    const res = await fetch("/api/skills/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill_id: skillId, template_id: templateId }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to assign");
    }
    // Reload links
    const linkRes = await fetch(`/api/skills/templates?skill_id=${skillId}`);
    setTemplateLinks(await linkRes.json());
    setActionLoading(null);
  }

  async function unassignTemplate(skillId: string, templateId: string) {
    setActionLoading(`${skillId}-unassign`);
    await fetch("/api/skills/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill_id: skillId, template_id: templateId }),
    });
    const linkRes = await fetch(`/api/skills/templates?skill_id=${skillId}`);
    setTemplateLinks(await linkRes.json());
    setActionLoading(null);
  }

  const runtimes = [...new Set(skills.map((s) => s.preferred_runtime))];
  const filtered = filterRuntime === "all" ? skills : skills.filter((s) => s.preferred_runtime === filterRuntime);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "active", label: "Active" },
    { key: "pending", label: "Pending" },
    { key: "drafts", label: "Drafts" },
    { key: "inactive", label: "Inactive" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#f0f0f0]">Skills Manager</h2>
          <p className="text-sm text-[#606068] mt-1">
            Create, edit, approve, and assign reusable capability packs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowCreate(true); setEditingId(null); }}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors"
          >
            <Plus size={12} />
            New Skill
          </button>
          <span className="text-sm text-[#606068]">{filtered.length} skills</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                tab === t.key ? "bg-white/10 text-white" : "text-[#606068] hover:text-[#a0a0a8]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-[#232326]" />
        <div className="flex gap-1">
          <button
            onClick={() => setFilterRuntime("all")}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${
              filterRuntime === "all" ? "bg-white/10 text-white" : "text-[#606068] hover:text-[#a0a0a8]"
            }`}
          >
            All runtimes
          </button>
          {runtimes.map((rt) => (
            <button
              key={rt}
              onClick={() => setFilterRuntime(rt)}
              className="text-xs px-2 py-1 rounded-full transition-colors"
              style={{
                color: filterRuntime === rt ? (RUNTIME_COLORS[rt] || "#909098") : "#606068",
                backgroundColor: filterRuntime === rt ? `${RUNTIME_COLORS[rt] || "#909098"}15` : undefined,
              }}
            >
              {rt}
            </button>
          ))}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showCreate && (
        <SkillForm
          skill={editingId ? skills.find((s) => s.id === editingId) || null : null}
          onClose={() => { setShowCreate(false); setEditingId(null); }}
          onSaved={() => { setShowCreate(false); setEditingId(null); loadSkills(); }}
        />
      )}

      {/* Skills List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-[#505055]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <Zap size={32} className="mx-auto text-[#3a3a3e] mb-3" />
          <p className="text-[#707078] text-[15px]">No skills found for this filter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((skill) => {
            const isExpanded = expanded === skill.id;
            const rtColor = RUNTIME_COLORS[skill.preferred_runtime] || "#909098";
            const statusCfg = STATUS_CONFIG[skill.approval_status] || STATUS_CONFIG.draft;
            const isAL = (id: string) => actionLoading?.startsWith(id);

            return (
              <div key={skill.id} className="bg-[#101012] border border-[#1c1c1e] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                {/* Row header */}
                <div
                  className="flex items-center gap-3 p-5 cursor-pointer hover:bg-[#151515] transition-colors"
                  onClick={() => toggleExpand(skill.id)}
                >
                  {isExpanded
                    ? <ChevronDown size={14} className="text-[#606068] shrink-0" />
                    : <ChevronRight size={14} className="text-[#606068] shrink-0" />}
                  <Zap size={14} style={{ color: rtColor }} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#f0f0f0]">{skill.name}</span>
                      <span className="text-xs text-[#505055] font-mono">{skill.key}</span>
                    </div>
                    <p className="text-xs text-[#707078] mt-0.5 truncate">{skill.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Risk tier badge */}
                    {skill.risk_tier >= 2 && (
                      <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded"
                        style={{
                          color: skill.risk_tier >= 3 ? "#ff4444" : "#f59e0b",
                          backgroundColor: skill.risk_tier >= 3 ? "#ff444415" : "#f59e0b15",
                        }}
                      >
                        <Shield size={8} />
                        {TIER_LABELS[skill.risk_tier]} risk
                      </span>
                    )}
                    {/* Approval status */}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ color: statusCfg.color, backgroundColor: `${statusCfg.color}15` }}
                    >
                      {statusCfg.label}
                    </span>
                    {/* Active indicator */}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        color: skill.is_active ? "#00ff88" : "#707078",
                        backgroundColor: skill.is_active ? "#00ff8815" : "#70707815",
                      }}
                    >
                      {skill.is_active ? "Active" : "Inactive"}
                    </span>
                    {/* Runtime */}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ color: rtColor, backgroundColor: `${rtColor}15` }}
                    >
                      {skill.preferred_runtime}
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#1c1c1e] px-4 pb-4 pt-3 space-y-4">
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(skill.id); setShowCreate(true); }}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/5 text-[#a0a0a8] hover:text-white transition-colors"
                      >
                        <Pencil size={10} /> Edit
                      </button>

                      {skill.approval_status === "pending_approval" && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); performAction(skill.id, "approve"); }}
                            disabled={!!isAL(skill.id)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors"
                          >
                            <Check size={10} /> Approve
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); performAction(skill.id, "reject"); }}
                            disabled={!!isAL(skill.id)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#ff4444]/10 text-[#ff4444] hover:bg-[#ff4444]/20 transition-colors"
                          >
                            <Ban size={10} /> Reject
                          </button>
                        </>
                      )}

                      {skill.approval_status === "draft" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); performAction(skill.id, "submit_for_approval"); }}
                          disabled={!!isAL(skill.id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 transition-colors"
                        >
                          <Send size={10} /> Submit for Approval
                        </button>
                      )}

                      {skill.approval_status === "approved" && skill.is_active && (
                        <button
                          onClick={(e) => { e.stopPropagation(); performAction(skill.id, "deactivate"); }}
                          disabled={!!isAL(skill.id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#ff4444]/10 text-[#ff4444] hover:bg-[#ff4444]/20 transition-colors"
                        >
                          <PowerOff size={10} /> Deactivate
                        </button>
                      )}

                      {skill.approval_status === "approved" && !skill.is_active && (
                        <button
                          onClick={(e) => { e.stopPropagation(); performAction(skill.id, "activate"); }}
                          disabled={!!isAL(skill.id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors"
                        >
                          <Power size={10} /> Activate
                        </button>
                      )}
                    </div>

                    {/* Skill details grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <DetailCell label="Category" value={skill.category} />
                      <DetailCell label="Cost Tier" value={TIER_LABELS[skill.cost_tier] || String(skill.cost_tier)} />
                      <DetailCell label="Risk Tier" value={TIER_LABELS[skill.risk_tier] || String(skill.risk_tier)} />
                      <DetailCell label="Version" value={`v${skill.version}`} />
                      <DetailCell label="Proposed By" value={skill.proposed_by || "—"} />
                      <DetailCell label="Approved By" value={skill.approved_by || "—"} />
                      <DetailCell label="Business Context" value={skill.business_context} />
                      <DetailCell label="Created" value={new Date(skill.created_at).toLocaleDateString()} />
                    </div>

                    {/* System prompt fragment */}
                    <div>
                      <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                        System Prompt Fragment
                      </div>
                      <div className="text-sm text-[#a0a0a8] whitespace-pre-wrap bg-[#0a0a0c] border border-[#1c1c1e] rounded-lg p-3 max-h-[150px] overflow-y-auto">
                        {skill.system_prompt_fragment}
                      </div>
                    </div>

                    {/* Allowed tools */}
                    {skill.allowed_tools && skill.allowed_tools.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                          Allowed Tools
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {skill.allowed_tools.map((tool, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-[#1c1c1e] text-[#909098]">
                              {String(tool)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {skill.tags && skill.tags.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {skill.tags.map((tag) => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-[#1c1c1e] text-[#707078]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Template assignments */}
                    <div>
                      <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-2">
                        Template Assignments
                      </div>
                      {detailLoading ? (
                        <Loader2 size={12} className="animate-spin text-[#505055]" />
                      ) : (
                        <div className="space-y-2">
                          {/* Existing links */}
                          {templateLinks.length > 0 ? (
                            templateLinks.map((link) => (
                              <div
                                key={link.agent_template_id}
                                className="flex items-center justify-between text-sm bg-[#0a0a0c] border border-[#1c1c1e] rounded-lg px-4 py-2.5"
                              >
                                <div className="flex items-center gap-2">
                                  <Link2 size={10} className="text-[#3b82f6]" />
                                  <span className="text-[#ccc]">{link.agent_templates?.name || "Unknown"}</span>
                                  <span className="text-xs text-[#505055]">priority {link.priority}</span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); unassignTemplate(skill.id, link.agent_template_id); }}
                                  className="flex items-center gap-1 text-xs text-[#ff4444] hover:text-[#ff6666] transition-colors"
                                >
                                  <Unlink size={10} /> Remove
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-[#505055]">Not assigned to any template</p>
                          )}

                          {/* Assign to template — only show if skill is approved */}
                          {skill.approval_status === "approved" && (
                            <TemplateAssigner
                              skillId={skill.id}
                              existingIds={templateLinks.map((l) => l.agent_template_id)}
                              templates={allTemplates}
                              onAssign={(tid) => assignTemplate(skill.id, tid)}
                            />
                          )}
                        </div>
                      )}
                    </div>
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
    <div className="bg-[#0a0a0c] border border-[#1c1c1e] rounded-lg px-4 py-2.5">
      <div className="text-[11px] text-[#606068] uppercase tracking-wider">{label}</div>
      <div className="text-sm text-[#ccc] mt-0.5">{value}</div>
    </div>
  );
}

function TemplateAssigner({
  skillId,
  existingIds,
  templates,
  onAssign,
}: {
  skillId: string;
  existingIds: string[];
  templates: TemplateOption[];
  onAssign: (templateId: string) => void;
}) {
  const available = templates.filter((t) => !existingIds.includes(t.id));
  const [selected, setSelected] = useState("");

  if (available.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mt-1">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="text-sm bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-[#ccc] outline-none focus:border-[#00ff88]/50"
      >
        <option value="">Assign to template...</option>
        {available.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <button
        onClick={() => { if (selected) { onAssign(selected); setSelected(""); } }}
        disabled={!selected}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-colors disabled:opacity-30"
      >
        <Link2 size={10} /> Assign
      </button>
    </div>
  );
}

// ── Skill Create/Edit Form ──

interface SkillFormProps {
  skill: SkillRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

function SkillForm({ skill, onClose, onSaved }: SkillFormProps) {
  const isEdit = !!skill;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [key, setKey] = useState(skill?.key || "");
  const [name, setName] = useState(skill?.name || "");
  const [description, setDescription] = useState(skill?.description || "");
  const [category, setCategory] = useState(skill?.category || "operations");
  const [systemPrompt, setSystemPrompt] = useState(skill?.system_prompt_fragment || "");
  const [runtime, setRuntime] = useState(skill?.preferred_runtime || "claude_code");
  const [costTier, setCostTier] = useState(skill?.cost_tier || 1);
  const [riskTier, setRiskTier] = useState(skill?.risk_tier || 1);
  const [businessContext, setBusinessContext] = useState(skill?.business_context || "music_school");
  const [tagsStr, setTagsStr] = useState((skill?.tags || []).join(", "));
  const [toolsStr, setToolsStr] = useState(
    (skill?.allowed_tools || []).map(String).join(", ")
  );

  async function handleSave() {
    setError(null);
    if (!key || !name || !description || !systemPrompt) {
      setError("Key, name, description, and system prompt are required");
      return;
    }

    setSaving(true);
    const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
    const allowed_tools = toolsStr.split(",").map((t) => t.trim()).filter(Boolean);

    if (isEdit) {
      const res = await fetch("/api/skills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: skill!.id,
          key,
          name,
          description,
          category,
          system_prompt_fragment: systemPrompt,
          preferred_runtime: runtime,
          cost_tier: costTier,
          risk_tier: riskTier,
          business_context: businessContext,
          tags,
          allowed_tools,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        setSaving(false);
        return;
      }
    } else {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          name,
          description,
          category,
          system_prompt_fragment: systemPrompt,
          preferred_runtime: runtime,
          cost_tier: costTier,
          risk_tier: riskTier,
          business_context: businessContext,
          tags,
          allowed_tools,
          approval_status: "draft",
          proposed_by: "admin",
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

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-16 overflow-y-auto">
      <div className="bg-[#101012] border border-[#232326] rounded-xl w-full max-w-2xl mx-4 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c1c1e]">
          <h3 className="text-xl font-extrabold text-[#f0f0f0]">
            {isEdit ? "Edit Skill" : "Create New Skill"}
          </h3>
          <button onClick={onClose} className="text-[#606068] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-[#ff4444] bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-lg px-4 py-2.5">
              <AlertTriangle size={12} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Key (slug)" value={key} onChange={setKey} placeholder="my-skill-key" disabled={isEdit} />
            <FormField label="Name" value={name} onChange={setName} placeholder="My Skill Name" />
          </div>

          <FormField label="Description" value={description} onChange={setDescription} placeholder="What this skill does..." multiline />

          <FormField label="System Prompt Fragment" value={systemPrompt} onChange={setSystemPrompt} placeholder="Instructions injected into the agent prompt..." multiline rows={5} />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/50">
                <option value="engineering">Engineering</option>
                <option value="operations">Operations</option>
                <option value="analytics">Analytics</option>
                <option value="content">Content</option>
                <option value="data">Data</option>
                <option value="deployment">Deployment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1">Runtime</label>
              <select value={runtime} onChange={(e) => setRuntime(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/50">
                <option value="claude_code">claude_code</option>
                <option value="api">api</option>
                <option value="browser">browser</option>
                <option value="manual">manual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1">Business Context</label>
              <select value={businessContext} onChange={(e) => setBusinessContext(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/50">
                <option value="music_school">music_school</option>
                <option value="future">future</option>
                <option value="legacy">legacy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1">Cost Tier</label>
              <select value={costTier} onChange={(e) => setCostTier(Number(e.target.value))}
                className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/50">
                <option value={1}>1 — Low</option>
                <option value={2}>2 — Medium</option>
                <option value={3}>3 — High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1">Risk Tier</label>
              <select value={riskTier} onChange={(e) => setRiskTier(Number(e.target.value))}
                className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/50">
                <option value={1}>1 — Low</option>
                <option value={2}>2 — Medium</option>
                <option value={3}>3 — High</option>
              </select>
            </div>
          </div>

          <FormField label="Tags (comma-separated)" value={tagsStr} onChange={setTagsStr} placeholder="build, deploy, verify" />

          <FormField label="Allowed Tools (comma-separated)" value={toolsStr} onChange={setToolsStr} placeholder="supabase-query, file-read" />

          {!isEdit && (
            <div className="flex items-center gap-2 text-xs text-[#707078] bg-[#0a0a0c] border border-[#1c1c1e] rounded-lg px-4 py-2.5">
              <Shield size={12} className="text-[#f59e0b] shrink-0" />
              New skills are created as drafts. Submit for approval to make them active.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#1c1c1e]">
          <button
            onClick={onClose}
            className="text-sm px-5 py-2.5 rounded-lg text-[#a0a0a8] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-[15px] px-5 py-2.5 rounded-lg bg-[#00ff88] text-black font-medium hover:bg-[#33ffaa] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {isEdit ? "Save Changes" : "Create Draft"}
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
  const cls = "w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00ff88]/50 placeholder-[#505055] disabled:opacity-50";
  return (
    <div>
      <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1">{label}</label>
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
