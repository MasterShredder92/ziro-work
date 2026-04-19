import { PORTAL_SCOPES } from "@data/brandingLayoutConfigs";
import { getBrandingDashboard } from "@/lib/branding";
import type { BrandingContext } from "../guard";
import { resolveBrandingContext } from "../guard";
import { resolveBrandingTenantId } from "../tenant";
import { BrandingForbidden } from "../BrandingForbidden";
import { PortalLayoutPreview } from "../components/PortalLayoutPreview";

export const dynamic = "force-dynamic";

export default async function PortalLayoutPage({
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

  const data = await getBrandingDashboard(ctx.tenantId);
  const byScope = new Map(data.layouts.map((l) => [l.scope, l]));

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Portal layouts
        </div>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          Presets, sidebars & dashboard widgets
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Per-portal overrides for student, family, teacher, director, and admin
          portals.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        {PORTAL_SCOPES.map((scope) => {
          const layout =
            byScope.get(scope) ??
            ({
              id: `virtual-${scope}`,
              tenant_id: ctx.tenantId,
              scope,
              preset: "classic",
              sidebar_variant: "icons_labels",
              dashboard_preset: "grid",
              widgets: [],
              header_extras: [],
              footer_extras: [],
              created_at: "",
              updated_at: "",
            } as (typeof data.layouts)[0]);
          return (
            <PortalLayoutPreview
              key={scope}
              layout={layout}
              scopeLabel={`${scope} portal`}
            />
          );
        })}
      </div>
    </div>
  );
}
