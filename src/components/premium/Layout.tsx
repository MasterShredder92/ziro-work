import * as React from "react";
import { cn } from "./utils/cn";
import { TopNav, type TopNavProps } from "./TopNav";

export type LayoutProps = {
  children: React.ReactNode;
  nav?: TopNavProps | null;
  footer?: React.ReactNode;
  className?: string;
};

export function Layout({ children, nav = {}, footer, className }: LayoutProps) {
  return (
    <div className={cn("min-h-dvh bg-[var(--z-bg)] text-[var(--z-fg)]", className)}>
      {nav === null ? null : <TopNav {...nav} />}
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      {footer ? (
        <footer className="border-t border-[var(--z-border)]">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}

