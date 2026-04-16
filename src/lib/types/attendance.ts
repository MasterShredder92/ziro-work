export interface Attendance {
  id: string;
  tenant_id?: string;
  student_id: string;
  lesson_date: string;
  present: boolean;
  created_at: string;
}
