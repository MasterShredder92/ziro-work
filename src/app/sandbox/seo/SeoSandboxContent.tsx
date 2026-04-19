"use client";

import * as React from "react";
import { CookieBanner } from "@/components/marketing/CookieBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";

type SeoSandboxContentProps = {
  metadataJson: string;
};

export function SeoSandboxContent({ metadataJson }: SeoSandboxContentProps) {
  const { trackEvent } = useAnalytics();

  return (
    <div className="min-h-full bg-[var(--z-bg)] p-[var(--z-space-8)] text-[var(--z-fg)]">
      <div className="mx-auto max-w-3xl space-y-[var(--z-space-8)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--z-muted)]">Sandbox</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">SEO + launch chrome</h1>
          <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_18%)]">
            Metadata snapshot (build-time), cookie banner inline preview, and mock analytics (watch the browser
            console).
          </p>
        </div>

        <Section title="Default metadata" accent spacing="default">
          <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="overflow-x-auto">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
              {metadataJson}
            </pre>
          </Card>
        </Section>

        <Section title="Cookie banner (inline)" spacing="default">
          <CookieBanner honorStoredConsent={false} position="inline" />
        </Section>

        <Section title="Analytics" spacing="default">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" size="sm" onClick={() => trackEvent("sandbox_ping", { from: "seo" })}>
              Fire test event
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => trackEvent("sandbox_utm_hint", { hint: "append ?utm_source=sandbox to this URL" })}
            >
              Log UTM hint
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
