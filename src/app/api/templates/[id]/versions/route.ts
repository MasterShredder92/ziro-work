import { NextRequest } from "next/server";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { badRequest, created, notFound, ok, serverError } from "@/lib/http";
import {
  createTemplateVersionForTenant,
  getTemplateSurface,
} from "@/lib/templates/service";
import type { TemplateVersionInput } from "@/lib/templates/types";

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
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("templates.read")();
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const tenantHint = (url.searchParams.get("tenantId") ?? session.tenantId).trim();
    if (tenantHint) await assertTenantAccess(tenantHint);

    const surface = await getTemplateSurface(id, tenantHint || undefined);
    if (!surface) return notFound("TEMPLATE_NOT_FOUND");

    await logAudit("templates.api.versions.list", {
      tenantId: surface.template.tenantId,
      profileId: session.userId,
      templateId: surface.template.id,
      count: surface.versions.length,
      source: "api",
    });
    return ok({ data: surface.versions });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

type VersionBody = Partial<TemplateVersionInput> & {
  body: string;
  tenantId?: string;
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("templates.write")();
    const { id } = await ctx.params;
    const payload = (await req.json().catch(() => null)) as VersionBody | null;
    if (!payload || typeof payload.body !== "string") {
      return badRequest("INVALID_BODY", { expected: { body: "string" } });
    }

    const tenantHint = (payload.tenantId ?? session.tenantId ?? "").trim();
    if (tenantHint) await assertTenantAccess(tenantHint);

    const version = await createTemplateVersionForTenant(
      id,
      {
        body: payload.body,
        subject: payload.subject,
        changeSummary: payload.changeSummary ?? null,
        isCurrent: payload.isCurrent === true,
        createdBy: session.userId ?? null,
      },
      tenantHint || undefined,
    );

    await logAudit("templates.api.versions.create", {
      tenantId: version.tenantId,
      profileId: session.userId,
      templateId: version.templateId,
      versionId: version.id,
      version: version.version,
      source: "api",
    });
    return created({ data: version });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    if (err instanceof Error && err.message === "TEMPLATE_NOT_FOUND") {
      return notFound("TEMPLATE_NOT_FOUND");
    }
    return serverError(err);
  }
}
