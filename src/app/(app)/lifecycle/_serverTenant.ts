import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { getSession } from "@/lib/auth/session";

function pickTenantIdFromMetadata(user: {
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const app = user.app_metadata ?? {};
  const meta = user.user_metadata ?? {};
  const candidates = [app.tenant_id, app.tenantId, meta.tenant_id, meta.tenantId];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return "";
}

export async function resolveLifecycleTenantId(): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return DEFAULT_TENANT_ID;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          return;
        }
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));

  const tenantId =
    (session?.user ? pickTenantIdFromMetadata(session.user) : "") || DEFAULT_TENANT_ID;
  return tenantId;
}

export type LifecycleTenantScope = {
  tenantId: string;
  locationId: string | null;
};

export async function resolveLifecycleTenantScope(
  preferredLocationId?: string | null,
): Promise<LifecycleTenantScope> {
  try {
    const session = await requirePermission("students.read")();
    const access = await resolveUserLocationAccess({
      session,
      preferredLocationId,
      autoRepairProfileLocation: true,
    });
    const locationId =
      preferredLocationId && preferredLocationId.trim().length > 0
        ? access.selectedLocationId
        : null;
    return { tenantId: access.tenantId, locationId };
  } catch {
    const session = await getSession().catch(() => null);
    const tenantId = session?.tenantId?.trim() || DEFAULT_TENANT_ID;
    return { tenantId, locationId: null };
  }
}
