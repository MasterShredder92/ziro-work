import { NextRequest } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase";
import { badRequest, created, ok, readJson, resolveTenantId, serverError } from "@/lib/http";
import { emitEvent } from "@/lib/events/emitEvent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AgreementCreateSchema = z.object({
  studentId: z.string().uuid(),
  url: z.string().url().optional(),
  signed: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req);
    const supabase = getServiceClient();
    const url = new URL(req.url);
    const studentId = url.searchParams.get("studentId");
    let query = supabase.from("agreements").select("*").eq("tenantid", tenantId);
    if (studentId) query = query.eq("studentid", studentId);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return ok({ data, count: data?.length ?? 0 });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = AgreementCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid agreement payload", parsed.error.flatten());
    }
    const supabase = getServiceClient();
    const { data: row, error } = await supabase
      .from("agreements")
      .insert({
        tenantid: tenantId,
        studentid: parsed.data.studentId,
        url: parsed.data.url ?? null,
        signed: parsed.data.signed ?? false,
        signed_at: parsed.data.signed ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) throw error;
    if (parsed.data.signed) {
      await emitEvent({
        tenantId,
        eventType: "agreement.signed",
        entityType: "agreement",
        entityId: row.id,
        payload: { agreement: row, studentId: parsed.data.studentId },
      });
    }
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

// PATCH /api/agreements/:id — mark as signed
const AgreementPatchSchema = z.object({
  signed: z.boolean(),
  url: z.string().url().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req);
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return badRequest("Missing id");
    const body = await readJson(req);
    const parsed = AgreementPatchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid patch payload", parsed.error.flatten());
    const supabase = getServiceClient();
    const patch: Record<string, unknown> = { signed: parsed.data.signed };
    if (parsed.data.url) patch.url = parsed.data.url;
    if (parsed.data.signed) patch.signed_at = new Date().toISOString();
    const { data: row, error } = await supabase
      .from("agreements")
      .update(patch)
      .eq("id", id)
      .eq("tenantid", tenantId)
      .select()
      .single();
    if (error) throw error;
    if (parsed.data.signed) {
      const signedEvent = {
        tenantId,
        eventType: "agreement.signed",
        entityType: "agreement",
        entityId: row.id,
        payload: { agreement: row },
      };
      await emitEvent(signedEvent);
      // Agent event processing removed
    }
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
