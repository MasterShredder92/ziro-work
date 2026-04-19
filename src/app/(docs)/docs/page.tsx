import type { Metadata } from "next";
import Link from "next/link";
import { docsPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils/cn";

export const metadata: Metadata = docsPageMetadata(
  "Guides",
  "Pick a chapter—getting started, lifecycle, dashboard, studio map, students & teachers, and settings.",
);

const sections: { href: string; title: string; description: string }[] = [
  { href: "/docs/getting-started", title: "Getting Started", description: "Install, tenants, and first-run rituals." },
  { href: "/docs/lifecycle", title: "Lifecycle Engine", description: "Stages, signals, and automation touchpoints." },
  { href: "/docs/dashboard", title: "Dashboard", description: "KPIs, feeds, and command surfaces." },
  { href: "/docs/studio-map", title: "Studio Map", description: "Orb map, rosters, and teacher lenses." },
  { href: "/docs/students", title: "Students & Teachers", description: "Profiles, payroll hints, and assignments." },
  { href: "/docs/settings", title: "Settings", description: "Tenant config, theme, and permissions." },
];

export default function DocsHomePage() {
  return (
    <div className="space-y-[var(--z-space-8)]">
      <PageHeader
        title="Guides"
        subtitle="Pick a chapter—each page is a self-contained briefing for operators."
      />

      <Section title="Core surfaces" accent spacing="default">
        <div className="grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} prefetch className="group block min-w-0">
              <Card
                variant="elevated"
                padding="md"
                radius="lg"
                shadow="sm"
                className={cn(
                  "h-full border-[var(--z-border)] transition-colors",
                  "hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)]",
                  "hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_78%),0_0_28px_color-mix(in_oklab,var(--z-accent),transparent_88%)]",
                )}
              >
                <div className="text-sm font-extrabold tracking-tight text-[var(--z-fg)] group-hover:text-[var(--z-accent)]">
                  {s.title}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--z-muted)]">{s.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Changelog" description="Shipped highlights and release cadence." accent spacing="tight">
        <Link
          prefetch
          href="/docs/changelog"
          className="inline-flex text-sm font-semibold text-[var(--z-accent)] hover:underline"
        >
          View changelog →
        </Link>
      </Section>
    </div>
  );
}
