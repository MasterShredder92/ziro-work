import { NextRequest } from "next/server";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
import { ok, serverError, badRequest } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const BUCKET = "teacher-avatars";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id } = await ctx.params;
    const { tenantId } = resolved.context;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return badRequest("No file provided");
    if (!ALLOWED_TYPES.includes(file.type)) {
      return badRequest(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`);
    }
    if (file.size > MAX_SIZE) {
      return badRequest("File too large. Max 5MB.");
    }

    const ext = file.type.split("/")[1] ?? "jpg";
    const storagePath = `${tenantId}/teachers/${id}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = await createTenantBoundSupabaseClient({ tenantId: resolved.context.tenantId });

    // Upload to storage (upsert = replace existing)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) return serverError(uploadError);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Patch the teacher's photo_url in the DB
    const { error: dbError } = await supabase
      .from("teachers")
      .update({ photo_url: publicUrl })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (dbError) return serverError(dbError);

    return ok({ data: { photo_url: publicUrl } });
  } catch (err) {
    return serverError(err);
  }
}
