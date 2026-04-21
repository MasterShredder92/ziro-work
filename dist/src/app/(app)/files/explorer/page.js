import { jsx as _jsx } from "react/jsx-runtime";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listFiles, listFolders } from "@/lib/files/queries";
import { FilesExplorerRuntimeProvider } from "../context/FilesExplorerRuntimeContext";
import { FileExplorerClient } from "./FileExplorerClient";
export const dynamic = "force-dynamic";
export default async function FilesExplorerPage({ searchParams, }) {
    var _a, _b, _c;
    const session = await getSession();
    if (!session)
        redirect("/login?next=/files/explorer");
    const sp = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const tenantId = ((_b = session.tenantId) === null || _b === void 0 ? void 0 : _b.trim()) || DEFAULT_TENANT_ID;
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
    return (_jsx(FilesExplorerRuntimeProvider, { value: { folders, permissionContext }, children: _jsx(FileExplorerClient, { folders: folders, files: files, initialFolderId: (_c = sp.folderId) !== null && _c !== void 0 ? _c : null, initialUpload: sp.upload === "1", canWrite: canWrite }) }));
}
