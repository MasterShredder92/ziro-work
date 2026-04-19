import type { ReactNode } from "react";

interface MessagingShellProps {
  sidebar: ReactNode;
  conversation: ReactNode;
  composer: ReactNode;
}

export function MessagingShell({
  sidebar,
  conversation,
  composer,
}: MessagingShellProps) {
  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-7xl overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] shadow-sm">
      <div className="hidden w-80 shrink-0 md:flex">{sidebar}</div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {conversation}
        </div>
        {composer}
      </div>
    </div>
  );
}
