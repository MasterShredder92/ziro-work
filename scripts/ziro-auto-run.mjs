#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const eqIdx = token.indexOf("=");
      if (eqIdx !== -1) {
        flags[token.slice(2, eqIdx)] = token.slice(eqIdx + 1);
      } else {
        const key = token.slice(2);
        const next = argv[i + 1];
        if (typeof next === "string" && !next.startsWith("--")) {
          flags[key] = next;
          i += 1;
        } else {
          flags[key] = "true";
        }
      }
    } else {
      positional.push(token);
    }
  }
  return { positional, flags };
}

const { positional, flags } = parseArgs(process.argv);
const tenantId = flags.tenantId ?? flags.tenant ?? positional[0] ?? null;
const profileId = flags.profileId ?? flags.profile ?? null;
const packsRaw = flags.packs ?? null;

if (!tenantId) {
  console.error(
    "Usage: node scripts/ziro-auto-run.mjs <tenantId> [--profileId=<id>] [--packs=leads,schedule,billing,retention]",
  );
  process.exit(1);
}

const innerPath = path.resolve(__dirname, "ziro-auto-run.inner.ts");
if (!fs.existsSync(innerPath)) {
  console.error(`Missing worker script: ${innerPath}`);
  process.exit(1);
}

const env = {
  ...process.env,
  ZIRO_AUTO_TENANT_ID: tenantId,
  ZIRO_AUTO_PROFILE_ID: profileId ?? "",
  ZIRO_AUTO_PACKS: packsRaw ?? "",
  TS_NODE_TRANSPILE_ONLY: "1",
  TS_NODE_COMPILER_OPTIONS: JSON.stringify({
    module: "commonjs",
    moduleResolution: "node",
    target: "ES2019",
    esModuleInterop: true,
    allowJs: true,
  }),
};

const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
const args = [
  "--no-install",
  "ts-node",
  "-r",
  "tsconfig-paths/register",
  "-r",
  "dotenv/config",
  innerPath,
];

const res = spawnSync(cmd, args, {
  stdio: "inherit",
  env,
  cwd: repoRoot,
});

process.exit(res.status ?? 1);
