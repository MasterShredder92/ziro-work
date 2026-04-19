"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FilesPublicChrome } from "./FilesPublicChrome";

export function FilesPublicLayout({ children }: { children: ReactNode }) {
  const p = usePathname();
  const variant = p?.includes("/files/sign/") ? "sign" : "share";
  return <FilesPublicChrome variant={variant}>{children}</FilesPublicChrome>;
}
