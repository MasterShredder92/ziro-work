import { NextRequest } from "next/server";
import {
  badRequest,
  noContent,
  ok,
  serverError,
} from "@/lib/http";
import {
  deleteStoredFileVersion,
  restoreFileToVersion,
  signedUrlForFileVersion,
} from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const { id: fileId, versionId } = await params;
    if (!fileId || !versionId) return badRequest("ids required");
    const { tenantId, ctx } = await resolveFilesApiContext(req);
    const url = new URL(req.url);
    if (url.searchParams.get("signedUrl") === "true") {
      const ttl = Number(url.searchParams.get("ttl") ?? "3600");
      const signed = await signedUrlForFileVersion(fileId, versionId, tenantId, ctx, {
        ttlSeconds: Number.isFinite(ttl) ? ttl : 3600,
        download: url.searchParams.get("download") === "true",
      });
      return ok({ data: { signedUrl: signed } });
    }
    return badRequest("signedUrl=true required");
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const { id: fileId, versionId } = await params;
    if (!fileId || !versionId) return badRequest("ids required");
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireWrite: true,
    });
    const file = await restoreFileToVersion(fileId, versionId, tenantId, ctx);
    return ok({ data: file });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const { id: fileId, versionId } = await params;
    if (!fileId || !versionId) return badRequest("ids required");
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireWrite: true,
    });
    await deleteStoredFileVersion(fileId, versionId, tenantId, ctx);
    return noContent();
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}
