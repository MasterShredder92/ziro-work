"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Bot, Users, Settings, Zap, Layers, Play, Star, FileText, Archive } from "lucide-react";
import clsx from "clsx";
import MrrTracker from "./MrrTracker";

export type ViewName = "dashboard" | "agents" | "contacts" | "skills" | "templates" | "runs" | "reviews" | "taskbank" | "archived" | "settings";

const navItems: { label: string; view: ViewName; icon: typeof LayoutDashboard; section?: string }[] = [
  { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { label: "Agents", view: "agents", icon: Bot },
  { label: "Contacts", view: "contacts", icon: Users },
  { label: "Skills", view: "skills", icon: Zap, section: "orchestrator" },
  { label: "Templates", view: "templates", icon: Layers, section: "orchestrator" },
  { label: "Runs", view: "runs", icon: Play, section: "orchestrator" },
  { label: "Reviews", view: "reviews", icon: Star, section: "orchestrator" },
  { label: "Task Bank", view: "taskbank", icon: FileText, section: "orchestrator" },
  { label: "Archived", view: "archived", icon: Archive, section: "orchestrator" },
  { label: "Settings", view: "settings", icon: Settings },
];

interface SidebarProps {
  activeView: ViewName;
  setActiveView: (view: ViewName) => void;
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const [phase, setPhase] = useState<string>("1");

  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .eq("key", "current_phase")
      .single()
      .then(({ data }) => {
        if (data) setPhase(String(data.value));
      });
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-[#0c0c0c] border-r border-[#1a1a1a] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-[#00ff88]">ZIRO</span>
          <span className="text-white ml-1">WORK</span>
        </h1>
      </div>

      {/* MRR */}
      <div className="px-5 pb-2">
        <MrrTracker />
      </div>

      {/* Phase Badge */}
      <div className="px-5 pb-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20">
          Phase {phase}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#1a1a1a] mx-5" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          const prevItem = navItems[idx - 1];
          const showDivider = item.section === "orchestrator" && prevItem?.section !== "orchestrator";
          return (
            <div key={item.view}>
              {showDivider && (
                <div className="pt-3 pb-2 px-3">
                  <div className="text-[10px] font-semibold text-[#444] uppercase tracking-wider">Orchestrator</div>
                </div>
              )}
              <button
                onClick={() => setActiveView(item.view)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#00ff88]/10 text-[#00ff88]"
                    : "text-[#888] hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={18} />
                {item.label}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 pb-5 text-[11px] text-[#444]">
        Ziro Work v0.1
      </div>
    </aside>
  );
}
