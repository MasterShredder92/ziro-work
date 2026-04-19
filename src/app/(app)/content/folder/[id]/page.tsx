import Link from "next/link";
import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getFolder, listContentItems, listFolders, listTags } from "@/lib/content";
import { ContentList, TagList } from "../../components";
import { resolveContentContext } from "../../guard";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ContentFolderPage({ params }: PageProps) {
  const { id } = await params;
  let ctx;
  try {
    ctx = await resolveContentContext();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You do not have permission to view this folder.
        </div>
      </div>
    );
  }

  const folder = await getFolder(id, ctx.tenantId);
  if (!folder) notFound();

  const [items, childFolders, tags] = await Promise.all([
    listContentItems(ctx.tenantId, { folderId: id }),
    listFolders(ctx.tenantId),
    listTags(ctx.tenantId),
  ]);
  const children = childFolders.filter((f) => f.parent_id === folder.id);

  const visibleItems =
    ctx.session.role === "student" || ctx.session.role === "family"
      ? items.filter(
          (i) => i.visibility === "public" || i.visibility === "tenant",
        )
      : items;

  await logAudit("content.folder.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    folderId: id,
    count: visibleItems.length,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          <Link
            href="/content"
            className="text-[var(--z-muted)] hover:text-[var(--z-fg)]"
          >
            Content Library
          </Link>{" "}
          /
        </div>
        <h1
          className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)] flex items-center gap-2"
        >
          {folder.color ? (
            <span
              aria-hidden
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: folder.color }}
            />
          ) : null}
          {folder.name}
        </h1>
        {folder.description ? (
          <div className="text-xs text-[var(--z-muted)]">
            {folder.description}
          </div>
        ) : null}
      </header>

      {children.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Subfolders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {children.map((f) => (
              <Link
                key={f.id}
                href={`/content/folder/${f.id}`}
                className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3 hover:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  {f.color ? (
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: f.color }}
                    />
                  ) : null}
                  <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                    {f.name}
                  </div>
                </div>
                {f.description ? (
                  <div className="mt-1 text-[11px] text-[var(--z-muted)] line-clamp-2">
                    {f.description}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-2">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Items
          </h2>
          <span className="text-[11px] text-[var(--z-muted)]">
            {visibleItems.length} total
          </span>
        </header>
        <ContentList items={visibleItems} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Tags
        </h2>
        <TagList tags={tags} />
      </section>
    </div>
  );
}
