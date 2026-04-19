import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  FILES_NAV_ITEMS,
  FilesPublicLayout,
  FilesShell,
  FilesToastHost,
} from "./components";

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

export default async function FilesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = await resolvePathname();
  const isPublic =
    pathname.includes("/files/share/") ||
    pathname.includes("/files/sign/");

  if (isPublic) {
    return (
      <FilesPublicLayout>
        <FilesToastHost />
        <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 shadow-lg md:p-6">
          {children}
        </div>
      </FilesPublicLayout>
    );
  }

  const session = await getSession();
  if (!session) redirect("/login?next=/files");

  const canRead = can(session.role, "files.read");
  if (!canRead) redirect("/");

  const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
  await assertTenantAccess(tenantId);

  const allowedNavIds = FILES_NAV_ITEMS.filter(
    (item) => !item.scope || can(session.role, item.scope),
  ).map((i) => i.id);

  const currentUserName = session.userId ?? null;

  return (
    <FilesShell
      allowedNavIds={allowedNavIds}
      currentUserName={currentUserName}
    >
      {children}
    </FilesShell>
  );
}
