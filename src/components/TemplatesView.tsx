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
        <Loader2 size={20} className="animate-spin text-[#505055]" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#f0f0f0]">Agent Templates</h2>
          <p className="text-sm text-[#606068] mt-1">
            Pre-configured agent profiles with skills and runtime routing
          </p>
        </div>
        <span className="text-sm text-[#606068]">{templates.length} templates</span>
      </div>

      {templates.length === 0 ? (
        <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <Layers size={32} className="mx-auto text-[#3a3a3e] mb-3" />
          <p className="text-[#707078] text-[15px]">No templates defined yet</p>
          <p className="text-[#505055] text-sm mt-1">
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
                className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-6 hover:border-[#2a2a2e] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-[#00ff88]" />
                      <span className="text-[15px] font-bold text-[#f0f0f0]">
                        {template.name}
                      </span>
                      {!template.is_active && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#ff4444]/10 text-[#ff4444]">
                          Inactive
                        </span>
                      )}
                      {overloaded && (
                        <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b]">
                          <AlertTriangle size={10} />
                          Overloaded
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#909098] mt-1">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {(template.supported_runtimes || []).map((rt) => (
                      <span
                        key={rt}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          color: RUNTIME_COLORS[rt] || "#909098",
                          backgroundColor: `${RUNTIME_COLORS[rt] || "#909098"}15`,
                        }}
                      >
                        {rt}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Task types / categories */}
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  <span className="text-xs text-[#606068] mr-1">Routes:</span>
                  {(template.task_types || []).map((tt) => (
                    <span
                      key={tt}
                      className="text-xs px-1.5 py-0.5 rounded font-medium"
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
                  <Zap size={10} className="text-[#606068]" />
                  <span className="text-xs text-[#606068]">
                    {skillCount}/{template.max_skills} skills:
                  </span>
                  {skills.map((s) =>
                    s ? (
                      <span
                        key={s.slug}
                        className="text-xs px-1.5 py-0.5 rounded border border-[#1c1c1e] text-[#a0a0a8]"
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
