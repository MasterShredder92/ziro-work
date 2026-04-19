import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";

const docsDesc =
  "ZiroWork documentation—getting started, lifecycle engine, dashboard, studio map, students & teachers, and settings.";

export const metadata: Metadata = mergePageMetadata({
  title: "Documentation",
  description: docsDesc,
  openGraph: {
    title: "Documentation · ZiroWork",
    description: docsDesc,
    url: `${siteBaseUrl()}/docs`,
  },
  twitter: { title: "Documentation · ZiroWork", description: docsDesc },
});

export default function DocsRouteGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--z-bg)] text-[var(--z-fg)]">
      <div className="border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_8%)] px-[var(--z-space-6)] py-[var(--z-space-5)]">
        <PageHeader
          title="ZiroWork documentation"
          subtitle="Charcoal canvas, neon wayfinding—no sidebar chrome."
          actions={
            <Link
              prefetch
              href="/dashboard"
              className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-2 text-xs font-semibold text-[var(--z-muted)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:text-[var(--z-accent)]"
            >
              Back to app
            </Link>
          }
        />
      </div>
      <div className="mx-auto max-w-4xl px-[var(--z-space-6)] py-[var(--z-space-8)]">
        <Section spacing="loose">{children}</Section>
      </div>
    </div>
  );
}
