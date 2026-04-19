import { NextRequest } from "next/server";
import { z } from "zod";
import { listContacts, createContact } from "@data/contacts";
import type { ContactFilter, ContactKind } from "@/lib/types/crm";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "student",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const url = new URL(req.url);
    const kindParam = url.searchParams.getAll("kind");
    const filter: ContactFilter = {
      kind: (kindParam.length
        ? (kindParam as ContactKind[])
        : undefined) as ContactKind[] | undefined,
      familyId: url.searchParams.get("familyId") ?? undefined,
      teacherId: url.searchParams.get("teacherId") ?? undefined,
      locationId: url.searchParams.get("locationId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      stage: url.searchParams.get("stage") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      includeArchived:
        url.searchParams.get("includeArchived") === "true" || undefined,
    };
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") ?? "200"), 1),
      1000,
    );
    const data = await listContacts(resolved.context.tenantId, filter, limit);
    return ok({ data, count: data.length });
  } catch (err) {
    return serverError(err);
  }
}

const CreateContactSchema = z.object({
  kind: z.enum(["lead", "student", "family", "teacher"]),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  familyId: z.string().uuid().nullable().optional(),
  locationId: z.string().uuid().nullable().optional(),
  source: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const body = await readJson(req);
    const parsed = CreateContactSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid contact payload", parsed.error.flatten());
    }
    const row = await createContact(resolved.context.tenantId, parsed.data);
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
