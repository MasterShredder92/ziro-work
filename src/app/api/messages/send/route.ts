import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendMessage } from "@/lib/messaging/messageOps";
import { createFile, createSignedFileUrl } from "@/lib/files/service";
import type { FileUploadPayload } from "@/lib/files/types";
import type { MessageAttachment } from "@/lib/messaging/types";

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
    .array(
      z.object({
        fileName: z.string().min(1),
        mimeType: z.string().optional(),
        size: z.number().int().nonnegative(),
        base64: z.string().min(1),
        checksum: z.string().optional(),
      }),
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid send payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const attachmentPayload: MessageAttachment[] = [];
    if (parsed.data.uploads?.length) {
      for (const upload of parsed.data.uploads) {
        const file = await createFile({
          tenantId: parsed.data.tenantId,
          input: { name: upload.fileName, folderId: null },
          upload: {
            fileName: upload.fileName,
            mimeType: upload.mimeType ?? "application/octet-stream",
            size: upload.size,
            base64: upload.base64,
            checksum: upload.checksum ?? null,
          } as FileUploadPayload,
          context: {
            role: parsed.data.role ?? "admin",
            userId: parsed.data.senderId,
            profileId: parsed.data.senderId,
            tenantId: parsed.data.tenantId,
          },
        });
        const signed = await createSignedFileUrl(
          file.id,
          parsed.data.tenantId,
          {
            role: parsed.data.role ?? "admin",
            userId: parsed.data.senderId,
            profileId: parsed.data.senderId,
            tenantId: parsed.data.tenantId,
          },
          { ttlSeconds: 3600 },
        );
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
      channelType: parsed.data.channelType ?? "in_app",
      attachments: attachmentPayload,
    });
    return NextResponse.json({ data: sent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
