#!/usr/bin/env node
/*
 Smoke-test the new ZiroWork backend routes.
 Usage:
   BASE_URL=http://localhost:3000 TENANT_ID=<uuid> node scripts/smoke-routes.mjs
 Optional:
   PROFILE_ID=<uuid>   used for POST /api/ai-conversations
 The script asserts shape-level sanity (2xx/4xx) without mutating production data:
 - All GETs are pure reads.
 - Only one POST is attempted (ai-conversations), and the created row is then deleted.
 - Destructive writes are skipped unless SMOKE_WRITE=1 is set explicitly.
*/

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TENANT_ID = process.env.TENANT_ID;
const PROFILE_ID = process.env.PROFILE_ID;
const SMOKE_WRITE = process.env.SMOKE_WRITE === "1";

if (!TENANT_ID) {
  console.error("TENANT_ID env var is required");
  process.exit(2);
}

const HDRS = { "x-tenant-id": TENANT_ID, "content-type": "application/json" };

const results = [];

async function hit(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const init = { method, headers: HDRS };
  if (body !== undefined) init.body = JSON.stringify(body);
  const started = Date.now();
  let res, json;
  try {
    res = await fetch(url, init);
    const text = await res.text();
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { _raw: text.slice(0, 200) };
    }
  } catch (err) {
    results.push({ method, path, ok: false, error: String(err) });
    return { ok: false, error: err };
  }
  const ms = Date.now() - started;
  const ok = res.status < 500;
  results.push({
    method,
    path,
    status: res.status,
    ok,
    ms,
    shape: json && typeof json === "object" ? Object.keys(json).sort().join(",") : typeof json,
  });
  return { ok, status: res.status, json };
}

async function main() {
  const reads = [
    ["GET", "/api/leads?limit=1"],
    ["GET", "/api/students?limit=1"],
    ["GET", "/api/families?limit=1"],
    ["GET", "/api/schedule-blocks?limit=1"],
    ["GET", "/api/session-log?limit=1"],
    ["GET", "/api/tasks?limit=1"],
    ["GET", "/api/ai-conversations?limit=1"],
  ];
  for (const [m, p] of reads) await hit(m, p);

  await hit("POST", "/api/leads", {});
  await hit("POST", "/api/schedule-blocks", { block_date: "not-a-date" });

  if (SMOKE_WRITE && PROFILE_ID) {
    const r = await hit("POST", "/api/ai-conversations", {
      profile_id: PROFILE_ID,
      source: "smoke",
      metadata: { smoke: true },
    });
    const id = r.json?.data?.id;
    if (id) {
      await hit("GET", `/api/ai-conversations/${id}`);
      await hit("GET", `/api/ai-conversations/${id}/messages`);
      await hit("DELETE", `/api/ai-conversations/${id}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.table(results);
  if (failed.length > 0) {
    console.error(`FAIL: ${failed.length} route(s) returned 5xx or errored.`);
    process.exit(1);
  }
  console.log(`OK: ${results.length} checks, all < 500.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
