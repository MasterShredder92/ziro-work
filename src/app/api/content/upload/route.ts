import { NextRequest } from "next/server";
import { badRequest, created, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { uploadAsset } from "@/lib/content";
import type { ContentAsset } from "@/lib/content";
import { fireContentTrigger } from "@/lib/content/triggers";
import {
  resolveContentApiContext,
  toAuthErrorResponse,
} from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UploadPayload = Partial<ContentAsset> & {
  name?: string;
  url?: string;
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await resolveContentApiContext(req, { requireWrite: true });
    const body = await readJson<UploadPayload>(req);
    if (
      !body ||
      typeof body.name !== "string" ||
      !body.name.trim() ||
      typeof body.url !== "string" ||
      !body.url.trim()
    ) {
      return badRequest("name and url required");
    }

    const asset = await uploadAsset(ctx.tenantId, {
      ...body,
      name: body.name,
      url: body.url,
      created_by: body.created_by ?? ctx.session.userId,
    });

    await fireContentTrigger("content.asset.uploaded", {
      tenantId: ctx.tenantId,
      itemId: asset.item_id ?? undefined,
      profileId: ctx.session.userId,
      data: {
        assetId: asset.id,
        kind: asset.kind,
        name: asset.name,
        mimeType: asset.mime_type,
        sizeBytes: asset.size_bytes,
      },
    }).catch(() => null);

    await logAudit("content.api.upload", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      assetId: asset.id,
      kind: asset.kind,
    });

    return created({ data: asset });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}
