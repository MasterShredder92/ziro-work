import type { CSSProperties } from "react";
import { getBrandingRuntime } from "@/lib/branding";
import type { BrandingContext } from "../guard";
import { resolveBrandingContext } from "../guard";
import { resolveBrandingTenantId } from "../tenant";
import { BrandingForbidden } from "../BrandingForbidden";

export const dynamic = "force-dynamic";

export default async function BrandingPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tenantId = await resolveBrandingTenantId(params);

  let ctx: BrandingContext | undefined;
  try {
    ctx = await resolveBrandingContext({ tenantId });
  } catch {
    ctx = undefined;
  }
  if (!ctx) return <BrandingForbidden variant="compact" />;

  const runtime = await getBrandingRuntime(ctx.tenantId);

  return (
    <div className="space-y-4">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Live preview
        </div>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          Tenant theme preview
        </h1>
      </header>
      <div
        className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] p-6 space-y-4"
        style={
          {
            ...Object.fromEntries(
              Object.entries(runtime.cssVariables).map(([k, v]) => [k, v]),
            ),
            background: "var(--brand-background, var(--z-bg))",
            color: "var(--brand-nav-fg, var(--z-fg))",
          } as CSSProperties
        }
      >
        <div
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--brand-font-heading, inherit)" }}
        >
          {runtime.logo.light || runtime.logo.dark ? "Logo loaded" : "Your studio"}
        </div>
        <p style={{ fontFamily: "var(--brand-font-body, inherit)" }}>
          Primary buttons and cards pick up component tokens when published.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 font-semibold"
            style={{
              borderRadius: "var(--brand-button-radius, 0.5rem)",
              background: "var(--brand-primary, var(--z-accent))",
              color: "#000",
            }}
          >
            Primary
          </button>
          <div
            className="px-4 py-2 border"
            style={{
              borderRadius: "var(--brand-card-radius, 0.75rem)",
              borderColor: "var(--brand-card-border, var(--z-border))",
              background: "var(--brand-surface, var(--z-surface))",
            }}
          >
            Card
          </div>
        </div>
      </div>
      {runtime.cssText ? (
        <details className="text-xs text-[var(--z-muted)]">
          <summary className="cursor-pointer">CSS variables</summary>
          <pre className="mt-2 overflow-auto rounded border border-[var(--z-border)] p-2 bg-[var(--z-surface-2)] max-h-48">
            {runtime.cssText}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
