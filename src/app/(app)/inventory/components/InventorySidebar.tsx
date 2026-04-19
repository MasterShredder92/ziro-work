"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";

export type InventoryNavItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
  scope?: string;
};

export const INVENTORY_NAV: InventoryNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "#overview",
    description: "KPIs & inventory health",
    scope: "inventory.read",
  },
  {
    id: "items",
    label: "Items",
    href: "#items",
    description: "Catalog & assets",
    scope: "inventory.read",
  },
  {
    id: "checkouts",
    label: "Checkouts",
    href: "#checkouts",
    description: "Active & overdue",
    scope: "inventory.read",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    href: "#maintenance",
    description: "Scheduled & open",
    scope: "inventory.read",
  },
  {
    id: "depreciation",
    label: "Depreciation",
    href: "#depreciation",
    description: "Value curve",
    scope: "inventory.read",
  },
];

export function InventorySidebar({
  tenantLabel,
  allowedNavIds,
}: {
  tenantLabel: string;
  allowedNavIds?: string[] | null;
}) {
  const [active, setActive] = useState("overview");
  const items = allowedNavIds
    ? INVENTORY_NAV.filter((i) => allowedNavIds.includes(i.id))
    : INVENTORY_NAV;

  return (
    <aside className="md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]">
      <div className="px-5 py-4 border-b border-[var(--z-border)]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Inventory
        </div>
        <div className="mt-1 text-base font-semibold text-[var(--z-fg)] truncate">
          {tenantLabel}
        </div>
      </div>
      <nav className="flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActive(item.id)}
              className={clsx(
                "block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
                isActive
                  ? "bg-[#00ff88]/10 text-[#00ff88]"
                  : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5",
              )}
            >
              <div>{item.label}</div>
              {item.description ? (
                <div
                  className={clsx(
                    "hidden md:block text-[11px] mt-0.5",
                    isActive ? "text-[#00ff88]/70" : "text-[var(--z-muted)]",
                  )}
                >
                  {item.description}
                </div>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
