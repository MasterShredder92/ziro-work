/**
 * errorCapture.ts — Passive "Immune System" error observer.
 *
 * Captures DB/API errors into error_resolution_logs WITHOUT blocking
 * the main application thread. All writes are fire-and-forget.
 *
 * Usage:
 *   captureError(err, { route: "/api/invoices/create", tenantId, inputPayload: body })
 */
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

export interface ErrorCaptureContext {
  route?: string;
  tenantId?: string | null;
  inputPayload?: unknown;
}

function extractErrorFields(err: unknown): {
  error_code: string | null;
  message: string;
  stack_trace: string | null;
} {
  if (!err) return { error_code: null, message: "Unknown error", stack_trace: null };
  if (typeof err === "string") return { error_code: null, message: err, stack_trace: null };
  if (err instanceof Error) {
    const rec = err as Error & { code?: string };
    return {
      error_code: rec.code ?? null,
      message: rec.message,
      stack_trace: rec.stack ?? null,
    };
  }
  if (typeof err === "object") {
    const rec = err as Record<string, unknown>;
    return {
      error_code: typeof rec.code === "string" ? rec.code : null,
      message: typeof rec.message === "string" ? rec.message : JSON.stringify(rec),
      stack_trace: null,
    };
  }
  return { error_code: null, message: String(err), stack_trace: null };
}

function safePayload(input: unknown): Record<string, unknown> | null {
  if (!input) return null;
  try {
    return JSON.parse(JSON.stringify(input)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * captureError — fire-and-forget passive error logger.
 * NEVER throws. NEVER awaits in the caller's critical path.
 */
export function captureError(err: unknown, ctx: ErrorCaptureContext = {}): void {
  // Intentionally not awaited — passive observer only
  void (async () => {
    try {
      const { error_code, message, stack_trace } = extractErrorFields(err);
      assertServiceRoleAllowed("src/lib/errorCapture.ts — service-role module; internal/background operations only");
      const supabase = getServiceClient();
      await supabase.from("error_resolution_logs").insert({
        tenant_id: ctx.tenantId ?? null,
        error_code,
        message,
        stack_trace,
        input_payload: safePayload(ctx.inputPayload),
        route: ctx.route ?? null,
        resolved: false,
      });
    } catch {
      // Silently swallow — this observer must never cause cascading failures
    }
  })();
}
