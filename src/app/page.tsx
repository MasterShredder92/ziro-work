"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar, { type ViewName } from "@/components/Sidebar";
import AgentChart from "@/components/AgentChart";
import ChatSidebar from "@/components/ChatSidebar";
import SkillsView from "@/components/SkillsView";
import TemplatesView from "@/components/TemplatesView";
import RunsView from "@/components/RunsView";
import ReviewsView from "@/components/ReviewsView";
import TaskBankView from "@/components/TaskBankView";
import ArchivedView from "@/components/ArchivedView";
import AgentProfilesView from "@/components/AgentProfilesView";
import StarConfigView from "@/components/StarConfigView";
import {
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  Search,
  SlidersHorizontal,
  Save,
  Loader2,
} from "lucide-react";

interface Agent {
  id: string;
  slug: string;
  name: string;
  role: string;
  status: string;
  color: string;
  mode: string | null;
  position_x: number;
  position_y: number;
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeView, setActiveView] = useState<ViewName>("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load visible agents (STAR + any currently-running spawned agents)
    supabase
      .from("agents")
      .select("id, slug, name, role, status, color, mode, position_x, position_y")
      .eq("is_visible_in_ui", true)
      .eq("is_archived", false)
      .eq("business_context", "music_school")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setAgents(data || []);
        setLoading(false);
      });

    // Realtime: spawned agents appear when created, disappear when retired
    const channel = supabase
      .channel("agents-canvas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as Agent & { is_visible_in_ui: boolean; is_archived: boolean; business_context: string };
            if (row.is_visible_in_ui && !row.is_archived && row.business_context === "music_school") {
              setAgents((prev) => [...prev.filter((a) => a.id !== row.id), row]);
            }
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as Agent & { is_visible_in_ui: boolean; is_archived: boolean; business_context: string };
            if (!row.is_visible_in_ui || row.is_archived || row.status === "retired") {
              // Agent retired — remove from canvas
              setAgents((prev) => prev.filter((a) => a.id !== row.id));
            } else if (row.business_context === "music_school") {
              // Agent updated — refresh it on canvas
              setAgents((prev) => prev.map((a) => a.id === row.id ? row : a));
            }
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setAgents((prev) => prev.filter((a) => a.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAgentClick = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
  }, []);

  const handleCloseChat = useCallback(() => {
    setSelectedAgent(null);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#080808]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            <span className="text-[#00ff88]">ZIRO</span>
            <span className="text-[#f0f0f0] ml-1">WORK</span>
          </h1>
          <div className="text-[#606068] text-[15px]">Loading command center...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main content */}
      <main
        className="flex-1 h-full transition-all duration-300"
        style={{
          marginLeft: 240,
          marginRight: selectedAgent ? 400 : 0,
        }}
      >
        {activeView === "dashboard" && <DashboardView agents={agents} />}
        {activeView === "agents" && (
          <AgentChart agents={agents} onAgentClick={handleAgentClick} />
        )}
        {activeView === "agent-profiles" && <AgentProfilesView />}
        {activeView === "star-config" && <StarConfigView />}
        {activeView === "contacts" && <ContactsView />}
        {activeView === "skills" && <SkillsView />}
        {activeView === "templates" && <TemplatesView />}
        {activeView === "runs" && <RunsView />}
        {activeView === "reviews" && <ReviewsView />}
        {activeView === "taskbank" && <TaskBankView />}
        {activeView === "archived" && <ArchivedView />}
        {activeView === "settings" && <SettingsView />}
      </main>

      {/* Chat sidebar — only relevant on agents view */}
      <ChatSidebar agent={selectedAgent} onClose={handleCloseChat} />
    </div>
  );
}

/* ─── Dashboard View ──────────────────────────────────────────────── */

