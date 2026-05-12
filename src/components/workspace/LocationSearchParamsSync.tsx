"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useZiroWorkspace } from "@/components/workspace/ZiroWorkspaceContext";

/**
 * Hydrates workspace location from URL on supported module routes, and writes
 * URL when the location rail changes the selection.
 */
export function LocationSearchParamsSync() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedLocId, setSelectedLocId, locations } = useZiroWorkspace();

  // ── Schedule (?locationId=) ───────────────────────────────────────────────
  // Schedule is always per-studio (no aggregate "all locations" view). Missing or
  // invalid ?locationId= defaults to the first active location — never null.
  React.useEffect(() => {
    if (!pathname.startsWith("/schedule")) return;
    if (locations.length === 0) return;
    const urlLoc = searchParams.get("locationId");
    const first = locations[0]!.id;
    if (urlLoc && locations.some((l) => l.id === urlLoc)) {
      setSelectedLocId((prev) => (prev === urlLoc ? prev : urlLoc));
    } else {
      setSelectedLocId((prev) => (prev === first ? prev : first));
    }
  }, [pathname, searchParams, locations, setSelectedLocId]);

  React.useEffect(() => {
    if (!pathname.startsWith("/schedule")) return;
    if (locations.length === 0) return;
    const cur = searchParams.get("locationId");
    const effective = selectedLocId && locations.some((l) => l.id === selectedLocId) ? selectedLocId : locations[0]!.id;
    if (cur !== effective) {
      router.replace(`/schedule?locationId=${encodeURIComponent(effective)}`);
    }
  }, [pathname, router, searchParams, selectedLocId, locations]);

  // ── Invoices (?location_id=) ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!pathname.startsWith("/invoices")) return;
    const urlLoc = searchParams.get("location_id");
    if (urlLoc && locations.some((l) => l.id === urlLoc)) {
      setSelectedLocId((prev) => (prev === urlLoc ? prev : urlLoc));
    } else if (!urlLoc) {
      setSelectedLocId((prev) => (prev === null ? prev : null));
    }
  }, [pathname, searchParams, locations, setSelectedLocId]);

  React.useEffect(() => {
    if (!pathname.startsWith("/invoices")) return;
    const cur = searchParams.get("location_id");
    if (selectedLocId) {
      if (cur !== selectedLocId) {
        const next = new URLSearchParams(searchParams.toString());
        next.set("location_id", selectedLocId);
        router.replace(`/invoices?${next.toString()}`);
      }
    } else if (cur) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("location_id");
      const q = next.toString();
      router.replace(q ? `/invoices?${q}` : "/invoices");
    }
  }, [pathname, router, searchParams, selectedLocId]);

  return null;
}
