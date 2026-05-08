"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { TopBar } from "@/components/navigation/TopBar";
import { AnnouncementsProvider } from "@/components/announcements/AnnouncementsProvider";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { RouteLoadingBoundary } from "@/components/system/RouteLoadingBoundary";

export function CleanLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // Listen for custom nav toggle event dispatched by schedule mobile header
  useEffect(() => {
    const handler = () => setMobileNavOpen((open) => !open);
    window.addEventListener("zw:toggle-nav", handler);
    return () => window.removeEventListener("zw:toggle-nav", handler);
  }, []);
  const isSchedulePage = pathname?.startsWith("/schedule") ?? false;

  return (
    <div className="relative flex h-screen overflow-hidden">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-[var(--z-on-accent,white)] focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <Sidebar isMobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[padding] duration-300 lg:pl-[64px]">
        <AnnouncementsProvider />
        <div className="flex flex-1 flex-col min-h-0 relative">
          <Suspense
            fallback={
              <div className={`h-[65px] shrink-0 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)] ${isSchedulePage ? "hidden sm:flex" : ""}`} />
            }
          >
            <TopBar
              onMenuToggle={() => setMobileNavOpen((open) => !open)}
              hideMobile={isSchedulePage}
            />
          </Suspense>
          <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto relative">
            <ErrorBoundary>
              <RouteLoadingBoundary>{children}</RouteLoadingBoundary>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
    </div>
  );
}
