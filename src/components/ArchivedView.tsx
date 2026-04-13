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
          <h2 className="text-lg font-bold text-white">Archived / Hidden</h2>
          <p className="text-xs text-[#555] mt-1">
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
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                tab === t.key
                  ? "bg-white/10 text-white"
                  : "text-[#555] hover:text-[#999]"
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
          <Loader2 size={20} className="animate-spin text-[#444]" />
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
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-[#111] border border-[#1a1a1a] rounded-xl">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#ccc]">{a.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#555]">{a.role}</span>
                        <span className="text-[10px] text-[#444]">{a.mode || "—"}</span>
                        <span className="text-[10px] text-[#444]">{a.business_context || "—"}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#666]">
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
                  <div key={t.id} className="p-3 bg-[#111] border border-[#1a1a1a] rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-[#ccc]">{t.name}</div>
                      <div className="flex gap-1">
                        {!t.is_active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff4444]/10 text-[#ff4444]">
                            Inactive
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-[#666]">
                          {t.business_context || "—"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#666] mt-1">{t.description}</p>
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
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-[#111] border border-[#1a1a1a] rounded-xl">
                    <Zap size={12} className="text-[#555]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#ccc]">{s.name}</div>
                      <div className="text-[10px] text-[#555] mt-0.5">{s.runtime} / {s.business_context || "—"}</div>
                    </div>
                    {!s.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff4444]/10 text-[#ff4444]">
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
    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-12 text-center">
      <Archive size={32} className="mx-auto text-[#333] mb-3" />
      <p className="text-[#666] text-sm">{label}</p>
    </div>
  );
}
