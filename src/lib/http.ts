import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

export type ApiError = {
  error: string;
  code?: string;
  details?: unknown;
};

export function resolveTenantId(req: NextRequest): string {
  const headerTenant = req.headers.get("x-tenant-id");
  if (headerTenant && headerTenant.trim().length > 0) return headerTenant.trim();
  const url = new URL(req.url);
  const queryTenant = url.searchParams.get("tenantId");
  if (queryTenant && queryTenant.trim().length > 0) return queryTenant.trim();
  return DEFAULT_TENANT_ID;
}

const UUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveTenantIdBySlugOrId(
  slugOrId: string | null | undefined,
): Promise<string | null> {
  const value = (slugOrId ?? "").trim();
  if (!value) return null;
  if (UUID_LIKE.test(value)) return value;

  assertServiceRoleAllowed("src/lib/http.ts — service-role module; internal/background operations only");
  const service = getServiceClient();
  const { data, error } = await service
    .from("tenants")
    .select("id")
    .eq("slug", value)
    .maybeSingle();
  if (error || !data?.id) return null;
  return String(data.id);
}

export async function resolveTenantIdFromRequest(req: NextRequest): Promise<string> {
  const headerTenantId = req.headers.get("x-tenant-id");
  const headerTenantSlug = req.headers.get("x-tenant-slug");
  const url = new URL(req.url);
  const queryTenantId = url.searchParams.get("tenantId");
  const queryTenantSlug =
    url.searchParams.get("tenantSlug") ?? url.searchParams.get("tenant");

  const resolved =
    (await resolveTenantIdBySlugOrId(headerTenantId)) ??
    (await resolveTenantIdBySlugOrId(headerTenantSlug)) ??
    (await resolveTenantIdBySlugOrId(queryTenantId)) ??
    (await resolveTenantIdBySlugOrId(queryTenantSlug));

  return resolved ?? DEFAULT_TENANT_ID;
}

export function parseListQuery(req: NextRequest): {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
} {
  const url = new URL(req.url);
  const out: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
  } = {};
  const limit = url.searchParams.get("limit");
  const offset = url.searchParams.get("offset");
  const orderBy = url.searchParams.get("orderBy");
  const order = url.searchParams.get("order");
  if (limit) {
    const n = Number(limit);
    if (Number.isFinite(n) && n > 0) out.limit = Math.min(n, 1000);
  }
  if (offset) {
    const n = Number(offset);
    if (Number.isFinite(n) && n >= 0) out.offset = n;
  }
  if (orderBy) out.orderBy = orderBy;
  if (order) out.ascending = order.toLowerCase() === "asc";
  return out;
}

export async function readJson<T = unknown>(
  req: NextRequest,
): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(error: string, details?: unknown): NextResponse {
  const body: ApiError = { error };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status: 400, headers: { "Cache-Control": "no-store" } });
}

export function notFound(error = "Not found"): NextResponse {
  return NextResponse.json(
    { error } satisfies ApiError,
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

export function tooManyRequests(
  error = "Too many requests",
  options?: { retryAfterSeconds?: number; details?: unknown },
): NextResponse {
  const body: ApiError = { error, code: "RATE_LIMITED" };
  if (options?.details !== undefined) body.details = options.details;
  const retryAfter = options?.retryAfterSeconds;
  return NextResponse.json(body, {
    status: 429,
    headers: {
      "Cache-Control": "no-store",
      ...(retryAfter && retryAfter > 0 ? { "Retry-After": String(Math.ceil(retryAfter)) } : {}),
    },
  });
}

export function serverError(err: unknown): NextResponse {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Internal error";
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code)
      : undefined;
  const body: ApiError = { error: message };
  if (code) body.code = code;
  return NextResponse.json(body, { status: 500, headers: { "Cache-Control": "no-store" } });
}

export function serializeError(err: unknown): ApiError {
  if (err instanceof Error) {
    const maybe = err as Error & { code?: string; details?: unknown };
    return {
      error: err.message,
      code: maybe.code,
      details: maybe.details,
    };
  }
  return { error: typeof err === "string" ? err : "Unknown error" };
}
