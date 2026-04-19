import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export type FacadeErrorInfo = { message: string; code?: string };

export type FacadeResult<T> =
  | { data: T; error: null }
  | { data: null; error: FacadeErrorInfo };

export type DbId = string;
export type IsoDateTime = string;

export type PageParams =
  | { mode: "offset"; page: number; pageSize: number }
  | { mode: "cursor"; cursor?: string; limit: number };

export interface PageInfoOffset {
  mode: "offset";
  page: number;
  pageSize: number;
  range: { from: number; to: number };
}

export interface PageInfoCursor {
  mode: "cursor";
  cursor?: string;
  limit: number;
  nextCursor?: string;
}

export type PageInfo = PageInfoOffset | PageInfoCursor;

export interface ListResult<T> {
  items: T[];
  pageInfo: PageInfo;
}

export function toErrorInfo(err: unknown): FacadeErrorInfo {
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    const message =
      typeof anyErr.message === "string"
        ? anyErr.message
        : typeof anyErr.error_description === "string"
          ? anyErr.error_description
          : "Unknown error";
    const code = typeof anyErr.code === "string" ? anyErr.code : undefined;
    return { message, ...(code ? { code } : {}) };
  }
  return { message: typeof err === "string" ? err : "Unknown error" };
}

export function toErrorInfoFromPostgrest(err: PostgrestError): FacadeErrorInfo {
  return { message: err.message, ...(err.code ? { code: err.code } : {}) };
}

export function offsetRange(page: number, pageSize: number) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 25;
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  return { page: safePage, pageSize: safePageSize, from, to };
}

export function encodeCursor(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor<T>(cursor: string): T | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export type DbClient = SupabaseClient;

