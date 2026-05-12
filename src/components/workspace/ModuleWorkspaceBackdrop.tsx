"use client";

import { usePathname } from "next/navigation";
import { isModuleWorkspaceRoute } from "@/components/workspace/moduleShellRoutes";

/**
 * Module routes: same neutral black + static micro-grid as the global body (no blue wash).
 */
export function ModuleWorkspaceBackdrop() {
  const pathname = usePathname();
  if (!isModuleWorkspaceRoute(pathname)) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 bg-[var(--z-bg)]"
      aria-hidden
      style={{
        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        backgroundAttachment: "fixed",
      }}
    />
  );
}
