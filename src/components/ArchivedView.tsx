"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Archive, Bot, Layers, Zap } from "lucide-react";

type Tab = "agents" | "templates" | "skills";

interface ArchivedAgent {
  id: string;
  slug: string;
  name: string;
  role: string;
  status: string;
  mode: string | null;
  business_context: string | null;
  color: string;
  created_at: string;
}

interface ArchivedTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_active: boolean;
  business_context: string | null;
  supported_runtimes: string[];
  created_at: string;
}

interface ArchivedSkill {
  id: string;
  slug: string;
  name: string;
  description: string;
  runtime: string;
  is_active: boolean;
  business_context: string | null;
  created_at: string;
}

export default function ArchivedView() {
  const [tab, setTab] = useState<Tab>("agents");
  const [agents, setAgents] = useState<ArchivedAgent[]>([]);
  const [templates, setTemplates] = useState<ArchivedTemplate[]>([]);
  const [skills, setSkills] = useState<ArchivedSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === "agents") {
      supabase
        .from("agents")
        .select("id, slug, name, role, status, mode, business_context, color, created_at")
        .or("is_archived.eq.true,is_visible_in_ui.eq.false")
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data }) => {
          setAgents((data as ArchivedAgent[]) || []);
          setLoading(false);
        });
    } else if (tab === "templates") {
      supabase
        .from("agent_templates")
        .select("id, slug, name, description, is_active, business_context, supported_runtimes, created_at")
        .or("is_active.eq.false,business_context.neq.music_school")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setTemplates((data as ArchivedTemplate[]) || []);
          setLoading(false);
        });
    } else {
      supabase
        .from("skills")
        .select("id, slug, name, description, runtime, is_active, business_context, created_at")
        .or("is_active.eq.false,business_context.neq.music_school")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setSkills((data as ArchivedSkill[]) || []);
          setLoading(false);
        });
    }
  }, [tab]);

  const tabs: { key: Tab; label: string; icon: typeof Bot }[] = [
    { key: "agents", label: "Agents", icon: Bot },
    { key: "templates", label: "Templates", icon: Layers },
    { key: "skills", label: "Skills", icon: Zap },
  ];

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#f0f0f0]">Archived / Hidden</h2>
          <p className="text-sm text-[#606068] mt-1">
            Preserved records hidden from active UI — data intact, not deleted
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-colors ${
                tab === t.key
                  ? "bg-white/10 text-white"
                  : "text-[#606068] hover:text-[#a0a0a8]"
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-[#505055]" />
        </div>
      ) : (
        <>
          {/* Agents */}
          {tab === "agents" && (
            agents.length === 0 ? (
              <EmptyState label="No archived agents" />
            ) : (
              <div className="space-y-2">
                {agents.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-4 bg-[#101012] border border-[#1c1c1e] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#d0d0d8]">{a.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#606068]">{a.role}</span>
                        <span className="text-xs text-[#505055]">{a.mode || "—"}</span>
                        <span className="text-xs text-[#505055]">{a.business_context || "—"}</span>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1c1c1e] text-[#707078]">
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Templates */}
          {tab === "templates" && (
            templates.length === 0 ? (
              <EmptyState label="No archived templates" />
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <div key={t.id} className="p-4 bg-[#101012] border border-[#1c1c1e] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#d0d0d8]">{t.name}</div>
                      <div className="flex gap-1">
                        {!t.is_active && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#ff4444]/10 text-[#ff4444]">
                            Inactive
                          </span>
                        )}
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#1c1c1e] text-[#707078]">
                          {t.business_context || "—"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#707078] mt-1">{t.description}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Skills */}
          {tab === "skills" && (
            skills.length === 0 ? (
              <EmptyState label="No archived skills" />
            ) : (
              <div className="space-y-2">
                {skills.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-4 bg-[#101012] border border-[#1c1c1e] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    <Zap size={12} className="text-[#606068]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#d0d0d8]">{s.name}</div>
                      <div className="text-xs text-[#606068] mt-0.5">{s.runtime} / {s.business_context || "—"}</div>
                    </div>
                    {!s.is_active && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[#ff4444]/10 text-[#ff4444]">
                        Inactive
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      <Archive size={32} className="mx-auto text-[#3a3a3e] mb-3" />
      <p className="text-[#707078] text-[15px]">{label}</p>
    </div>
  );
}
