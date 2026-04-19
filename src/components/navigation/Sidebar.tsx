"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ROUTE_GROUPS } from "@/lib/routes";

type SidebarProps = {
  isMobileOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 z-40 h-full w-[260px] border-r border-[#1c1c1e] bg-[#0a0a0c] transition-transform duration-200 ease-out",
        "flex flex-col",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
      aria-label="Primary navigation"
    >
      <div className="flex items-center justify-between px-6 pb-5 pt-7">
        <div className="text-2xl tracking-tighter">
          <span className="text-[#00ff88] font-extrabold">ZIRO</span>
          <span className="text-white ml-1 font-light">WORK</span>
        </div>
        <button
          type="button"
          className="rounded-md border border-[#2b2b2f] px-2 py-1 text-xs font-semibold text-[#909098] lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        >
          Close
        </button>
      </div>

      <div className="h-px bg-[#1c1c1e] mx-6" />

      <nav className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">
        {ROUTE_GROUPS.map((group) => (
          <div
            key={group.id}
            className="space-y-1"
            data-tour={group.id === "lifecycle" ? "lifecycle-stages" : undefined}
          >
            <div className="px-2 pb-2">
              <div className="text-xs font-semibold text-[#505055] uppercase tracking-wider">
                {group.label}
              </div>
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={clsx(
                    "block px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-[#00ff88]/10 text-[#00ff88]"
                      : "text-[#909098] hover:text-white hover:bg-white/5"
                  )}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-6 pb-6 text-xs text-[#505055]">Ziro Work</div>
    </aside>
  );
}

