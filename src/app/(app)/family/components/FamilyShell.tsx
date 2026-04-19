"use client";

import { useState, type ReactNode } from "react";
import { PortalQuickActionStrip } from "@/components/portals/PortalQuickActionStrip";
import type { FamilyDisplayProfile } from "@/lib/family/types";
import { FamilySidebar } from "./FamilySidebar";

const FAMILY_QUICK_ACTIONS = [
  { id: "invoices", href: "/family/invoices", label: "Pay invoice", icon: "$" },
  { id: "schedule", href: "/schedule/family", label: "Student schedule", icon: "⌚" },
  { id: "messages", href: "/messages", label: "Message teacher", icon: "✉" },
  { id: "automation", href: "/automation", label: "Agent automations", icon: "⚙" },
  { id: "profile", href: "/family/profile", label: "Update family info", icon: "◎" },
] as const;

interface FamilyShellProps {
  profile: FamilyDisplayProfile | null;
  children: ReactNode;
  allowedNavIds?: string[] | null;
}

export function FamilyShell({
  profile,
  children,
  allowedNavIds,
}: FamilyShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[color-mix(in_oklab,var(--z-bg),black_4%)] pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:flex-row">
      <aside
        className={`${
          mobileOpen
            ? "fixed bottom-[env(safe-area-inset-bottom)] left-[max(0px,env(safe-area-inset-left))] top-[env(safe-area-inset-top)] z-30 w-64 max-w-[min(16rem,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)))] border-r shadow-xl"
            : "hidden"
        } md:static md:block md:max-w-none md:w-[220px] md:shrink-0 md:border-r md:border-b-0 md:shadow-none border-[var(--z-border)] bg-[var(--z-surface)]`}
      >
        <div className="sticky top-0 flex flex-col">
          <FamilySidebar
            allowedNavIds={allowedNavIds}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </aside>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-[var(--z-border)] bg-[var(--z-surface)]/95 px-4 supports-[backdrop-filter]:backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--z-border)] text-[var(--z-fg)] md:hidden"
              aria-label="Toggle navigation"
            >
              <span className="text-lg leading-none">≡</span>
            </button>
            <div className="text-sm font-semibold text-[var(--z-fg)]">
              Family Dashboard
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-[var(--z-fg)]">
                {profile?.familyName ?? "Family"}
              </div>
              {profile?.email ? (
                <div className="text-xs text-[var(--z-muted)]">
                  {profile.email}
                </div>
              ) : null}
            </div>
            <FamilyAvatar profile={profile} />
          </div>
        </header>

        <PortalQuickActionStrip
          ariaLabel="Family quick actions"
          allowedNavIds={allowedNavIds}
          actions={FAMILY_QUICK_ACTIONS}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function FamilyAvatar({ profile }: { profile: FamilyDisplayProfile | null }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] text-sm font-semibold text-[var(--z-accent)]">
      {profile?.initials ?? "F"}
    </div>
  );
}
