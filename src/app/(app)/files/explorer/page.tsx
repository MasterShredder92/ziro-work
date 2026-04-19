import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listFiles, listFolders } from "@/lib/files/queries";
import { FilesExplorerRuntimeProvider } from "../context/FilesExplorerRuntimeContext";
import { FileExplorerClient } from "./FileExplorerClient";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ folderId?: string; upload?: string }>;

export default async function FilesExplorerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/files/explorer");
  const sp = (await searchParams) ?? {};
  const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
  const [folders, files] = await Promise.all([
    listFolders(tenantId),
    listFiles(tenantId, sp.folderId ? { folderId: sp.folderId } : {}),
  ]);

  const canWrite = can(session.role, "files.write");
  const permissionContext = {
    role: session.role,
    userId: session.userId,
    profileId: session.userId,
    tenantId,
  };
  return (
    <FilesExplorerRuntimeProvider value={{ folders, permissionContext }}>
      <FileExplorerClient
        folders={folders}
        files={files}
        initialFolderId={sp.folderId ?? null}
        initialUpload={sp.upload === "1"}
        canWrite={canWrite}
      />
    </FilesExplorerRuntimeProvider>
  );
}
