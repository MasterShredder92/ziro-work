"use client";

import * as React from "react";

export type TenantOption = {
  id: string;
  name: string;
};

const SELECTED_LOCATION_STORAGE_KEY = "ziro:selected-location-id";

export type TenantUiContextValue = {
  tenantId: string;
  locations: TenantOption[];
  locationId: string;
  currentLocation: TenantOption | null;
  setLocationId: (id: string) => void;
};

export const TenantUiContext = React.createContext<TenantUiContextValue | null>(null);

export type TenantUiProviderProps = {
  children: React.ReactNode;
  defaultTenantId: string;
  defaultLocationId?: string;
};

export function TenantUiProvider({
  children,
  defaultTenantId,
  defaultLocationId,
}: TenantUiProviderProps) {
  const [tenantId, setTenantId] = React.useState(defaultTenantId);
  const [locations, setLocations] = React.useState<TenantOption[]>([]);
  const [locationId, setLocationIdState] = React.useState<string>("");
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
    if (!isClient) return;

    let cancelled = false;
    const controller = new AbortController();

    const loadLocations = async () => {
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

        const payload = (await res.json()) as {
          data?: TenantOption[];
          tenantId?: string;
        };

        if (cancelled) return;

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

        const trimmedQuery = fromQuery?.trim() ?? "";
        const trimmedStorage = fromStorage?.trim() ?? "";
        const trimmedDefault = defaultLocationId?.trim() ?? "";

        const hasId = (id: string) => nextLocations.some((l) => l.id === id);

        const preferred =
          (trimmedQuery && hasId(trimmedQuery) && trimmedQuery) ||
          (trimmedStorage && hasId(trimmedStorage) && trimmedStorage) ||
          (trimmedDefault && hasId(trimmedDefault) && trimmedDefault) ||
          "";

        const fallback = nextLocations[0]?.id ?? "";

        setLocationIdState(preferred || fallback);
      } catch {
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
    if (!isClient) return;
    if (!locationId) return;
    window.localStorage.setItem(SELECTED_LOCATION_STORAGE_KEY, locationId);
  }, [isClient, locationId]);

  const setLocationId = React.useCallback(
    (id: string) => {
      if (!id) return;
      if (!locations.some((l) => l.id === id)) return;
      setLocationIdState(id);
    },
    [locations],
  );

  const currentLocation = React.useMemo(
    () => locations.find((l) => l.id === locationId) ?? null,
    [locationId, locations],
  );

  const value = React.useMemo(
    () => ({
      tenantId,
      locations,
      locationId,
      currentLocation,
      setLocationId,
    }),
    [tenantId, locations, locationId, currentLocation, setLocationId],
  );

  return <TenantUiContext.Provider value={value}>{children}</TenantUiContext.Provider>;
}

export function useTenantUi() {
  const ctx = React.useContext(TenantUiContext);
  if (!ctx) throw new Error("useTenantUi must be used within TenantUiProvider");
  return ctx;
}
