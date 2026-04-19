import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess } from "@/lib/auth/guards";
import { FORMS_NAV_ITEMS, FormsShell } from "./components";

async function resolvePathname(): Promise<string> {
  try {
    const h = await headers();
    return (
      h.get("x-invoke-path") ??
      h.get("next-url") ??
      h.get("x-pathname") ??
      h.get("referer")?.replace(/^https?:\/\/[^/]+/, "") ??
      ""
    );
  } catch {
    return "";
  }
}

export default async function FormsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = await resolvePathname();
  const isPublicRunner = pathname.includes("/forms/run/");

  if (isPublicRunner) {
    return (
      <div className="min-h-screen w-full bg-[color-mix(in_oklab,var(--z-bg),black_4%)] px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-6 shadow-lg">
          {children}
        </div>
      </div>
    );
  }

  const session = await getSession();
  if (!session) redirect("/login?next=/forms");

  const canRead = can(session.role, "forms.read");
  const isPrivileged =
    session.role === "admin" || session.role === "director";
  if (!canRead || !isPrivileged) {
    redirect("/");
  }

  const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
  await assertTenantAccess(tenantId);

  const allowedNavIds = FORMS_NAV_ITEMS.filter(
    (item) => !item.scope || can(session.role, item.scope),
  ).map((i) => i.id);

  const currentUserName = session.userId ?? null;

  return (
    <FormsShell
      allowedNavIds={allowedNavIds}
      currentUserName={currentUserName}
    >
      {children}
    </FormsShell>
  );
}
