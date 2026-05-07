import { logAudit } from "@/lib/audit/log";
import { getContentDashboard } from "@/lib/content";
import {
  CollectionList,
  ContentList,
  ContentSearch,
  ContentUploader,
  TagList,
} from "./components";
import { resolveContentContext } from "./guard";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-bold ${accent ?? "text-[var(--z-fg)]"}`}
      >
        {value}
      </div>
      {sublabel ? (
        <div className="mt-0.5 text-[11px] text-[var(--z-muted)]">
          {sublabel}
        </div>
      ) : null}
    </div>
  );
}

function Forbidden() {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
      <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
      <div className="mt-2 text-sm text-[var(--z-muted)]">
        You do not have permission to view the content library.
      </div>
    </div>
  );
}

export default async function ContentDashboardPage() {
  let ctx;
  try {
    ctx = await resolveContentContext();
  } catch {
    return <Forbidden />;
  }

  const data = await getContentDashboard(ctx.tenantId);

  await logAudit("content.dashboard.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    totalItems: data.kpis.totalItems,
    embeddingCoverage: data.kpis.embeddingCoveragePct,
    source: "page",
  });

  const kindsWithCounts = Object.entries(data.kpis.itemsByKind)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${kind} ${count}`)
    .join(" · ");

  return (
    <div className="space-y-6">
      <section id="overview" className="space-y-3 scroll-mt-24">
        <header>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Content OS
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
            Content Library
          </h1>
          <div className="text-xs text-[var(--z-muted)]">
            Updated {new Date(data.generatedAt).toLocaleTimeString()}
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi
            label="Items"
            value={data.kpis.totalItems}
            sublabel={kindsWithCounts || "No items yet"}
          />
          <Kpi
            label="Tags"
            value={data.kpis.totalTags}
            sublabel={
              data.kpis.mostUsedTags[0]
                ? `Top: ${data.kpis.mostUsedTags[0].label}`
                : undefined
            }
          />
          <Kpi
            label="Collections"
            value={data.kpis.totalCollections}
          />
          <Kpi
            label="Indexed"
            value={`${data.kpis.embeddingCoveragePct}%`}
            sublabel={`${data.kpis.itemsWithEmbeddings}/${data.kpis.totalItems} embedded`}
            accent="text-[#c4f036]"
          />
        </div>
      </section>

      <section id="search" className="space-y-2 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Search
        </h2>
        <ContentSearch tenantId={ctx.tenantId} />
      </section>

      <section id="library" className="space-y-2 scroll-mt-24">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Most accessed
          </h2>
          <span className="text-[11px] text-[var(--z-muted)]">
            {data.items.length} total
          </span>
        </header>
        <ContentList items={data.items.slice(0, 20)} />
      </section>

      <section id="collections" className="space-y-2 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Collections
        </h2>
        <CollectionList collections={data.collections} />
      </section>

      <section id="tags" className="space-y-2 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Tags
        </h2>
        <TagList
          tags={data.tags}
          usageBySlug={
            new Map(
              data.kpis.mostUsedTags.map((t) => [t.slug, t.usageCount]),
            )
          }
        />
      </section>

      {ctx.canWrite ? (
        <section id="upload" className="space-y-2 scroll-mt-24">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Upload
          </h2>
          <ContentUploader tenantId={ctx.tenantId} />
        </section>
      ) : null}
    </div>
  );
}
