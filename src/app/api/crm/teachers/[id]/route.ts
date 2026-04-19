import { NextRequest } from "next/server";
import { z } from "zod";
import {
  deleteTeacher,
  getTeacherById,
  updateTeacher,
} from "@data/teachers";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  readJson,
  serverError,
} from "@/lib/http";
import { resolveCRMContext } from "../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id } = await ctx.params;
    const { data, error } = await getTeacherById(id);
    if (error) return serverError(error);
    if (!data) return notFound();
    if (
      data.tenant_id &&
      data.tenant_id !== resolved.context.tenantId &&
      resolved.context.session.baseRole !== "admin"
    ) {
      return notFound();
    }
    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}

const UpdateSchema = z.object({}).passthrough();

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id } = await ctx.params;
    const body = await readJson(req);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid teacher patch", parsed.error.flatten());
    }
    const row = await updateTeacher(id, resolved.context.tenantId, parsed.data);
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "admin",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id } = await ctx.params;
    await deleteTeacher(id, resolved.context.tenantId);
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
