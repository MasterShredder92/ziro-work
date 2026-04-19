import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getContentSurface, recordContentAccess } from "@/lib/content";
import { ContentDetail } from "../components";
import { resolveContentContext } from "../guard";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ContentItemPage({ params }: PageProps) {
  const { id } = await params;
  let ctx;
  try {
    ctx = await resolveContentContext();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You do not have permission to view this content item.
        </div>
      </div>
    );
  }

  const surface = await getContentSurface(id, ctx.tenantId);
  if (!surface) notFound();

  // Bump access counter for analytics + most-accessed KPIs.
  await recordContentAccess(id, ctx.tenantId).catch(() => null);

  await logAudit("content.surface.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    itemId: id,
    source: "page",
  });

  return <ContentDetail surface={surface} canWrite={ctx.canWrite} />;
}
