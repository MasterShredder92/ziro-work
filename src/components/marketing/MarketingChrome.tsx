"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MarketingConversionContext } from "@/components/marketing/MarketingConversionContext";
import { ExitIntentModal } from "@/components/marketing/ExitIntentModal";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";

const ComparePlansDrawer = dynamic(
  () => import("@/components/marketing/ComparePlansDrawer").then((m) => m.ComparePlansDrawer),
  { ssr: false },
);

const trial = cn(
  "inline-flex min-h-10 flex-1 items-center justify-center rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 text-sm font-extrabold text-black transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)] sm:flex-none sm:px-6",
  focusRingClassName()
);

const demoBtn = cn(
  "inline-flex min-h-10 flex-1 items-center justify-center rounded-[var(--z-radius-md)] border border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] px-4 text-sm font-extrabold text-[var(--z-accent)] transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] sm:flex-none sm:px-6",
  focusRingClassName()
);

const compareBtn = cn(
  "inline-flex min-h-10 items-center justify-center rounded-[var(--z-radius-md)] px-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)] underline decoration-transparent underline-offset-4 transition-colors hover:text-[var(--z-fg)] hover:decoration-[var(--z-accent)] hover:decoration-2",
  focusRingClassName()
);

export function MarketingChrome({ children }: { children: React.ReactNode }) {
  const { trackEvent } = useAnalytics();
  const [compareOpen, setCompareOpen] = React.useState(false);
  const value = React.useMemo(
    () => ({
      openComparePlans: () => {
        trackEvent("marketing_compare_open", {});
        setCompareOpen(true);
      },
    }),
    [trackEvent],
  );

  return (
    <MarketingConversionContext.Provider value={value}>
      <ExitIntentModal />
      <ComparePlansDrawer open={compareOpen} onClose={() => setCompareOpen(false)} />
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-[var(--z-space-3)] pb-[var(--z-space-3)] sm:px-[var(--z-space-5)]">
        <div
          className={cn(
            "pointer-events-auto mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-[var(--z-space-3)] rounded-[var(--z-radius-lg)] border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]",
            "bg-[color-mix(in_oklab,var(--z-surface),transparent_12%)] px-[var(--z-space-4)] py-[var(--z-space-3)] shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md",
          )}
        >
          <p className="hidden text-xs font-semibold text-[var(--z-muted)] sm:block">
            Launch in minutes · no credit card for demo
          </p>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <button
              type="button"
              className={compareBtn}
              onClick={() => {
                trackEvent("marketing_compare_click", {});
                setCompareOpen(true);
              }}
            >
              Compare plans
            </button>
            <Link
              prefetch
              href="/demo"
              className={demoBtn}
              onClick={() => trackEvent("marketing_demo_entry", { href: "/demo" })}
            >
              Try Demo
            </Link>
            <Link
              prefetch
              href="/signup"
              className={trial}
              onClick={() => trackEvent("marketing_signup_entry", { href: "/signup" })}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </MarketingConversionContext.Provider>
  );
}
