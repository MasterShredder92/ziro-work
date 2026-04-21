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
export async function processAgentEvent(event) {
    var _a, _b, _c, _d, _e, _f, _g;
    const { tenantId, eventType, payload } = event;
    const db = getServiceClient();
    try {
        // ─── lead.created → Star ──────────────────────────────────────────────
        if (eventType === "lead.created") {
            const lead = payload.lead;
            if (!lead)
                return;
            const email = lead.email;
            const firstName = (_a = lead.first_name) !== null && _a !== void 0 ? _a : "there";
            const instrument = (_b = lead.instrument) !== null && _b !== void 0 ? _b : "music";
            // Update lead stage to "contacted"
            await db
                .from("leads")
                .update({ stage: "contacted", updated_at: new Date().toISOString() })
                .eq("id", lead.id)
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
            const enrollment = payload.enrollment;
            if (!enrollment)
                return;
            const studentId = (_c = payload.studentId) !== null && _c !== void 0 ? _c : enrollment.student_id;
            // Fetch student to get rate info
            const { data: student } = await db
                .from("students")
                .select("id, first_name, last_name, email, rate_per_session, blocks_per_week, family_id")
                .eq("id", studentId)
                .eq("tenant_id", tenantId)
                .maybeSingle();
            if (!student)
                return;
            // Create first invoice in square_invoices table
            const rate = (_d = student.rate_per_session) !== null && _d !== void 0 ? _d : 0;
            const blocks = (_e = student.blocks_per_week) !== null && _e !== void 0 ? _e : 1;
            const monthlyAmount = rate * blocks * 4; // approximate monthly
            if (monthlyAmount > 0) {
                await db.from("square_invoices").insert({
                    tenant_id: tenantId,
                    student_id: studentId,
                    family_id: (_f = student.family_id) !== null && _f !== void 0 ? _f : null,
                    status: "draft",
                    amount_cents: Math.round(monthlyAmount * 100),
                    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                    created_at: new Date().toISOString(),
                });
            }
            // Send enrollment confirmation email
            const email = student.email;
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
            const agreement = payload.agreement;
            if (!agreement)
                return;
            const studentId = (_g = agreement.studentid) !== null && _g !== void 0 ? _g : payload.studentId;
            if (!studentId)
                return;
            await db
                .from("students")
                .update({ status: "active", updated_at: new Date().toISOString() })
                .eq("id", studentId)
                .eq("tenant_id", tenantId);
        }
    }
    catch (err) {
        console.error(`[AgentEventProcessor] Error processing ${eventType}:`, err);
    }
}
