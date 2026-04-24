import { NextRequest } from "next/server";
import { z } from "zod";
import {
  deleteStudent,
  getStudentById,
  updateStudent,
} from "@data/students";
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
    minRole: "student",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id } = await ctx.params;
    const data = await getStudentById(id, resolved.context.tenantId);
    if (!data) return notFound();
    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}

const UpdateSchema = z.record(z.string(), z.unknown());

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
      return badRequest("Invalid update payload", parsed.error.flatten());
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await updateStudent(id, resolved.context.tenantId, parsed.data as any);
    return ok({ data });
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
    await deleteStudent(id, resolved.context.tenantId);
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
