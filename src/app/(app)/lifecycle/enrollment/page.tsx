import { StageSurfaceClient } from "../[stage]/_client";
import { resolveLifecycleTenantScope } from "../_serverTenant";

export default async function EnrollmentPage() {
  const scope = await resolveLifecycleTenantScope();
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]">
      <StageSurfaceClient stageId="enrollment" tenantId={scope.tenantId} locationId={scope.locationId} />
    </div>
  );
}
