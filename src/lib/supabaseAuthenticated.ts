import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TenantBoundSupabaseClient = SupabaseClient;

function requireSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { url, anonKey };
}

function normalizeTenantId(tenantId?: string | null): string | null {
  const value = typeof tenantId === "string" ? tenantId.trim() : "";
  return value || null;
}

/**
 * Creates the default server-side application Supabase client.
 *
 * This client uses the user's Supabase auth cookies and the public anon key, so
 * normal API routes remain RLS-bound. The database pre-request hook owns tenant
 * initialization by deriving app.tenant_id from the authenticated profile. When
 * a caller passes tenantId, it is sent as x-tenant-id only as a requested tenant
 * context; the database validates it before setting app.tenant_id.
 */
export async function createTenantBoundSupabaseClient(options?: {
  tenantId?: string | null;
}): Promise<TenantBoundSupabaseClient> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const cookieStore = await cookies();
  const tenantId = normalizeTenantId(options?.tenantId);

  return createServerClient(url, anonKey, {
    global: tenantId
      ? {
          headers: {
            "x-tenant-id": tenantId,
          },
        }
      : undefined,
    cookies: {
      getAll() {
        return cookieStore.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options: cookieOptions } of cookiesToSet) {
          try {
            cookieStore.set(name, value, cookieOptions);
          } catch {
            // Server Components and read-only contexts cannot set cookies.
            // Supabase can still read the current request session.
          }
        }
      },
    },
  });
}

/**
 * Hard stop for non-admin route code. Importing getServiceClient should be a
 * conscious exception for webhooks, scheduled jobs, migrations, diagnostics, or
 * repair scripts. User-facing API routes should use createTenantBoundSupabaseClient.
 */
export function assertServiceRoleAllowed(reason: string): void {
  if (!reason.trim()) {
    throw new Error("SERVICE_ROLE_REQUIRES_EXPLICIT_REASON");
  }
}
