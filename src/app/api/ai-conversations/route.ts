import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createAIConversation,
  listAIConversations,
  type AIConversationFilter,
} from "@data/aiConversations";
import type { AIConversationInsert } from "@/lib/types/entities";
import {
  badRequest,
  created,
  ok,
  parseListQuery,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req);
    const url = new URL(req.url);
    const filter: AIConversationFilter = {
      profile_id: url.searchParams.get("profile_id") ?? undefined,
      source: url.searchParams.get("source") ?? undefined,
      client_route: url.searchParams.get("client_route") ?? undefined,
    };
    const data = await listAIConversations(tenantId, filter, parseListQuery(req));
    return ok({ data, count: data.length });
  } catch (err) {
    return serverError(err);
  }
}

const ConversationCreateSchema = z.object({
  profile_id: z.string().uuid(),
  client_route: z.string().nullable().optional(),
  source: z.string().optional(),
  page_context: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = ConversationCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        "Invalid ai_conversation payload",
        parsed.error.flatten(),
      );
    }
    const row = await createAIConversation(
      tenantId,
      parsed.data as unknown as Omit<AIConversationInsert, "tenant_id">,
    );
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
