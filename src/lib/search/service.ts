import "server-only";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
import type { Session } from "@/lib/auth/session";
import { bestFuzzyScore } from "./fuzzy";

/**
 * Tenant-scoped global search.
 *
 * Strategy: hit several well-known tables with `ilike` prefilters (cheap),
 * pull a candidate set, then fuzzy-score in memory to assemble the final
 * ranked list. This keeps queries predictable even when Postgres full-text
 * indexes aren't present. Admins can search across all tenants (baseRole
 * override); everyone else is pinned to their own tenant.
 *
 * All reads are best-effort — missing tables return empty groups rather than
 * erroring out the whole request.
 */

export type SearchDomain =
  | "contacts"
  | "students"
  | "leads"
  | "forms"
  | "templates"
  | "content";

export interface SearchResult {
  domain: SearchDomain;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  score: number;
  tenantId?: string | null;
}

export interface SearchArgs {
  session: Session;
  query: string;
  domains?: SearchDomain[];
  /** Per-domain candidate limit. Final results honour `limit`. */
  candidateLimit?: number;
  /** Final result limit after scoring. */
  limit?: number;
}

const ALL_DOMAINS: SearchDomain[] = [
  "contacts",
  "students",
  "leads",
  "forms",
  "templates",
  "content",
];

export async function globalSearch(args: SearchArgs): Promise<SearchResult[]> {
  const query = args.query.trim();
  if (!query) return [];

  const domains = args.domains && args.domains.length > 0 ? args.domains : ALL_DOMAINS;
  const candidateLimit = Math.max(1, Math.min(50, args.candidateLimit ?? 20));
  const limit = Math.max(1, Math.min(100, args.limit ?? 25));

  const baseRole = args.session.baseRole ?? args.session.role;
  const tenantId = baseRole === "admin" ? null : args.session.tenantId;

  const grouped = await Promise.all(
    domains.map((d) => searchDomain(d, query, tenantId, candidateLimit)),
  );

  return grouped
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function searchDomain(
  domain: SearchDomain,
  query: string,
  tenantId: string | null,
  candidateLimit: number,
): Promise<SearchResult[]> {
  try {
    switch (domain) {
      case "contacts":
        return await searchTable({
          table: "contacts",
          tenantId,
          query,
          candidateLimit,
          textColumns: ["first_name", "last_name", "email", "phone"],
          map: (row) => ({
            domain,
            id: String(row.id),
            title: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || String(row.email ?? "(no name)"),
            subtitle: (row.email as string | null) ?? (row.phone as string | null) ?? undefined,
            href: `/families/contacts/${row.id}`,
            tenantId: (row.tenant_id as string | null) ?? null,
          }),
        });
      case "students":
        return await searchTable({
          table: "students",
          tenantId,
          query,
          candidateLimit,
          textColumns: ["first_name", "last_name", "display_name", "instrument"],
          map: (row) => ({
            domain,
            id: String(row.id),
            title:
              ((row.display_name as string | null) ??
                [row.first_name, row.last_name].filter(Boolean).join(" ").trim()) ||
              "(unnamed student)",
            subtitle: (row.instrument as string | null) ?? undefined,
            href: `/students/${row.id}`,
            tenantId: (row.tenant_id as string | null) ?? null,
          }),
        });
      case "leads":
        return await searchTable({
          table: "leads",
          tenantId,
          query,
          candidateLimit,
          textColumns: ["name", "email", "phone", "source"],
          map: (row) => ({
            domain,
            id: String(row.id),
            title: (row.name as string | null) ?? (row.email as string | null) ?? "(unnamed lead)",
            subtitle: (row.source as string | null) ?? (row.email as string | null) ?? undefined,
            href: `/leads/${row.id}`,
            tenantId: (row.tenant_id as string | null) ?? null,
          }),
        });
      case "forms":
        return await searchTable({
          table: "forms",
          tenantId,
          query,
          candidateLimit,
          textColumns: ["name", "slug", "description"],
          map: (row) => ({
            domain,
            id: String(row.id),
            title: (row.name as string | null) ?? "(unnamed form)",
            subtitle: (row.slug as string | null) ?? undefined,
            href: `/forms/${row.id}`,
            tenantId: (row.tenant_id as string | null) ?? null,
          }),
        });
      case "templates":
        return await searchTable({
          table: "templates",
          tenantId,
          query,
          candidateLimit,
          textColumns: ["name", "kind", "description"],
          map: (row) => ({
            domain,
            id: String(row.id),
            title: (row.name as string | null) ?? "(unnamed template)",
            subtitle: (row.kind as string | null) ?? undefined,
            href: `/templates/${row.id}`,
            tenantId: (row.tenant_id as string | null) ?? null,
          }),
        });
      case "content":
        return await searchTable({
          table: "content_items",
          tenantId,
          query,
          candidateLimit,
          textColumns: ["title", "description", "kind"],
          map: (row) => ({
            domain,
            id: String(row.id),
            title: (row.title as string | null) ?? "(untitled content)",
            subtitle: (row.kind as string | null) ?? undefined,
            href: `/content/${row.id}`,
            tenantId: (row.tenant_id as string | null) ?? null,
          }),
        });
      default:
        return [];
    }
  } catch {
    return [];
  }
}

interface SearchTableArgs {
  table: string;
  tenantId: string | null;
  query: string;
  candidateLimit: number;
  textColumns: string[];
  map: (row: Record<string, unknown>) => Omit<SearchResult, "score">;
}

async function searchTable(args: SearchTableArgs): Promise<SearchResult[]> {
  assertServiceRoleAllowed("src/lib/search/service.ts — service-role module; internal/background operations only");
  const sb = getServiceClient();
  const pattern = `%${args.query.replace(/[%_]/g, "\\$&")}%`;
  const orFilter = args.textColumns.map((col) => `${col}.ilike.${pattern}`).join(",");

  let q = sb.from(args.table).select("*").limit(args.candidateLimit);
  if (args.tenantId) q = q.eq("tenant_id", args.tenantId);
  q = q.or(orFilter);

  const { data, error } = await q;
  if (error || !data) return [];

  return data
    .map((raw) => {
      const row = raw as Record<string, unknown>;
      const base = args.map(row);
      const searchable = args.textColumns
        .map((col) => (row[col] ?? "") as string)
        .filter((s): s is string => typeof s === "string" && s.length > 0);
      const score = bestFuzzyScore(args.query, [base.title, base.subtitle ?? "", ...searchable].filter(Boolean));
      return { ...base, score };
    })
    .filter((r) => r.score > 0);
}
