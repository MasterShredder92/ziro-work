import { badRequest, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { applyThemeToProfile, listBrandingThemes, removeTheme, saveTheme, } from "@/lib/branding";
import { jsonAdminError, resolveBrandingAdminOperatorContext, } from "../_auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const ctx = await resolveBrandingAdminOperatorContext(req);
        const themes = await listBrandingThemes(ctx.tenantId);
        await logAudit("branding.theme.list", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            source: "api",
        });
        return ok({ data: { themes } });
    }
    catch (err) {
        const j = jsonAdminError(err);
        if (j)
            return j;
        return serverError(err);
    }
}
export async function PATCH(req) {
    var _a, _b;
    try {
        const ctx = await resolveBrandingAdminOperatorContext(req);
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        const key = body.theme_key;
        if (!key || typeof key !== "string") {
            return badRequest("theme_key required");
        }
        if (body.action === "delete") {
            await removeTheme(ctx.tenantId, key);
            await logAudit("branding.theme.delete", {
                tenantId: ctx.tenantId,
                themeKey: key,
                source: "api",
            });
            return ok({ data: { ok: true } });
        }
        if (body.action === "apply") {
            const profile = await applyThemeToProfile(ctx.tenantId, key);
            await logAudit("branding.theme.apply", {
                tenantId: ctx.tenantId,
                themeKey: key,
                source: "api",
            });
            return ok({ data: { profile } });
        }
        const theme = await saveTheme(ctx.tenantId, {
            theme_key: key,
            name: body.name,
            description: (_b = body.description) !== null && _b !== void 0 ? _b : null,
            tokens: body.tokens,
        });
        await logAudit("branding.theme.save", {
            tenantId: ctx.tenantId,
            themeKey: key,
            source: "api",
        });
        return ok({ data: { theme } });
    }
    catch (err) {
        const j = jsonAdminError(err);
        if (j)
            return j;
        return serverError(err);
    }
}
