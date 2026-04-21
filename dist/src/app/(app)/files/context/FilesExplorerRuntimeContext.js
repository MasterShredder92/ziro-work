"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
const FilesExplorerRuntimeContext = createContext(null);
export function FilesExplorerRuntimeProvider({ value, children, }) {
    return (_jsx(FilesExplorerRuntimeContext.Provider, { value: value, children: children }));
}
export function useFilesExplorerRuntimeOptional() {
    return useContext(FilesExplorerRuntimeContext);
}
