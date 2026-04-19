import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { getTenantProfile, readSettings } from "@/lib/admin/settings";
import { TenantBrandingForm } from "../components/TenantBrandingForm";
import { TenantSettingsForm } from "./TenantSettingsForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveTenantId(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<string> {
  const fromParam = searchParams.tenantId;
  const paramValue = Array.isArray(fromParam) ? fromParam[0] : fromParam;
  if (paramValue && paramValue.trim().length > 0) return paramValue.trim();
  const h = await headers();
  const fromHeader = h.get("x-tenant-id");
  if (fromHeader && fromHeader.trim().length > 0) return fromHeader.trim();
  return DEFAULT_TENANT_ID;
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tenantId = await resolveTenantId(params);
  const session = await requirePermission("admin.settings.read")();
  const canWrite = session.role === "admin";
  const [tenant, settings] = await Promise.all([
    getTenantProfile(tenantId),
    readSettings(tenantId),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Admin OS
        </div>
        <h1 className="text-2xl font-bold text-[var(--z-fg)]">
          Tenant settings
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Branding, locale, and per-OS configuration for this tenant.
          {canWrite ? null : " Read-only for directors."}
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--z-fg)]">Branding</h2>
        <TenantBrandingForm
          tenantId={tenantId}
          tenant={tenant}
          canWrite={canWrite}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--z-fg)]">
          Operational settings
        </h2>
        <TenantSettingsForm
          tenantId={tenantId}
          settings={settings}
          canWrite={canWrite}
        />
      </section>
    </div>
  );
}
