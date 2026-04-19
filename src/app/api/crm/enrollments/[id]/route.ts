import { NextRequest } from "next/server";
import { z } from "zod";
import {
  endEnrollment,
  getEnrollment,
  updateEnrollment,
} from "@/lib/crm";
import { deleteEnrollment } from "@data/enrollments";
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
    const row = await getEnrollment(resolved.context.tenantId, id);
    if (!row) return notFound();
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

const UpdateSchema = z
  .object({
    teacher_id: z.string().uuid().optional(),
    status: z.string().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
  })
  .passthrough();

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
      return badRequest("Invalid enrollment patch", parsed.error.flatten());
    }
    const row = await updateEnrollment(
      resolved.context.tenantId,
      id,
      parsed.data,
    );
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

const DeleteSchema = z
  .object({
    end: z.boolean().optional(),
    endDate: z.string().optional(),
  })
  .optional();

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id } = await ctx.params;
    const body = await readJson(req);
    const parsed = DeleteSchema.safeParse(body);
    const opts = parsed.success ? parsed.data : undefined;
    if (opts?.end) {
      await endEnrollment(resolved.context.tenantId, id, opts.endDate);
    } else {
      await deleteEnrollment(id, resolved.context.tenantId);
    }
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
