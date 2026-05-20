/**
 * ZiroWork Recurring Billing Engine
 *
 * - Detects 5th-week months and auto-labels those sessions as "5th-week Makeup"
 * - Generates monthly invoices for all active subscriptions
 * - Dry-run mode: returns what WOULD be created without writing to DB
 *
 * Trigger: Run on the 1st of each month (cron job or manual trigger via /api/billing/generate-monthly)
 */

import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

// ── Types ─────────────────────────────────────────────────────────────────────

export type GeneratedInvoicePreview = {
  student_id: string;
  student_name: string;
  family_id: string | null;
  subscription_plan_name: string;
  base_price: number;
  session_count: number;
  fifth_week_count: number;
  line_items: {
    description: string;
    quantity: number;
    unit_price: number;
    is_makeup: boolean;
    is_fifth_week: boolean;
  }[];
  total: number;
  due_date: string;
};

export type RecurringBillingResult = {
  month: string;          // "2026-05"
  dry_run: boolean;
  invoices_generated: number;
  invoices_skipped: number;
  fifth_week_sessions: number;
  previews: GeneratedInvoicePreview[];
  errors: string[];
};

// ── 5th-Week Detection ────────────────────────────────────────────────────────

/**
 * Returns the number of occurrences of a given weekday (0=Sun…6=Sat) in a month.
 */
export function weekdayCountInMonth(year: number, month: number, weekday: number): number {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  let count = 0;
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === weekday) count++;
  }
  return count;
}

/**
 * Returns true if the given month has a 5th occurrence of any weekday.
 * (Any month with 29+ days will have at least one weekday that appears 5 times.)
 */
export function monthHasFifthWeek(year: number, month: number): boolean {
  const daysInMonth = new Date(year, month, 0).getDate();
  return daysInMonth >= 29; // 29, 30, 31 day months always have a 5th week
}

/**
 * Returns all weekdays (0-6) that appear exactly 5 times in the given month.
 */
export function fifthWeekDays(year: number, month: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6].filter(wd => weekdayCountInMonth(year, month, wd) === 5);
}

/**
 * Given a lesson weekday and a month, returns the date of the 5th occurrence (if any).
 * Returns null if the weekday only appears 4 times that month.
 */
export function fifthOccurrenceDate(year: number, month: number, weekday: number): Date | null {
  const count = weekdayCountInMonth(year, month, weekday);
  if (count < 5) return null;

  let found = 0;
  for (let d = new Date(year, month - 1, 1); d.getMonth() === month - 1; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === weekday) {
      found++;
      if (found === 5) return new Date(d);
    }
  }
  return null;
}

// ── Invoice Generation ────────────────────────────────────────────────────────

/**
 * Generate monthly invoices for all active subscriptions.
 *
 * @param targetYear  - Year to generate for (default: current)
 * @param targetMonth - Month to generate for (1-12, default: current)
 * @param dryRun      - If true, returns previews without writing to DB
 */
