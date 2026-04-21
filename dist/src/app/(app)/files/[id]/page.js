import { jsx as _jsx } from "react/jsx-runtime";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listFolders } from "@/lib/files/queries";
import { buildContextFromSession, createSignedFileUrl, getFileSurface, } from "@/lib/files/service";
import { FileDetailView } from "../components";
export const dynamic = "force-dynamic";
export default async function FileDetailPage({ params }) {
    var _a;
    const { id } = await params;
    const session = await getSession();
    if (!session)
        redirect(`/login?next=/files/${id}`);
    const tenantId = ((_a = session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const ctx = buildContextFromSession({
        role: session.role,
        userId: session.userId,
        tenantId,
    });
    let surface;
    try {
        surface = await getFileSurface(id, tenantId, ctx);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message === "NOT_FOUND")
            notFound();
        if (message.startsWith("FORBIDDEN"))
            redirect("/files?error=forbidden");
        throw err;
    }
    let signedUrl = null;
    if (surface.file.storageKey) {
        try {
            signedUrl = await createSignedFileUrl(id, tenantId, ctx);
        }
        catch (_b) {
            signedUrl = null;
        }
    }
    const folders = await listFolders(tenantId);
    return _jsx(FileDetailView, { surface: surface, signedUrl: signedUrl, folders: folders });
}
