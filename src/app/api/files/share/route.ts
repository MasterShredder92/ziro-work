import { NextRequest } from "next/server";
import {
  badRequest,
  created,
  noContent,
  ok,
  readJson,
  serverError,
} from "@/lib/http";
import {
  createShareLink,
  patchShareLink,
  revokeShareLinkById,
} from "@/lib/files/service";
import type { FileShareLinkInput } from "@/lib/files/types";
import { resolveFilesApiContext, toAuthErrorResponse } from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = { input: FileShareLinkInput } | FileShareLinkInput;

export async function POST(req: NextRequest) {
  try {
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireShare: true,
    });
    const raw = await readJson<CreateBody>(req);
    if (!raw) return badRequest("body required");
    const input: FileShareLinkInput | undefined =
      raw && typeof raw === "object" && "input" in raw
        ? (raw as { input: FileShareLinkInput }).input
        : (raw as FileShareLinkInput);
    if (!input || (!input.fileId && !input.folderId)) {
      return badRequest("fileId or folderId required");
    }
    const link = await createShareLink(tenantId, input, ctx);
    return created({ data: link });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireShare: true,
    });
    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim();
    if (!id) return badRequest("id required");
    await revokeShareLinkById(id, tenantId, ctx);
    return noContent();
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

type PatchBody = {
  id: string;
  metadata?: Record<string, unknown>;
  allowDownload?: boolean;
  linkDisabled?: boolean;
  watermarkPreview?: boolean;
};

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireShare: true,
    });
    const body = await readJson<PatchBody>(req);
    if (!body?.id) return badRequest("id required");
    const meta: Record<string, unknown> = { ...(body.metadata ?? {}) };
    if (body.linkDisabled !== undefined)
      meta.linkDisabled = body.linkDisabled;
    if (body.watermarkPreview !== undefined)
      meta.watermarkPreview = body.watermarkPreview;
    const link = await patchShareLink(
      body.id,
      tenantId,
      {
        metadata: meta,
        ...(body.allowDownload !== undefined
          ? { allowDownload: body.allowDownload }
          : {}),
      },
      ctx,
    );
    return ok({ data: link });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}
