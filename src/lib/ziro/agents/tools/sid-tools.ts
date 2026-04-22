/**
 * Sid Tool Definitions — SOVEREIGN SCHEMA
 *
 * Tools for managing student and teacher data.
 * All queries use tenant_id isolation and ilike for resilient name matching.
 * Legacy "instructors" table replaced with "teachers".
 */

import { createClient } from "@supabase/supabase-js";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const TENANT_ID = DEFAULT_TENANT_ID;

export async function read_student({
  studentId,
  studentName,
}: {
  studentId?: string;
  studentName?: string;
}) {
  const supabase = getSupabase();

  if (studentId) {
    const { data, error } = await supabase
      .from("students")
      .select("id, first_name, last_name, email, phone, instrument, status, bio, goals, prior_experience, notes, parent_name, parent_email, parent_phone, created_at")
      .eq("id", studentId)
      .eq("tenant_id", TENANT_ID)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, student: data };
  }

  if (studentName) {
    const parts = studentName.trim().split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    const { data, error } = await supabase
      .from("students")
      .select("id, first_name, last_name, email, phone, instrument, status, bio, goals, prior_experience, notes, parent_name, parent_email, parent_phone, created_at")
      .eq("tenant_id", TENANT_ID)
      .ilike("first_name", "%" + firstName + "%")
      .ilike("last_name", "%" + lastName + "%");

    if (error) return { success: false, error: error.message };
    if (!data || data.length === 0) return { success: false, error: "No student found matching: " + studentName };
    return { success: true, student: data[0], matchCount: data.length };
  }

  return { success: false, error: "Provide studentId or studentName" };
}

export async function update_student_bio({
  studentId,
  updates,
}: {
  studentId: string;
  updates: Record<string, any>;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("students")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", studentId)
    .eq("tenant_id", TENANT_ID)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, student: data, message: "Student profile updated" };
}

export async function read_instructor({
  teacherId,
  teacherName,
}: {
  teacherId?: string;
  teacherName?: string;
}) {
  const supabase = getSupabase();

  if (teacherId) {
    const { data, error } = await supabase
      .from("teachers")
      .select("id, first_name, last_name, email, phone, specialties, bio, hire_date, status, pay_rate")
      .eq("id", teacherId)
      .eq("tenant_id", TENANT_ID)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, teacher: data };
  }

  if (teacherName) {
    const parts = teacherName.trim().split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    const { data, error } = await supabase
      .from("teachers")
      .select("id, first_name, last_name, email, phone, specialties, bio, hire_date, status, pay_rate")
      .eq("tenant_id", TENANT_ID)
      .ilike("first_name", "%" + firstName + "%")
      .ilike("last_name", "%" + lastName + "%");

    if (error) return { success: false, error: error.message };
    if (!data || data.length === 0) return { success: false, error: "No teacher found matching: " + teacherName };
    return { success: true, teacher: data[0], matchCount: data.length };
  }

  return { success: false, error: "Provide teacherId or teacherName" };
}

export async function update_instructor_info({
  teacherId,
  updates,
}: {
  teacherId: string;
  updates: Record<string, any>;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("teachers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", teacherId)
    .eq("tenant_id", TENANT_ID)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, teacher: data, message: "Teacher profile updated" };
}

export async function get_lesson_history({
  studentId,
  limit = 20,
}: {
  studentId: string;
  limit?: number;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select("id, start_time, end_time, status, block_type, teacher:teachers(first_name, last_name)")
    .eq("student_id", studentId)
    .eq("tenant_id", TENANT_ID)
    .eq("block_type", "student_session")
    .order("start_time", { ascending: false })
    .limit(limit);

  if (error) return { success: false, error: error.message };
  return { success: true, history: data, count: data?.length || 0 };
}

export const SID_TOOLS = {
  read_student,
  update_student_bio,
  read_instructor,
  update_instructor_info,
  get_lesson_history,
};
