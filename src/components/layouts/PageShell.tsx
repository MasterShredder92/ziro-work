import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

type PageShellProps = {
  title?: string;
  breadcrumbs?: ReactNode;
  /** When false, the default Workspace crumb row is omitted (e.g. dashboard with its own title). */
  showBreadcrumb?: boolean;
  /** Extra classes on the scroll container (padding, etc.). */
  shellClassName?: string;
  /** Classes for the main content wrapper (default includes mt-6). */
  mainClassName?: string;
  children?: ReactNode;
};

export function BreadcrumbPlaceholder() {
  return (
    <div className="text-xs text-[#606068]">Workspace</div>
  );
}

export function PageShell({
  title,
  breadcrumbs,
  showBreadcrumb = true,
  shellClassName,
  mainClassName,
  children,
}: PageShellProps) {
  return (
    <div
      className={cn("h-full overflow-y-auto overflow-x-hidden p-6", shellClassName)}
    >
      {showBreadcrumb ? (
        <div className="mb-4">
          {breadcrumbs ?? <BreadcrumbPlaceholder />}
        </div>
      ) : null}
      {title ? (
        <h1 className="text-xl font-extrabold text-[#f0f0f0]">{title}</h1>
      ) : null}
      <div className={cn("mt-6", mainClassName)}>
        {children ?? (
          <div
            className="space-y-2"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-full max-w-lg animate-pulse rounded bg-white/5" />
            <div className="h-3 w-4/5 max-w-md animate-pulse rounded bg-white/5" />
          </div>
        )}
      </div>
    </div>
  );
}

