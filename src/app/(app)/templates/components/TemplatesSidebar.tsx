"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface TemplatesNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  scope?: string;
}

export const TEMPLATES_NAV_ITEMS: TemplatesNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/templates",
    icon: "▦",
    scope: "templates.read",
  },
  {
    id: "library",
    label: "Template Library",
    href: "/templates#library",
    icon: "📚",
    scope: "templates.read",
  },
  {
    id: "merge-fields",
    label: "Merge Fields",
    href: "/templates#merge-fields",
    icon: "{}",
    scope: "templates.read",
  },
];

export interface TemplatesSidebarProps {
  allowedNavIds?: string[] | null;
  activeTemplateName?: string | null;
}

export function TemplatesSidebar({
  allowedNavIds,
  activeTemplateName,
}: TemplatesSidebarProps) {
  const pathname = usePathname();
  const items = allowedNavIds
    ? TEMPLATES_NAV_ITEMS.filter((i) => allowedNavIds.includes(i.id))
    : TEMPLATES_NAV_ITEMS;

  return (
    <nav className="flex flex-col gap-1 px-4 py-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        Templates OS
      </div>
      {items.map((item) => {
        const base = item.href.split("#")[0];
        const isActive =
          base === "/templates"
            ? pathname === "/templates"
            : pathname.startsWith(base);
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
      {activeTemplateName ? (
        <div className="mt-4 border-t border-[var(--z-border)] pt-4 text-xs text-[var(--z-muted)]">
          <div className="font-semibold uppercase tracking-wider">
            Editing
          </div>
          <div className="mt-1 truncate text-sm text-[var(--z-fg)]">
            {activeTemplateName}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
