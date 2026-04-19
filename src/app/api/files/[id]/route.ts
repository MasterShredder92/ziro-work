import { NextRequest } from "next/server";
import {
  badRequest,
  noContent,
  ok,
  readJson,
  serverError,
} from "@/lib/http";
import {
  createSignedFileUrl,
  deleteFileAndStorage,
  getFileSurface,
  updateFile,
} from "@/lib/files/service";
import type { FileObject } from "@/lib/files/types";
import { resolveFilesApiContext, toAuthErrorResponse } from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return badRequest("id required");
    const { tenantId, ctx } = await resolveFilesApiContext(req);
    const surface = await getFileSurface(id, tenantId, ctx);
    const url = new URL(req.url);
    if (url.searchParams.get("signedUrl") === "true") {
      const ttl = Number(url.searchParams.get("ttl") ?? "3600");
      const signed = await createSignedFileUrl(id, tenantId, ctx, {
        ttlSeconds: Number.isFinite(ttl) ? ttl : 3600,
      });
      return ok({ data: { surface, signedUrl: signed } });
    }
    return ok({ data: surface });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return badRequest("id required");
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireWrite: true,
    });
    const body = await readJson<Partial<FileObject>>(req);
    if (!body) return badRequest("body required");
    const file = await updateFile(id, tenantId, body, ctx);
    return ok({ data: file });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return badRequest("id required");
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireWrite: true,
    });
    const url = new URL(req.url);
    const hard = url.searchParams.get("hard") === "true";
    if (hard) {
      await deleteFileAndStorage(id, tenantId, ctx);
    } else {
      await deleteFileAndStorage(id, tenantId, ctx);
    }
    return noContent();
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}
