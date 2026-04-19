import Link from "next/link";
import type { ContentSurface } from "@/lib/content/types";

export type ContentDetailProps = {
  surface: ContentSurface;
  canWrite: boolean;
};

function formatBytes(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export function ContentDetail({ surface, canWrite }: ContentDetailProps) {
  const { item, file, tags, collections, embedding, related } = surface;
  const size = formatBytes(item.file_size_bytes);
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Content item
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          {item.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--z-muted)]">
          <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
            {item.kind}
          </span>
          <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
            {item.visibility}
          </span>
          {item.file_name ? <span>· {item.file_name}</span> : null}
          {size ? <span>· {size}</span> : null}
          <span>· Viewed {item.access_count}</span>
        </div>
      </header>

      {item.description ? (
        <p className="text-sm leading-relaxed text-[var(--z-fg)]/80">
          {item.description}
        </p>
      ) : null}

      {file ? (
        <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Preview
          </div>
          <FilePreview
            mime={file.mimeType}
            url={file.fileUrl ?? file.sourceUrl ?? null}
            thumbnail={file.thumbnailUrl}
            title={item.title}
          />
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {file.fileUrl ? (
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)] hover:text-[#00ff88]"
              >
                Download / open
              </a>
            ) : null}
            {file.sourceUrl ? (
              <a
                href={file.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)] hover:text-[#00ff88]"
              >
                Source
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MetadataCard
          title="Tags"
          empty="No tags"
          body={
            tags.length === 0 ? null : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-0.5 text-[11px] text-[var(--z-fg)]"
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            )
          }
        />

        <MetadataCard
          title="Collections"
          empty="Not in any collections"
          body={
            collections.length === 0 ? null : (
              <ul className="space-y-1 text-sm">
                {collections.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/content/collections/${c.id}`}
                      className="text-[var(--z-fg)] hover:text-[#00ff88]"
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )
          }
        />

        <MetadataCard
          title="Embedding"
          empty="Not indexed"
          body={
            embedding ? (
              <div className="text-xs text-[var(--z-muted)] space-y-0.5">
                <div>
                  Model:{" "}
                  <span className="text-[var(--z-fg)]">{embedding.model}</span>
                </div>
                <div>
                  Dimensions:{" "}
                  <span className="text-[var(--z-fg)]">
                    {embedding.dimensions}
                  </span>
                </div>
                <div>
                  Updated{" "}
                  <span className="text-[var(--z-fg)]">
                    {new Date(embedding.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : null
          }
        />

        <MetadataCard
          title="Author"
          empty="No author recorded"
          body={
            item.author_id ? (
              <div className="text-sm text-[var(--z-fg)]">{item.author_id}</div>
            ) : null
          }
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Related
        </h2>
        {related.length === 0 ? (
          <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-6 text-center text-xs text-[var(--z-muted)]">
            No related items yet.
          </div>
        ) : (
          <ul className="grid gap-1.5 md:grid-cols-2">
            {related.map((r) => (
              <li
                key={r.id}
                className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm"
              >
                <Link
                  href={`/content/${r.id}`}
                  className="text-[var(--z-fg)] hover:text-[#00ff88]"
                >
                  {r.title}
                </Link>
                <div className="text-[11px] text-[var(--z-muted)]">
                  {r.kind}
                  {r.tags.length > 0 ? ` · ${r.tags.slice(0, 3).join(", ")}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canWrite ? (
        <section className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3 text-xs text-[var(--z-muted)]">
          You have write access. Use the API to rename, retag, or move this
          item.
        </section>
      ) : null}
    </div>
  );
}

function MetadataCard({
  title,
  empty,
  body,
}: {
  title: string;
  empty: string;
  body: React.ReactNode | null;
}) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
        {title}
      </div>
      <div className="mt-2">
        {body ?? (
          <div className="text-xs text-[var(--z-muted)]">{empty}</div>
        )}
      </div>
    </div>
  );
}

function FilePreview({
  mime,
  url,
  thumbnail,
  title,
}: {
  mime: string | null;
  url: string | null;
  thumbnail: string | null;
  title: string;
}) {
  if (!url) {
    return (
      <div className="mt-3 flex h-40 items-center justify-center rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface-2)] text-xs text-[var(--z-muted)]">
        No preview available
      </div>
    );
  }
  if (mime?.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={title}
        className="mt-3 max-h-[400px] w-full rounded-md border border-[var(--z-border)] object-contain bg-[var(--z-surface-2)]"
      />
    );
  }
  if (mime?.startsWith("video/")) {
    return (
      <video
        controls
        className="mt-3 w-full rounded-md border border-[var(--z-border)] bg-black"
      >
        <source src={url} type={mime} />
      </video>
    );
  }
  if (mime?.startsWith("audio/")) {
    return (
      <audio controls className="mt-3 w-full">
        <source src={url} type={mime} />
      </audio>
    );
  }
  if (mime === "application/pdf") {
    return (
      <iframe
        src={url}
        title={title}
        className="mt-3 h-[520px] w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)]"
      />
    );
  }
  if (thumbnail) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbnail}
        alt={title}
        className="mt-3 max-h-[320px] w-full rounded-md border border-[var(--z-border)] object-contain bg-[var(--z-surface-2)]"
      />
    );
  }
  return (
    <div className="mt-3 flex h-40 items-center justify-center rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface-2)] text-xs text-[var(--z-muted)]">
      Preview unavailable · open in new tab
    </div>
  );
}
