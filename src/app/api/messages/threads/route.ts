import "server-only";
import type { NextRequest } from "next/server";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  createThread,
  listThreadsForUser,
} from "@/lib/messaging/service";
import type {
  ChannelType,
  ThreadFilter,
  ThreadStatus,
} from "@/lib/messaging/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden() {
  return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("messages.read")();
    await assertTenantAccess(session.tenantId);

    const url = new URL(req.url);
    const filter: ThreadFilter = {
      status: (url.searchParams.get("status") as ThreadStatus | null) ?? undefined,
      channelType:
        (url.searchParams.get("channelType") as ChannelType | null) ??
        undefined,
      contextType: url.searchParams.get("contextType") ?? undefined,
      contextId: url.searchParams.get("contextId") ?? undefined,
      search: url.searchParams.get("q") ?? undefined,
      limit: url.searchParams.get("limit")
        ? Number(url.searchParams.get("limit"))
        : undefined,
      offset: url.searchParams.get("offset")
        ? Number(url.searchParams.get("offset"))
        : undefined,
    };

    const result = await listThreadsForUser(
      session.tenantId,
      session.userId,
      filter,
    );
    await logAudit("messages.threads.list", {
      tenantId: session.tenantId,
      count: result.threads.length,
    });
    return ok({ data: result });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

type CreateThreadBody = {
  subject?: string | null;
  channelType?: ChannelType;
  participantIds?: string[];
  contextType?: string | null;
  contextId?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("messages.write")();
    await assertTenantAccess(session.tenantId);

    const body = (await readJson<CreateThreadBody>(req)) ?? {};
    const participantIds = Array.isArray(body.participantIds)
      ? body.participantIds.filter(
          (id): id is string => typeof id === "string" && id.length > 0,
        )
      : [];
    if (participantIds.length === 0) {
      return badRequest("At least one recipient is required");
    }

    const thread = await createThread(session.tenantId, session.userId, {
      subject: body.subject ?? null,
      channelType: body.channelType ?? "in_app",
      participantIds,
      contextType: body.contextType ?? null,
      contextId: body.contextId ?? null,
    });

    await logAudit("messages.threads.create", {
      tenantId: session.tenantId,
      threadId: thread.id,
    });

    return created({ data: thread });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
