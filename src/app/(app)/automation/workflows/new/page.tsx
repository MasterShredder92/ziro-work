import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { WorkflowEditor } from "../../components/workflows";

export const dynamic = "force-dynamic";

export default async function NewWorkflowPage() {
  let session;
  try {
    session = await requirePermission("automation.write")();
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
    <div className="space-y-4">
      <Link
        href="/automation/workflows"
        className="inline-block text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]"
      >
        ← Back to workflows
      </Link>
      <WorkflowEditor mode="create" />
    </div>
  );
}
