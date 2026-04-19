import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requireRole, assertTenantAccess } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { canForRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { getAutomationRule } from "@/lib/automation/queries";
import { AutomationEditor } from "../components/AutomationEditor";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function AutomationRulePage({
  params,
}: {
  params: Promise<Params>;
}) {
  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await requireRole("director")();
  } catch {
    try {
      session = await requireRole("admin")();
    } catch {
      session = null;
    }
  }

  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;

  if (!session || !canForRole(session.role, "automation.read")) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You do not have permission to view this rule.
        </div>
      </div>
    );
  }

  try {
    await assertTenantAccess(tenantId);
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          Tenant access denied.
        </div>
      </div>
    );
  }

  const { id } = await params;

  if (id === "new") {
    return (
      <div className="space-y-4">
        <Link
          href="/automation"
          className="inline-block text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]"
        >
          ← Back to rules
        </Link>
        <AutomationEditor tenantId={tenantId} rule={null} />
      </div>
    );
  }

  const rule = await getAutomationRule(id, tenantId);

  if (!rule) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Rule not found
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          The automation rule does not exist or is not accessible.
        </div>
        <div className="mt-4">
          <Link href="/automation" className="text-[var(--z-accent)] underline">
            Back to rules
          </Link>
        </div>
      </div>
    );
  }

  await logAudit("automation.rule.view", {
    tenantId,
    profileId: session.userId,
    ruleId: rule.id,
  });

  return (
    <div className="space-y-4">
      <Link
        href="/automation"
        className="inline-block text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]"
      >
        ← Back to rules
      </Link>
      <AutomationEditor tenantId={tenantId} rule={rule} />
    </div>
  );
}
