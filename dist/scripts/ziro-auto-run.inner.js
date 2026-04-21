import "dotenv/config";
import { runAutoActions } from "@/lib/ziro/runtime";
async function main() {
    var _a, _b, _c;
    const tenantId = ((_a = process.env.ZIRO_AUTO_TENANT_ID) !== null && _a !== void 0 ? _a : "").trim();
    if (!tenantId) {
        console.error("ZIRO_AUTO_TENANT_ID is required");
        process.exit(1);
    }
    const rawProfile = ((_b = process.env.ZIRO_AUTO_PROFILE_ID) !== null && _b !== void 0 ? _b : "").trim();
    const profileId = rawProfile.length > 0 ? rawProfile : null;
    const rawPacks = ((_c = process.env.ZIRO_AUTO_PACKS) !== null && _c !== void 0 ? _c : "").trim();
    const packKeys = rawPacks.length > 0
        ? rawPacks.split(",").map((p) => p.trim()).filter((p) => p.length > 0)
        : undefined;
    const summary = await runAutoActions({ tenantId, profileId, packKeys });
    process.stdout.write(JSON.stringify(summary, null, 2));
    process.stdout.write("\n");
}
main().catch((err) => {
    var _a;
    const message = err instanceof Error ? (_a = err.stack) !== null && _a !== void 0 ? _a : err.message : String(err);
    console.error(message);
    process.exit(1);
});
