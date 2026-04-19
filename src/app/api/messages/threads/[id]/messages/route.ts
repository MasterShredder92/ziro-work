import "server-only";
import type { NextRequest } from "next/server";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import {
  badRequest,
  created,
  notFound,
  ok,
  readJson,
  serverError,
} from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  getThreadDetail,
  sendMessageOnThread,
} from "@/lib/messaging/service";
import { createFile, createSignedFileUrl } from "@/lib/files/service";
import type {
  ChannelType,
  MessageAttachment,
  SendMessageInput,
} from "@/lib/messaging/types";
import type { FileUploadPayload } from "@/lib/files/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function forbidden() {
  return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

function isParticipant(
  participantIds: string[],
  profileId: string,
  role: string,
): boolean {
  if (role === "admin" || role === "director") return true;
  return participantIds.includes(profileId);
}

export async function GET(_req: NextRequest, { params }: Params) {
  void _req;
  try {
    const session = await requirePermission("messages.read")();
    await assertTenantAccess(session.tenantId);

    const { id } = await params;
    if (!id) return badRequest("Missing thread id");

    const detail = await getThreadDetail(session.tenantId, id, session.userId);
    if (!detail) return notFound("Thread not found");
    if (!isParticipant(detail.thread.participantIds, session.userId, session.role)) {
      return forbidden();
    }

    await logAudit("messages.thread.messages.list", {
      tenantId: session.tenantId,
      threadId: id,
      count: detail.messages.length,
    });
    return ok({ data: detail.messages });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

type PostBody = {
  body?: string;
  bodyHtml?: string | null;
  subject?: string | null;
  channelType?: ChannelType;
  templateId?: string | null;
  mergeVars?: Record<string, unknown> | null;
  attachments?: MessageAttachment[];
  uploads?: Array<{
    fileName: string;
    mimeType?: string | null;
    size: number;
    base64: string;
    checksum?: string | null;
  }>;
  replyToMessageId?: string | null;
  contextType?: string | null;
  contextId?: string | null;
};

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requirePermission("messages.write")();
    await assertTenantAccess(session.tenantId);

    const { id } = await params;
    if (!id) return badRequest("Missing thread id");

    const detail = await getThreadDetail(session.tenantId, id, session.userId);
    if (!detail) return notFound("Thread not found");
    if (!isParticipant(detail.thread.participantIds, session.userId, session.role)) {
      return forbidden();
    }

    const body = (await readJson<PostBody>(req)) ?? {};
    if (!body.body || typeof body.body !== "string") {
      return badRequest("Message body is required");
    }

    const uploadedAttachments: MessageAttachment[] = [];
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
            mimeType: upload.mimeType ?? "application/octet-stream",
            size: upload.size,
            base64: upload.base64,
            checksum: upload.checksum ?? null,
          } as FileUploadPayload,
          context: {
            role: session.role,
            userId: session.userId,
            profileId: session.userId,
            tenantId: session.tenantId,
          },
        });
        const signed = await createSignedFileUrl(
          file.id,
          session.tenantId,
          {
            role: session.role,
            userId: session.userId,
            profileId: session.userId,
            tenantId: session.tenantId,
          },
          { ttlSeconds: 3600 },
        );
        uploadedAttachments.push({
          id: file.id,
          name: file.name,
          url: signed.url,
          mimeType: file.mimeType,
          sizeBytes: file.size,
        });
      }
    }

    const input: SendMessageInput = {
      threadId: id,
      body: body.body,
      bodyHtml: body.bodyHtml ?? null,
      subject: body.subject ?? null,
      channelType: body.channelType ?? detail.thread.channelType,
      templateId: body.templateId ?? null,
      mergeVars: body.mergeVars ?? null,
      attachments: [
        ...(Array.isArray(body.attachments) ? body.attachments : []),
        ...uploadedAttachments,
      ],
      replyToMessageId: body.replyToMessageId ?? null,
      recipientIds: detail.thread.participantIds.filter(
        (pid) => pid !== session.userId,
      ),
      contextType: body.contextType ?? detail.thread.contextType,
      contextId: body.contextId ?? detail.thread.contextId,
    };

    const result = await sendMessageOnThread(
      session.tenantId,
      session.userId,
      input,
    );
    await logAudit("messages.message.send", {
      tenantId: session.tenantId,
      threadId: id,
      messageId: result.message.id,
    });
    return created({ data: result });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
