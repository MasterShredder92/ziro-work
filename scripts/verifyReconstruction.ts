import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const REAL_SCHOOLS = ["Bellevue", "Gretna", "Elkhorn", "Omaha"] as const;
const DEMO_SCHOOLS = ["Demo", "North Studio", "South Studio"] as const;
const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const tenantId = process.env.TARGET_TENANT_ID?.trim() || DEFAULT_TENANT_ID;

  const supabase = createClient(url, key, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const checks: Array<{ label: string; query: string }> = [
    {
      label: "real schools present",
      query: `select count(*)::int as value from locations where tenant_id='${tenantId}' and name in ('${REAL_SCHOOLS.join("','")}') and is_active=true`,
    },
    {
      label: "demo schools present",
      query: `select count(*)::int as value from locations where tenant_id='${tenantId}' and name in ('${DEMO_SCHOOLS.join("','")}')`,
    },
    {
      label: "schedule invalid student refs",
      query: `select count(*)::int as value from schedule_blocks sb left join students s on s.id=sb.student_id where sb.tenant_id='${tenantId}' and sb.student_id is not null and s.id is null`,
    },
    {
      label: "schedule invalid teacher refs",
      query: `select count(*)::int as value from schedule_blocks sb left join teachers t on t.id=sb.teacher_id where sb.tenant_id='${tenantId}' and t.id is null`,
    },
    {
      label: "schedule invalid location refs",
      query: `select count(*)::int as value from schedule_blocks sb left join locations l on l.id=sb.location_id where sb.tenant_id='${tenantId}' and l.id is null`,
    },
    {
      label: "students invalid family refs",
      query: `select count(*)::int as value from students s left join families f on f.id=s.family_id where s.tenant_id='${tenantId}' and s.family_id is not null and f.id is null`,
    },
    {
      label: "student tenant mismatches",
      query: `select count(*)::int as value from students where tenant_id<>'${tenantId}'`,
    },
    {
      label: "teacher tenant mismatches",
      query: `select count(*)::int as value from teachers where tenant_id<>'${tenantId}'`,
    },
    {
      label: "family tenant mismatches",
      query: `select count(*)::int as value from families where tenant_id<>'${tenantId}'`,
    },
  ];

  console.log(`Verification tenant: ${tenantId}`);
  for (const check of checks) {
    const { data, error } = await supabase.rpc("exec_sql", { query: check.query });
    if (error) {
      console.log(`- ${check.label}: ERROR (${error.message})`);
      continue;
    }
    const value = Array.isArray(data) ? Number((data[0] as { value?: number })?.value ?? 0) : 0;
    console.log(`- ${check.label}: ${value}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
