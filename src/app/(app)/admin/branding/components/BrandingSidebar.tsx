"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface BrandingNavItem {
  id: string;
  label: string;
  href: string;
  description: string;
  icon: string;
  match: (pathname: string) => boolean;
}

export const BRANDING_NAV: BrandingNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin/branding",
    description: "Overview of logo, colors, domain, identity.",
    icon: "▦",
    match: (p) => p === "/admin/branding",
  },
  {
    id: "theme",
    label: "Theme",
    href: "/admin/branding/theme",
    description: "Colors, typography, component tokens.",
    icon: "◎",
    match: (p) => p.startsWith("/admin/branding/theme"),
  },
  {
    id: "domain",
    label: "Domain",
    href: "/admin/branding/domain",
    description: "Custom domains & CNAME verification.",
    icon: "✱",
    match: (p) => p.startsWith("/admin/branding/domain"),
  },
  {
    id: "email",
    label: "Email identity",
    href: "/admin/branding/email",
    description: "From address, reply-to, test send.",
    icon: "✉",
    match: (p) => p.startsWith("/admin/branding/email"),
  },
  {
    id: "layouts",
    label: "Portal layouts",
    href: "/admin/branding/layouts",
    description: "Presets, sidebar, dashboards.",
    icon: "▤",
    match: (p) => p.startsWith("/admin/branding/layouts"),
  },
  {
    id: "preview",
    label: "Preview",
    href: "/admin/branding/preview",
    description: "Live preview of tenant theme.",
    icon: "◉",
    match: (p) => p.startsWith("/admin/branding/preview"),
  },
];

export function BrandingSidebar({
  tenantLabel,
  canWrite,
}: {
  tenantLabel: string;
  canWrite: boolean;
}) {
  const pathname = usePathname() ?? "/admin/branding";

  return (
    <aside className="md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]">
      <div className="px-5 py-4 border-b border-[var(--z-border)]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Branding OS
        </div>
        <div className="mt-1 text-base font-semibold text-[var(--z-fg)] truncate">
          {tenantLabel}
        </div>
        <div className="mt-1 text-[11px] text-[var(--z-muted)]">
          {canWrite ? "Admin · write enabled" : "Director · read only"}
        </div>
      </div>
      <nav className="flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5">
        {BRANDING_NAV.map((item) => {
          const isActive = item.match(pathname);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`block shrink-0 md:shrink md:w-full px-3 py-2 rounded-[var(--z-radius-md)] text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal ${
                isActive
                  ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] text-[var(--z-fg)]"
                  : "text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex w-4 justify-center text-sm">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              <div className="hidden md:block text-[11px] mt-0.5 text-[var(--z-muted)]">
                {item.description}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
