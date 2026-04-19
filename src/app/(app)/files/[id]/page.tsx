import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listFolders } from "@/lib/files/queries";
import {
  buildContextFromSession,
  createSignedFileUrl,
  getFileSurface,
} from "@/lib/files/service";
import { FileDetailView } from "../components";

export const dynamic = "force-dynamic";

type PageParams = { params: Promise<{ id: string }> };

export default async function FileDetailPage({ params }: PageParams) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/files/${id}`);
  const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
  const ctx = buildContextFromSession({
    role: session.role,
    userId: session.userId,
    tenantId,
  });

  let surface;
  try {
    surface = await getFileSurface(id, tenantId, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "NOT_FOUND") notFound();
    if (message.startsWith("FORBIDDEN")) redirect("/files?error=forbidden");
    throw err;
  }

  let signedUrl = null;
  if (surface.file.storageKey) {
    try {
      signedUrl = await createSignedFileUrl(id, tenantId, ctx);
    } catch {
      signedUrl = null;
    }
  }

  const folders = await listFolders(tenantId);

  return <FileDetailView surface={surface} signedUrl={signedUrl} folders={folders} />;
}
