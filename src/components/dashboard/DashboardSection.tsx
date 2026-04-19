import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

export type DashboardSectionProps = {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** When false, only the heading + children render (no frosted panel). Use when children bring their own cards. */
  withSurface?: boolean;
  /** Extra classes on the padded surface wrapper */
  surfaceClassName?: string;
};

/**
 * Consistent section chrome for the main dashboard column.
 */
export function DashboardSection({
  id,
  title,
  description,
  children,
  className,
  withSurface = true,
  surfaceClassName,
}: DashboardSectionProps) {
  return (
    <section id={id} className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--z-muted)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_42%)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {withSurface ? (
        <div
          className={cn(
            "rounded-2xl border border-[color-mix(in_oklab,var(--z-border),transparent_12%)] bg-[color-mix(in_oklab,var(--z-surface),transparent_22%)] p-4 shadow-[inset_0_1px_0_0_color-mix(in_oklab,white,transparent_94%)] backdrop-blur-sm sm:p-5",
            surfaceClassName,
          )}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
