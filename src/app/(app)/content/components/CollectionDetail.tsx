import type { ContentCollectionSurface } from "@/lib/content/types";
import { ContentList } from "./ContentList";
import { TagList } from "./TagList";

export type CollectionDetailProps = {
  surface: ContentCollectionSurface;
};

export function CollectionDetail({ surface }: CollectionDetailProps) {
  const { collection, items, tags } = surface;
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Collection
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          {collection.title}
        </h1>
        {collection.description ? (
          <p className="text-sm leading-relaxed text-[var(--z-fg)]/80">
            {collection.description}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--z-muted)]">
          <span>{collection.item_ids.length} items</span>
          <span>· Visibility {collection.visibility}</span>
          <span>
            · Updated {new Date(collection.updated_at).toLocaleDateString()}
          </span>
        </div>
      </header>

      {tags.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Tags
          </h2>
          <TagList tags={tags} />
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Items
        </h2>
        <ContentList items={items} emptyMessage="Collection is empty." />
      </section>
    </div>
  );
}
