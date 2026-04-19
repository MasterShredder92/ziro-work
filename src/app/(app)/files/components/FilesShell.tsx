"use client";

import { useState, type ReactNode } from "react";
import { FilesSidebar } from "./FilesSidebar";
import { FilesToastHost } from "./FilesToastHost";

export interface FilesShellProps {
  children: ReactNode;
  allowedNavIds?: string[] | null;
  activeName?: string | null;
  currentUserName?: string | null;
}

export function FilesShell({
  children,
  allowedNavIds,
  activeName,
  currentUserName,
}: FilesShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[color-mix(in_oklab,var(--z-bg),black_4%)] md:flex-row">
      <aside
        className={`${
          mobileOpen ? "block" : "hidden"
        } md:block w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[var(--z-surface)]`}
      >
        <div className="sticky top-0">
          <FilesSidebar
            allowedNavIds={allowedNavIds}
            activeName={activeName}
          />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--z-border)] bg-[var(--z-surface)] px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--z-border)] text-[var(--z-fg)] md:hidden"
              aria-label="Toggle navigation"
            >
              <span className="text-lg leading-none">≡</span>
            </button>
            <div className="text-sm font-semibold text-[var(--z-fg)]">
              Files &amp; Documents
            </div>
          </div>

          {currentUserName ? (
            <div className="text-xs text-[var(--z-muted)]">
              Signed in as{" "}
              <span className="text-[var(--z-fg)]">{currentUserName}</span>
            </div>
          ) : null}
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
        <FilesToastHost />
      </div>
    </div>
  );
}
