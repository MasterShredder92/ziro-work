"use client";

import { useState, type ReactNode } from "react";
import { PortalQuickActionStrip } from "@/components/portals/PortalQuickActionStrip";
import type { StudentDisplayProfile } from "@/lib/student/types";
import { StudentSidebar } from "./StudentSidebar";

const STUDENT_QUICK_ACTIONS = [
  { id: "schedule", href: "/schedule/student", label: "View schedule", icon: "⌚" },
  { id: "billing", href: "/student#billing", label: "View billing", icon: "$" },
  { id: "messages", href: "/messages", label: "Message teacher", icon: "✉" },
  { id: "automation", href: "/automation", label: "Agent automations", icon: "⚙" },
  { id: "progress", href: "/student/progress", label: "View progress", icon: "★" },
  { id: "lessons", href: "/student#lessons", label: "Lessons", icon: "♪" },
] as const;

export interface StudentShellProps {
  profile: StudentDisplayProfile | null;
  allowedNavIds?: string[] | null;
  children: ReactNode;
}

export function StudentShell({
  profile,
  allowedNavIds,
  children,
}: StudentShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = profile?.fullName ?? "Student";

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--z-bg)] pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-[var(--z-border)] bg-[var(--z-surface)]/95 px-4 supports-[backdrop-filter]:backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] text-[var(--z-fg)] lg:hidden"
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--z-radius-sm)] font-bold text-black"
            style={{ backgroundColor: "var(--z-accent)" }}
          >
            Z
          </span>
          <div className="truncate text-sm font-semibold text-[var(--z-fg)]">
            ZiroWork OS · Student
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="truncate text-sm font-semibold text-[var(--z-fg)]">
              {displayName}
            </div>
            {profile?.instrument ? (
              <div className="truncate text-xs text-[var(--z-muted)]">
                {profile.instrument}
                {profile.teacherName ? ` · ${profile.teacherName}` : ""}
              </div>
            ) : null}
          </div>
          <StudentAvatar profile={profile} />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <aside
          className={`${
            mobileOpen
              ? "absolute inset-y-0 left-0 z-30 w-64 max-w-[min(16rem,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)))] shadow-xl"
              : "hidden"
          } shrink-0 border-r border-[var(--z-border)] bg-[var(--z-surface)] lg:static lg:block lg:w-60 lg:max-w-none lg:shadow-none`}
        >
          <StudentSidebar
            allowedNavIds={allowedNavIds}
            onNavigate={() => setMobileOpen(false)}
          />
        </aside>

        {mobileOpen ? (
          <div
            className="absolute inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PortalQuickActionStrip
            ariaLabel="Student quick actions"
            allowedNavIds={allowedNavIds}
            actions={STUDENT_QUICK_ACTIONS}
          />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function StudentAvatar({
  profile,
}: {
  profile: StudentDisplayProfile | null;
}) {
  return (
    <div
      aria-hidden
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-accent),transparent_70%)] text-xs font-semibold text-[var(--z-fg)]"
    >
      {profile?.initials || "S"}
    </div>
  );
}
