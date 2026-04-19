import { getSession } from "@/lib/auth/session";
import { notFound, redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getFile } from "@/lib/files/queries";
import { SignatureRequestEditor } from "../../components";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ fileId?: string }>;

export default async function NewSignatureRequestPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/files/signatures/new");
  const canSign = can(session.role, "files.sign");
  if (!canSign) redirect("/files?error=forbidden");

  const sp = await searchParams;
  const fileId = sp?.fileId?.trim();
  if (!fileId) {
    redirect("/files/explorer");
  }
  const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
  const file = await getFile(fileId, tenantId);
  if (!file) notFound();

  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Files &amp; Documents
        </div>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
          New signature request
        </h1>
        <p className="mt-1 text-sm text-[var(--z-muted)]">
          Request signatures on <span className="text-[var(--z-fg)]">{file.name}</span>.
        </p>
      </header>
      <SignatureRequestEditor file={file} canSign={canSign} />
    </div>
  );
}
