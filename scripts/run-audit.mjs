import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env.local") });
config({ path: path.resolve(__dirname, "..", ".env") });

const EXPECTED_TABLES = [
  "students",
  "families",
  "teachers",
  "enrollments",
  "schedules",
  "invoices",
  "payments",
  "lifecycle",
  "notes",
];

const EXPECTED_COLUMNS = {
  students: ["id", "tenant_id", "first_name", "last_name", "status"],
  families: ["id", "tenant_id", "name"],
  teachers: ["id", "tenant_id", "first_name", "last_name", "status"],
  enrollments: ["id", "tenant_id", "student_id", "teacher_id", "status"],
  schedules: ["id", "tenant_id", "enrollment_id", "starts_at", "ends_at"],
  invoices: ["id", "tenant_id", "family_id", "amount_cents", "status"],
  payments: ["id", "tenant_id", "invoice_id", "amount_cents", "status"],
  lifecycle: ["id", "tenant_id", "entity_type", "entity_id", "stage"],
  notes: ["id", "tenant_id", "entity_type", "entity_id", "body"],
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.log(JSON.stringify({ error: "Missing env", tables: {}, readyForMigration: false }, null, 2));
    process.exit(1);
  }

  const projectRef = (url.match(/https?:\/\/([^.]+)\./) || [])[1] || "unknown";

  const supabase = createClient(url, serviceKey, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const report = {
    projectRef,
    supabaseUrl: url,
    tables: {},
    readyForMigration: false,
  };

  for (const table of EXPECTED_TABLES) {
    const entry = {
      exists: false,
      rowCount: null,
      missingColumns: [],
      sampleRowShapeMatches: false,
    };

    const { error: headErr, count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (headErr) {
      const msg = (headErr.message || "").toLowerCase();
      if (msg.includes("does not exist") || msg.includes("could not find") || msg.includes("not found") || msg.includes("schema cache")) {
        entry.exists = false;
        report.tables[table] = entry;
        continue;
      }
      entry.exists = false;
      entry.error = headErr.message;
      report.tables[table] = entry;
      continue;
    }

    entry.exists = true;
    entry.rowCount = count ?? 0;

    const { data: sample } = await supabase.from(table).select("*").limit(1);
    const row = Array.isArray(sample) && sample.length > 0 ? sample[0] : null;
    if (row) {
      const keys = new Set(Object.keys(row));
      entry.missingColumns = EXPECTED_COLUMNS[table].filter((c) => !keys.has(c));
      entry.sampleRowShapeMatches = entry.missingColumns.length === 0;
    } else {
      entry.sampleRowShapeMatches = entry.missingColumns.length === 0;
    }

    report.tables[table] = entry;
  }

  report.readyForMigration = Object.values(report.tables).every(
    (t) => t.exists && t.missingColumns.length === 0
  );

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.log(JSON.stringify({ error: err?.message || String(err), stack: err?.stack }, null, 2));
  process.exit(1);
});
