"use client";

import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { RoleCard, type RoleCardPermission } from "@/components/settings/RoleCard";
import { Card } from "@/components/ui/Card";

const ROLES: { name: string; permissions: RoleCardPermission[] }[] = [
  {
    name: "Owner",
    permissions: [
      { id: "o-1", kind: "page", label: "Dashboard" },
      { id: "o-2", kind: "page", label: "Studio Map" },
      { id: "o-3", kind: "page", label: "Lifecycle" },
      { id: "o-4", kind: "page", label: "Operations" },
      { id: "o-5", kind: "page", label: "Settings" },
      { id: "o-6", kind: "action", label: "Manage billing" },
      { id: "o-7", kind: "action", label: "Invite users" },
      { id: "o-8", kind: "action", label: "Destroy tenant (simulated)" },
    ],
  },
  {
    name: "Admin",
    permissions: [
      { id: "a-1", kind: "page", label: "Dashboard" },
      { id: "a-2", kind: "page", label: "Studio Map" },
      { id: "a-3", kind: "page", label: "Lifecycle" },
      { id: "a-4", kind: "page", label: "Operations" },
      { id: "a-5", kind: "page", label: "Settings" },
      { id: "a-6", kind: "action", label: "Edit teachers" },
      { id: "a-7", kind: "action", label: "Issue refunds" },
    ],
  },
  {
    name: "Coordinator",
    permissions: [
      { id: "c-1", kind: "page", label: "Dashboard" },
      { id: "c-2", kind: "page", label: "Lifecycle" },
      { id: "c-3", kind: "page", label: "Students" },
      { id: "c-4", kind: "page", label: "Families" },
      { id: "c-5", kind: "action", label: "Reschedule lessons" },
      { id: "c-6", kind: "action", label: "Send nudges" },
    ],
  },
  {
    name: "Teacher",
    permissions: [
      { id: "t-1", kind: "page", label: "Dashboard" },
      { id: "t-2", kind: "page", label: "Students (assigned)" },
      { id: "t-3", kind: "action", label: "Log attendance" },
      { id: "t-4", kind: "action", label: "Add lesson notes" },
    ],
  },
];

export function PermissionsSettingsClient() {
  return (
    <PageShell title="Permissions">
      <div className="mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
        <Link className="text-[var(--z-accent)] hover:underline" href="/settings">
          ← All settings
        </Link>
      </div>

      <SettingsSection
        title="Roles & coverage"
        description="Static matrix for UX review—wire to your auth provider when policies land."
      >
        <div className="space-y-[var(--z-space-5)]">
          {ROLES.map((r) => (
            <div key={r.name} className="space-y-[var(--z-space-4)]">
              <RoleCard role={r.name} permissions={r.permissions} />
              {r.name === "Owner" ? (
                <SettingsSection
                  title="Go-to-market (Owner only)"
                  description="Studio owner tools for email, automations, announcements, and release notes."
                >
                  <Link
                    className="mb-[var(--z-space-3)] block rounded-[var(--z-radius-md)] border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-extrabold text-[var(--z-fg)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_70%)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_35%)] hover:text-[var(--z-accent)]"
                    href="/publishing-hub"
                  >
                    Publishing Hub
                  </Link>
                  <Link
                    className="mb-[var(--z-space-3)] block rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-extrabold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)]"
                    href="/marketing-insights"
                  >
                    Marketing Insights
                  </Link>
                  <div className="grid grid-cols-1 gap-[var(--z-space-3)] sm:grid-cols-2">
                    <Link
                      className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)]"
                      href="/email-templates"
                    >
                      Email templates
                    </Link>
                    <Link
                      className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)]"
                      href="/email-preview"
                    >
                      Email preview
                    </Link>
                    <Link
                      className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)]"
                      href="/automations"
                    >
                      Automations
                    </Link>
                    <Link
                      className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)]"
                      href="/announcements"
                    >
                      Announcements
                    </Link>
                    <Link
                      className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)] sm:col-span-2"
                      href="/release-notes"
                    >
                      Release notes
                    </Link>
                  </div>
                </SettingsSection>
              ) : null}
            </div>
          ))}
        </div>
      </SettingsSection>

      <Card
        variant="elevated"
        padding="md"
        radius="lg"
        shadow="sm"
        className="mt-[var(--z-space-8)] border-[color-mix(in_oklab,var(--z-accent),transparent_65%)]"
      >
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">Owner workspace</div>
        <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          Draft release notes locally, preview the neon changelog card, and iterate before publishing.
        </p>
        <div className="mt-[var(--z-space-4)]">
          <Link
            href="/admin/release-notes"
            className="text-sm font-semibold text-[var(--z-accent)] hover:underline"
          >
            Open release notes automation →
          </Link>
        </div>
        <p className="mt-2 text-[0.65rem] text-[var(--z-muted)]">
          In production, show this card only when the signed-in role is Owner.
        </p>
      </Card>
    </PageShell>
  );
}
