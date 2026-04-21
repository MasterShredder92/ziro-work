"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
const SELECTED_LOCATION_STORAGE_KEY = "ziro:selected-location-id";
export const TenantUiContext = React.createContext(null);
export function TenantUiProvider({ children, defaultTenantId, defaultLocationId, }) {
    const [tenantId, setTenantId] = React.useState(defaultTenantId);
    const [locations, setLocations] = React.useState([]);
    const [locationId, setLocationIdState] = React.useState("");
    const [isClient, setIsClient] = React.useState(false);
    // Ensure we only touch window/localStorage on the client
    React.useEffect(() => {
        setIsClient(true);
    }, []);
    // Keep tenantId in sync with server-provided default
    React.useEffect(() => {
        setTenantId(defaultTenantId);
    }, [defaultTenantId]);
    React.useEffect(() => {
        if (!isClient)
            return;
        let cancelled = false;
        const controller = new AbortController();
        const loadLocations = async () => {
            var _a, _b, _c, _d, _e;
            try {
                const res = await fetch("/api/locations/options", {
                    cache: "no-store",
                    signal: controller.signal,
                });
                if (!res.ok) {
                    if (!cancelled) {
                        setLocations([]);
                        setLocationIdState("");
                    }
                    return;
                }
                const payload = (await res.json());
                if (cancelled)
                    return;
                const nextLocations = Array.isArray(payload.data) ? payload.data : [];
                setLocations(nextLocations);
                if (payload.tenantId && payload.tenantId.trim().length > 0) {
                    setTenantId(payload.tenantId.trim());
                }
                // If there are no locations at all, we can't pick one
                if (nextLocations.length === 0) {
                    setLocationIdState("");
                    return;
                }
                const fromStorage = window.localStorage.getItem(SELECTED_LOCATION_STORAGE_KEY);
                const fromQuery = new URLSearchParams(window.location.search).get("locationId");
                const trimmedQuery = (_a = fromQuery === null || fromQuery === void 0 ? void 0 : fromQuery.trim()) !== null && _a !== void 0 ? _a : "";
                const trimmedStorage = (_b = fromStorage === null || fromStorage === void 0 ? void 0 : fromStorage.trim()) !== null && _b !== void 0 ? _b : "";
                const trimmedDefault = (_c = defaultLocationId === null || defaultLocationId === void 0 ? void 0 : defaultLocationId.trim()) !== null && _c !== void 0 ? _c : "";
                const hasId = (id) => nextLocations.some((l) => l.id === id);
                const preferred = (trimmedQuery && hasId(trimmedQuery) && trimmedQuery) ||
                    (trimmedStorage && hasId(trimmedStorage) && trimmedStorage) ||
                    (trimmedDefault && hasId(trimmedDefault) && trimmedDefault) ||
                    "";
                const fallback = (_e = (_d = nextLocations[0]) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : "";
                setLocationIdState(preferred || fallback);
            }
            catch (_f) {
                if (!cancelled) {
                    setLocations([]);
                    setLocationIdState("");
                }
            }
        };
        void loadLocations();
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [defaultLocationId, isClient]);
    // Persist selected location on the client
    React.useEffect(() => {
        if (!isClient)
            return;
        if (!locationId)
            return;
        window.localStorage.setItem(SELECTED_LOCATION_STORAGE_KEY, locationId);
    }, [isClient, locationId]);
    const setLocationId = React.useCallback((id) => {
        if (!id)
            return;
        if (!locations.some((l) => l.id === id))
            return;
        setLocationIdState(id);
    }, [locations]);
    const currentLocation = React.useMemo(() => { var _a; return (_a = locations.find((l) => l.id === locationId)) !== null && _a !== void 0 ? _a : null; }, [locationId, locations]);
    const value = React.useMemo(() => ({
        tenantId,
        locations,
        locationId,
        currentLocation,
        setLocationId,
    }), [tenantId, locations, locationId, currentLocation, setLocationId]);
    return _jsx(TenantUiContext.Provider, { value: value, children: children });
}
export function useTenantUi() {
    const ctx = React.useContext(TenantUiContext);
    if (!ctx)
        throw new Error("useTenantUi must be used within TenantUiProvider");
    return ctx;
}
