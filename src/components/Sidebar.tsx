"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Users, Settings, Zap, Layers, Play, Star, FileText, Archive, UserCog, Sparkles, Orbit } from "lucide-react";
import clsx from "clsx";
import MrrTracker from "./MrrTracker";

export type ViewName =
  | "dashboard"
  | "organization"
  | "agent-profiles"
  | "star-config"
  | "contacts"
  | "skills"
  | "templates"
  | "runs"
  | "reviews"
  | "taskbank"
  | "archived"
  | "settings";

const navItems: { label: string; view: ViewName; icon: typeof LayoutDashboard; section?: string }[] = [
  { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { label: "Organization", view: "organization", icon: Orbit },
  { label: "Contacts", view: "contacts", icon: Users },
  { label: "Star Config", view: "star-config", icon: Sparkles, section: "orchestrator" },
  { label: "Agents", view: "agent-profiles", icon: UserCog, section: "orchestrator" },
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
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeView, setActiveView, isOpen, onClose }: SidebarProps) {
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
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`fixed left-0 top-0 h-full w-[240px] bg-[#0a0a0c] border-r border-[#1c1c1e] flex flex-col z-50 transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
      {/* Logo */}
      <div className="px-6 pt-7 pb-5">
        <h1 className="text-2xl tracking-tighter">
          <span className="text-[#00ff88] font-extrabold">ZIRO</span>
          <span className="text-white ml-1 font-light">WORK</span>
        </h1>
      </div>

      {/* MRR */}
      <div className="px-6 pb-3">
        <MrrTracker />
      </div>

      {/* Phase Badge */}
      <div className="px-6 pb-6">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20">
          Phase {phase}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#1c1c1e] mx-6" />

      {/* Nav */}
      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          const prevItem = navItems[idx - 1];
          const showDivider = item.section === "orchestrator" && prevItem?.section !== "orchestrator";
          return (
            <div key={item.view}>
              {showDivider && (
                <div className="pt-4 pb-3 px-4">
                  <div className="text-xs font-semibold text-[#505055] uppercase tracking-wider">Orchestrator</div>
                </div>
              )}
              <button
                onClick={() => {
                  setActiveView(item.view);
                  onClose();
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-[#00ff88]/10 text-[#00ff88]"
                    : "text-[#909098] hover:text-white hover:bg-white/5"
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
      <div className="px-6 pb-6 text-xs text-[#505055]">
        Ziro Work v0.1
      </div>
    </aside>
    </>
  );
}
