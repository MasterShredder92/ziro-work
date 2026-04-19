import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getLeadSurface } from "@/lib/leads/service";
import { toLeadDisplayProfile } from "@/lib/leads/types";
import {
  LeadDetailPanel,
  LeadQualificationCard,
  LeadTimeline,
} from "../components";

export const dynamic = "force-dynamic";

interface LeadSurfacePageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadSurfacePage({
  params,
}: LeadSurfacePageProps) {
  let session;
  try {
    session = await requirePermission("leads.read")();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You need the leads.read permission to view this lead.
        </div>
      </div>
    );
  }

  const tenantId = session.tenantId ?? DEFAULT_TENANT_ID;
  await assertTenantAccess(tenantId);

  const resolved = await params;
  const leadId = resolved.id;
  if (!leadId) notFound();

  const surface = await getLeadSurface(leadId, tenantId);
  if (!surface) notFound();

  try {
    await assertTenantAccess(surface.detail.lead.tenant_id);
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          This lead belongs to a different tenant.
        </div>
      </div>
    );
  }

  await logAudit("leads.detail.view", {
    tenantId,
    leadId,
    profileId: session.userId,
    generatedAt: surface.generatedAt,
    source: "page",
  });

  const profile = toLeadDisplayProfile(surface.detail.lead);

  return (
    <div className="space-y-6">
      <nav className="text-xs text-[var(--z-muted)]">
        <Link
          href="/leads"
          className="hover:text-[var(--z-fg)] transition-colors"
        >
          Leads
        </Link>{" "}
        / <span className="text-[var(--z-fg)]">{profile.fullName}</span>
      </nav>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <LeadDetailPanel detail={surface.detail} profile={profile} />
          <LeadTimeline items={surface.detail.timeline} />
        </div>
        <div className="space-y-5">
          <LeadQualificationCard
            qualification={surface.detail.qualification}
          />
        </div>
      </div>
    </div>
  );
}
