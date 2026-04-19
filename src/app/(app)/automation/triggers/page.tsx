import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { TriggerLibrary } from "../components/workflows";

export const dynamic = "force-dynamic";

export default async function TriggersPage() {
  let session;
  try {
    session = await requirePermission("automation.read")();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
      </div>
    );
  }

  const tenantId = session.tenantId || DEFAULT_TENANT_ID;
  try {
    await assertTenantAccess(tenantId);
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Automation OS
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          Trigger library
        </h1>
        <div className="text-xs text-[var(--z-muted)] mt-1">
          All available trigger types.
        </div>
      </header>
      <TriggerLibrary />
    </div>
  );
}
