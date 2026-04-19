import type { ReactNode } from "react";

interface LocationsShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function LocationsShell({ sidebar, children }: LocationsShellProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1400px] overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] shadow-sm">
      <div className="hidden w-72 shrink-0 md:flex">{sidebar}</div>
      <section className="flex min-w-0 flex-1 flex-col overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          {children}
        </div>
      </section>
    </div>
  );
}
