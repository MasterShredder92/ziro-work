import type { Database, Json } from "./supabase";

export type { Database, Json };

type T = Database["public"]["Tables"];

export type Lead = T["leads"]["Row"];
export type LeadInsert = T["leads"]["Insert"];
export type LeadUpdate = T["leads"]["Update"];

export type IntakeSubmission = T["intake_submissions"]["Row"];
export type IntakeSubmissionInsert = T["intake_submissions"]["Insert"];
export type IntakeSubmissionUpdate = T["intake_submissions"]["Update"];

export type StudentFollowup = T["student_followups"]["Row"];
export type StudentFollowupInsert = T["student_followups"]["Insert"];
export type StudentFollowupUpdate = T["student_followups"]["Update"];

export type ScheduleBlock = T["schedule_blocks"]["Row"];
export type ScheduleBlockInsert = T["schedule_blocks"]["Insert"];
export type ScheduleBlockUpdate = T["schedule_blocks"]["Update"];

export type SessionLog = T["session_log"]["Row"];
export type SessionLogInsert = T["session_log"]["Insert"];
export type SessionLogUpdate = T["session_log"]["Update"];

export type Family = T["families"]["Row"];
export type FamilyInsert = T["families"]["Insert"];
export type FamilyUpdate = T["families"]["Update"];

export type Student = T["students"]["Row"];
export type StudentInsert = T["students"]["Insert"];
export type StudentUpdate = T["students"]["Update"];

export type Task = T["tasks"]["Row"];
export type TaskInsert = T["tasks"]["Insert"];
export type TaskUpdate = T["tasks"]["Update"];

export type AIConversation = T["ai_conversations"]["Row"];
export type AIConversationInsert = T["ai_conversations"]["Insert"];
export type AIConversationUpdate = T["ai_conversations"]["Update"];

export type AIMessage = T["ai_messages"]["Row"];
export type AIMessageInsert = T["ai_messages"]["Insert"];
export type AIMessageUpdate = T["ai_messages"]["Update"];

export type AIActionLog = T["ai_action_logs"]["Row"];
export type AIActionLogInsert = T["ai_action_logs"]["Insert"];

export type Teacher = T["teachers"]["Row"];
export type TeacherInsert = T["teachers"]["Insert"];
export type TeacherUpdate = T["teachers"]["Update"];

export type Room = T["rooms"]["Row"];
export type RoomInsert = T["rooms"]["Insert"];
export type RoomUpdate = T["rooms"]["Update"];

export type Location = T["locations"]["Row"];
export type LocationInsert = T["locations"]["Insert"];
export type LocationUpdate = T["locations"]["Update"];

export type Tenant = T["tenants"]["Row"];

export type ZiroAgent = T["ziro_agents"]["Row"];
export type ZiroAgentInsert = T["ziro_agents"]["Insert"];
export type ZiroSkill = T["ziro_skills"]["Row"];
export type ZiroAgentSkill = T["ziro_agent_skills"]["Row"];
export type ZiroConfig = T["ziro_config"]["Row"];
export type ZiroPageIntelligenceBinding = T["ziro_page_intelligence_bindings"]["Row"];
export type ZiroPageIntelligenceBindingInsert = T["ziro_page_intelligence_bindings"]["Insert"];

export type SquareInvoice = T["square_invoices"]["Row"];
export type SquarePayment = T["square_payments_fact"]["Row"];
export type SquareRefund = T["square_refunds_fact"]["Row"];

export type LeadStage = Database["public"]["Enums"]["lead_stage"];
export type BlockType = Database["public"]["Enums"]["block_type"];
export type BlockStatus = Database["public"]["Enums"]["block_status"];
export type DayOfWeek = Database["public"]["Enums"]["day_of_week"];
