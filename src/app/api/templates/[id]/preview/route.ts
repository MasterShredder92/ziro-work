import { NextRequest } from "next/server";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { badRequest, notFound, ok, serverError } from "@/lib/http";
import { renderTemplateForContext } from "@/lib/templates/service";
import type { TemplateContext } from "@/lib/templates/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

type PreviewBody = {
  versionId?: string;
  context?: TemplateContext;
  tenantId?: string;
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("templates.read")();
    const { id } = await ctx.params;
    const payload = ((await req.json().catch(() => null)) ??
      {}) as PreviewBody;

    const tenantHint = (payload.tenantId ?? session.tenantId ?? "").trim();
    if (tenantHint) await assertTenantAccess(tenantHint);

    const rendered = await renderTemplateForContext({
      templateId: id,
      versionId: payload.versionId,
      context: (payload.context ?? {}) as TemplateContext,
      tenantId: tenantHint || undefined,
    });

    await logAudit("templates.api.preview", {
      tenantId: tenantHint,
      profileId: session.userId,
      templateId: id,
      versionId: payload.versionId ?? null,
      missing: rendered.missingMergeFields.length,
      source: "api",
    });
    return ok({ data: rendered });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    if (
      err instanceof Error &&
      (err.message === "TEMPLATE_NOT_FOUND" ||
        err.message === "TEMPLATE_VERSION_NOT_FOUND")
    ) {
      return notFound(err.message);
    }
    if (err instanceof Error && err.message === "INVALID_BODY") {
      return badRequest("INVALID_BODY");
    }
    return serverError(err);
  }
}
