import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/AppError";
import { withApi } from "@/lib/errors/handler";
import { globalSearch, type SearchDomain } from "@/lib/search/service";
import { enforceOrThrow } from "@/lib/ratelimit";
import { POLICIES } from "@/lib/ratelimit/policies";

export const dynamic = "force-dynamic";

const VALID_DOMAINS: SearchDomain[] = [
  "contacts",
  "students",
  "leads",
  "forms",
  "templates",
  "content",
];

export const GET = withApi(
  { name: "api.search.GET" },
  async (req: NextRequest) => {
    const session = await getSession();
    if (!session) throw AppError.unauthenticated();

    const url = new URL(req.url);
    const query = (url.searchParams.get("q") ?? "").trim();
    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }
    if (query.length > 128) {
      throw AppError.badRequest("Query too long");
    }

    await enforceOrThrow({
      req,
      policy: POLICIES.ipBurst,
      tenantId: session.tenantId,
      route: "api.search",
    });

    const rawDomains = url.searchParams.get("domains");
    const domains =
      rawDomains
        ? (rawDomains
            .split(",")
            .map((d) => d.trim())
            .filter((d): d is SearchDomain =>
              (VALID_DOMAINS as string[]).includes(d),
            ) as SearchDomain[])
        : undefined;

    const results = await globalSearch({
      session,
      query,
      domains,
      limit: 25,
    });
    return NextResponse.json({ results });
  },
);
