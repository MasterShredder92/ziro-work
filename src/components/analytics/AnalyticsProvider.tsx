"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const UTM_KEY = "ziro.utm";

export type AnalyticsContextValue = {
  trackEvent: (name: string, payload?: Record<string, unknown>) => void;
};

const AnalyticsContext = React.createContext<AnalyticsContextValue>({
  trackEvent: () => undefined,
});

function readUtms(searchParams: URLSearchParams): Record<string, string> {
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = searchParams.get(k);
    if (v) out[k] = v;
  }
  return out;
}

function AnalyticsInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const trackEvent = React.useCallback((name: string, payload?: Record<string, unknown>) => {
    const line = { name, payload: payload ?? {}, ts: new Date().toISOString(), path: pathname };
    console.info("[analytics:event]", line);
  }, [pathname]);

  React.useEffect(() => {
    const utm = readUtms(searchParams);
    if (Object.keys(utm).length) {
      try {
        sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
      } catch {
        /* ignore */
      }
    }
    console.info("[analytics:pageview]", { path: pathname, search: searchParams.toString() });
  }, [pathname, searchParams]);

  const value = React.useMemo(() => ({ trackEvent }), [trackEvent]);

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <AnalyticsInner>{children}</AnalyticsInner>
    </Suspense>
  );
}

export function useAnalytics() {
  return React.useContext(AnalyticsContext);
}
