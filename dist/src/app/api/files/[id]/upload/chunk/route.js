import { badRequest, ok, readJson, serverError } from "@/lib/http";
import { uploadNewVersion } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function chunkStore() {
    const g = globalThis;
    if (!g.__ziro_file_chunk_uploads)
        g.__ziro_file_chunk_uploads = new Map();
    return g.__ziro_file_chunk_uploads;
}
function decodeBase64(b64) {
    const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
    return Uint8Array.from(Buffer.from(clean, "base64"));
}
export async function POST(req, { params }) {
    var _a;
    try {
        const { id: fileId } = await params;
        if (!fileId)
            return badRequest("id required");
        const { tenantId, ctx } = await resolveFilesApiContext(req, {
            requireWrite: true,
        });
        const body = await readJson(req);
        if (!body ||
            typeof body.uploadId !== "string" ||
            typeof body.chunkIndex !== "number" ||
            typeof body.totalChunks !== "number" ||
            typeof body.base64 !== "string" ||
            typeof body.fileName !== "string") {
            return badRequest("uploadId, chunkIndex, totalChunks, base64, fileName required");
        }
        const key = `${tenantId}:${fileId}:${body.uploadId}`;
        const session = (() => {
            var _a;
            const existing = chunkStore().get(key);
            if (existing)
                return existing;
            const created = {
                total: body.totalChunks,
                parts: new Array(body.totalChunks),
                fileName: body.fileName,
                mimeType: body.mimeType || "application/octet-stream",
                notes: (_a = body.notes) !== null && _a !== void 0 ? _a : null,
            };
            chunkStore().set(key, created);
            return created;
        })();
        const bytes = decodeBase64(body.base64);
        session.parts[body.chunkIndex] = bytes;
        const filled = session.parts.filter((p) => p !== undefined);
        if (filled.length !== session.total) {
            return ok({
                data: {
                    complete: false,
                    received: filled.length,
                },
            });
        }
        let totalLen = 0;
        for (const p of filled)
            totalLen += p.length;
        const merged = new Uint8Array(totalLen);
        let o = 0;
        for (const p of filled) {
            merged.set(p, o);
            o += p.length;
        }
        chunkStore().delete(key);
        const payload = {
            fileName: session.fileName,
            mimeType: session.mimeType,
            size: merged.length,
            base64: Buffer.from(merged).toString("base64"),
            notes: session.notes,
        };
        const file = await uploadNewVersion(fileId, tenantId, payload, ctx);
        return ok({ data: { complete: true, file } });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
