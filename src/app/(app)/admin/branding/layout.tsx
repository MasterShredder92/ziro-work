import type { ReactNode } from "react";
import { BrandingShell } from "./components/BrandingShell";
import { resolveBrandingDashboardContext } from "./guard";

export const dynamic = "force-dynamic";

export default async function BrandingSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  let tenantLabel = "Workspace";
  let canWrite = false;
  let generatedAt: string | null = null;
  try {
    const ctx = await resolveBrandingDashboardContext();
    tenantLabel = ctx.session.tenantId ?? tenantLabel;
    canWrite = ctx.canWrite;
    generatedAt = new Date().toISOString();
  } catch {
    /* shell still renders; pages show forbidden */
  }

  return (
    <BrandingShell
      tenantLabel={tenantLabel}
      canWrite={canWrite}
      generatedAt={generatedAt}
    >
      {children}
    </BrandingShell>
  );
}
