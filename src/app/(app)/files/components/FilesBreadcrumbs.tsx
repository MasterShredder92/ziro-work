"use client";

import Link from "next/link";
import { FolderColorDot } from "./FolderColorPicker";

export type FilesCrumb = {
  label: string;
  href?: string;
  /**
   * When present, shows a folder color dot (resolved hex, or empty slot if null).
   * Omit the key for non-folder crumbs.
   */
  colorHex?: string | null;
};

export function FilesBreadcrumbs({ items }: { items: FilesCrumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-[var(--z-muted)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 ? <span className="text-[var(--z-border)]">/</span> : null}
            <span className="flex min-w-0 items-center gap-1">
              {Object.prototype.hasOwnProperty.call(c, "colorHex") ? (
                <FolderColorDot hex={c.colorHex ?? null} />
              ) : null}
              {c.href ? (
                <Link
                  href={c.href}
                  className="min-w-0 truncate text-[var(--z-fg)]/80 underline-offset-2 hover:text-[var(--z-accent)] hover:underline"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="min-w-0 truncate font-medium text-[var(--z-fg)]">
                  {c.label}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
