import Link from "next/link";
import { PORTAL_SCOPES } from "@data/brandingLayoutConfigs";
import { getBrandingDashboard } from "@/lib/branding";
import type { BrandingContext } from "./guard";
import { resolveBrandingDashboardContext } from "./guard";
import { resolveBrandingTenantId } from "./tenant";
import { BrandingForbidden } from "./BrandingForbidden";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[var(--z-fg)]">{value}</div>
    </div>
  );
}

export default async function BrandingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tenantId = await resolveBrandingTenantId(params);

  let ctx: BrandingContext | undefined;
  try {
    ctx = await resolveBrandingDashboardContext({ tenantId });
  } catch {
    ctx = undefined;
  }
  if (!ctx) return <BrandingForbidden />;

  const data = await getBrandingDashboard(ctx.tenantId);
  const k = data.kpis;
  const profile = data.profile;

  return (
    <div className="space-y-6" id="overview">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Branding dashboard
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          Logo, colors, domain & email identity
        </h1>
        <p className="mt-1 text-sm text-[var(--z-muted)]">
          {ctx.canWrite
            ? "Edit themes, domains, and layouts in each section."
            : "Read-only — contact a platform admin to publish changes."}
        </p>
        <div className="text-xs text-[var(--z-muted)]">
          Updated {new Date(data.generatedAt).toLocaleString()}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat label="Profile status" value={k.profileStatus} />
        <Stat label="Domains" value={String(k.domainCount)} />
        <Stat label="Verified domains" value={String(k.verifiedDomainCount)} />
        <Stat
          label="Primary email"
          value={k.activeEmailIdentity ? "Set" : "Not set"}
        />
        <Stat label="Theme key" value={k.themeKey ?? "—"} />
        <Stat
          label="Layouts"
          value={`${k.layoutsConfigured}/${PORTAL_SCOPES.length}`}
        />
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2">
          <div className="text-sm font-semibold text-[var(--z-fg)]">Logos</div>
          <div className="text-xs text-[var(--z-muted)]">
            Light / dark variants drive headers and login.
          </div>
          <div className="text-xs font-mono text-[var(--z-fg)]">
            {profile?.logo?.light ? "Light · set" : "Light · not set"} ·{" "}
            {profile?.logo?.dark ? "Dark · set" : "Dark · not set"}
          </div>
        </div>
        <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2">
          <div className="text-sm font-semibold text-[var(--z-fg)]">Colors</div>
          <div className="flex gap-2 flex-wrap">
            {profile ? (
              <>
                <Swatch c={profile.colors.primary} />
                <Swatch c={profile.colors.secondary} />
                <Swatch c={profile.colors.accent} />
                <Swatch c={profile.colors.background} />
                <Swatch c={profile.colors.surface} />
              </>
            ) : (
              <span className="text-xs text-[var(--z-muted)]">No profile yet</span>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/branding/theme"
          className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:border-[#c4f036]/40"
        >
          Theme editor
        </Link>
        <Link
          href="/admin/branding/domain"
          className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:border-[#c4f036]/40"
        >
          Domains
        </Link>
        <Link
          href="/admin/branding/email"
          className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:border-[#c4f036]/40"
        >
          Email identity
        </Link>
        <Link
          href="/admin/branding/layouts"
          className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:border-[#c4f036]/40"
        >
          Portal layouts
        </Link>
        <Link
          href="/admin/branding/preview"
          className="rounded-[var(--z-radius-md)] border border-[#c4f036]/40 bg-[#c4f036]/10 px-3 py-1.5 text-xs font-semibold text-[#c4f036]"
        >
          Live preview
        </Link>
      </div>
    </div>
  );
}

function Swatch({ c }: { c: string }) {
  return (
    <span
      className="inline-block h-8 w-8 rounded border border-[var(--z-border)]"
      style={{ background: c }}
      title={c}
    />
  );
}
