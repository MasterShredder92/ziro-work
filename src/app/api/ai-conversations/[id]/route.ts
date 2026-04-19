import { NextRequest } from "next/server";
import { z } from "zod";
import {
  deleteAIConversation,
  getAIConversationById,
  updateAIConversation,
} from "@data/aiConversations";
import type { AIConversationUpdate } from "@/lib/types/entities";
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
    const row = await getAIConversationById(id, tenantId);
    if (!row) return notFound();
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

const UpdateSchema = z
  .object({
    client_route: z.string().nullable().optional(),
    source: z.string().optional(),
    page_context: z.record(z.string(), z.unknown()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid update payload", parsed.error.flatten());
    }
    const row = await updateAIConversation(
      id,
      tenantId,
      parsed.data as unknown as AIConversationUpdate,
    );
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const tenantId = resolveTenantId(req);
    await deleteAIConversation(id, tenantId);
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
