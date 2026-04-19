import { NextRequest } from "next/server";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { badRequest, created, ok, serverError } from "@/lib/http";
import {
  createTemplateForTenant,
  listTemplatesForTenant,
} from "@/lib/templates/service";
import type { TemplateInput } from "@/lib/templates/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("templates.read")();
    const url = new URL(req.url);
    const tenantId = (url.searchParams.get("tenantId") ?? session.tenantId).trim();
    if (tenantId) await assertTenantAccess(tenantId);
    const templates = await listTemplatesForTenant(tenantId || undefined);
    await logAudit("templates.api.list", {
      tenantId,
      profileId: session.userId,
      count: templates.length,
      source: "api",
    });
    return ok({ data: templates });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("templates.write")();
    const body = (await req.json().catch(() => null)) as
      | (TemplateInput & { tenantId?: string })
      | null;
    if (!body || typeof body.name !== "string" || typeof body.body !== "string") {
      return badRequest("INVALID_BODY", {
        expected: { name: "string", body: "string" },
      });
    }
    const tenantId = (body.tenantId ?? session.tenantId ?? "").trim();
    if (tenantId) await assertTenantAccess(tenantId);
    const createdRow = await createTemplateForTenant(
      {
        ...body,
        createdBy: body.createdBy ?? session.userId ?? null,
        updatedBy: body.updatedBy ?? session.userId ?? null,
      },
      tenantId || undefined,
    );
    await logAudit("templates.api.create", {
      tenantId: createdRow.tenantId,
      profileId: session.userId,
      templateId: createdRow.id,
      category: createdRow.category,
      channel: createdRow.channel,
      source: "api",
    });
    return created({ data: createdRow });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
