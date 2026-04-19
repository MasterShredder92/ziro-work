import type { Material } from "@/lib/curriculum";

const KIND_LABEL: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  link: "Link",
  sheet: "Sheet",
  audio: "Audio",
  note: "Note",
};

export function MaterialList({
  materials,
  emptyMessage = "No materials attached.",
}: {
  materials: Material[];
  emptyMessage?: string;
}) {
  if (materials.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-center text-xs text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {materials.map((material) => (
        <li
          key={material.id}
          className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                {KIND_LABEL[material.kind] ?? material.kind}
              </div>
              <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                {material.url ? (
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[var(--z-accent)]"
                  >
                    {material.title}
                  </a>
                ) : (
                  material.title
                )}
              </div>
              {material.description ? (
                <div className="text-xs text-[var(--z-muted)] line-clamp-2">
                  {material.description}
                </div>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
