import "dotenv/config";
import { runAutoActions } from "@/lib/ziro/runtime";

async function main(): Promise<void> {
  const tenantId = (process.env.ZIRO_AUTO_TENANT_ID ?? "").trim();
  if (!tenantId) {
    console.error("ZIRO_AUTO_TENANT_ID is required");
    process.exit(1);
  }
  const rawProfile = (process.env.ZIRO_AUTO_PROFILE_ID ?? "").trim();
  const profileId = rawProfile.length > 0 ? rawProfile : null;
  const rawPacks = (process.env.ZIRO_AUTO_PACKS ?? "").trim();
  const packKeys = rawPacks.length > 0
    ? rawPacks.split(",").map((p) => p.trim()).filter((p) => p.length > 0)
    : undefined;

  const summary = await runAutoActions({ tenantId, profileId, packKeys });
  process.stdout.write(JSON.stringify(summary, null, 2));
  process.stdout.write("\n");
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  console.error(message);
  process.exit(1);
});
