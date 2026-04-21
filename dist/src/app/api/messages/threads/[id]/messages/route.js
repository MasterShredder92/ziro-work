import "server-only";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { badRequest, created, notFound, ok, readJson, serverError, } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getThreadDetail, sendMessageOnThread, } from "@/lib/messaging/service";
import { createFile, createSignedFileUrl } from "@/lib/files/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden() {
    return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
    });
}
function isParticipant(participantIds, profileId, role) {
    if (role === "admin" || role === "director")
        return true;
    return participantIds.includes(profileId);
}
export async function GET(_req, { params }) {
    void _req;
    try {
        const session = await requirePermission("messages.read")();
        await assertTenantAccess(session.tenantId);
        const { id } = await params;
        if (!id)
            return badRequest("Missing thread id");
        const detail = await getThreadDetail(session.tenantId, id, session.userId);
        if (!detail)
            return notFound("Thread not found");
        if (!isParticipant(detail.thread.participantIds, session.userId, session.role)) {
            return forbidden();
        }
        await logAudit("messages.thread.messages.list", {
            tenantId: session.tenantId,
            threadId: id,
            count: detail.messages.length,
        });
        return ok({ data: detail.messages });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
export async function POST(req, { params }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        const session = await requirePermission("messages.write")();
        await assertTenantAccess(session.tenantId);
        const { id } = await params;
        if (!id)
            return badRequest("Missing thread id");
        const detail = await getThreadDetail(session.tenantId, id, session.userId);
        if (!detail)
            return notFound("Thread not found");
        if (!isParticipant(detail.thread.participantIds, session.userId, session.role)) {
            return forbidden();
        }
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        if (!body.body || typeof body.body !== "string") {
            return badRequest("Message body is required");
        }
        const uploadedAttachments = [];
        if (Array.isArray(body.uploads) && body.uploads.length > 0) {
            for (const upload of body.uploads) {
                const file = await createFile({
                    tenantId: session.tenantId,
                    input: {
                        name: upload.fileName,
                        folderId: null,
                    },
                    upload: {
                        fileName: upload.fileName,
                        mimeType: (_b = upload.mimeType) !== null && _b !== void 0 ? _b : "application/octet-stream",
                        size: upload.size,
                        base64: upload.base64,
                        checksum: (_c = upload.checksum) !== null && _c !== void 0 ? _c : null,
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
        const input = {
            threadId: id,
            body: body.body,
            bodyHtml: (_d = body.bodyHtml) !== null && _d !== void 0 ? _d : null,
            subject: (_e = body.subject) !== null && _e !== void 0 ? _e : null,
            channelType: (_f = body.channelType) !== null && _f !== void 0 ? _f : detail.thread.channelType,
            templateId: (_g = body.templateId) !== null && _g !== void 0 ? _g : null,
            mergeVars: (_h = body.mergeVars) !== null && _h !== void 0 ? _h : null,
            attachments: [
                ...(Array.isArray(body.attachments) ? body.attachments : []),
                ...uploadedAttachments,
            ],
            replyToMessageId: (_j = body.replyToMessageId) !== null && _j !== void 0 ? _j : null,
            recipientIds: detail.thread.participantIds.filter((pid) => pid !== session.userId),
            contextType: (_k = body.contextType) !== null && _k !== void 0 ? _k : detail.thread.contextType,
            contextId: (_l = body.contextId) !== null && _l !== void 0 ? _l : detail.thread.contextId,
        };
        const result = await sendMessageOnThread(session.tenantId, session.userId, input);
        await logAudit("messages.message.send", {
            tenantId: session.tenantId,
            threadId: id,
            messageId: result.message.id,
        });
        return created({ data: result });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
