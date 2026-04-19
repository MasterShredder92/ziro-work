import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { badRequest, notFound, ok, serverError } from "@/lib/http";
import { renderTemplateForContext } from "@/lib/templates/service";
import type { TemplateContext } from "@/lib/templates/types";

type RenderBody = {
  templateId?: string;
  versionId?: string;
  context?: TemplateContext;
  tenantId?: string;
};

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("templates.read")();
    const body = (await req.json().catch(() => null)) as RenderBody | null;
    if (!body || typeof body.templateId !== "string") {
      return badRequest("INVALID_BODY", {
        expected: { templateId: "string", context: "object" },
      });
    }
    const context = (body.context ?? {}) as TemplateContext;
    const rendered = await renderTemplateForContext({
      templateId: body.templateId,
      versionId: body.versionId,
      context,
      tenantId: body.tenantId,
    });
    return ok({ data: rendered });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "FORBIDDEN") return forbidden();
      if (
        err.message === "TEMPLATE_NOT_FOUND" ||
        err.message === "TEMPLATE_VERSION_NOT_FOUND"
      ) {
        return notFound(err.message);
      }
    }
    return serverError(err);
  }
}
