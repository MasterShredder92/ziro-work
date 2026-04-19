import type { ReactNode } from "react";
import { headers } from "next/headers";
import { getBrandingRuntime } from "@/lib/branding";
import { BrandingStyleTag } from "@/app/(app)/admin/branding/components/BrandingStyleTag";
import { SystemProviders } from "@/components/system/SystemProviders";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const tenantId = h.get("x-tenant-id")?.trim() || DEFAULT_TENANT_ID;
  const runtime = await getBrandingRuntime(tenantId).catch(() => null);

  return (
    <SystemProviders defaultTenantId={DEFAULT_TENANT_ID}>
      {runtime ? <BrandingStyleTag runtime={runtime} /> : null}
      {children}
    </SystemProviders>
  );
}
