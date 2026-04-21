"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
const UTM_KEY = "ziro.utm";
const AnalyticsContext = React.createContext({
    trackEvent: () => undefined,
});
function readUtms(searchParams) {
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const out = {};
    for (const k of keys) {
        const v = searchParams.get(k);
        if (v)
            out[k] = v;
    }
    return out;
}
function AnalyticsInner({ children }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const trackEvent = React.useCallback((name, payload) => {
        const line = { name, payload: payload !== null && payload !== void 0 ? payload : {}, ts: new Date().toISOString(), path: pathname };
        console.info("[analytics:event]", line);
    }, [pathname]);
    React.useEffect(() => {
        const utm = readUtms(searchParams);
        if (Object.keys(utm).length) {
            try {
                sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
            }
            catch (_a) {
                /* ignore */
            }
        }
        console.info("[analytics:pageview]", { path: pathname, search: searchParams.toString() });
    }, [pathname, searchParams]);
    const value = React.useMemo(() => ({ trackEvent }), [trackEvent]);
    return _jsx(AnalyticsContext.Provider, { value: value, children: children });
}
export function AnalyticsProvider({ children }) {
    return (_jsx(Suspense, { fallback: children, children: _jsx(AnalyticsInner, { children: children }) }));
}
export function useAnalytics() {
    return React.useContext(AnalyticsContext);
}
