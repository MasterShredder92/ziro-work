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

  /** Last `locationId` search param we applied — avoids URL↔state ping-pong. */
  const scheduleLocParamRef = React.useRef<string | null>(null);

  // ── Schedule (?locationId=) ───────────────────────────────────────────────
  // Schedule is per-studio only. Two one-way effects (URL→state + state→URL) fought
  // in the same tick (stale selectedLocId vs URL), causing rapid router.replace loops.
  // Single layout pass: adopt URL when the param actually changed; otherwise push
  // URL when the rail/context is ahead of the query string.
  const scheduleLocParam = pathname.startsWith("/schedule")
    ? (searchParams.get("locationId") ?? "")
    : "";
  React.useLayoutEffect(() => {
    if (!pathname.startsWith("/schedule")) return;
    if (locations.length === 0) return;

    const firstId = locations[0]!.id;
    const urlIsValid = scheduleLocParam !== "" && locations.some((l) => l.id === scheduleLocParam);
    const stateIsValid = !!(selectedLocId && locations.some((l) => l.id === selectedLocId));
    const locParamChanged = scheduleLocParamRef.current !== scheduleLocParam;

    const bumpRef = () => {
      scheduleLocParamRef.current = scheduleLocParam;
    };

    if (urlIsValid && locParamChanged) {
      if (selectedLocId !== scheduleLocParam) setSelectedLocId(scheduleLocParam);
      bumpRef();
      return;
    }

    if (stateIsValid && scheduleLocParam !== selectedLocId) {
      router.replace(`/schedule?locationId=${encodeURIComponent(selectedLocId)}`);
      bumpRef();
      return;
    }

    if (!urlIsValid) {
      const fallback = stateIsValid ? selectedLocId! : firstId;
      if (scheduleLocParam !== fallback) {
        router.replace(`/schedule?locationId=${encodeURIComponent(fallback)}`);
      }
      if (!stateIsValid || selectedLocId !== fallback) {
        setSelectedLocId(fallback);
      }
      bumpRef();
      return;
    }

    bumpRef();
  }, [pathname, scheduleLocParam, selectedLocId, locations, router, setSelectedLocId]);

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
