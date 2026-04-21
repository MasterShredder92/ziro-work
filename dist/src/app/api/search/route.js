import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/AppError";
import { withApi } from "@/lib/errors/handler";
import { globalSearch } from "@/lib/search/service";
import { enforceOrThrow } from "@/lib/ratelimit";
import { POLICIES } from "@/lib/ratelimit/policies";
export const dynamic = "force-dynamic";
const VALID_DOMAINS = [
    "contacts",
    "students",
    "leads",
    "forms",
    "templates",
    "content",
];
export const GET = withApi({ name: "api.search.GET" }, async (req) => {
    var _a;
    const session = await getSession();
    if (!session)
        throw AppError.unauthenticated();
    const url = new URL(req.url);
    const query = ((_a = url.searchParams.get("q")) !== null && _a !== void 0 ? _a : "").trim();
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
    const domains = rawDomains
        ? rawDomains
            .split(",")
            .map((d) => d.trim())
            .filter((d) => VALID_DOMAINS.includes(d))
        : undefined;
    const results = await globalSearch({
        session,
        query,
        domains,
        limit: 25,
    });
    return NextResponse.json({ results });
});
