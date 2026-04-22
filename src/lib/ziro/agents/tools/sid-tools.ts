/**
 * Sid Tool Definitions
 * 
 * Tools for managing student and instructor data.
 * 
 * Tools:
 * - read_student: Get student profile and history
 * - update_student_bio: Edit student information (requires approval)
 * - read_instructor: Get instructor profile
 * - update_instructor_info: Edit instructor information (requires approval)
 * - get_lesson_history: Retrieve past lessons and progress
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function read_student({ studentId }: { studentId: string }) {
  const { data, error } = await supabase
    .from("students")
    .select(`
      id, first_name, last_name, email, phone,
      date_of_birth, skill_level, instrument,
      enrollment_date, status, notes,
      parent_name, parent_email, parent_phone
    `)
    .eq("id", studentId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, student: data };
}

export async function update_student_bio({
  studentId,
  updates,
}: {
  studentId: string;
  updates: Record<string, any>;
}) {
  const { data, error } = await supabase
    .from("students")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", studentId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, student: data, message: "Student profile updated" };
}

export async function read_instructor({ instructorId }: { instructorId: string }) {
  const { data, error } = await supabase
    .from("instructors")
    .select(`
      id, first_name, last_name, email, phone,
      specialties, bio, hire_date, status,
      max_weekly_hours, hourly_rate
    `)
    .eq("id", instructorId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, instructor: data };
}

export async function update_instructor_info({
  instructorId,
  updates,
}: {
  instructorId: string;
  updates: Record<string, any>;
}) {
  const { data, error } = await supabase
    .from("instructors")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", instructorId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, instructor: data, message: "Instructor profile updated" };
}

export async function get_lesson_history({
  studentId,
  limit = 20,
}: {
  studentId: string;
  limit?: number;
}) {
  const { data, error } = await supabase
    .from("lessons")
    .select(`
      id, start_time, end_time, status, notes,
      instructor:instructors(first_name, last_name),
      lesson_type
    `)
    .eq("student_id", studentId)
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
