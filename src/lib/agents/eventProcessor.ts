/**
 * Agent Event Processor
 *
 * Processes events from the events table and dispatches them to subscribed agents.
 * Called by API routes after emitting events (or can be called from a background job).
 *
 * Subscriptions (canonical):
 *   lead.created        → Star (send welcome email, update lead stage to "contacted")
 *   student.enrolled    → Star (send enrollment confirmation), Bub (create first invoice)
 *   invoice.created     → Bub (send invoice email to family)
 *   agreement.signed    → Sid (update student status to active)
 */

import { sendEmail } from "./tools/sendEmail";
import { getServiceClient } from "@/lib/supabase";

export interface AgentEvent {
  tenantId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
}

export async function processAgentEvent(event: AgentEvent): Promise<void> {
  const { tenantId, eventType, payload } = event;
  const db = getServiceClient();

  try {
    // ─── lead.created → Star ──────────────────────────────────────────────
    if (eventType === "lead.created") {
      const lead = payload.lead as Record<string, unknown> | undefined;
      if (!lead) return;

      const email = lead.email as string | null;
      const firstName = (lead.first_name as string) ?? "there";
      const instrument = (lead.instrument as string) ?? "music";

      // Update lead stage to "contacted"
      await db
        .from("leads")
        .update({ stage: "contacted", updated_at: new Date().toISOString() })
        .eq("id", lead.id as string)
        .eq("tenant_id", tenantId);

      // Send welcome email if we have an address
      if (email) {
        await sendEmail({
          to: email,
          subject: `Welcome! We received your inquiry about ${instrument} lessons`,
          body: `Hi ${firstName},\n\nThank you for reaching out about ${instrument} lessons! We're excited to connect with you.\n\nA member of our team will be in touch shortly to schedule your free trial lesson.\n\nIn the meantime, feel free to reply to this email with any questions.\n\nLooking forward to meeting you!\n\nThe Studio Team`,
        });
      }
    }

    // ─── student.enrolled → Bub (invoice trigger) ─────────────────────────
    if (eventType === "student.enrolled") {
      const enrollment = payload.enrollment as Record<string, unknown> | undefined;
      if (!enrollment) return;

      const studentId = payload.studentId as string ?? enrollment.student_id as string;

      // Fetch student to get rate info
      const { data: student } = await db
        .from("students")
        .select("id, first_name, last_name, email, rate_per_session, blocks_per_week, family_id")
        .eq("id", studentId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!student) return;

      // Create first invoice in square_invoices table
      const rate = (student.rate_per_session as number) ?? 0;
      const blocks = (student.blocks_per_week as number) ?? 1;
      const monthlyAmount = rate * blocks * 4; // approximate monthly

      if (monthlyAmount > 0) {
        await db.from("square_invoices").insert({
          tenant_id: tenantId,
          student_id: studentId,
          family_id: student.family_id ?? null,
          status: "draft",
          amount_cents: Math.round(monthlyAmount * 100),
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          created_at: new Date().toISOString(),
        });
      }

      // Send enrollment confirmation email
      const email = student.email as string | null;
      if (email) {
        await sendEmail({
          to: email,
          subject: "You're enrolled! Here's what happens next",
          body: `Hi ${student.first_name},\n\nGreat news — you're officially enrolled in lessons!\n\nYour first invoice will be sent shortly. If you have any questions about scheduling or billing, just reply to this email.\n\nWe can't wait to get started!\n\nThe Studio Team`,
        });
      }
    }

    // ─── agreement.signed → Sid (activate student) ────────────────────────
    if (eventType === "agreement.signed") {
      const agreement = payload.agreement as Record<string, unknown> | undefined;
      if (!agreement) return;

      const studentId = agreement.studentid as string ?? payload.studentId as string;
      if (!studentId) return;

      await db
        .from("students")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", studentId)
        .eq("tenant_id", tenantId);
    }

  } catch (err) {
    console.error(`[AgentEventProcessor] Error processing ${eventType}:`, err);
  }
}
