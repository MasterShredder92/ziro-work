"use client";

import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { CookieBanner } from "@/components/marketing/CookieBanner";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { MarketingTrackedLink } from "@/components/marketing/MarketingTrackedLink";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsProvider>
      <div className="min-h-screen bg-[var(--z-bg)] text-[var(--z-fg)]">
        <header className="border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)] backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-[var(--z-space-4)] px-[var(--z-space-5)] py-[var(--z-space-4)]">
            <MarketingTrackedLink
              href="/"
              eventName="marketing_nav_home"
              className="text-lg font-extrabold tracking-tight"
            >
              <span className="text-[var(--z-accent)]">ZIRO</span>
              <span className="text-[var(--z-fg)]">WORK</span>
            </MarketingTrackedLink>
            <nav className="flex flex-wrap items-center gap-[var(--z-space-4)] text-sm font-semibold">
              <MarketingTrackedLink
                href="/features"
                eventName="marketing_nav_features"
                className="text-[var(--z-muted)] transition-colors hover:text-[var(--z-fg)] hover:underline hover:decoration-[var(--z-accent)] hover:decoration-2 hover:underline-offset-4"
              >
                Features
              </MarketingTrackedLink>
              <MarketingTrackedLink
                href="/pricing"
                eventName="marketing_nav_pricing"
                className="text-[var(--z-muted)] transition-colors hover:text-[var(--z-fg)] hover:underline hover:decoration-[var(--z-accent)] hover:decoration-2 hover:underline-offset-4"
              >
                Pricing
              </MarketingTrackedLink>
              <MarketingTrackedLink
                href="/about"
                eventName="marketing_nav_about"
                className="text-[var(--z-muted)] transition-colors hover:text-[var(--z-fg)] hover:underline hover:decoration-[var(--z-accent)] hover:decoration-2 hover:underline-offset-4"
              >
                About
              </MarketingTrackedLink>
              <MarketingTrackedLink
                href="/launch"
                eventName="marketing_nav_launch"
                className="text-[var(--z-muted)] transition-colors hover:text-[var(--z-fg)] hover:underline hover:decoration-[var(--z-accent)] hover:decoration-2 hover:underline-offset-4"
              >
                Launch
              </MarketingTrackedLink>
              <MarketingTrackedLink
                href="/demo"
                eventName="marketing_nav_try_demo"
                className="rounded-[var(--z-radius-md)] border border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] px-3 py-1.5 text-[var(--z-accent)] transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),transparent_90%)] hover:text-black"
              >
                Try Demo
              </MarketingTrackedLink>
              <MarketingTrackedLink
                href="/dashboard"
                eventName="marketing_nav_open_app"
                className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-[var(--z-muted)] transition-colors hover:border-[var(--z-border-2)] hover:text-[var(--z-fg)]"
              >
                Open app
              </MarketingTrackedLink>
            </nav>
          </div>
        </header>
        <MarketingChrome>
          <div className="mx-auto max-w-6xl px-[var(--z-space-5)] py-[var(--z-space-10)] pb-32">{children}</div>
          <footer className="mx-auto max-w-6xl border-t border-[var(--z-border)] px-[var(--z-space-5)] py-[var(--z-space-8)] pb-28 text-center text-xs text-[var(--z-muted)]">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <MarketingTrackedLink
                href="/press-kit"
                eventName="marketing_footer_press_kit"
                className="hover:text-[var(--z-accent)] hover:underline hover:underline-offset-4"
              >
                Press kit
              </MarketingTrackedLink>
              <span aria-hidden className="text-[color-mix(in_oklab,var(--z-fg),transparent_78%)]">
                ·
              </span>
              <MarketingTrackedLink
                href="/brand"
                eventName="marketing_footer_brand"
                className="hover:text-[var(--z-accent)] hover:underline hover:underline-offset-4"
              >
                Brand
              </MarketingTrackedLink>
            </div>
            <div className="mt-3">© {new Date().getFullYear()} ZiroWork · Charcoal console, neon signal.</div>
          </footer>
        </MarketingChrome>
        <CookieBanner />
      </div>
    </AnalyticsProvider>
  );
}
