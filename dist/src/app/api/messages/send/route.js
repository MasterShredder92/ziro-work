import { NextResponse } from "next/server";
import { z } from "zod";
import { sendMessage } from "@/lib/messaging/messageOps";
import { createFile, createSignedFileUrl } from "@/lib/files/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const SendSchema = z.object({
    tenantId: z.string().min(1),
    senderId: z.string().min(1),
    role: z.string().optional(),
    recipientIds: z.array(z.string().min(1)).min(1),
    body: z.string().min(1),
    channelType: z.enum(["in_app", "email", "sms"]).optional(),
    uploads: z
        .array(z.object({
        fileName: z.string().min(1),
        mimeType: z.string().optional(),
        size: z.number().int().nonnegative(),
        base64: z.string().min(1),
        checksum: z.string().optional(),
    }))
        .optional(),
});
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f;
    try {
        const body = await req.json();
        const parsed = SendSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid send payload", details: parsed.error.flatten() }, { status: 400 });
        }
        const attachmentPayload = [];
        if ((_a = parsed.data.uploads) === null || _a === void 0 ? void 0 : _a.length) {
            for (const upload of parsed.data.uploads) {
                const file = await createFile({
                    tenantId: parsed.data.tenantId,
                    input: { name: upload.fileName, folderId: null },
                    upload: {
                        fileName: upload.fileName,
                        mimeType: (_b = upload.mimeType) !== null && _b !== void 0 ? _b : "application/octet-stream",
                        size: upload.size,
                        base64: upload.base64,
                        checksum: (_c = upload.checksum) !== null && _c !== void 0 ? _c : null,
                    },
                    context: {
                        role: (_d = parsed.data.role) !== null && _d !== void 0 ? _d : "admin",
                        userId: parsed.data.senderId,
                        profileId: parsed.data.senderId,
                        tenantId: parsed.data.tenantId,
                    },
                });
                const signed = await createSignedFileUrl(file.id, parsed.data.tenantId, {
                    role: (_e = parsed.data.role) !== null && _e !== void 0 ? _e : "admin",
                    userId: parsed.data.senderId,
                    profileId: parsed.data.senderId,
                    tenantId: parsed.data.tenantId,
                }, { ttlSeconds: 3600 });
                attachmentPayload.push({
                    id: file.id,
                    name: file.name,
                    url: signed.url,
                    mimeType: file.mimeType,
                    sizeBytes: file.size,
                });
            }
        }
        const sent = await sendMessage(parsed.data.tenantId, parsed.data.senderId, {
            recipientIds: parsed.data.recipientIds,
            body: parsed.data.body,
            channelType: (_f = parsed.data.channelType) !== null && _f !== void 0 ? _f : "in_app",
            attachments: attachmentPayload,
        });
        return NextResponse.json({ data: sent }, { status: 201 });
    }
    catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
    }
}
