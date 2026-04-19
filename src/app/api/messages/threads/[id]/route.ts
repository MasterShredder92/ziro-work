import "server-only";
import type { NextRequest } from "next/server";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  readJson,
  serverError,
} from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  addParticipantToThread,
  archiveThread,
  deleteThread,
  getThreadDetail,
  markThreadRead,
  removeParticipantFromThread,
} from "@/lib/messaging/service";

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
    await markThreadRead(session.tenantId, id, session.userId);
    await logAudit("messages.thread.view", {
      tenantId: session.tenantId,
      threadId: id,
    });
    return ok({ data: detail });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

type PatchBody = {
  action?: "archive" | "markRead" | "addParticipant" | "removeParticipant";
  profileId?: string;
  participantId?: string;
};

export async function PATCH(req: NextRequest, { params }: Params) {
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

    const body = (await readJson<PatchBody>(req)) ?? {};
    switch (body.action) {
      case "archive": {
        await archiveThread(session.tenantId, id);
        await logAudit("messages.thread.archive", {
          tenantId: session.tenantId,
          threadId: id,
        });
        return ok({ data: { threadId: id, status: "archived" } });
      }
      case "markRead": {
        await markThreadRead(session.tenantId, id, session.userId);
        return ok({ data: { threadId: id, read: true } });
      }
      case "addParticipant": {
        if (!body.profileId) return badRequest("Missing profileId");
        const participants = await addParticipantToThread(
          session.tenantId,
          id,
          body.profileId,
        );
        await logAudit("messages.thread.participant.add", {
          tenantId: session.tenantId,
          threadId: id,
          profileId: body.profileId,
        });
        return ok({ data: { participants } });
      }
      case "removeParticipant": {
        if (!body.participantId) return badRequest("Missing participantId");
        const participants = await removeParticipantFromThread(
          session.tenantId,
          id,
          body.participantId,
        );
        await logAudit("messages.thread.participant.remove", {
          tenantId: session.tenantId,
          threadId: id,
          participantId: body.participantId,
        });
        return ok({ data: { participants } });
      }
      default:
        return badRequest("Unsupported action");
    }
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  void _req;
  try {
    const session = await requirePermission("messages.admin")();
    await assertTenantAccess(session.tenantId);

    const { id } = await params;
    if (!id) return badRequest("Missing thread id");

    await deleteThread(session.tenantId, id);
    await logAudit("messages.thread.delete", {
      tenantId: session.tenantId,
      threadId: id,
    });
    return noContent();
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
