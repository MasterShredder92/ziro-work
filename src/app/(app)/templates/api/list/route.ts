import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { badRequest, ok, serverError } from "@/lib/http";
import {
  createTemplateForTenant,
  listTemplatesForTenant,
} from "@/lib/templates/service";
import type { TemplateInput } from "@/lib/templates/types";

export async function GET() {
  try {
    await requirePermission("templates.read")();
    const templates = await listTemplatesForTenant();
    return ok({ data: templates });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("templates.write")();
    const body = (await req.json().catch(() => null)) as TemplateInput | null;
    if (!body || typeof body.name !== "string" || typeof body.body !== "string") {
      return badRequest("INVALID_BODY", {
        expected: { name: "string", body: "string" },
      });
    }
    const created = await createTemplateForTenant({
      ...body,
      createdBy: body.createdBy ?? session.userId ?? null,
      updatedBy: body.updatedBy ?? session.userId ?? null,
    });
    return ok({ data: created });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
    return serverError(err);
  }
}
