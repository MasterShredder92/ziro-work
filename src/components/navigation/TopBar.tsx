"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { CommandPalette } from "@/components/command/CommandPalette";
import { TenantSwitcher } from "@/components/tenant/TenantSwitcher";
import { useTenantUi } from "@/components/tenant/TenantUiContext";
import { getRouteByHref } from "@/lib/routes";
import Link from "next/link";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/Button";
import { ProductTour } from "@/components/tour/ProductTour";
import { ZIRO_TOUR_AUTOSTART_KEY } from "@/lib/demo/isDemoMode";
import { ClientPageTitle } from "@/components/navigation/ClientPageTitle";

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
  const [tourOpen, setTourOpen] = React.useState(false);
  const pageTitle = titleForPath(pathname);

  const marketingLinkClass =
    "text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)] underline decoration-transparent underline-offset-4 transition-colors hover:text-[var(--z-fg)] hover:decoration-[var(--z-accent)] hover:decoration-2";

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

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (window.sessionStorage.getItem(ZIRO_TOUR_AUTOSTART_KEY) === "1") {
        window.sessionStorage.removeItem(ZIRO_TOUR_AUTOSTART_KEY);
        setTourOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-[var(--z-space-3)] border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)] px-[var(--z-space-4)] py-[var(--z-space-3)] backdrop-blur-md sm:px-[var(--z-space-5)]">
        <div className="flex min-w-0 flex-1 items-center gap-[var(--z-space-3)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="inline-flex lg:hidden"
            aria-label="Toggle navigation menu"
          >
            Menu
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCommandOpen((v) => !v)}
            className="inline-flex sm:hidden"
            aria-label="Open quick actions"
          >
            Quick
          </Button>
          <TenantSwitcher />
          <div className="hidden min-w-0 flex-1 sm:block">
            <ClientPageTitle title={pageTitle} />
          </div>
        </div>
        <nav
          className="hidden items-center gap-[var(--z-space-4)] lg:flex"
          aria-label="Marketing links"
        >
          <a href="/features" target="_blank" rel="noopener noreferrer" className={marketingLinkClass}>
            Docs
          </a>
          <a href="/about" target="_blank" rel="noopener noreferrer" className={marketingLinkClass}>
            Updates
          </a>
          <a href="/pricing" target="_blank" rel="noopener noreferrer" className={marketingLinkClass}>
            Pricing
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-[var(--z-space-2)] sm:gap-[var(--z-space-3)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--z-accent)] sm:inline-flex"
            onClick={() => setTourOpen(true)}
          >
            Start Tour
          </Button>
          <Link
            href="/demo"
            className="rounded-[var(--z-radius-md)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--z-accent)] hover:bg-white/5"
          >
            Try Demo
          </Link>
          <Link
            href="/help"
            className="rounded-[var(--z-radius-md)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-accent)]"
          >
            Help
          </Link>
          <span
            className={cn(
              "hidden select-none text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--z-muted)]",
              "lg:inline",
            )}
          >
            ⌘K
          </span>
          <NotificationBell />
        </div>
      </header>
      <ProductTour open={tourOpen} onClose={() => setTourOpen(false)} />
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
