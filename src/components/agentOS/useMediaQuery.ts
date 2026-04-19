"use client";

import * as React from "react";

export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = React.useState<boolean>(defaultValue);
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    if (mql.addEventListener) {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, [query]);
  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 640px)", false);
}
