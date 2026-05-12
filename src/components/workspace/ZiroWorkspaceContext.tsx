"use client";

import * as React from "react";
import type { ShellLocation } from "@/lib/workspace/getWorkspaceShellData";

export type ZiroWorkspaceValue = {
  schoolName: string;
  locations: ShellLocation[];
  selectedLocId: string | null;
  setSelectedLocId: React.Dispatch<React.SetStateAction<string | null>>;
  headerFocusLabel: string;
};

const ZiroWorkspaceContext = React.createContext<ZiroWorkspaceValue | null>(null);

export function ZiroWorkspaceProvider({
  schoolName,
  locations,
  children,
}: {
  schoolName: string;
  locations: ShellLocation[];
  children: React.ReactNode;
}) {
  const [selectedLocId, setSelectedLocId] = React.useState<string | null>(null);

  const loc = selectedLocId ? locations.find((l) => l.id === selectedLocId) : undefined;
  const headerFocusLabel =
    loc?.shortName?.trim() || loc?.name?.trim() || schoolName;

  const value = React.useMemo(
    () => ({
      schoolName,
      locations,
      selectedLocId,
      setSelectedLocId,
      headerFocusLabel,
    }),
    [schoolName, locations, selectedLocId, headerFocusLabel],
  );

  return <ZiroWorkspaceContext.Provider value={value}>{children}</ZiroWorkspaceContext.Provider>;
}

export function useZiroWorkspace(): ZiroWorkspaceValue {
  const ctx = React.useContext(ZiroWorkspaceContext);
  if (!ctx) {
    throw new Error("useZiroWorkspace must be used within ZiroWorkspaceProvider");
  }
  return ctx;
}
