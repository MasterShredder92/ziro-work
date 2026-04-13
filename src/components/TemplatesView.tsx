"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Layers, Zap, AlertTriangle } from "lucide-react";

interface TemplateSkillLink {
  skill_id: string;
  priority: number;
  skills: { name: string; slug: string; runtime: string } | null;
}

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  supported_runtimes: string[];
  max_skills: number;
  task_types: string[];
  is_active: boolean;
  created_at: string;
  agent_template_skills: TemplateSkillLink[];
}

const RUNTIME_COLORS: Record<string, string> = {
  claude_code: "#00ff88",
  api: "#3b82f6",
  browser: "#f59e0b",
  manual: "#a855f7",
};

const CATEGORY_COLORS: Record<string, string> = {
  code: "#00ff88",
  crm: "#3b82f6",
  outreach: "#f59e0b",
  content: "#a855f7",
  analytics: "#ec4899",
  ops: "#14b8a6",
};

export default function TemplatesView() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("agent_templates")
      .select("*, agent_template_skills(skill_id, priority, skills(name, slug, runtime))")
      .eq("is_active", true)
      .eq("business_context", "music_school")
      .order("name", { ascending: true })
      .then(({ data }) => {
        setTemplates((data as Template[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-[#444]" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Agent Templates</h2>
          <p className="text-xs text-[#555] mt-1">
            Pre-configured agent profiles with skills and runtime routing
          </p>
        </div>
        <span className="text-xs text-[#555]">{templates.length} templates</span>
      </div>

      {templates.length === 0 ? (
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-12 text-center">
          <Layers size={32} className="mx-auto text-[#333] mb-3" />
          <p className="text-[#666] text-sm">No templates defined yet</p>
          <p className="text-[#444] text-xs mt-1">
            Run the seed SQL to populate templates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => {
            const skillCount = template.agent_template_skills?.length || 0;
            const overloaded = skillCount > template.max_skills;
            const skills = (template.agent_template_skills || [])
              .sort((a, b) => a.priority - b.priority)
              .map((l) => l.skills)
              .filter(Boolean);

            return (
              <div
                key={template.id}
                className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#252525] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-[#00ff88]" />
                      <span className="text-sm font-bold text-white">
                        {template.name}
                      </span>
                      {!template.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff4444]/10 text-[#ff4444]">
                          Inactive
                        </span>
                      )}
                      {overloaded && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b]">
                          <AlertTriangle size={10} />
                          Overloaded
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#888] mt-1">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {(template.supported_runtimes || []).map((rt) => (
                      <span
                        key={rt}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          color: RUNTIME_COLORS[rt] || "#888",
                          backgroundColor: `${RUNTIME_COLORS[rt] || "#888"}15`,
                        }}
                      >
                        {rt}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Task types / categories */}
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  <span className="text-[10px] text-[#555] mr-1">Routes:</span>
                  {(template.task_types || []).map((tt) => (
                    <span
                      key={tt}
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{
                        color: CATEGORY_COLORS[tt] || "#00ff88",
                        backgroundColor: `${CATEGORY_COLORS[tt] || "#00ff88"}15`,
                      }}
                    >
                      {tt}
                    </span>
                  ))}
                </div>

                {/* Skills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Zap size={10} className="text-[#555]" />
                  <span className="text-[10px] text-[#555]">
                    {skillCount}/{template.max_skills} skills:
                  </span>
                  {skills.map((s) =>
                    s ? (
                      <span
                        key={s.slug}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-[#1a1a1a] text-[#999]"
                      >
                        {s.name}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
