"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { CommandPalette } from "@/components/command/CommandPalette";
import { useTenantUi } from "@/components/tenant/TenantUiContext";
import { getRouteByHref } from "@/lib/routes";
import Link from "next/link";
import { ClientPageTitle } from "@/components/navigation/ClientPageTitle";
import { cn } from "@/components/ui/utils";

function titleForPath(pathname: string): string {
  const hit = getRouteByHref(pathname);
  if (hit) return hit.label;
  if (pathname.startsWith("/students/")) return "Student profile";
  if (pathname.startsWith("/teachers/")) return "Teacher profile";
  if (pathname.startsWith("/lifecycle/")) {
    const seg = pathname.split("/")[2] ?? "";
    if (!seg) return "Lifecycle";
    return seg
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/docs")) return "Documentation";
  if (pathname.startsWith("/admin/")) return "Admin";
  if (pathname === "/help") return "Help";
  return "ZiroWork";
}

type TopBarProps = {
  onMenuToggle?: () => void;
};

export function TopBar({ onMenuToggle }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenantId } = useTenantUi();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const pageTitle = titleForPath(pathname);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() !== "k") return;
      e.preventDefault();
      setCommandOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-[var(--z-space-3)] border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)] px-[var(--z-space-4)] py-[var(--z-space-3)] backdrop-blur-md sm:px-[var(--z-space-5)]">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Hamburger — visible only on mobile */}
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#2b2b2f] bg-[#111113] text-[#e0e0e6] active:scale-95 lg:hidden"
            aria-label="Open navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
          {/* Search icon — mobile only */}
          <button
            type="button"
            onClick={() => setCommandOpen((v) => !v)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#2b2b2f] bg-[#111113] text-[#909098] active:scale-95 sm:hidden"
            aria-label="Open quick actions"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12.5 12.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="min-w-0 flex-1 flex items-center gap-4">
            <ClientPageTitle title={pageTitle} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-[var(--z-space-2)] sm:gap-[var(--z-space-3)]">
          <Link
            href="/help"
            className="rounded-[var(--z-radius-md)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-accent)]"
          >
            Help
          </Link>
          <span
            className="hidden select-none text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--z-muted)] lg:inline"
          >
            ⌘K
          </span>
          <NotificationBell />
        </div>
      </header>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        tenantId={tenantId}
        onNewFamily={() => {
          router.push("/families");
          setCommandOpen(false);
        }}
        onNewStudent={() => {
          router.push("/students");
          setCommandOpen(false);
        }}
        onNewInvoice={() => {
          router.push("/invoices");
          setCommandOpen(false);
        }}
      />
    </>
  );
}
