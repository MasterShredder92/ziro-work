"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Building2 } from "lucide-react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useTenantUi } from "@/components/tenant/TenantUiContext";

export function TenantSwitcher() {
  const { locations, locationId, currentLocation, setLocationId } = useTenantUi();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  const hasLocations = locations.length > 0;

  const navigateToLocation = React.useCallback(
    (nextLocationId: string) => {
      const currentSearch = typeof window !== "undefined" ? window.location.search : "";
      const params = new URLSearchParams(currentSearch);
      params.set("locationId", nextLocationId);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      router.refresh();
    },
    [pathname, router],
  );

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        disabled={!hasLocations}
        className={cn(
          "flex max-w-[min(52vw,220px)] items-center gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] py-2 text-left text-xs font-semibold text-[var(--z-fg)] transition-colors",
          "hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]",
          !hasLocations && "opacity-60 cursor-not-allowed",
          focusRingClassName(),
        )}
      >
        <Building2 className="h-4 w-4 shrink-0 text-[var(--z-accent)]" aria-hidden />
        <span className="min-w-0 flex-1 truncate">
          {currentLocation?.name ?? "No locations configured"}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-[var(--z-muted)] transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && hasLocations ? (
        <ul
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-40 min-w-[220px] overflow-hidden rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] py-1 shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
        >
          {locations.map((location) => (
            <li key={location.id} role="option" aria-selected={location.id === locationId}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-[var(--z-space-3)] py-2 text-left text-xs font-semibold transition-colors",
                  location.id === locationId
                    ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] text-[var(--z-fg)]"
                    : "text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)]",
                )}
                onClick={() => {
                  setLocationId(location.id);
                  navigateToLocation(location.id);
                  setOpen(false);
                }}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    location.id === locationId
                      ? "bg-[var(--z-accent)] shadow-[0_0_8px_var(--z-accent)]"
                      : "bg-[var(--z-border)]",
                  )}
                />
                <span className="truncate">{location.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
