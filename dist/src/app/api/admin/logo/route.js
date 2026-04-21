import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { resolveContext, requireRole } from "../_context";
import { handleError } from "../_handle";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * POST /api/admin/logo
 * Accepts multipart/form-data with a "file" field.
 * Uploads to Supabase storage bucket "tenant-assets" and saves the public URL
 * into tenant_settings.schedule.logo_url.
 */
export async function POST(req) {
    var _a, _b, _c;
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "director");
        const formData = await req.formData();
        const file = formData.get("file");
        if (!file || typeof file === "string") {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        const blob = file;
        const ext = (_b = (_a = blob.name.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : "png";
        const allowedExts = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
        if (!allowedExts.includes(ext)) {
            return NextResponse.json({ error: "Invalid file type. Use PNG, JPG, GIF, SVG, or WebP." }, { status: 400 });
        }
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const storagePath = `${tenantId}/logo.${ext}`;
        const bucketName = "tenant-assets";
        const db = getServiceClient();
        // Ensure bucket exists (will silently fail if it already exists)
        await db.storage.createBucket(bucketName, { public: true }).catch(() => null);
        // Upload (upsert) the file
        const { error: uploadError } = await db.storage
            .from(bucketName)
            .upload(storagePath, buffer, {
            contentType: blob.type || `image/${ext}`,
            upsert: true,
        });
        if (uploadError) {
            console.error("[Logo Upload] Storage error:", uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }
        // Get the public URL
        const { data: urlData } = db.storage.from(bucketName).getPublicUrl(storagePath);
        const publicUrl = (_c = urlData === null || urlData === void 0 ? void 0 : urlData.publicUrl) !== null && _c !== void 0 ? _c : null;
        // Save URL into tenant_settings.schedule.logo_url
        if (publicUrl) {
            const { data: currentSettings } = await db
                .from("tenant_settings")
                .select("schedule")
                .eq("tenant_id", tenantId)
                .maybeSingle();
            const existingSchedule = (currentSettings === null || currentSettings === void 0 ? void 0 : currentSettings.schedule) &&
                typeof currentSettings.schedule === "object" &&
                !Array.isArray(currentSettings.schedule)
                ? currentSettings.schedule
                : {};
            await db.from("tenant_settings").upsert({
                tenant_id: tenantId,
                schedule: Object.assign(Object.assign({}, existingSchedule), { logo_url: publicUrl }),
                updated_at: new Date().toISOString(),
                updated_by: session.userId,
            }, { onConflict: "tenant_id" });
        }
        return NextResponse.json({ success: true, url: publicUrl });
    }
    catch (err) {
        return handleError(err);
    }
}
