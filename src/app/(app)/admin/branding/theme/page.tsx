import { getBrandingDashboard } from "@/lib/branding";
import type { BrandingContext } from "../guard";
import { resolveBrandingAdminSurfaceContext } from "../guard";
import { resolveBrandingTenantId } from "../tenant";
import { BrandingForbidden } from "../BrandingForbidden";
import { ThemeEditor } from "../components/ThemeEditor";

export const dynamic = "force-dynamic";

export default async function ThemeEditorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tenantId = await resolveBrandingTenantId(params);

  let ctx: BrandingContext | undefined;
  try {
    ctx = await resolveBrandingAdminSurfaceContext({ tenantId });
  } catch {
    ctx = undefined;
  }
  if (!ctx) return <BrandingForbidden variant="compact" />;

  const data = await getBrandingDashboard(ctx.tenantId);

  if (!data.profile) {
    return (
      <div className="space-y-6">
        <header>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Theme editor
          </div>
          <h1 className="text-xl font-semibold text-[var(--z-fg)]">
            Colors, typography & component tokens
          </h1>
        </header>
        <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]">
          No branding profile exists for this tenant yet. Seed a profile row or create one via the API.
        </div>
      </div>
    );
  }

  return (
    <ThemeEditor
      tenantId={ctx.tenantId}
      canWrite={ctx.canWrite}
      profile={data.profile}
      themes={data.themes}
    />
  );
}
