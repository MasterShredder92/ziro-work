"use client";

import Link from "next/link";
import type { BrandingDashboardData } from "@/lib/branding";
import { DomainStatusBadge } from "./DomainStatusBadge";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-[var(--z-fg)]">{value}</div>
    </div>
  );
}

export function BrandingDashboard({
  data,
}: {
  data: BrandingDashboardData;
}) {
  const { profile, domains, primaryEmailIdentity, activeTheme, kpis } = data;
  const primaryDomain = domains.find((d) => d.is_primary) ?? domains[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="space-y-3 scroll-mt-24" id="overview">
        <header>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Branding OS
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
            Brand & white-label overview
          </h1>
          <div className="text-xs text-[var(--z-muted)]">
            Updated {new Date(data.generatedAt).toLocaleTimeString()}
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <Stat label="Status" value={kpis.profileStatus} />
          <Stat label="Theme" value={kpis.themeKey ?? "—"} />
          <Stat label="Domains" value={`${kpis.verifiedDomainCount}/${kpis.domainCount}`} />
          <Stat label="Layouts" value={`${kpis.layoutsConfigured}/4`} />
          <Stat
            label="Identity"
            value={kpis.activeEmailIdentity ?? "—"}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--z-fg)]">Logo & colors</div>
            <Link
              href="/admin/branding/theme"
              className="text-xs text-[#00ff88] hover:underline"
            >
              Edit theme →
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded bg-[#0b0b0d] border border-[var(--z-border)] flex items-center justify-center">
              {profile?.logo.dark || profile?.logo.light ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile?.logo.dark ?? profile?.logo.light ?? ""}
                  alt="Brand logo"
                  className="max-h-10 max-w-10 object-contain"
                />
              ) : (
                <span className="text-xs text-[var(--z-muted)]">No logo</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile
                ? [
                    profile.colors.primary,
                    profile.colors.secondary,
                    profile.colors.accent,
                    profile.colors.background,
                    profile.colors.surface,
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="h-6 w-6 rounded border border-black/30"
                      style={{ background: c }}
                      title={c}
                    />
                  ))
                : (
                  <div className="text-xs text-[var(--z-muted)]">No profile yet.</div>
                )}
            </div>
          </div>
          <div className="text-[11px] text-[var(--z-muted)]">
            Active theme: {activeTheme?.name ?? "Default"}
          </div>
        </div>

        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--z-fg)]">Domain</div>
            <Link
              href="/admin/branding/domain"
              className="text-xs text-[#00ff88] hover:underline"
            >
              Manage domains →
            </Link>
          </div>
          {primaryDomain ? (
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm text-[var(--z-fg)] truncate">
                {primaryDomain.domain_name}
              </div>
              <DomainStatusBadge status={primaryDomain.status} />
            </div>
          ) : (
            <div className="text-xs text-[var(--z-muted)]">
              No custom domains configured.
            </div>
          )}
          <div className="text-[11px] text-[var(--z-muted)]">
            {kpis.verifiedDomainCount} verified of {kpis.domainCount} total.
          </div>
        </div>

        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--z-fg)]">Email identity</div>
            <Link
              href="/admin/branding/email"
              className="text-xs text-[#00ff88] hover:underline"
            >
              Edit identity →
            </Link>
          </div>
          {primaryEmailIdentity ? (
            <div className="flex flex-col gap-1 text-sm">
              <div className="text-[var(--z-fg)]">
                {primaryEmailIdentity.from_name} &lt;{primaryEmailIdentity.from_email}&gt;
              </div>
              <div className="text-[11px] text-[var(--z-muted)]">
                Reply-to: {primaryEmailIdentity.reply_to_email ?? "—"}
              </div>
              <div className="text-[11px] text-[var(--z-muted)]">
                Status: {primaryEmailIdentity.status}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[var(--z-muted)]">
              No email identity configured.
            </div>
          )}
        </div>

        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--z-fg)]">
              Portal layouts
            </div>
            <Link
              href="/admin/branding/layouts"
              className="text-xs text-[#00ff88] hover:underline"
            >
              Configure →
            </Link>
          </div>
          <div className="text-xs text-[var(--z-muted)]">
            Configured: {kpis.layoutsConfigured}/4 portals. Missing:{" "}
            {kpis.layoutsMissing}.
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["student", "family", "teacher", "director"].map((s) => {
              const configured = data.layouts.find((l) => l.scope === s);
              return (
                <span
                  key={s}
                  className={`text-[10px] uppercase tracking-wider rounded border px-1.5 py-0.5 ${
                    configured
                      ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]"
                      : "border-[var(--z-border)] text-[var(--z-muted)]"
                  }`}
                >
                  {s}
                </span>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
