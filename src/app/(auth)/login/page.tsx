import { headers } from "next/headers";
import Link from "next/link";
import { getBrandingProfile } from "@/lib/branding";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { LoginPageClient } from "./LoginPageClient";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const h = await headers();
  const tenantId = h.get("x-tenant-id")?.trim() || DEFAULT_TENANT_ID;
  const profile = await getBrandingProfile(tenantId);
  const lp = profile?.login_page;
  const bg =
    lp?.backgroundColor ?? profile?.colors.background ?? "var(--z-bg)";
  const accent = lp?.accentColor ?? profile?.colors.accent ?? "#00ff88";
  const nextHref = sp.next?.startsWith("/") ? sp.next : "/dashboard";
  const logoAlt = profile?.name ? `${profile.name} logo` : "Studio logo";

  return (
    <main
      className="min-h-screen flex flex-col md:flex-row"
      style={{ background: bg }}
      aria-labelledby="login-title"
    >
      <div
        className="relative md:w-1/2 min-h-[40vh] md:min-h-screen border-b md:border-b-0 md:border-r border-[var(--z-border)] overflow-hidden"
        style={{
          backgroundImage: lp?.heroImage ? `url(${lp.heroImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--z-bg),transparent_35%)]" />
        <div className="relative z-10 p-8 md:p-12 flex flex-col justify-end h-full">
          {profile?.logo?.light ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logo.light}
              alt={logoAlt}
              className="h-10 w-auto mb-4"
            />
          ) : null}
          <h1 id="login-title" className="text-2xl md:text-3xl font-semibold text-[var(--z-fg)]">
            {lp?.heroHeadline ?? "Sign in to your workspace"}
          </h1>
          {lp?.heroSubline ? (
            <p className="mt-2 text-sm text-[var(--z-muted)] max-w-md">
              {lp.heroSubline}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-6 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 shadow-xl">
          <div className="text-sm text-[var(--z-muted)]">
            Tenant-branded login — connect your identity provider or continue
            with email once wired.
          </div>
          <div
            className="h-1 rounded-full"
            style={{ background: accent }}
            aria-hidden
          />
          <LoginPageClient accent={accent} nextHref={nextHref} />
          <Link
            href={nextHref}
            className="block w-full rounded-[var(--z-radius-md)] px-4 py-3 text-center text-sm font-semibold text-[var(--z-fg)] outline-none transition border border-[var(--z-border)] bg-[var(--z-bg)]"
          >
            Continue without sign-in
          </Link>
          <p className="text-xs text-[var(--z-muted)] text-center">
            Custom domains set <code className="font-mono">x-tenant-id</code>{" "}
            via middleware for white-label hosts.
          </p>
        </div>
      </div>
    </main>
  );
}