export async function generateMonthlyInvoices(
  targetYear?: number,
  targetMonth?: number,
  dryRun = false,
): Promise<RecurringBillingResult> {
  const now = new Date();
  const year = targetYear ?? now.getFullYear();
  const month = targetMonth ?? (now.getMonth() + 1);
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  // Due date = 5th of the month
  const dueDate = `${year}-${String(month).padStart(2, "0")}-05`;

  const hasFifthWeek = monthHasFifthWeek(year, month);
  const fifthDays = fifthWeekDays(year, month);

  assertServiceRoleAllowed("src/lib/billing/recurringBilling.ts — service-role module; internal/background operations only");
  const db = getServiceClient();
  const errors: string[] = [];
  const previews: GeneratedInvoicePreview[] = [];
  let invoicesGenerated = 0;
  let invoicesSkipped = 0;
  let fifthWeekSessions = 0;

  // ── Fetch active subscriptions with plan + student data ──
  const { data: subscriptions, error: subError } = await db
    .from("subscriptions")
    .select(`
      id,
      student_id,
      family_id,
      billing_plan_id,
      metadata,
      students (
        id,
        first_name,
        last_name,
        instrument
      ),
      billing_plans (
        id,
        name,
        amount_cents,
        interval,
        interval_count
      )
    `)
    .eq("status", "active");

  if (subError) {
    return {
      month: monthStr,
      dry_run: dryRun,
      invoices_generated: 0,
      invoices_skipped: 0,
      fifth_week_sessions: 0,
      previews: [],
      errors: [`Failed to fetch subscriptions: ${subError.message}`],
    };
  }

  for (const sub of (subscriptions ?? [])) {
    try {
      const student = Array.isArray(sub.students) ? sub.students[0] : sub.students;
      const plan = Array.isArray(sub.billing_plans) ? sub.billing_plans[0] : sub.billing_plans;

      if (!student || !plan) {
        invoicesSkipped++;
        continue;
      }

      // Check if invoice already exists for this month
      if (!dryRun) {
        const { data: existing } = await db
          .from("invoices")
          .select("id")
          .eq("student_id", sub.student_id)
          .gte("issued_at", `${year}-${String(month).padStart(2, "0")}-01`)
          .lt("issued_at", `${year}-${String(month + 1).padStart(2, "0")}-01`)
          .limit(1);

        if (existing && existing.length > 0) {
          invoicesSkipped++;
          continue;
        }
      }

      const basePrice = (plan.amount_cents ?? 0) / 100;
      const studentName = `${student.first_name} ${student.last_name}`;

      // ── Determine lesson weekday from metadata ──
      // metadata.lesson_weekday: 0-6 (Sun-Sat)
      const meta = (sub.metadata as Record<string, unknown>) ?? {};
      const lessonWeekday = typeof meta.lesson_weekday === "number" ? meta.lesson_weekday : null;

      // ── Build line items ──
      const lineItems: GeneratedInvoicePreview["line_items"] = [];
      let sessionCount = 4; // Standard: 4 sessions/month
      let fifthWeekCount = 0;

      // Standard sessions line item
      lineItems.push({
        description: `${plan.name} — ${monthStr} (4 sessions)`,
        quantity: 4,
        unit_price: basePrice / 4,
        is_makeup: false,
        is_fifth_week: false,
      });

      // 5th-week detection
      if (hasFifthWeek && lessonWeekday !== null && fifthDays.includes(lessonWeekday)) {
        sessionCount = 5;
        fifthWeekCount = 1;
        fifthWeekSessions++;

        const fifthDate = fifthOccurrenceDate(year, month, lessonWeekday);
        const dateStr = fifthDate
          ? fifthDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "5th week";

        lineItems.push({
          description: `5th-Week Makeup Session — ${dateStr} (pre-paid, no extra charge)`,
          quantity: 1,
          unit_price: 0,
          is_makeup: true,
          is_fifth_week: true,
        });
      }

      const total = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);

      const preview: GeneratedInvoicePreview = {
        student_id: sub.student_id,
        student_name: studentName,
        family_id: sub.family_id ?? null,
        subscription_plan_name: plan.name,
        base_price: basePrice,
        session_count: sessionCount,
        fifth_week_count: fifthWeekCount,
        line_items: lineItems,
        total,
        due_date: dueDate,
      };

      previews.push(preview);

      if (!dryRun) {
        // Generate live_url_token
        const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

        const { data: invoice, error: invoiceError } = await db
          .from("invoices")
          .insert({
            tenant_id: (meta.tenant_id as string) ?? undefined,
            student_id: sub.student_id,
            family_id: sub.family_id ?? null,
            status: "draft",
            amount_cents: Math.round(total * 100),
            subtotal_cents: Math.round(total * 100),
            total_cents: Math.round(total * 100),
            balance_cents: Math.round(total * 100),
            due_date: dueDate,
            issued_at: new Date().toISOString(),
            description: `${monthStr} lessons — ${studentName}`,
            live_url_token: token,
            metadata: {
              generated_by: "recurring_billing",
              month: monthStr,
              subscription_id: sub.id,
            },
          })
          .select("id")
          .single();

        if (invoiceError) {
          errors.push(`Student ${studentName}: ${invoiceError.message}`);
          invoicesSkipped++;
          continue;
        }

        // Insert line items
        if (invoice) {
          const itemRows = lineItems.map((item, idx) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            is_makeup_session: item.is_makeup,
            is_fifth_week: item.is_fifth_week,
            sort_order: idx,
          }));

          await db.from("invoice_items").insert(itemRows);
        }

        invoicesGenerated++;
      } else {
        invoicesGenerated++; // Count previews as "would generate"
      }
    } catch (err) {
      errors.push(`Subscription ${sub.id}: ${err instanceof Error ? err.message : String(err)}`);
      invoicesSkipped++;
    }
  }

  return {
    month: monthStr,
    dry_run: dryRun,
    invoices_generated: invoicesGenerated,
    invoices_skipped: invoicesSkipped,
    fifth_week_sessions: fifthWeekSessions,
    previews,
    errors,
  };
}
