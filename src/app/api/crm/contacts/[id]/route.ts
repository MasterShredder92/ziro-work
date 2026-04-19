import { NextRequest } from "next/server";
import { z } from "zod";
import {
  archiveContact,
  getContactById,
  updateContact,
} from "@data/contacts";
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
    const decoded = decodeURIComponent(id);
    const row = await getContactById(resolved.context.tenantId, decoded);
    if (!row) return notFound();
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

const UpdateSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id } = await ctx.params;
    const decoded = decodeURIComponent(id);
    const body = await readJson(req);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid contact patch", parsed.error.flatten());
    }
    const row = await updateContact(
      resolved.context.tenantId,
      decoded,
      parsed.data,
    );
    if (!row) return notFound();
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id } = await ctx.params;
    const decoded = decodeURIComponent(id);
    await archiveContact(resolved.context.tenantId, decoded);
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
