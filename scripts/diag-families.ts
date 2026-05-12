/**
 * Diagnostic: replicate the families page data fetch with logging.
 * Run with:  npx tsx scripts/diag-families.ts
 */
/* eslint-disable */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const TENANT = process.env.DIAG_TENANT_ID || "00000000-0000-0000-0000-000000000001";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  console.log("[diag] url        :", url);
  console.log("[diag] service key:", key ? `${key.slice(0, 10)}…(${key.length} chars)` : "MISSING");
  console.log("[diag] tenant     :", TENANT);

  const supabase = createClient(url, key, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("\n[step 1] Fetch teachers");
  const { data: teachers, error: teacherErr } = await supabase
    .from("teachers")
    .select("*")
    .eq("tenant_id", TENANT)
    .order("created_at", { ascending: false })
    .limit(500);
  console.log("  err  :", teacherErr?.message ?? "(none)");
  console.log("  count:", teachers?.length ?? 0);
  console.log("  sample:", teachers?.slice(0, 3).map((t: any) => ({
    id: t.id, display_name: t.display_name, first_name: t.first_name, last_name: t.last_name, status: t.status,
  })));

  const teacherNameById: Record<string, string> = {};
  for (const t of (teachers ?? []) as Array<any>) {
    const name =
      (t.display_name ?? "").trim() ||
      [t.first_name, t.last_name].filter(Boolean).join(" ").trim();
    if (name) teacherNameById[t.id] = name;
  }
  console.log("  teacherNameById size:", Object.keys(teacherNameById).length);

  console.log("\n[step 2] Fetch students");
  const { data: students, error: studentErr } = await supabase
    .from("students")
    .select("*")
    .eq("tenant_id", TENANT)
    .order("created_at", { ascending: false })
    .limit(2000);
  console.log("  err  :", studentErr?.message ?? "(none)");
  console.log("  count:", students?.length ?? 0);
  const withTeacherIdRaw = (students ?? []).filter((s: any) => Boolean(s.teacher_id));
  console.log("  students with teacher_id (raw column):", withTeacherIdRaw.length);
  console.log("  first student sample:", students?.slice(0, 1).map((s: any) => ({
    id: s.id, first_name: s.first_name, last_name: s.last_name, status: s.status,
    teacher_id: s.teacher_id, family_id: s.family_id, instrument: s.instrument,
  })));

  console.log("\n[step 3] Build studentsByFamily");
  const studentsByFamily: Record<string, any[]> = {};
  let resolved = 0;
  let unresolved = 0;
  for (const s of (students ?? []) as Array<any>) {
    if (!s.family_id) continue;
    if (!studentsByFamily[s.family_id]) studentsByFamily[s.family_id] = [];
    const teacherName = s.teacher_id ? (teacherNameById[s.teacher_id] ?? null) : null;
    if (s.teacher_id && teacherName) resolved++;
    else if (s.teacher_id && !teacherName) unresolved++;
    studentsByFamily[s.family_id].push({
      id: s.id,
      name: [s.first_name, s.last_name].filter(Boolean).join(" "),
      status: s.status,
      teacherId: s.teacher_id ?? null,
      teacherName,
    });
  }
  console.log("  families with students :", Object.keys(studentsByFamily).length);
  console.log("  teacher_id  -> name OK :", resolved);
  console.log("  teacher_id  -> name MISS:", unresolved);

  if (unresolved > 0) {
    const missIds = new Set<string>();
    for (const studs of Object.values(studentsByFamily)) {
      for (const s of studs) {
        if (s.teacherId && !s.teacherName) missIds.add(s.teacherId);
        if (missIds.size >= 5) break;
      }
      if (missIds.size >= 5) break;
    }
    console.log("  example unresolved teacher_ids:", Array.from(missIds));
  }

  console.log("\n[step 4] Build teacherByFamily (active only)");
  const teacherByFamily: Record<string, string> = {};
  let famsWithTeacher = 0;
  for (const [fam, studs] of Object.entries(studentsByFamily)) {
    const actives = studs.filter((s) => (s.status ?? "").toLowerCase() === "active");
    const names = new Set<string>();
    for (const s of actives) if (s.teacherName) names.add(s.teacherName);
    if (names.size > 0) {
      teacherByFamily[fam] = Array.from(names).sort().join(", ");
      famsWithTeacher++;
    }
  }
  console.log("  families with non-empty Teacher column:", famsWithTeacher);
  console.log("  first 3 entries:", Object.entries(teacherByFamily).slice(0, 3));
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
