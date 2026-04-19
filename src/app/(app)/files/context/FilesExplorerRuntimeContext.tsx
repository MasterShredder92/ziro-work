"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FileFolder, FilePermissionContext } from "@/lib/files/types";

export type FilesExplorerRuntimeValue = {
  folders: FileFolder[];
  permissionContext: FilePermissionContext | null;
};

const FilesExplorerRuntimeContext = createContext<FilesExplorerRuntimeValue | null>(
  null,
);

export function FilesExplorerRuntimeProvider({
  value,
  children,
}: {
  value: FilesExplorerRuntimeValue;
  children: ReactNode;
}) {
  return (
    <FilesExplorerRuntimeContext.Provider value={value}>
      {children}
    </FilesExplorerRuntimeContext.Provider>
  );
}

export function useFilesExplorerRuntimeOptional(): FilesExplorerRuntimeValue | null {
  return useContext(FilesExplorerRuntimeContext);
}
