import "server-only";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/guards";
import { assertTenantAccess } from "@/lib/auth/guards";
import { MessagingToastHost } from "./components/MessagingToastHost";

export const dynamic = "force-dynamic";

export default async function MessagesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/messages");
  }

  await requirePermission("messages.read")();
  await assertTenantAccess(session.tenantId);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[var(--z-bg)] p-4 sm:p-6">
      {children}
      <MessagingToastHost />
    </div>
  );
}
