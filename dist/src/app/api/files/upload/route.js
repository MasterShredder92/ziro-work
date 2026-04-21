import { z } from "zod";
import { createFile, createSignedFileUrl } from "@/lib/files/service";
import { badRequest, created, serverError } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const UploadSchema = z.object({
    tenantId: z.string().min(1),
    name: z.string().min(1),
    role: z.string().optional(),
    userId: z.string().optional(),
    folderId: z.string().nullable().optional(),
    mimeType: z.string().optional(),
    bytesBase64: z.string().optional(),
});
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const body = await req.json();
        const parsed = UploadSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid upload payload");
        }
        const payload = parsed.data;
        const file = await createFile({
            tenantId: payload.tenantId,
            input: {
                name: payload.name,
                folderId: (_a = payload.folderId) !== null && _a !== void 0 ? _a : null,
            },
            upload: payload.bytesBase64
                ? {
                    fileName: payload.name,
                    mimeType: (_b = payload.mimeType) !== null && _b !== void 0 ? _b : "application/octet-stream",
                    size: Math.floor((payload.bytesBase64.length * 3) / 4),
                    base64: payload.bytesBase64,
                }
                : undefined,
            context: {
                source: "api",
                role: (_c = payload.role) !== null && _c !== void 0 ? _c : "admin",
                userId: (_d = payload.userId) !== null && _d !== void 0 ? _d : "system",
                profileId: (_e = payload.userId) !== null && _e !== void 0 ? _e : "system",
                tenantId: payload.tenantId,
            },
        });
        const signedUrl = await createSignedFileUrl(file.id, payload.tenantId, {
            role: (_f = payload.role) !== null && _f !== void 0 ? _f : "admin",
            userId: (_g = payload.userId) !== null && _g !== void 0 ? _g : "system",
            profileId: (_h = payload.userId) !== null && _h !== void 0 ? _h : "system",
            tenantId: payload.tenantId,
        }, { ttlSeconds: 3600 });
        return created({
            data: {
                file,
                signedUrl,
                metadata: {
                    fileId: file.id,
                    mimeType: file.mimeType,
                    size: file.size,
                },
            },
        });
    }
    catch (error) {
        return serverError(error);
    }
}
