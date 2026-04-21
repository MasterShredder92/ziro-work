import "server-only";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { sendMessage } from "@/lib/messaging/messageOps";
import { getThread } from "@/lib/messaging/queries";
import { createFile, createSignedFileUrl } from "@/lib/files/service";
import { badRequest, ok, readJson, serverError } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const session = await requirePermission("messages.write")();
        await assertTenantAccess(session.tenantId);
        const payload = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        const body = ((_b = payload.body) !== null && _b !== void 0 ? _b : "").trim();
        if (!body)
            return badRequest("Missing message body");
        let targetId = ((_c = payload.targetId) !== null && _c !== void 0 ? _c : "").trim();
        const threadId = ((_d = payload.threadId) !== null && _d !== void 0 ? _d : "").trim();
        if (!targetId && threadId) {
            const thread = await getThread(threadId);
            if (!thread)
                return badRequest("Thread not found");
            if (thread.conversation.tenant_id !== session.tenantId &&
                session.role !== "admin") {
                return badRequest("Forbidden");
            }
            const participants = thread.participants.map((p) => p.profileId);
            if (!participants.includes(session.userId) && session.role !== "admin") {
                return badRequest("Forbidden");
            }
            targetId =
                (_e = participants.find((id) => id !== session.userId)) !== null && _e !== void 0 ? _e : thread.conversation.profile_id;
        }
        if (!targetId)
            return badRequest("Missing target recipient");
        const uploadedAttachments = [];
        if (Array.isArray(payload.uploads) && payload.uploads.length > 0) {
            for (const upload of payload.uploads) {
                const file = await createFile({
                    tenantId: session.tenantId,
                    input: { name: upload.fileName, folderId: null },
                    upload: {
                        fileName: upload.fileName,
                        mimeType: (_f = upload.mimeType) !== null && _f !== void 0 ? _f : "application/octet-stream",
                        size: upload.size,
                        base64: upload.base64,
                        checksum: (_g = upload.checksum) !== null && _g !== void 0 ? _g : null,
                    },
                    context: {
                        role: session.role,
                        userId: session.userId,
                        profileId: session.userId,
                        tenantId: session.tenantId,
                    },
                });
                const signed = await createSignedFileUrl(file.id, session.tenantId, {
                    role: session.role,
                    userId: session.userId,
                    profileId: session.userId,
                    tenantId: session.tenantId,
                }, { ttlSeconds: 3600 });
                uploadedAttachments.push({
                    id: file.id,
                    name: file.name,
                    url: signed.url,
                    mimeType: file.mimeType,
                    sizeBytes: file.size,
                });
            }
        }
        const detail = await sendMessage(session.tenantId, session.userId, {
            threadId: threadId || undefined,
            recipientIds: [targetId],
            body,
            channelType: "in_app",
            attachments: uploadedAttachments,
        });
        return ok({ thread: detail.thread, data: detail });
    }
    catch (err) {
        if (err instanceof Error) {
            if (err.message === "FORBIDDEN")
                return badRequest("Forbidden");
            if (err.message === "EMPTY_BODY")
                return badRequest("Empty body");
            if (err.message === "MISSING_TARGET")
                return badRequest("Missing recipient");
        }
        return serverError(err);
    }
}
