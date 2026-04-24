import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, notFound, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ── BILLING EXCLUSION GUARD ──────────────────────────────────
   These tables are strictly forbidden from this endpoint.
   Billing data lives at the Family level only.
   FORBIDDEN: invoices, invoice_items, payments, family_billing,
              billing_records, rate_tiers, square_invoices
──────────────────────────────────────────────────────── */
const BILLING_TABLES_FORBIDDEN = [
  "invoices", "invoice_items", "payments",
  "family_billing", "billing_records",
  "rate_tiers", "square_invoices",
] as const;
function assertNoBillingQuery(tableName: string): void {
  if ((BILLING_TABLES_FORBIDDEN as readonly string[]).includes(tableName)) {
    throw new Error(
      `[Timeline] BILLING DATA BLOCKED: table "${tableName}" is forbidden in the student timeline. ` +
      `Billing data belongs at the Family level only.`
    );
  }
}

type EventType = "attendance" | "upload" | "note" | "system_update";

type TimelineEvent = {
  id: string;
  event_type: EventType;
  description: string;
  source_id: string | null;
  created_at: string;
  created_by_name: string | null;
  created_by_role: string | null;
};

type RouteContext = { params: Promise<{ id: string }> };

/* ── GET /api/crm/students/[id]/timeline ─────────────────────────
   Unified immutable audit ledger. Sources:
     session_log     → attendance
     student_notes   → note
     student_files   → upload
     student_events  → system_update
   Query params: event_type (filter), limit (default 100, max 500)
──────────────────────────────────────────────────────── */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: studentId } = await ctx.params;
    const { tenantId } = resolved.context;
    const supabase = getServiceClient();

    const url = new URL(req.url);
    const filterType = url.searchParams.get("event_type") as EventType | null;
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

    // Verify student belongs to this tenant and get family_id
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, family_id")
      .eq("id", studentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (studentError) return serverError(studentError);
    if (!student) return notFound();

    const events: TimelineEvent[] = [];

    // ── 1. Attendance (session_log) ──────────────────────────────
    if (!filterType || filterType === "attendance") {
      const { data: sessions, error: sessErr } = await supabase
        .from("session_log")
        .select("id, block_date, status, notes, teacher_note, lesson_notes, created_at")
        .eq("student_id", studentId)
        .eq("tenant_id", tenantId)
        .is("archived_at", null)
        .order("block_date", { ascending: false })
        .limit(limit);
      if (!sessErr && sessions) {
        for (const s of sessions) {
          const statusLabel = s.status
            ? s.status.charAt(0).toUpperCase() + s.status.slice(1).replace(/_/g, " ")
            : "Session";
          const note = s.lesson_notes ?? s.teacher_note ?? s.notes ?? null;
          const desc = note
            ? `${statusLabel} — ${(note as string).slice(0, 120)}${(note as string).length > 120 ? "…" : ""}`
            : statusLabel;
          events.push({
            id: `att_${s.id}`,
            event_type: "attendance",
            description: desc,
            source_id: s.id,
            created_at: s.block_date ?? s.created_at,
            created_by_name: null,
            created_by_role: null,
          });
        }
      }
    }

    // ── 2. Notes (student_notes) ────────────────────────────────
    if (!filterType || filterType === "note") {
      const { data: notes, error: notesErr } = await supabase
        .from("student_notes")
        .select("id, body, note_type, author_name, author_role, created_at")
        .eq("student_id", studentId)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!notesErr && notes) {
        for (const n of notes) {
          const typeLabel = n.note_type ? ` [${(n.note_type as string).replace(/_/g, " ")}]` : "";
          const body = (n.body as string) ?? "";
          events.push({
            id: `note_${n.id}`,
            event_type: "note",
            description: `Note${typeLabel}: ${body.slice(0, 140)}${body.length > 140 ? "…" : ""}`,
            source_id: n.id,
            created_at: n.created_at,
            created_by_name: (n.author_name as string) ?? null,
            created_by_role: (n.author_role as string) ?? null,
          });
        }
      }
    }

    // ── 3. Uploads (student_files) ─────────────────────────────
    if (!filterType || filterType === "upload") {
      const { data: files, error: filesErr } = await supabase
        .from("student_files")
        .select("id, file_name, uploaded_by_role, created_at")
        .eq("student_id", studentId)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!filesErr && files) {
        for (const f of files) {
          events.push({
            id: `upload_${f.id}`,
            event_type: "upload",
            description: `File uploaded: ${(f.file_name as string) ?? "Unnamed file"}`,
            source_id: f.id,
            created_at: f.created_at,
            created_by_name: null,
            created_by_role: (f.uploaded_by_role as string) ?? null,
          });
        }
      }
    }

    // ── 4. System updates (student_events) ──────────────────────
    if (!filterType || filterType === "system_update") {
      const { data: sysEvents, error: sysErr } = await supabase
        .from("student_events")
        .select("id, event_type, description, source_id, created_at, created_by_name, created_by_role")
        .eq("student_id", studentId)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!sysErr && sysEvents) {
        for (const e of sysEvents) {
          events.push({
            id: `sys_${e.id}`,
            event_type: e.event_type as EventType,
            description: e.description,
            source_id: e.source_id ?? null,
            created_at: e.created_at,
            created_by_name: e.created_by_name ?? null,
            created_by_role: e.created_by_role ?? null,
          });
        }
      }
    }

    // Sort all events newest-first
    events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return ok({
      data: events.slice(0, limit),
      meta: {
        student_id: studentId,
        family_id: (student as { id: string; family_id?: string }).family_id ?? null,
        total: events.length,
        billing_excluded: true,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("[Timeline] BILLING DATA BLOCKED")) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return serverError(err);
  }
}
