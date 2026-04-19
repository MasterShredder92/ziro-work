import type { NextRequest } from "next/server";
import { sendTestEmailIdentity } from "@/lib/branding";
import { readJson, ok } from "@/lib/http";
import { handleError } from "@/app/api/admin/_handle";
import { AdminApiError } from "@/app/api/admin/_context";
import { brandingWriteContext } from "../../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { id?: string; identityId?: string; to?: string };

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await brandingWriteContext(req);
    const body = (await readJson<Body>(req)) ?? {};
    const id = body.id?.trim() || body.identityId?.trim();
    if (!id || !body.to?.trim()) {
      throw new AdminApiError("INVALID_BODY", 400);
    }
    const result = await sendTestEmailIdentity(tenantId, id, body.to.trim());
    return ok({ data: result });
  } catch (err) {
    return handleError(err);
  }
}
