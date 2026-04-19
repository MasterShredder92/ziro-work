import Link from "next/link";
import type { ContentItem } from "@/lib/content/types";

export type ContentListProps = {
  items: ContentItem[];
  emptyMessage?: string;
};

function kindIcon(kind: ContentItem["kind"]): string {
  switch (kind) {
    case "video":
      return "▶";
    case "audio":
      return "♫";
    case "image":
      return "▦";
    case "document":
      return "◫";
    case "link":
      return "↗";
    case "note":
      return "✎";
    default:
      return "⬚";
  }
}

function formatBytes(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export function ContentList({
  items,
  emptyMessage = "No content items yet.",
}: ContentListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-8 text-center text-sm text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {items.map((item) => {
        const size = formatBytes(item.file_size_bytes);
        return (
          <li
            key={item.id}
            className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]"
          >
            <Link
              href={`/content/${item.id}`}
              className="flex items-start gap-3 px-4 py-3"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] text-base text-[var(--z-muted)]">
                {kindIcon(item.kind)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                    {item.title}
                  </div>
                  <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
                    {item.kind}
                  </span>
                  {item.visibility !== "tenant" ? (
                    <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
                      {item.visibility}
                    </span>
                  ) : null}
                </div>
                {item.description ? (
                  <div className="mt-0.5 line-clamp-2 text-xs text-[var(--z-muted)]">
                    {item.description}
                  </div>
                ) : null}
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--z-muted)]">
                  {item.file_name ? <span>{item.file_name}</span> : null}
                  {size ? <span>· {size}</span> : null}
                  {item.tags.length > 0 ? (
                    <span>· {item.tags.slice(0, 4).join(", ")}</span>
                  ) : null}
                  <span>
                    · Viewed {item.access_count}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
