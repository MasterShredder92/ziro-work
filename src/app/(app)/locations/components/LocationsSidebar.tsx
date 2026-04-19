"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Location } from "@/lib/types/entities";

interface LocationsSidebarProps {
  locations: Location[];
}

export function LocationsSidebar({ locations }: LocationsSidebarProps) {
  const pathname = usePathname() ?? "";

  return (
    <aside className="flex h-full w-full flex-col border-r border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="border-b border-[var(--z-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">Locations</h2>
        <p className="text-xs text-[var(--z-muted)]">
          {locations.length} active
        </p>
      </header>
      <nav className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-[var(--z-border)]">
          <li>
            <Link
              href="/locations"
              className={`flex flex-col px-4 py-3 text-sm transition hover:bg-[var(--z-surface-hover)] ${
                pathname === "/locations"
                  ? "bg-[var(--z-surface-hover)] text-[var(--z-fg)]"
                  : "text-[var(--z-fg)]"
              }`}
            >
              <span className="font-medium">All locations</span>
              <span className="text-xs text-[var(--z-muted)]">
                Overview of every studio
              </span>
            </Link>
          </li>
          {locations.map((loc) => {
            const href = `/locations/${loc.id}`;
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={loc.id}>
                <Link
                  href={href}
                  className={`flex flex-col px-4 py-3 text-sm transition hover:bg-[var(--z-surface-hover)] ${
                    active
                      ? "bg-[var(--z-surface-hover)] text-[var(--z-fg)]"
                      : "text-[var(--z-fg)]"
                  }`}
                >
                  <span className="truncate font-medium">{loc.name}</span>
                  <span className="truncate text-xs text-[var(--z-muted)]">
                    {[loc.city, loc.state].filter(Boolean).join(", ") || "—"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
