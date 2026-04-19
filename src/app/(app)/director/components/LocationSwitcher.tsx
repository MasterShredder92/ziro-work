"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { DirectorLocation } from "@/lib/director/types";

export type LocationSwitcherProps = {
  locations: DirectorLocation[];
  activeLocationId: string;
};

export function LocationSwitcher({
  locations,
  activeLocationId,
}: LocationSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("locationId", value);
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-[var(--z-muted)]">
      <span className="hidden sm:inline text-xs uppercase tracking-wider">
        Location
      </span>
      <select
        value={activeLocationId}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        className="bg-[var(--z-surface)] border border-[var(--z-border)] rounded-[var(--z-radius-md)] px-3 py-1.5 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-2 focus:ring-[#00ff88]/60 disabled:opacity-60"
      >
        {locations.length === 0 ? (
          <option value={activeLocationId}>All Locations</option>
        ) : null}
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}
