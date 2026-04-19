import type { ContentTag } from "@/lib/content/types";

export type TagListProps = {
  tags: ContentTag[];
  usageBySlug?: Map<string, number>;
  emptyMessage?: string;
};

export function TagList({
  tags,
  usageBySlug,
  emptyMessage = "No tags yet.",
}: TagListProps) {
  if (tags.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-6 text-center text-xs text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => {
        const count = usageBySlug?.get(t.slug) ?? 0;
        return (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-0.5 text-xs text-[var(--z-fg)]"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                background: t.color ?? "color-mix(in oklab, var(--z-accent), transparent 50%)",
              }}
            />
            <span>{t.label}</span>
            <span className="text-[10px] text-[var(--z-muted)]">{count}</span>
          </span>
        );
      })}
    </div>
  );
}
