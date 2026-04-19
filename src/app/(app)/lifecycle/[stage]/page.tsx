import { notFound } from "next/navigation";
import { isLifecycleStageId } from "@/lib/lifecycle/helpers";
import { StageSurfaceClient } from "./_client";
import { resolveLifecycleTenantScope } from "../_serverTenant";

type PageProps = {
  params: Promise<{ stage: string }>;
  searchParams?: Promise<{ locationId?: string }>;
};

export default async function LifecycleDynamicStagePage({
  params,
  searchParams,
}: PageProps) {
  const { stage } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const locationId = resolvedSearch.locationId?.trim() || "";
  if (!isLifecycleStageId(stage)) notFound();
  const scope = await resolveLifecycleTenantScope(locationId || null);
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]">
      <StageSurfaceClient
        stageId={stage}
        tenantId={scope.tenantId}
        locationId={scope.locationId}
      />
    </div>
  );
}
