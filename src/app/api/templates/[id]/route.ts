import { NextRequest } from "next/server";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { badRequest, noContent, notFound, ok, serverError } from "@/lib/http";
import {
  createTemplateVersionForTenant,
  deleteTemplateForTenant,
  getTemplateSurface,
  updateTemplateForTenant,
} from "@/lib/templates/service";
import type {
  TemplateInput,
  TemplateVersionInput,
} from "@/lib/templates/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

type PatchBody = Partial<TemplateInput> & {
  tenantId?: string;
  newVersion?: Partial<TemplateVersionInput> & { body?: string };
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("templates.read")();
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const tenantId = (url.searchParams.get("tenantId") ?? session.tenantId).trim();
    if (tenantId) await assertTenantAccess(tenantId);

    const surface = await getTemplateSurface(id, tenantId || undefined);
    if (!surface) return notFound("TEMPLATE_NOT_FOUND");

    await logAudit("templates.api.get", {
      tenantId: surface.template.tenantId,
      profileId: session.userId,
      templateId: surface.template.id,
      source: "api",
    });
    return ok({ data: surface });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("templates.write")();
    const { id } = await ctx.params;
    const payload = (await req.json().catch(() => null)) as PatchBody | null;
    if (!payload) return badRequest("INVALID_BODY");

    const tenantHint = (payload.tenantId ?? session.tenantId ?? "").trim();
    if (tenantHint) await assertTenantAccess(tenantHint);

    const updates: Partial<TemplateInput> = {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      category: payload.category,
      channel: payload.channel,
      subject: payload.subject,
      body: payload.body,
      isArchived: payload.isArchived,
      updatedBy: session.userId ?? null,
    };

    const updated = await updateTemplateForTenant(
      id,
      updates,
      tenantHint || undefined,
    );

    let version = null;
    if (payload.newVersion && typeof payload.newVersion.body === "string") {
      version = await createTemplateVersionForTenant(
        id,
        {
          body: payload.newVersion.body,
          subject: payload.newVersion.subject,
          changeSummary: payload.newVersion.changeSummary,
          isCurrent: payload.newVersion.isCurrent === true,
          createdBy: session.userId ?? null,
        },
        tenantHint || undefined,
      );
    }

    await logAudit("templates.api.patch", {
      tenantId: updated.tenantId,
      profileId: session.userId,
      templateId: updated.id,
      newVersion: version ? version.id : null,
      source: "api",
    });
    return ok({ data: { template: updated, version } });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    if (err instanceof Error && err.message === "TEMPLATE_NOT_FOUND") {
      return notFound("TEMPLATE_NOT_FOUND");
    }
    return serverError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("templates.write")();
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const tenantHint = (url.searchParams.get("tenantId") ?? session.tenantId).trim();
    if (tenantHint) await assertTenantAccess(tenantHint);

    await deleteTemplateForTenant(id, tenantHint || undefined);
    await logAudit("templates.api.delete", {
      tenantId: tenantHint,
      profileId: session.userId,
      templateId: id,
      source: "api",
    });
    return noContent();
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
