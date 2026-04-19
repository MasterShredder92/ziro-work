#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const steps = [
  ["npm", ["run", "lint"]],
  ["npm", ["run", "test:smoke"]],
];

for (const [cmd, args] of steps) {
  const label = `${cmd} ${args.join(" ")}`;
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: true });
  if (res.status !== 0) {
    console.error(`Release checklist failed at: ${label}`);
    process.exit(res.status ?? 1);
  }
}

console.log("Release checklist passed.");
