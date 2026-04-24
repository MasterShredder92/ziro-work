import type { ListResult, PageParams } from "@/lib/data/core";
import type { FacadeResult } from "@/lib/data/core";
import { offsetRange } from "@/lib/data/core";
import type { Student } from "@/lib/data/models/students";
import type { Teacher } from "@/lib/data/models/teachers";
import type { Family } from "@/lib/data/models/families";
import type { Invoice } from "@/lib/data/models/invoices";
import type { EventLog } from "@/lib/data/models/events";
import {
  DEMO_EVENTS,
  DEMO_FAMILIES,
  DEMO_INVOICES,
  DEMO_STUDENTS,
  DEMO_TEACHERS,
} from "@/lib/demo/demoData";

function offsetSlice<T>(items: T[], page: PageParams): T[] {
  if (page.mode !== "offset") return items.slice(0, Math.min(items.length, page.limit ?? 50));
  const { from, to } = offsetRange(page.page, page.pageSize);
  return items.slice(from, to + 1);
}

function pageInfo(page: PageParams): ListResult<unknown>["pageInfo"] {
  if (page.mode === "offset") {
    const r = offsetRange(page.page, page.pageSize);
    return {
      mode: "offset",
      page: r.page,
      pageSize: r.pageSize,
      range: { from: r.from, to: r.to },
    };
  }
  return { mode: "cursor", limit: page.limit ?? 50, cursor: page.cursor };
}

function ok<T>(items: T[], page: PageParams): FacadeResult<ListResult<T>> {
  return {
    data: {
      items: offsetSlice(items, page),
      pageInfo: pageInfo(page) as ListResult<T>["pageInfo"],
    },
    error: null,
  };
}

function matches(term: string, fields: string[]) {
  const t = term.toLowerCase();
  return fields.some((f) => f.toLowerCase().includes(t));
}

export function demoListStudents(params: {
  page: PageParams;
  search?: string;
}): FacadeResult<ListResult<Student>> {
  let list = [...DEMO_STUDENTS] as Student[];
  const s = params.search?.trim();
  if (s) {
    list = list.filter((row) =>
      matches(s, [row.name, row.email ?? "", row.phone ?? "", row.status, row.onboarding_stage ?? ""])
    );
  }
  return ok(list, params.page);
}

export function demoListTeachers(params: {
  page: PageParams;
  search?: string;
}): FacadeResult<ListResult<Teacher>> {
  let list = [...DEMO_TEACHERS];
  const s = params.search?.trim();
  if (s) {
    list = list.filter((row) =>
      matches(s, [row.name, row.email ?? "", row.phone ?? "", row.status])
    );
  }
  return ok(list, params.page);
}

export function demoListFamilies(params: {
  page: PageParams;
  search?: string;
}): FacadeResult<ListResult<Family>> {
  let list = [...DEMO_FAMILIES];
  const s = params.search?.trim();
  if (s) {
    list = list.filter((row) =>
      matches(s, [row.name, row.primary_email ?? "", row.primary_phone ?? ""])
    );
  }
  return ok(list, params.page);
}

export function demoListInvoices(params: { page: PageParams }): FacadeResult<ListResult<Invoice>> {
  const list = [...DEMO_INVOICES].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return ok(list, params.page);
}

export function demoListEvents(params: { page: PageParams }): FacadeResult<ListResult<EventLog>> {
  const list = [...DEMO_EVENTS].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return ok(list, params.page);
}
