import * as React from "react";
import Link from "next/link";
import { cn } from "./utils/cn";

export type TopNavProps = {
  brand?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export function TopNav({ brand, left, right, className }: TopNavProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-bg),white_2%)] backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold tracking-[-0.01em] text-[var(--z-fg)] hover:bg-[color-mix(in_oklab,var(--z-fg),transparent_92%)]"
          >
            {brand ?? (
              <>
                <span className="h-2 w-2 rounded-full bg-[var(--z-accent)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--z-accent),transparent_85%)]" />
                <span className="truncate">Ziro</span>
              </>
            )}
          </Link>
          {left ? <div className="min-w-0">{left}</div> : null}
        </div>

        <div className="flex-1" />

        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
    </header>
  );
}

