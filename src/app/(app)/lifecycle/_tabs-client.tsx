"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StageSurfaceClient } from "./[stage]/_client";
import type { LifecycleStageId } from "@/lib/lifecycle/types";

// ─── Stage definitions ────────────────────────────────────────────────────────
const STAGES: { id: LifecycleStageId; label: string; short: string }[] = [
  { id: "intake",           label: "Inquiries",      short: "Inquiries"  },
  { id: "lead-work",        label: "Follow-up",      short: "Follow-up"  },
  { id: "scheduling",       label: "Scheduling",     short: "Scheduling" },
  { id: "enrollment",       label: "Enrollment",     short: "Enrollment" },
  { id: "service-delivery", label: "Ongoing Lessons",short: "Lessons"    },
  { id: "relationship",     label: "Client Care",    short: "Care"       },
  { id: "retention",        label: "Retention",      short: "Retention"  },
  { id: "win-back",         label: "Win Back",       short: "Win Back"   },
];

// Arrow connector between tabs
function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3 shrink-0 text-[#303035]" aria-hidden>
      <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

type Props = {
  tenantId: string;
  locationId: string | null;
  initialTab: string;
};

export function LifecycleTabsClient({ tenantId, locationId, initialTab }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive active tab from URL or prop
  const activeTab = (searchParams.get("tab") || initialTab) as LifecycleStageId;
  const activeIndex = STAGES.findIndex((s) => s.id === activeTab);
  const safeActiveTab = activeIndex >= 0 ? activeTab : "intake";

  function setTab(id: LifecycleStageId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.push(`/lifecycle?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header ── */}
      <div className="shrink-0 px-6 pt-6 pb-0 space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Customer Lifecycle
          </div>
          <h1 className="text-xl font-semibold text-[var(--z-fg)]">Student Journey</h1>
          <p className="text-xs text-[var(--z-muted)] mt-0.5">
            Track every student from first inquiry to long-term retention.
          </p>
        </div>

        {/* ── Horizontal stage tabs ── */}
        <div className="overflow-x-auto pb-0">
          <div className="flex items-center gap-1 min-w-max">
            {STAGES.map((stage, i) => {
              const isActive = stage.id === safeActiveTab;
              const isPast = STAGES.findIndex((s) => s.id === safeActiveTab) > i;
              return (
                <React.Fragment key={stage.id}>
                  <button
                    type="button"
                    onClick={() => setTab(stage.id)}
                    className={[
                      "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap",
                      isActive
                        ? "bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30"
                        : isPast
                        ? "text-[#505055] hover:text-[#909098] hover:bg-white/5 border border-transparent"
                        : "text-[#303035] hover:text-[#505055] hover:bg-white/3 border border-transparent",
                    ].join(" ")}
                  >
                    {/* Step number */}
                    <span
                      className={[
                        "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold shrink-0",
                        isActive
                          ? "bg-[#00ff88]/30 text-[#00ff88]"
                          : isPast
                          ? "bg-[#303035] text-[#505055]"
                          : "bg-[#1c1c1e] text-[#303035]",
                      ].join(" ")}
                    >
                      {i + 1}
                    </span>
                    {/* Label — short on small screens */}
                    <span className="hidden sm:inline">{stage.label}</span>
                    <span className="sm:hidden">{stage.short}</span>
                  </button>
                  {i < STAGES.length - 1 && <Arrow />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-[var(--z-border)]" />
      </div>

      {/* ── Stage content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]">
        <StageSurfaceClient
          key={safeActiveTab}
          stageId={safeActiveTab}
          tenantId={tenantId}
          locationId={locationId}
        />
      </div>
    </div>
  );
}
