import Link from "next/link";
import type { ContentCollection } from "@/lib/content/types";

export type CollectionListProps = {
  collections: ContentCollection[];
  emptyMessage?: string;
};

export function CollectionList({
  collections,
  emptyMessage = "No collections yet.",
}: CollectionListProps) {
  if (collections.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-6 text-center text-xs text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }
  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {collections.map((c) => (
        <li
          key={c.id}
          className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]"
        >
          <Link href={`/content/collections/${c.id}`} className="block px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                  {c.title}
                </div>
                {c.description ? (
                  <div className="mt-0.5 line-clamp-2 text-xs text-[var(--z-muted)]">
                    {c.description}
                  </div>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-lg font-bold text-[var(--z-fg)]">
                  {c.item_ids.length}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
                  items
                </div>
              </div>
            </div>
            {c.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-[var(--z-muted)]">
                {c.tags.slice(0, 6).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1.5 py-0.5"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
