import { NextRequest } from "next/server";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { notFound, ok, serverError } from "@/lib/http";
import {
  getTemplateVersionForTenant,
  restoreTemplateVersionForTenant,
} from "@/lib/templates/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const session = await requirePermission("templates.read")();
    const { id, versionId } = await ctx.params;
    const url = new URL(req.url);
    const tenantHint = (url.searchParams.get("tenantId") ?? session.tenantId).trim();
    if (tenantHint) await assertTenantAccess(tenantHint);

    const version = await getTemplateVersionForTenant(
      id,
      versionId,
      tenantHint || undefined,
    );
    if (!version) return notFound("TEMPLATE_VERSION_NOT_FOUND");

    await logAudit("templates.api.versions.get", {
      tenantId: version.tenantId,
      profileId: session.userId,
      templateId: version.templateId,
      versionId: version.id,
      source: "api",
    });
    return ok({ data: version });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    if (err instanceof Error && err.message === "TEMPLATE_NOT_FOUND") {
      return notFound("TEMPLATE_NOT_FOUND");
    }
    return serverError(err);
  }
}

type RestoreBody = {
  tenantId?: string;
  changeSummary?: string | null;
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const session = await requirePermission("templates.write")();
    const { id, versionId } = await ctx.params;
    const payload = ((await req.json().catch(() => null)) ??
      {}) as RestoreBody;

    const tenantHint = (payload.tenantId ?? session.tenantId ?? "").trim();
    if (tenantHint) await assertTenantAccess(tenantHint);

    const result = await restoreTemplateVersionForTenant(
      id,
      versionId,
      tenantHint || undefined,
      { changeSummary: payload.changeSummary ?? null },
    );

    await logAudit("templates.api.versions.restore", {
      tenantId: result.version.tenantId,
      profileId: session.userId,
      templateId: result.version.templateId,
      versionId: result.version.id,
      restoredFrom: versionId,
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
