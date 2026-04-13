"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Zap, Tag } from "lucide-react";

interface Skill {
  id: string;
  slug: string;
  name: string;
  description: string;
  runtime: string;
  tags: string[];
  created_at: string;
}

const RUNTIME_COLORS: Record<string, string> = {
  claude_code: "#00ff88",
  api: "#3b82f6",
  browser: "#f59e0b",
  manual: "#a855f7",
};

export default function SkillsView() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRuntime, setFilterRuntime] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("skills")
      .select("*")
      .eq("is_active", true)
      .eq("business_context", "music_school")
      .order("name", { ascending: true })
      .then(({ data }) => {
        setSkills(data || []);
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

  const runtimes = [...new Set(skills.map((s) => s.runtime))];
  const filtered = filterRuntime === "all"
    ? skills
    : skills.filter((s) => s.runtime === filterRuntime);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Skills</h2>
          <p className="text-xs text-[#555] mt-1">
            Reusable capability packs injected into agent prompts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <button
              onClick={() => setFilterRuntime("all")}
              className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                filterRuntime === "all"
                  ? "bg-white/10 text-white"
                  : "text-[#555] hover:text-[#999]"
              }`}
            >
              All
            </button>
            {runtimes.map((rt) => (
              <button
                key={rt}
                onClick={() => setFilterRuntime(rt)}
                className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                  filterRuntime === rt
                    ? "text-white"
                    : "hover:text-[#999]"
                }`}
                style={{
                  color: filterRuntime === rt ? (RUNTIME_COLORS[rt] || "#888") : undefined,
                  backgroundColor: filterRuntime === rt ? `${RUNTIME_COLORS[rt] || "#888"}15` : undefined,
                }}
              >
                {rt}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#555]">{filtered.length} skills</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-12 text-center">
          <Zap size={32} className="mx-auto text-[#333] mb-3" />
          <p className="text-[#666] text-sm">No skills found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((skill) => {
            const runtimeColor = RUNTIME_COLORS[skill.runtime] || "#888";
            return (
              <div
                key={skill.id}
                className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#252525] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap size={14} style={{ color: runtimeColor }} />
                    <span className="text-sm font-bold text-white">
                      {skill.name}
                    </span>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      color: runtimeColor,
                      backgroundColor: `${runtimeColor}15`,
                    }}
                  >
                    {skill.runtime}
                  </span>
                </div>

                <p className="text-xs text-[#888] mb-3 line-clamp-2">
                  {skill.description}
                </p>

                {skill.tags && skill.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tag size={10} className="text-[#444]" />
                    {skill.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-[#666]"
                      >
                        {tag}
                      </span>
                    ))}
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
