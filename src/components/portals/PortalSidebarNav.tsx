"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessagesBadge } from "@/components/messaging/MessagesBadge";

export type PortalSidebarItem = {
  id: string;
  label: string;
  href: string;
  icon?: string;
  match?: (pathname: string) => boolean;
};

function normalizeHrefBase(href: string): string {
  return href.split("#")[0] ?? href;
}

function isActive(pathname: string, item: PortalSidebarItem): boolean {
  if (item.match) return item.match(pathname);

  const base = normalizeHrefBase(item.href);
  if (!base || base === "/") return pathname === "/";

  // Hash links target sections on the same page and should not auto-highlight
  // unrelated routes just because they share the same pathname.
  if (item.href.includes("#")) return false;

  return pathname === base || pathname.startsWith(`${base}/`);
}

export function PortalSidebarNav({
  label,
  items,
  allowedNavIds,
  onNavigate,
  className,
}: {
  label: string;
  items: readonly PortalSidebarItem[];
  allowedNavIds?: readonly string[] | null;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname() ?? "/";
  const visible = allowedNavIds
    ? items.filter((item) => allowedNavIds.includes(item.id))
    : items;

  return (
    <nav
      className={`flex h-full flex-col gap-1 p-3 ${className ?? ""}`}
      aria-label={label}
    >
      <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      {visible.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center gap-2 rounded-[var(--z-radius-md)] px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] ${
            isActive(pathname, item)
              ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] text-[var(--z-fg)]"
              : "text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)]"
          }`}
        >
          {item.icon ? (
            <span className="inline-flex w-4 justify-center text-sm">
              {item.icon}
            </span>
          ) : null}
          <span>{item.label}</span>
          {item.id === "messages" ? <MessagesBadge /> : null}
        </Link>
      ))}
    </nav>
  );
}