function DashboardView({ agents }: { agents: Agent[] }) {
  const [mrr, setMrr] = useState<number>(0);
  const [target, setTarget] = useState<number>(1000000);
  const [phase, setPhase] = useState<string>("1");

  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .in("key", ["current_mrr", "target_mrr", "current_phase"])
      .then(({ data }) => {
        if (data) {
          for (const row of data) {
            if (row.key === "current_mrr") setMrr(Number(row.value));
            if (row.key === "target_mrr") setTarget(Number(row.value));
            if (row.key === "current_phase") setPhase(String(row.value));
          }
        }
      });
  }, []);

  const pct = target > 0 ? Math.min((mrr / target) * 100, 100) : 0;
  const spawnedAgents = agents.filter((a) => a.slug !== "star");
  const activeAgents = agents.filter(
    (a) => a.status === "deployed" || a.status === "active" || a.status === "running" || a.status === "build_now"
  ).length;

  const kpis = [
    {
      label: "Current MRR",
      value: `$${mrr.toLocaleString()}`,
      icon: DollarSign,
      color: "#00ff88",
    },
    {
      label: "Target MRR",
      value: `$${target.toLocaleString()}`,
      icon: TrendingUp,
      color: "#f59e0b",
    },
    {
      label: "Active Agents",
      value: `${activeAgents} / ${agents.length}`,
      icon: Activity,
      color: "#3b82f6",
    },
    {
      label: "Current Phase",
      value: `Phase ${phase}`,
      icon: Users,
      color: "#a855f7",
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-8">
      <h2 className="text-xl font-extrabold text-[#f0f0f0] mb-6">Command Center</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: kpi.color }} />
                <span className="text-xs text-[#707078] uppercase tracking-wider">
                  {kpi.label}
                </span>
              </div>
              <div className="text-2xl font-bold text-[#f0f0f0]">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* MRR Progress */}
      <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-6 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-medium text-[#a0a0a8]">
            Revenue Progress
          </span>
          <span className="text-sm text-[#606068]">{pct.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 bg-[#1c1c1e] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00ff88] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-[#606068]">
          <span>${mrr.toLocaleString()}</span>
          <span>${target.toLocaleString()}</span>
        </div>
      </div>

      {/* Agent Status List */}
      <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        <h3 className="text-[15px] font-medium text-[#a0a0a8] mb-4">Agent Status</h3>
        <div className="space-y-3">
          {/* STAR orchestrator — always first */}
          {agents.filter((a) => a.slug === "star").map((agent) => (
            <div key={agent.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full status-pulse"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="text-[15px] text-[#f0f0f0] font-bold">{agent.name}</span>
                <span className="text-sm text-[#606068]">Orchestrator</span>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full capitalize"
                style={{ color: agent.color, backgroundColor: `${agent.color}15` }}
              >
                {agent.status.replace("_", " ")}
              </span>
            </div>
          ))}

          {/* Spawned agents */}
          {spawnedAgents.length > 0 ? (
            spawnedAgents.map((agent) => {
              const isActive = agent.status === "active" || agent.status === "running";
              return (
                <div key={agent.id} className="flex items-center justify-between py-1 pl-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${isActive ? "status-pulse" : ""}`}
                      style={{ backgroundColor: agent.color }}
                    />
                    <span className="text-sm text-[#f0f0f0] font-medium">{agent.name}</span>
                    <span className="text-xs text-[#505055]">{agent.mode || "ephemeral"}</span>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{ color: agent.color, backgroundColor: `${agent.color}15` }}
                  >
                    {agent.status.replace("_", " ")}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-[#505055] pl-4 py-1">
              No spawned agents — STAR will create them as tasks arrive
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Contacts View ───────────────────────────────────────────────── */

function ContactsView() {
  const [contacts, setContacts] = useState<
    {
      id: string;
      business_name: string | null;
      owner_name: string | null;
      email: string | null;
      vertical: string | null;
      status: string;
      city: string | null;
      state: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("contacts")
      .select(
        "id, business_name, owner_name, email, vertical, status, city, state"
      )
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setContacts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold text-[#f0f0f0]">Contacts</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#101012] border border-[#1c1c1e] rounded-lg px-4 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            <Search size={14} className="text-[#606068]" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="bg-transparent text-[15px] text-[#f0f0f0] placeholder-[#606068] outline-none w-48"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-[#505055]" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <Users size={32} className="mx-auto text-[#333] mb-3" />
          <p className="text-[#707078] text-[15px] mb-1">No contacts yet</p>
          <p className="text-[#505055] text-sm">
            Contacts will appear here as agents bring them in.
          </p>
        </div>
      ) : (
        <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1c1c1e] text-[#707078] text-sm tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Business</th>
                <th className="text-left px-4 py-3 font-medium">Owner</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Vertical</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[#1c1c1e] last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3.5 text-[#f0f0f0]">
                    {c.business_name || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-[#a0a0a8]">
                    {c.owner_name || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-[#a0a0a8]">{c.email || "—"}</td>
                  <td className="px-4 py-3.5 text-[#a0a0a8] capitalize">
                    {c.vertical?.replace("_", " ") || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-[#a0a0a8]">
                    {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm px-2 py-0.5 rounded-full bg-[#1c1c1e] text-[#909098] capitalize">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Settings View ───────────────────────────────────────────────── */

function SettingsView() {
  const [mrr, setMrr] = useState<number>(0);
  const [target, setTarget] = useState<number>(1000000);
  const [phase, setPhase] = useState<string>("1");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .in("key", ["current_mrr", "target_mrr", "current_phase"])
      .then(({ data }) => {
        if (data) {
          for (const row of data) {
            if (row.key === "current_mrr") setMrr(Number(row.value));
            if (row.key === "target_mrr") setTarget(Number(row.value));
            if (row.key === "current_phase") setPhase(String(row.value));
          }
        }
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const now = new Date().toISOString();
    await Promise.all([
      supabase
        .from("settings")
        .update({ value: String(mrr), updated_at: now })
        .eq("key", "current_mrr"),
      supabase
        .from("settings")
        .update({ value: String(target), updated_at: now })
        .eq("key", "target_mrr"),
      supabase
        .from("settings")
        .update({ value: phase, updated_at: now })
        .eq("key", "current_phase"),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <h2 className="text-xl font-extrabold text-[#f0f0f0] mb-6">Settings</h2>

      <div className="max-w-lg space-y-6">
        <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-6 space-y-5 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal size={18} className="text-[#00ff88]" />
            <span className="text-[15px] font-medium text-[#f0f0f0]">
              Revenue & Phase
            </span>
          </div>

          <div>
            <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1.5">
              Current MRR ($)
            </label>
            <input
              type="number"
              value={mrr}
              onChange={(e) => setMrr(Number(e.target.value))}
              className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-[15px] text-[#f0f0f0] outline-none focus:border-[#00ff88]/50"
            />
          </div>

          <div>
            <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1.5">
              Target MRR ($)
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-[15px] text-[#f0f0f0] outline-none focus:border-[#00ff88]/50"
            />
          </div>

          <div>
            <label className="block text-xs text-[#707078] uppercase tracking-wider mb-1.5">
              Current Phase
            </label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#232326] rounded-xl px-4 py-2.5 text-[15px] text-[#f0f0f0] outline-none focus:border-[#00ff88]/50"
            >
              <option value="1">Phase 1 — Build & Validate</option>
              <option value="2">Phase 2 — Beta & Outreach</option>
              <option value="3">Phase 3 — Scale</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00ff88] text-black rounded-lg text-[15px] font-medium hover:bg-[#33ffaa] transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
