import type { DbClient, FacadeResult, ListResult, PageParams } from "./core";
import { decodeCursor, encodeCursor, offsetRange, toErrorInfo } from "./core";
import type { Invoice, InvoiceInsert, InvoiceUpdate } from "./models/invoices";

export interface InvoiceFilters {
  status?: "draft" | "sent" | "paid" | "void" | "overdue";
  studentId?: string;
  familyId?: string;
  issuedFrom?: string;
  issuedTo?: string;
  dueFrom?: string;
  dueTo?: string;
  includeArchived?: boolean;
}

export interface ListInvoicesParams {
  tenantId: string;
  page: PageParams;
  filters?: InvoiceFilters;
}

type InvoiceCursorPayload = { created_at: string; id: string };

function applyInvoiceFilters<
  T extends {
    eq: (column: string, value: unknown) => T;
    is: (column: string, value: unknown) => T;
    gte: (column: string, value: string) => T;
    lte: (column: string, value: string) => T;
  },
>(q: T, filters: InvoiceFilters | undefined, tenantId: string): T {
  let out = q.eq("tenant_id", tenantId);
  const f = filters ?? {};
  if (f.status) out = out.eq("status", f.status);
  if (f.familyId) out = out.eq("family_id", f.familyId);

  // Keep filters aligned with public.invoices schema.
  if (f.issuedFrom) out = out.gte("created_at", f.issuedFrom);
  if (f.issuedTo) out = out.lte("created_at", f.issuedTo);
  if (f.dueFrom) out = out.gte("due_date", f.dueFrom);
  if (f.dueTo) out = out.lte("due_date", f.dueTo);
  return out;
}

export async function listInvoices(
  client: DbClient,
  params: ListInvoicesParams
): Promise<FacadeResult<ListResult<Invoice>>> {
  try {
    let q = client.from("invoices").select("*");
    q = applyInvoiceFilters(q, params.filters, params.tenantId);

    if (params.page.mode === "offset") {
      const { page, pageSize, from, to } = offsetRange(
        params.page.page,
        params.page.pageSize
      );
      const { data, error } = await q
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
      if (error) return { data: null, error: toErrorInfo(error) };
      return {
        data: {
          items: ((data ?? []) as unknown[]).map((r) => r as Invoice),
          pageInfo: { mode: "offset", page, pageSize, range: { from, to } },
        },
        error: null,
      };
    }

    const limit =
      Number.isFinite(params.page.limit) && params.page.limit > 0
        ? Math.floor(params.page.limit)
        : 50;
    const cursor = params.page.cursor?.trim();
    const decoded = cursor ? decodeCursor<InvoiceCursorPayload>(cursor) : null;

    let cq = q
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (decoded?.created_at && decoded?.id) {
      cq = cq.or(
        [
          `created_at.lt.${decoded.created_at}`,
          `and(created_at.eq.${decoded.created_at},id.lt.${decoded.id})`,
        ].join(",")
      );
    }

    const { data, error } = await cq;
    if (error) return { data: null, error: toErrorInfo(error) };

    const items = ((data ?? []) as unknown[]).map((r) => r as Invoice);
    const last = items.at(-1);
    const nextCursor =
      last?.created_at && last?.id
        ? encodeCursor({ created_at: last.created_at, id: last.id })
        : undefined;

    return {
      data: {
        items,
        pageInfo: { mode: "cursor", cursor: cursor || undefined, limit, nextCursor },
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function getInvoiceById(
  client: DbClient,
  tenantId: string,
  id: string
): Promise<FacadeResult<Invoice | null>> {
  try {
    const { data, error } = await client
      .from("invoices")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: (data ?? null) as Invoice | null, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function createInvoice(
  client: DbClient,
  input: InvoiceInsert
): Promise<FacadeResult<Invoice>> {
  try {
    const { data, error } = await client
      .from("invoices")
      .insert(input)
      .select("*")
      .single();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: data as Invoice, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function updateInvoice(
  client: DbClient,
  tenantId: string,
  id: string,
  patch: InvoiceUpdate
): Promise<FacadeResult<Invoice>> {
  try {
    const { data, error } = await client
      .from("invoices")
      .update(patch)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: data as Invoice, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

