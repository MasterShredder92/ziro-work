/**
 * Routes opened from the command dashboard that render inside the expanded
 * workspace chrome (dim backdrop + close control). Not exhaustive for the
 * whole app — only primary module surfaces.
 */
const PREFIXES = [
  "/schedule",
  "/crm",
  "/invoices",
  "/lifecycle",
  "/financials",
  "/payroll",
  "/teachers",
  "/publishing-hub",
] as const;

export function isModuleWorkspaceRoute(pathname: string | null): boolean {
  if (!pathname || pathname === "/dashboard") return false;
  return PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
