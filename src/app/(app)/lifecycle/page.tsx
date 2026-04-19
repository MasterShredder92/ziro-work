import { resolveLifecycleTenantScope } from "./_serverTenant";
import { LifecycleTabsClient } from "./_tabs-client";

export const dynamic = "force-dynamic";

export default async function LifecyclePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const scope = await resolveLifecycleTenantScope();
  const params = await (searchParams ?? Promise.resolve({} as { tab?: string }));
  const initialTab = params.tab ?? "intake";

  return (
    <LifecycleTabsClient
      tenantId={scope.tenantId}
      locationId={scope.locationId}
      initialTab={initialTab}
    />
  );
}
