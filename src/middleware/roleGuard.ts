import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { normalizeDbRole, roleAtLeast, type Role } from "@/lib/auth/roles";

type RouteRule = {
  prefix: string;
  check: (role: Role) => boolean;
};

const ROUTE_RULES: RouteRule[] = [
  { prefix: "/admin", check: (role) => roleAtLeast(role, "director") },
  { prefix: "/teacher", check: (role) => role === "teacher" },
  { prefix: "/family", check: (role) => role === "family" },
  { prefix: "/student", check: (role) => role === "student" },
];

function matchRule(pathname: string): RouteRule | null {
  for (const rule of ROUTE_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule;
    }
  }
  return null;
}

function redirectToLogin(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function roleGuard(req: NextRequest): Promise<NextResponse | null> {
  const rule = matchRule(req.nextUrl.pathname);
  if (!rule) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return redirectToLogin(req);

  const response = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return redirectToLogin(req);

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role, tenant_id, is_platform_admin")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileErr || !profile) return redirectToLogin(req);

  const rawRole =
    (profile as { is_platform_admin?: boolean | null }).is_platform_admin === true
      ? "admin"
      : ((profile as { role?: string | null }).role ?? null);
  const role = normalizeDbRole(rawRole);
  if (!role) return redirectToLogin(req);

  if (!rule.check(role)) return redirectToLogin(req);

  return response;
}
