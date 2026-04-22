import { NextRequest } from "next/server";
import { z } from "zod";
import {
  deactivateStudent,
  getStudentById,
  updateStudent,
} from "@data/students";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const tenantId = resolveTenantId(req);
    const data = await getStudentById(id, tenantId);
    if (!data) return notFound();
    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}

const StudentUpdateSchema = z.object({}).passthrough();

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = StudentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid update payload", parsed.error.flatten());
    }
    const data = await updateStudent(id, tenantId, parsed.data);
    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}

const DeactivateSchema = z.object({
  deactivated_by: z.string().uuid(),
  reason: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
});

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = DeactivateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        "Deactivation requires deactivated_by",
        parsed.error.flatten(),
      );
    }
    await deactivateStudent(
      id,
      tenantId,
      parsed.data.deactivated_by,
      parsed.data.reason ?? undefined,
      parsed.data.category ?? undefined,
    );
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
