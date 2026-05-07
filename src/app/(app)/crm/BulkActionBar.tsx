"use client";

import { ChevronDown, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function BulkActionBar({
  selectedCount,
  children,
  onRefresh,
}: {
  selectedCount: number;
  children: (api: { closeMenu: () => void }) => ReactNode;
  onRefresh: () => void;
}) {
  const open = selectedCount > 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  useEffect(() => {
    if (selectedCount === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset dropdown when selection clears
      setMenuOpen(false);
    }
  }, [selectedCount]);

  return (
    <div
      className={`sticky top-0 z-40 -mx-1 mb-2 overflow-hidden rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)]/95 px-3 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-200 ease-out motion-safe:transition-[opacity,transform] ${
        open
          ? "translate-y-0 opacity-100"
          : "pointer-events-none max-h-0 translate-y-[-6px] border-transparent py-0 opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-[var(--z-fg,#f0f0f0)]">
          {selectedCount} selected
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--z-border,#1c1c1e)] px-2.5 py-1.5 text-xs font-semibold text-[var(--z-muted,#909098)] hover:bg-white/5 hover:text-[var(--z-fg,#f0f0f0)]"
            title="Refresh list"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </button>
          <div ref={rootRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((m) => !m)}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--z-accent,#c4f036)]/15 px-2.5 py-1.5 text-xs font-semibold text-[var(--z-accent,#c4f036)] hover:bg-[var(--z-accent,#c4f036)]/25"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              Bulk actions
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </button>
            {menuOpen && selectedCount > 0 ? (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-1 min-w-[180px] rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] py-1 shadow-lg"
              >
                {children({ closeMenu })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BulkMenuItem({
  label,
  destructive,
  onClick,
}: {
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onClick();
      }}
      className={`block w-full px-3 py-2 text-left text-xs font-medium hover:bg-white/5 ${
        destructive
          ? "text-red-400"
          : "text-[var(--z-fg,#e8e8e8)]"
      }`}
    >
      {label}
    </button>
  );
}
