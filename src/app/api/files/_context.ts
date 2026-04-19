import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getSession, type Session } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import {
  buildContextFromSession,
  type FilesServiceContext,
} from "@/lib/files/service";

export type FilesApiContext = {
  session: Session;
  tenantId: string;
  ctx: FilesServiceContext;
};

export type ResolveOptions = {
  requireWrite?: boolean;
  requireShare?: boolean;
  requireSign?: boolean;
};

export async function resolveFilesApiContext(
  req: NextRequest,
  options?: ResolveOptions,
): Promise<FilesApiContext> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");

  let scope = "files.read";
  if (options?.requireWrite) scope = "files.write";
  else if (options?.requireShare) scope = "files.share";
  else if (options?.requireSign) scope = "files.sign";

  await requirePermission(scope)();

  const url = new URL(req.url);
  const headerTenant = req.headers.get("x-tenant-id")?.trim() || null;
  const queryTenant = url.searchParams.get("tenantId")?.trim() || null;
  const tenantId =
    headerTenant || queryTenant || session.tenantId || DEFAULT_TENANT_ID;

  await assertTenantAccess(tenantId);

  const ctx = buildContextFromSession({
    role: session.role,
    userId: session.userId,
    tenantId,
  });

  return { session, tenantId, ctx };
}

export function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function unauthorized(message = "UNAUTHENTICATED"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function toAuthErrorResponse(err: unknown): NextResponse | null {
  const message = err instanceof Error ? err.message : String(err);
  if (message === "UNAUTHENTICATED") return unauthorized(message);
  if (message === "NOT_FOUND") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    message === "FORBIDDEN" ||
    message === "INSUFFICIENT_PERMISSIONS" ||
    message === "TENANT_FORBIDDEN" ||
    message.startsWith("ROLE_") ||
    message.startsWith("FORBIDDEN:")
  ) {
    return forbidden(message);
  }
  if (message.startsWith("BAD_REQUEST")) {
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (message === "CHECKSUM_MISMATCH") {
    return NextResponse.json(
      {
        error:
          "Upload integrity check failed (checksum mismatch). Retry or check your connection.",
      },
      { status: 400 },
    );
  }
  return null;
}

export function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}
