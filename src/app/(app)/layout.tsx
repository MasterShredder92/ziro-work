import type { ReactNode } from "react";
import { headers } from "next/headers";
import { CleanLayout } from "@/components/layouts/CleanLayout";
import { SystemProviders } from "@/components/system/SystemProviders";
import { AgentOSRoot } from "@/components/agentOS";
import { getSession } from "@/lib/auth/session";
import { getBrandingRuntime } from "@/lib/branding";
import { ensureQueueHandlersRegistered } from "@/lib/queue/registerHandlers";
import { BrandingStyleTag } from "./admin/branding/components/BrandingStyleTag";

const DEFAULT_TENANT_ID =
  process.env.NEXT_PUBLIC_ZIRO_DEFAULT_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";

export default async function AppLayout({ children }: { children: ReactNode }) {
  ensureQueueHandlersRegistered();
  const session = await getSession().catch(() => null);
  const h = await headers();
  const headerTenant = h.get("x-tenant-id")?.trim();
  const tenantId =
    headerTenant && headerTenant.length > 0
      ? headerTenant
      : session?.tenantId ?? DEFAULT_TENANT_ID;
  const runtime = await getBrandingRuntime(tenantId).catch(() => null);

  return (
    <SystemProviders defaultTenantId={tenantId}>
      <AgentOSRoot>
        {runtime ? <BrandingStyleTag runtime={runtime} /> : null}
        <CleanLayout>{children}</CleanLayout>
      </AgentOSRoot>
    </SystemProviders>
  );
}
