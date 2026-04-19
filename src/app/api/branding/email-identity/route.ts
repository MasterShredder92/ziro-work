import type { NextRequest } from "next/server";
import { ok, readJson, serverError } from "@/lib/http";
import {
  getPrimaryBrandingEmailIdentity,
  listBrandingEmailIdentities,
  saveEmailIdentity,
  sendTestEmailIdentity,
} from "@/lib/branding";
import {
  jsonAdminError,
  resolveBrandingAdminOperatorContext,
} from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await resolveBrandingAdminOperatorContext(req);
    const [identities, primary] = await Promise.all([
      listBrandingEmailIdentities(tenantId),
      getPrimaryBrandingEmailIdentity(tenantId),
    ]);
    return ok({
      data: { identities, primary, tenantId },
    });
  } catch (err) {
    const j = jsonAdminError(err);
    if (j) return j;
    return serverError(err);
  }
}

type IdentityPatch = Partial<{
  id: string;
  from_name: string;
  from_email: string;
  reply_to_email: string | null;
  is_primary: boolean;
  status: string;
}>;

type PatchBody = {
  identity?: IdentityPatch;
  patch?: IdentityPatch;
  test?: { id: string; to: string };
};

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId } = await resolveBrandingAdminOperatorContext(req);
    const body = (await readJson<PatchBody>(req)) ?? {};
    if (body.test?.id && body.test?.to) {
      const result = await sendTestEmailIdentity(
        tenantId,
        body.test.id,
        body.test.to,
      );
      return ok({ data: result });
    }
    const identity = body.identity ?? body.patch;
    if (identity) {
      const row = await saveEmailIdentity(tenantId, {
        ...identity,
        tenant_id: tenantId,
      } as Parameters<typeof saveEmailIdentity>[1]);
      return ok({ data: { identity: row } });
    }
    return Response.json({ error: "identity or test required" }, { status: 400 });
  } catch (err) {
    const j = jsonAdminError(err);
    if (j) return j;
    return serverError(err);
  }
}
