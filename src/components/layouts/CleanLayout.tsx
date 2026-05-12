"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "@/components/navigation/TopBar";
import { AppLocationRail } from "@/components/workspace/AppLocationRail";
import { ModuleWorkspaceBackdrop } from "@/components/workspace/ModuleWorkspaceBackdrop";
import { isModuleWorkspaceRoute } from "@/components/workspace/moduleShellRoutes";
import { AnnouncementsProvider } from "@/components/announcements/AnnouncementsProvider";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { RouteLoadingBoundary } from "@/components/system/RouteLoadingBoundary";

export function CleanLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isModule = isModuleWorkspaceRoute(pathname);
  const isDashboard = pathname === "/dashboard";

  return (
    <div className="relative flex h-screen overflow-hidden">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-[var(--z-on-accent,white)] focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <AppLocationRail />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AnnouncementsProvider />
        <div className="flex flex-1 flex-col min-h-0 relative">
          {/* TopBar shown on module pages only — dashboard has its own */}
          {!isDashboard && (
            <Suspense
              fallback={
                <div className="h-[65px] shrink-0 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)]" />
              }
            >
              <TopBar />
            </Suspense>
          )}
          <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto relative">
            {isModule && <ModuleWorkspaceBackdrop />}
            <ErrorBoundary>
              <RouteLoadingBoundary>{children}</RouteLoadingBoundary>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
