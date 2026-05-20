import type { Database, Json } from "./supabase";

export type { Database, Json };

type T = Database["public"]["Tables"];
type Table<Name extends string> = Name extends keyof T
  ? T[Name]
  :     {
      // Some legacy Ziro/AI tables are no longer present in the generated Lean DB type contract.
      // Keep aliases compile-safe without weakening real generated table typings.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Row: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Insert: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Update: any;
    };

export type Lead = Table<"leads">["Row"];
export type LeadInsert = Table<"leads">["Insert"];
export type LeadUpdate = Table<"leads">["Update"];

export type IntakeSubmission = Table<"intake_submissions">["Row"];
export type IntakeSubmissionInsert = Table<"intake_submissions">["Insert"];
export type IntakeSubmissionUpdate = Table<"intake_submissions">["Update"];

export type StudentFollowup = Table<"student_followups">["Row"];
export type StudentFollowupInsert = Table<"student_followups">["Insert"];
export type StudentFollowupUpdate = Table<"student_followups">["Update"];

export type ScheduleBlock = Table<"schedule_blocks">["Row"];
export type ScheduleBlockInsert = Table<"schedule_blocks">["Insert"];
export type ScheduleBlockUpdate = Table<"schedule_blocks">["Update"];

export type SessionLog = Table<"session_log">["Row"];
export type SessionLogInsert = Table<"session_log">["Insert"];
export type SessionLogUpdate = Table<"session_log">["Update"];

export type Family = Table<"families">["Row"];
export type FamilyInsert = Table<"families">["Insert"];
export type FamilyUpdate = Table<"families">["Update"];

export type Student = Table<"students">["Row"];
export type StudentInsert = Table<"students">["Insert"];
export type StudentUpdate = Table<"students">["Update"];

export type Task = Table<"tasks">["Row"];
export type TaskInsert = Table<"tasks">["Insert"];
export type TaskUpdate = Table<"tasks">["Update"];

export type AIConversation = Table<"ai_conversations">["Row"];
export type AIConversationInsert = Table<"ai_conversations">["Insert"];
export type AIConversationUpdate = Table<"ai_conversations">["Update"];

export type AIMessage = Table<"ai_messages">["Row"];
export type AIMessageInsert = Table<"ai_messages">["Insert"];
export type AIMessageUpdate = Table<"ai_messages">["Update"];

export type AIActionLog = Table<"ai_action_logs">["Row"];
export type AIActionLogInsert = Table<"ai_action_logs">["Insert"];

export type Teacher = Table<"teachers">["Row"];
export type TeacherInsert = Table<"teachers">["Insert"];
export type TeacherUpdate = Table<"teachers">["Update"];

export type Room = Table<"rooms">["Row"];
export type RoomInsert = Table<"rooms">["Insert"];
export type RoomUpdate = Table<"rooms">["Update"];

export type Location = Table<"locations">["Row"];
export type LocationInsert = Table<"locations">["Insert"];
export type LocationUpdate = Table<"locations">["Update"];

export type Tenant = Table<"tenants">["Row"];

export type ZiroAgent = Table<"ziro_agents">["Row"];
export type ZiroAgentInsert = Table<"ziro_agents">["Insert"];
export type ZiroSkill = Table<"ziro_skills">["Row"];
export type ZiroAgentSkill = Table<"ziro_agent_skills">["Row"];
export type ZiroConfig = Table<"ziro_config">["Row"];
export type ZiroPageIntelligenceBinding = Table<"ziro_page_intelligence_bindings">["Row"];
export type ZiroPageIntelligenceBindingInsert = Table<"ziro_page_intelligence_bindings">["Insert"];

export type SquareInvoice = Table<"square_invoices">["Row"];
export type SquarePayment = Table<"square_payments_fact">["Row"];
export type SquareRefund = Table<"square_refunds_fact">["Row"];

export type LeadStage = Database["public"]["Enums"]["lead_stage"];
export type BlockType = Database["public"]["Enums"]["block_type"];
export type BlockStatus = Database["public"]["Enums"]["block_status"];
export type DayOfWeek = Database["public"]["Enums"]["day_of_week"];
