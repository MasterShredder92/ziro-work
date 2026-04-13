"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Bot, Users, Settings } from "lucide-react";
import clsx from "clsx";
import MrrTracker from "./MrrTracker";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Agents", icon: Bot, href: "/" },
  { label: "Contacts", icon: Users, href: "/" },
  { label: "Settings", icon: Settings, href: "/" },
];

export default function Sidebar() {
  const [phase, setPhase] = useState<string>("1");
  const [activeNav, setActiveNav] = useState("Dashboard");

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
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
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
