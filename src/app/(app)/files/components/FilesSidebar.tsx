"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface FilesNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  scope?: string;
}

export const FILES_NAV_ITEMS: FilesNavItem[] = [
  { id: "overview", label: "Overview", href: "/files", icon: "▦", scope: "files.read" },
  { id: "explorer", label: "Explorer", href: "/files/explorer", icon: "📁", scope: "files.read" },
  { id: "signatures", label: "Signatures", href: "/files/signatures", icon: "✒", scope: "files.sign" },
  { id: "shares", label: "Share Links", href: "/files/shares", icon: "🔗", scope: "files.share" },
];

export interface FilesSidebarProps {
  allowedNavIds?: string[] | null;
  activeName?: string | null;
}

export function FilesSidebar({ allowedNavIds, activeName }: FilesSidebarProps) {
  const pathname = usePathname() ?? "/files";
  const items = allowedNavIds
    ? FILES_NAV_ITEMS.filter((i) => allowedNavIds.includes(i.id))
    : FILES_NAV_ITEMS;

  return (
    <nav className="flex flex-col gap-1 px-4 py-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        Files OS
      </div>
      {items.map((item) => {
        const base = item.href;
        const isActive =
          base === "/files" ? pathname === "/files" : pathname.startsWith(base);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] text-[var(--z-accent)]"
                : "text-[var(--z-fg)]/80 hover:bg-white/[0.04] hover:text-[var(--z-fg)]"
            }`}
          >
            <span className="text-xs text-[var(--z-muted)]">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
      {activeName ? (
        <div className="mt-4 border-t border-[var(--z-border)] pt-4 text-xs text-[var(--z-muted)]">
          <div className="font-semibold uppercase tracking-wider">Viewing</div>
          <div className="mt-1 truncate text-sm text-[var(--z-fg)]">
            {activeName}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
