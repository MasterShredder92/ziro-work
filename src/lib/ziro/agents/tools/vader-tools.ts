/**
 * Vader Tool Definitions
 * 
 * Tools for financial and billing management.
 * All write operations require human approval.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function read_invoices({
  studioId,
  studentId,
  status,
  limit = 20,
}: {
  studioId: string;
  studentId?: string;
  status?: string;
  limit?: number;
}) {
  let query = supabase
    .from("invoices")
    .select(`
      id, amount, status, due_date, paid_date,
      student:students(first_name, last_name),
      description, created_at
    `)
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (studentId) query = query.eq("student_id", studentId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, invoices: data, count: data?.length || 0 };
}

export async function create_invoice({
  studioId,
  studentId,
  amount,
  description,
  dueDate,
}: {
  studioId: string;
  studentId: string;
  amount: number;
  description: string;
  dueDate: string;
}) {
  const { data, error } = await supabase
    .from("invoices")
    .insert([{
      studio_id: studioId,
      student_id: studentId,
      amount,
      description,
      due_date: dueDate,
      status: "pending",
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, invoice: data, message: `Invoice for $${amount} created` };
}

export async function check_balance({ studioId }: { studioId: string }) {
  const { data, error } = await supabase
    .from("invoices")
    .select("amount, status")
    .eq("studio_id", studioId);

  if (error) return { success: false, error: error.message };

  const totalRevenue = data?.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0) || 0;
  const outstanding = data?.filter(i => i.status === "pending").reduce((sum, i) => sum + i.amount, 0) || 0;
  const overdue = data?.filter(i => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0) || 0;

  return {
    success: true,
    balance: { totalRevenue, outstanding, overdue },
    message: `Revenue: $${totalRevenue} | Outstanding: $${outstanding} | Overdue: $${overdue}`,
  };
}

export async function generate_report({
  studioId,
  reportType,
  startDate,
  endDate,
}: {
  studioId: string;
  reportType: "revenue" | "attendance" | "retention";
  startDate: string;
  endDate: string;
}) {
  if (reportType === "revenue") {
    const { data, error } = await supabase
      .from("invoices")
      .select("amount, status, paid_date, created_at")
      .eq("studio_id", studioId)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (error) return { success: false, error: error.message };

    const paid = data?.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0) || 0;
    const pending = data?.filter(i => i.status === "pending").reduce((sum, i) => sum + i.amount, 0) || 0;

    return {
      success: true,
      report: { type: "revenue", period: { startDate, endDate }, paid, pending, total: paid + pending },
    };
  }

  return { success: false, error: "Report type not yet implemented" };
}

export const VADER_TOOLS = {
  read_invoices,
  create_invoice,
  check_balance,
  generate_report,
};
