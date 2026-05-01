import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requireRole } from "@/lib/auth/guards";
import { OutboxBoard } from "./components/OutboxBoard";

export const dynamic = "force-dynamic";

export default async function OutboxPage() {
  if (!process.env.PLATFORM_SUPABASE_URL) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          RAVEN Outbox not connected yet.
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          Configure PLATFORM_SUPABASE_URL to get started.
        </div>
      </div>
    );
  }

  let session = null;
  try {
    session = await requireRole("director")();
  } catch {
    session = null;
  }

  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;

  return <OutboxBoard tenantId={tenantId} />;
}
