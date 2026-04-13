"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar, { type ViewName } from "@/components/Sidebar";
import AgentChart from "@/components/AgentChart";
import ChatSidebar from "@/components/ChatSidebar";
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
  position_x: number;
  position_y: number;
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeView, setActiveView] = useState<ViewName>("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("agents")
      .select("id, slug, name, role, status, color, position_x, position_y")
      .order("position_x", { ascending: true })
      .then(({ data }) => {
        setAgents(data || []);
        setLoading(false);
      });
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
          <h1 className="text-xl font-bold mb-2">
            <span className="text-[#00ff88]">ZIRO</span>
            <span className="text-white ml-1">WORK</span>
          </h1>
          <div className="text-[#555] text-sm">Loading command center...</div>
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
          marginLeft: 220,
          marginRight: selectedAgent ? 400 : 0,
        }}
      >
        {activeView === "dashboard" && <DashboardView agents={agents} />}
        {activeView === "agents" && (
          <AgentChart agents={agents} onAgentClick={handleAgentClick} />
        )}
        {activeView === "contacts" && <ContactsView />}
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
  const activeAgents = agents.filter(
    (a) => a.status === "build_now" || a.status === "deployed"
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
      <h2 className="text-lg font-bold text-white mb-6">Command Center</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: kpi.color }} />
                <span className="text-[11px] text-[#666] uppercase tracking-wider">
                  {kpi.label}
                </span>
              </div>
              <div className="text-xl font-bold text-white">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* MRR Progress */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#999]">
            Revenue Progress
          </span>
          <span className="text-xs text-[#555]">{pct.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00ff88] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-[#555]">
          <span>${mrr.toLocaleString()}</span>
          <span>${target.toLocaleString()}</span>
        </div>
      </div>

      {/* Agent Status List */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
        <h3 className="text-sm font-medium text-[#999] mb-4">Agent Status</h3>
        <div className="space-y-3">
          {agents.map((agent) => {
            const isActive =
              agent.status === "build_now" || agent.status === "deployed";
            return (
              <div
                key={agent.id}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${isActive ? "status-pulse" : ""}`}
                    style={{ backgroundColor: agent.color }}
                  />
                  <span className="text-sm text-white font-medium">
                    {agent.name}
                  </span>
                  <span className="text-xs text-[#555]">{agent.role}</span>
                </div>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    color: agent.color,
                    backgroundColor: `${agent.color}15`,
                  }}
                >
                  {agent.status.replace("_", " ")}
                </span>
              </div>
            );
          })}
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
        <h2 className="text-lg font-bold text-white">Contacts</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] rounded-lg px-3 py-1.5">
            <Search size={14} className="text-[#555]" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="bg-transparent text-sm text-white placeholder-[#555] outline-none w-48"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-[#444]" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-12 text-center">
          <Users size={32} className="mx-auto text-[#333] mb-3" />
          <p className="text-[#666] text-sm mb-1">No contacts yet</p>
          <p className="text-[#444] text-xs">
            Contacts will appear here as SCOUT brings them in.
          </p>
        </div>
      ) : (
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a] text-[#666] text-xs uppercase tracking-wider">
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
                  className="border-b border-[#1a1a1a] last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 text-white">
                    {c.business_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-[#999]">
                    {c.owner_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-[#999]">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-[#999] capitalize">
                    {c.vertical?.replace("_", " ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-[#999]">
                    {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#888] capitalize">
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
      <h2 className="text-lg font-bold text-white mb-6">Settings</h2>

      <div className="max-w-lg space-y-6">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal size={16} className="text-[#00ff88]" />
            <span className="text-sm font-medium text-white">
              Revenue & Phase
            </span>
          </div>

          <div>
            <label className="block text-[11px] text-[#666] uppercase tracking-wider mb-1.5">
              Current MRR ($)
            </label>
            <input
              type="number"
              value={mrr}
              onChange={(e) => setMrr(Number(e.target.value))}
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00ff88]/50"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#666] uppercase tracking-wider mb-1.5">
              Target MRR ($)
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00ff88]/50"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#666] uppercase tracking-wider mb-1.5">
              Current Phase
            </label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00ff88]/50"
            >
              <option value="1">Phase 1 — Build & Validate</option>
              <option value="2">Phase 2 — Beta & Outreach</option>
              <option value="3">Phase 3 — Scale</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#00ff88] text-black rounded-lg text-sm font-medium hover:bg-[#33ffaa] transition-colors disabled:opacity-50"
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
