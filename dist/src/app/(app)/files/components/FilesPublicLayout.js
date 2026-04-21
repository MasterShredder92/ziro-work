"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { usePathname } from "next/navigation";
import { FilesPublicChrome } from "./FilesPublicChrome";
export function FilesPublicLayout({ children }) {
    const p = usePathname();
    const variant = (p === null || p === void 0 ? void 0 : p.includes("/files/sign/")) ? "sign" : "share";
    return _jsx(FilesPublicChrome, { variant: variant, children: children });
}
