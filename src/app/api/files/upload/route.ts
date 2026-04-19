import { NextRequest } from "next/server";
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

export async function POST(req: NextRequest) {
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
        folderId: payload.folderId ?? null,
      },
      upload: payload.bytesBase64
        ? {
            fileName: payload.name,
            mimeType: payload.mimeType ?? "application/octet-stream",
            size: Math.floor((payload.bytesBase64.length * 3) / 4),
            base64: payload.bytesBase64,
          }
        : undefined,
      context: {
        source: "api",
        role: payload.role ?? "admin",
        userId: payload.userId ?? "system",
        profileId: payload.userId ?? "system",
        tenantId: payload.tenantId,
      },
    });
    const signedUrl = await createSignedFileUrl(
      file.id,
      payload.tenantId,
      {
        role: payload.role ?? "admin",
        userId: payload.userId ?? "system",
        profileId: payload.userId ?? "system",
        tenantId: payload.tenantId,
      },
      { ttlSeconds: 3600 },
    );
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
  } catch (error) {
    return serverError(error);
  }
}
