import type { ReactNode } from "react";
import { Suspense } from "react";
import { headers } from "next/headers";
import { CleanLayout } from "@/components/layouts/CleanLayout";
import { SystemProviders } from "@/components/system/SystemProviders";
import { getSession } from "@/lib/auth/session";
import { getBrandingRuntime } from "@/lib/branding";
import { ensureQueueHandlersRegistered } from "@/lib/queue/registerHandlers";
import { BrandingStyleTag } from "./admin/branding/components/BrandingStyleTag";
import { ZiroWorkspaceProvider } from "@/components/workspace/ZiroWorkspaceContext";
import { LocationSearchParamsSync } from "@/components/workspace/LocationSearchParamsSync";
import {
  getWorkspaceShellData,
  type WorkspaceShellData,
} from "@/lib/workspace/getWorkspaceShellData";

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
  const shell = await getWorkspaceShellData().catch(
    (): WorkspaceShellData => ({
      tenantId,
      schoolName: "Workspace",
      locations: [],
    }),
  );

  return (
    <SystemProviders defaultTenantId={tenantId}>
      {runtime ? <BrandingStyleTag runtime={runtime} /> : null}
      <ZiroWorkspaceProvider schoolName={shell.schoolName} locations={shell.locations}>
        <Suspense fallback={null}>
          <LocationSearchParamsSync />
        </Suspense>
        <CleanLayout>{children}</CleanLayout>
      </ZiroWorkspaceProvider>
    </SystemProviders>
  );
}
