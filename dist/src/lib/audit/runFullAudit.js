import { createClient } from "@supabase/supabase-js";
const COMMON = {
    id: { type: "uuid" },
    tenant_id: { type: "uuid" },
    created_at: { type: "timestamp with time zone" },
    updated_at: { type: "timestamp with time zone" },
};
const EXPECTED = {
    students: {
        columns: Object.assign(Object.assign({}, COMMON), { family_id: { type: "uuid", nullable: true }, first_name: { type: "text" }, last_name: { type: "text" }, email: { type: "text", nullable: true }, phone: { type: "text", nullable: true }, status: { type: "text" } }),
        primaryKey: ["id"],
        foreignKeys: [
            { column: "family_id", refTable: "families", refColumn: "id" },
        ],
        indexes: [{ columns: ["tenant_id"] }, { columns: ["family_id"] }],
    },
    families: {
        columns: Object.assign(Object.assign({}, COMMON), { name: { type: "text" }, primary_email: { type: "text", nullable: true }, primary_phone: { type: "text", nullable: true } }),
        primaryKey: ["id"],
        foreignKeys: [],
        indexes: [{ columns: ["tenant_id"] }],
    },
    teachers: {
        columns: Object.assign(Object.assign({}, COMMON), { first_name: { type: "text" }, last_name: { type: "text" }, email: { type: "text", nullable: true }, phone: { type: "text", nullable: true }, status: { type: "text" } }),
        primaryKey: ["id"],
        foreignKeys: [],
        indexes: [{ columns: ["tenant_id"] }],
    },
    enrollments: {
        columns: Object.assign(Object.assign({}, COMMON), { student_id: { type: "uuid" }, teacher_id: { type: "uuid" }, start_date: { type: "date", nullable: true }, end_date: { type: "date", nullable: true }, status: { type: "text" } }),
        primaryKey: ["id"],
        foreignKeys: [
            { column: "student_id", refTable: "students", refColumn: "id" },
            { column: "teacher_id", refTable: "teachers", refColumn: "id" },
        ],
        indexes: [
            { columns: ["tenant_id"] },
            { columns: ["student_id"] },
            { columns: ["teacher_id"] },
        ],
    },
    schedules: {
        columns: Object.assign(Object.assign({}, COMMON), { enrollment_id: { type: "uuid" }, teacher_id: { type: "uuid", nullable: true }, student_id: { type: "uuid", nullable: true }, starts_at: { type: "timestamp with time zone" }, ends_at: { type: "timestamp with time zone" }, status: { type: "text" } }),
        primaryKey: ["id"],
        foreignKeys: [
            { column: "enrollment_id", refTable: "enrollments", refColumn: "id" },
        ],
        indexes: [
            { columns: ["tenant_id"] },
            { columns: ["enrollment_id"] },
            { columns: ["starts_at"] },
        ],
    },
    invoices: {
        columns: Object.assign(Object.assign({}, COMMON), { family_id: { type: "uuid" }, amount_cents: { type: "integer" }, currency: { type: "text" }, status: { type: "text" }, due_date: { type: "date", nullable: true } }),
        primaryKey: ["id"],
        foreignKeys: [
            { column: "family_id", refTable: "families", refColumn: "id" },
        ],
        indexes: [{ columns: ["tenant_id"] }, { columns: ["family_id"] }],
    },
    payments: {
        columns: Object.assign(Object.assign({}, COMMON), { invoice_id: { type: "uuid" }, amount_cents: { type: "integer" }, currency: { type: "text" }, method: { type: "text", nullable: true }, status: { type: "text" }, paid_at: { type: "timestamp with time zone", nullable: true } }),
        primaryKey: ["id"],
        foreignKeys: [
            { column: "invoice_id", refTable: "invoices", refColumn: "id" },
        ],
        indexes: [{ columns: ["tenant_id"] }, { columns: ["invoice_id"] }],
    },
    lifecycle: {
        columns: Object.assign(Object.assign({}, COMMON), { entity_type: { type: "text" }, entity_id: { type: "uuid" }, stage: { type: "text" }, previous_stage: { type: "text", nullable: true }, changed_at: { type: "timestamp with time zone" } }),
        primaryKey: ["id"],
        foreignKeys: [],
        indexes: [
            { columns: ["tenant_id"] },
            { columns: ["entity_type", "entity_id"] },
        ],
    },
    notes: {
        columns: Object.assign(Object.assign({}, COMMON), { entity_type: { type: "text" }, entity_id: { type: "uuid" }, author_id: { type: "uuid", nullable: true }, body: { type: "text" } }),
        primaryKey: ["id"],
        foreignKeys: [],
        indexes: [
            { columns: ["tenant_id"] },
            { columns: ["entity_type", "entity_id"] },
        ],
    },
};
function emptyResult(exists) {
    return {
        exists,
        missingColumns: [],
        wrongTypes: [],
        missingForeignKeys: [],
        missingIndexes: [],
        sampleRowShapeMatches: false,
    };
}
function normalizeType(t) {
    if (!t)
        return "";
    const v = t.toLowerCase().trim();
    if (v === "timestamptz")
        return "timestamp with time zone";
    if (v === "timestamp")
        return "timestamp without time zone";
    if (v === "int" || v === "int4")
        return "integer";
    if (v === "int8")
        return "bigint";
    if (v === "varchar" || v === "character varying")
        return "text";
    return v;
}
async function rpcOrQuery(supabase, sql) {
    var _a;
    const { data, error } = await supabase.rpc("exec_sql", { query: sql });
    if (error)
        return null;
    return (_a = data) !== null && _a !== void 0 ? _a : null;
}
async function fetchColumns(supabase, table) {
    return rpcOrQuery(supabase, `select column_name, data_type, udt_name, is_nullable
     from information_schema.columns
     where table_schema = 'public' and table_name = '${table}'`);
}
async function fetchForeignKeys(supabase, table) {
    return rpcOrQuery(supabase, `select kcu.column_name,
            ccu.table_name as foreign_table_name,
            ccu.column_name as foreign_column_name
     from information_schema.table_constraints tc
     join information_schema.key_column_usage kcu
       on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
     join information_schema.constraint_column_usage ccu
       on ccu.constraint_name = tc.constraint_name
      and ccu.table_schema = tc.table_schema
     where tc.constraint_type = 'FOREIGN KEY'
       and tc.table_schema = 'public'
       and tc.table_name = '${table}'`);
}
async function fetchIndexes(supabase, table) {
    return rpcOrQuery(supabase, `select indexname, indexdef
     from pg_indexes
     where schemaname = 'public' and tablename = '${table}'`);
}
async function fetchPrimaryKey(supabase, table) {
    return rpcOrQuery(supabase, `select kcu.column_name
     from information_schema.table_constraints tc
     join information_schema.key_column_usage kcu
       on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
     where tc.constraint_type = 'PRIMARY KEY'
       and tc.table_schema = 'public'
       and tc.table_name = '${table}'`);
}
async function tableExists(supabase, table) {
    const { error } = await supabase.from(table).select("*").limit(0);
    if (!error)
        return true;
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("does not exist") ||
        msg.includes("not found") ||
        msg.includes("could not find") ||
        msg.includes("relation")) {
        return false;
    }
    return true;
}
async function fetchSampleRow(supabase, table) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error || !data || data.length === 0)
        return null;
    return data[0];
}
function indexMatches(have, want) {
    const wantCols = want.columns.map((c) => c.toLowerCase());
    return have.some((idx) => {
        const def = idx.indexdef.toLowerCase();
        const m = def.match(/\(([^)]*)\)/);
        if (!m)
            return false;
        const cols = m[1]
            .split(",")
            .map((c) => c.trim().split(" ")[0].replace(/"/g, ""));
        if (cols.length < wantCols.length)
            return false;
        for (let i = 0; i < wantCols.length; i++) {
            if (cols[i] !== wantCols[i])
                return false;
        }
        return true;
    });
}
async function auditTable(supabase, name, spec) {
    const exists = await tableExists(supabase, name);
    if (!exists)
        return emptyResult(false);
    const result = emptyResult(true);
    const columns = await fetchColumns(supabase, name);
    const fks = await fetchForeignKeys(supabase, name);
    const indexes = await fetchIndexes(supabase, name);
    const pk = await fetchPrimaryKey(supabase, name);
    const colMap = new Map();
    if (columns) {
        for (const c of columns)
            colMap.set(c.column_name, c);
    }
    if (columns) {
        for (const [colName, colSpec] of Object.entries(spec.columns)) {
            const found = colMap.get(colName);
            if (!found) {
                result.missingColumns.push(colName);
                continue;
            }
            const have = normalizeType(found.data_type) || normalizeType(found.udt_name);
            const want = normalizeType(colSpec.type);
            if (have !== want) {
                result.wrongTypes.push(`${colName}:${have}!=${want}`);
            }
        }
    }
    else {
        for (const colName of Object.keys(spec.columns)) {
            result.missingColumns.push(colName);
        }
    }
    if (!pk || pk.length === 0) {
        result.missingColumns.push("__primary_key__");
    }
    else {
        const pkCols = pk.map((p) => p.column_name);
        for (const want of spec.primaryKey) {
            if (!pkCols.includes(want)) {
                result.missingColumns.push(`__pk:${want}__`);
            }
        }
    }
    if (fks) {
        for (const want of spec.foreignKeys) {
            const ok = fks.some((f) => f.column_name === want.column &&
                f.foreign_table_name === want.refTable &&
                f.foreign_column_name === want.refColumn);
            if (!ok) {
                result.missingForeignKeys.push(`${want.column}->${want.refTable}.${want.refColumn}`);
            }
        }
    }
    else {
        for (const want of spec.foreignKeys) {
            result.missingForeignKeys.push(`${want.column}->${want.refTable}.${want.refColumn}`);
        }
    }
    if (indexes) {
        for (const want of spec.indexes) {
            if (!indexMatches(indexes, want)) {
                result.missingIndexes.push(want.columns.join(","));
            }
        }
    }
    else {
        for (const want of spec.indexes) {
            result.missingIndexes.push(want.columns.join(","));
        }
    }
    const sample = await fetchSampleRow(supabase, name);
    if (sample === null) {
        result.sampleRowShapeMatches = result.missingColumns.length === 0;
    }
    else {
        const sampleKeys = new Set(Object.keys(sample));
        let matches = true;
        for (const colName of Object.keys(spec.columns)) {
            if (!sampleKeys.has(colName)) {
                matches = false;
                break;
            }
        }
        result.sampleRowShapeMatches = matches;
    }
    return result;
}
export async function runFullAudit() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const report = {
        tables: {},
        readyForMigration: false,
    };
    if (!supabaseUrl || !serviceKey) {
        for (const name of Object.keys(EXPECTED)) {
            report.tables[name] = emptyResult(false);
        }
        return report;
    }
    const supabase = createClient(supabaseUrl, serviceKey, {
        db: { schema: "public" },
        auth: { persistSession: false, autoRefreshToken: false },
    });
    for (const [name, spec] of Object.entries(EXPECTED)) {
        try {
            report.tables[name] = await auditTable(supabase, name, spec);
        }
        catch (_a) {
            report.tables[name] = emptyResult(false);
        }
    }
    report.readyForMigration = Object.values(report.tables).every((t) => t.exists &&
        t.missingColumns.length === 0 &&
        t.wrongTypes.length === 0 &&
        t.missingForeignKeys.length === 0 &&
        t.missingIndexes.length === 0 &&
        t.sampleRowShapeMatches);
    return report;
}
