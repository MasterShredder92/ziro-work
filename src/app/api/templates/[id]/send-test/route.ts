import { NextRequest } from "next/server";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { badRequest, notFound, ok, serverError } from "@/lib/http";
import { sendTestMessage } from "@/lib/templates/service";
import type { TemplateContext } from "@/lib/templates/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

type SendTestBody = {
  targetProfileId?: string;
  versionId?: string;
  context?: TemplateContext;
  tenantId?: string;
  subjectOverride?: string | null;
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("templates.write")();
    const { id } = await ctx.params;
    const payload = ((await req.json().catch(() => null)) ??
      {}) as SendTestBody;

    const targetProfileId =
      (payload.targetProfileId ?? session.userId ?? "").trim();
    if (!targetProfileId) {
      return badRequest("INVALID_BODY", {
        expected: { targetProfileId: "string" },
      });
    }

    const tenantHint = (payload.tenantId ?? session.tenantId ?? "").trim();
    if (tenantHint) await assertTenantAccess(tenantHint);

    const result = await sendTestMessage({
      templateId: id,
      versionId: payload.versionId,
      targetProfileId,
      context: (payload.context ?? {}) as TemplateContext,
      tenantId: tenantHint || undefined,
      subjectOverride: payload.subjectOverride ?? null,
    });

    await logAudit("templates.api.send_test", {
      tenantId: tenantHint,
      profileId: session.userId,
      templateId: id,
      targetProfileId,
      threadId: result.delivery.threadId,
      messageId: result.delivery.messageId,
      simulated: result.delivery.simulated,
      source: "api",
    });
    return ok({ data: result });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    if (
      err instanceof Error &&
      (err.message === "TEMPLATE_NOT_FOUND" ||
        err.message === "TEMPLATE_VERSION_NOT_FOUND")
    ) {
      return notFound(err.message);
    }
    return serverError(err);
  }
}
