export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      _archive_2026_chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      _archive_2026_chat_messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_communications: {
        Row: {
          ai_completion_tokens: number | null
          ai_model: string | null
          ai_prompt_tokens: number | null
          body: string
          channel: string
          created_at: string
          created_by: string | null
          family_id: string
          id: string
          read_at: string | null
          sent_at: string | null
          session_log_id: string | null
          status: string
          student_id: string
          subject: string | null
          teacher_id: string | null
          teacher_input_summary: string | null
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          ai_completion_tokens?: number | null
          ai_model?: string | null
          ai_prompt_tokens?: number | null
          body: string
          channel?: string
          created_at?: string
          created_by?: string | null
          family_id: string
          id?: string
          read_at?: string | null
          sent_at?: string | null
          session_log_id?: string | null
          status?: string
          student_id: string
          subject?: string | null
          teacher_id?: string | null
          teacher_input_summary?: string | null
          tenant_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          ai_completion_tokens?: number | null
          ai_model?: string | null
          ai_prompt_tokens?: number | null
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          family_id?: string
          id?: string
          read_at?: string | null
          sent_at?: string | null
          session_log_id?: string | null
          status?: string
          student_id?: string
          subject?: string | null
          teacher_id?: string | null
          teacher_input_summary?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_session_log_id_fkey"
            columns: ["session_log_id"]
            isOneToOne: false
            referencedRelation: "session_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "communications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "communications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_contact_change_requests: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          requested_email: string | null
          requested_phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          requested_email?: string | null
          requested_phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          requested_email?: string | null
          requested_phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_change_requests_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_content_moderation_words: {
        Row: {
          id: number
          severity: string | null
          word: string
        }
        Insert: {
          id?: number
          severity?: string | null
          word: string
        }
        Update: {
          id?: number
          severity?: string | null
          word?: string
        }
        Relationships: []
      }
      _archive_2026_dashboard_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_date: string
          alert_type: string
          body: string | null
          created_at: string | null
          created_by: string | null
          emoji: string | null
          id: string
          is_acknowledged: boolean | null
          location_id: string | null
          priority: string
          related_entity_id: string | null
          related_entity_name: string | null
          related_entity_type: string | null
          target_profile_id: string | null
          target_role: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_date?: string
          alert_type: string
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          emoji?: string | null
          id?: string
          is_acknowledged?: boolean | null
          location_id?: string | null
          priority?: string
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_entity_type?: string | null
          target_profile_id?: string | null
          target_role?: string | null
          tenant_id: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_date?: string
          alert_type?: string
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          emoji?: string | null
          id?: string
          is_acknowledged?: boolean | null
          location_id?: string | null
          priority?: string
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_entity_type?: string | null
          target_profile_id?: string | null
          target_role?: string | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_alerts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_alerts_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_director_closeouts: {
        Row: {
          callouts_acknowledged: boolean | null
          closed_at: string | null
          closeout_date: string
          created_at: string | null
          id: string
          is_complete: boolean | null
          location_id: string | null
          manual_tasks_completed: boolean | null
          override_approved: boolean | null
          override_approved_at: string | null
          override_approved_by: string | null
          override_request_reason: string | null
          override_requested: boolean | null
          profile_id: string
          teacher_nonclosures_followed_up: boolean | null
          tenant_id: string
        }
        Insert: {
          callouts_acknowledged?: boolean | null
          closed_at?: string | null
          closeout_date: string
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          location_id?: string | null
          manual_tasks_completed?: boolean | null
          override_approved?: boolean | null
          override_approved_at?: string | null
          override_approved_by?: string | null
          override_request_reason?: string | null
          override_requested?: boolean | null
          profile_id: string
          teacher_nonclosures_followed_up?: boolean | null
          tenant_id: string
        }
        Update: {
          callouts_acknowledged?: boolean | null
          closed_at?: string | null
          closeout_date?: string
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          location_id?: string | null
          manual_tasks_completed?: boolean | null
          override_approved?: boolean | null
          override_approved_at?: string | null
          override_approved_by?: string | null
          override_request_reason?: string | null
          override_requested?: boolean | null
          profile_id?: string
          teacher_nonclosures_followed_up?: boolean | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "director_closeouts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "director_closeouts_override_approved_by_fkey"
            columns: ["override_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "director_closeouts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_issue_reports: {
        Row: {
          created_at: string | null
          description: string
          id: string
          page_area: string
          status: string | null
          submitted_by: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          page_area: string
          status?: string | null
          submitted_by: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          page_area?: string
          status?: string | null
          submitted_by?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_lifecycle: {
        Row: {
          changed_at: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          previous_stage: string | null
          stage: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          changed_at?: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          previous_stage?: string | null
          stage: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          changed_at?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          previous_stage?: string | null
          stage?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      _archive_2026_lp_prospects: {
        Row: {
          biggest_pain_point: string | null
          completed_at: string | null
          converted_tenant_id: string | null
          created_at: string
          current_software: string | null
          email: string
          first_name: string
          id: string
          last_name: string | null
          location_count: number | null
          phone: string | null
          plan_selected: string | null
          student_count: number | null
          studio_name: string | null
          teacher_count: number | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          biggest_pain_point?: string | null
          completed_at?: string | null
          converted_tenant_id?: string | null
          created_at?: string
          current_software?: string | null
          email: string
          first_name: string
          id?: string
          last_name?: string | null
          location_count?: number | null
          phone?: string | null
          plan_selected?: string | null
          student_count?: number | null
          studio_name?: string | null
          teacher_count?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          biggest_pain_point?: string | null
          completed_at?: string | null
          converted_tenant_id?: string | null
          created_at?: string
          current_software?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string | null
          location_count?: number | null
          phone?: string | null
          plan_selected?: string | null
          student_count?: number | null
          studio_name?: string | null
          teacher_count?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lp_prospects_converted_tenant_id_fkey"
            columns: ["converted_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_makeup_sessions: {
        Row: {
          created_at: string | null
          day_of_week: number
          expired_at: string | null
          family_id: string
          id: string
          is_payroll_event: boolean | null
          location_id: string
          original_callout_id: string | null
          schedule_block_id: string | null
          scheduled_date: string
          status: string
          student_id: string
          tenant_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          expired_at?: string | null
          family_id: string
          id?: string
          is_payroll_event?: boolean | null
          location_id: string
          original_callout_id?: string | null
          schedule_block_id?: string | null
          scheduled_date: string
          status?: string
          student_id: string
          tenant_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          expired_at?: string | null
          family_id?: string
          id?: string
          is_payroll_event?: boolean | null
          location_id?: string
          original_callout_id?: string | null
          schedule_block_id?: string | null
          scheduled_date?: string
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "makeup_sessions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "makeup_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "makeup_sessions_original_callout_id_fkey"
            columns: ["original_callout_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_student_callouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "makeup_sessions_schedule_block_id_fkey"
            columns: ["schedule_block_id"]
            isOneToOne: false
            referencedRelation: "schedule_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "makeup_sessions_schedule_block_id_fkey"
            columns: ["schedule_block_id"]
            isOneToOne: false
            referencedRelation: "scheduling_grid"
            referencedColumns: ["block_id"]
          },
          {
            foreignKeyName: "makeup_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "makeup_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_messages: {
        Row: {
          ai_drafted: boolean
          automation_id: string | null
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          external_id: string | null
          family_id: string | null
          from_phone: string | null
          id: string
          is_automated: boolean
          lead_id: string | null
          location_id: string
          sent_by: string | null
          student_id: string | null
          tenant_id: string
          to_phone: string | null
        }
        Insert: {
          ai_drafted?: boolean
          automation_id?: string | null
          body: string
          channel?: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          external_id?: string | null
          family_id?: string | null
          from_phone?: string | null
          id?: string
          is_automated?: boolean
          lead_id?: string | null
          location_id: string
          sent_by?: string | null
          student_id?: string | null
          tenant_id: string
          to_phone?: string | null
        }
        Update: {
          ai_drafted?: boolean
          automation_id?: string | null
          body?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          external_id?: string | null
          family_id?: string | null
          from_phone?: string | null
          id?: string
          is_automated?: boolean
          lead_id?: string | null
          location_id?: string
          sent_by?: string | null
          student_id?: string | null
          tenant_id?: string
          to_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      _archive_2026_oauth_state: {
        Row: {
          consumed_at: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          integration_id: string
          redirect_uri: string | null
          scopes: string[] | null
          state_token: string
          tenant_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          integration_id: string
          redirect_uri?: string | null
          scopes?: string[] | null
          state_token: string
          tenant_id?: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          integration_id?: string
          redirect_uri?: string | null
          scopes?: string[] | null
          state_token?: string
          tenant_id?: string
        }
        Relationships: []
      }
      _archive_2026_oauth_states: {
        Row: {
          client_id: string
          client_secret_encrypted: string
          created_at: string
          expires_at: string
          extra_params: Json | null
          id: string
          integration_id: string
          redirect_uri: string
          state: string
          tenant_id: string
          used: boolean
          user_id: string
        }
        Insert: {
          client_id: string
          client_secret_encrypted: string
          created_at?: string
          expires_at?: string
          extra_params?: Json | null
          id?: string
          integration_id: string
          redirect_uri: string
          state: string
          tenant_id: string
          used?: boolean
          user_id: string
        }
        Update: {
          client_id?: string
          client_secret_encrypted?: string
          created_at?: string
          expires_at?: string
          extra_params?: Json | null
          id?: string
          integration_id?: string
          redirect_uri?: string
          state?: string
          tenant_id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      _archive_2026_payment_history: {
        Row: {
          amount_cents: number
          billing_period_id: string | null
          card_brand: string | null
          card_last_four: string | null
          created_at: string | null
          family_id: string
          id: string
          session_breakdown: Json | null
          square_payment_id: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount_cents: number
          billing_period_id?: string | null
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string | null
          family_id: string
          id?: string
          session_breakdown?: Json | null
          square_payment_id?: string | null
          status: string
          tenant_id: string
        }
        Update: {
          amount_cents?: number
          billing_period_id?: string | null
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string | null
          family_id?: string
          id?: string
          session_breakdown?: Json | null
          square_payment_id?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_billing_period_id_fkey"
            columns: ["billing_period_id"]
            isOneToOne: false
            referencedRelation: "billing_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          invoice_id: string
          method: string | null
          paid_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id: string
          method?: string | null
          paid_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string
          method?: string | null
          paid_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_payroll_entries: {
        Row: {
          bonus_amount: number
          bonus_overridden: boolean
          bonus_overridden_at: string | null
          bonus_overridden_by: string | null
          created_at: string | null
          director_pay: number | null
          id: string
          notes: string | null
          pay_rate: number
          period_id: string
          session_total: number | null
          sessions_taught: number
          teacher_id: string
          tenant_id: string
          tips: number
          total_pay: number | null
          updated_at: string | null
        }
        Insert: {
          bonus_amount?: number
          bonus_overridden?: boolean
          bonus_overridden_at?: string | null
          bonus_overridden_by?: string | null
          created_at?: string | null
          director_pay?: number | null
          id?: string
          notes?: string | null
          pay_rate: number
          period_id: string
          session_total?: number | null
          sessions_taught?: number
          teacher_id: string
          tenant_id: string
          tips?: number
          total_pay?: number | null
          updated_at?: string | null
        }
        Update: {
          bonus_amount?: number
          bonus_overridden?: boolean
          bonus_overridden_at?: string | null
          bonus_overridden_by?: string | null
          created_at?: string | null
          director_pay?: number | null
          id?: string
          notes?: string | null
          pay_rate?: number
          period_id?: string
          session_total?: number | null
          sessions_taught?: number
          teacher_id?: string
          tenant_id?: string
          tips?: number
          total_pay?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "payroll_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_payroll_periods: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_closed: boolean
          period_label: string
          start_date: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_closed?: boolean
          period_label: string
          start_date: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_closed?: boolean
          period_label?: string
          start_date?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_permission_requests: {
        Row: {
          action_description: string
          created_at: string | null
          id: string
          record_id: string | null
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          table_name: string | null
          tenant_id: string
        }
        Insert: {
          action_description: string
          created_at?: string | null
          id?: string
          record_id?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          table_name?: string | null
          tenant_id: string
        }
        Update: {
          action_description?: string
          created_at?: string | null
          id?: string
          record_id?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          table_name?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_permission_set_grants: {
        Row: {
          id: string
          is_granted: boolean
          permission_key: string
          role: string
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          is_granted?: boolean
          permission_key: string
          role: string
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          is_granted?: boolean
          permission_key?: string
          role?: string
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_set_grants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_practice_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          duration_seconds: number | null
          family_id: string | null
          id: string
          instrument: string | null
          is_manual_entry: boolean
          logged_by: string | null
          notes: string | null
          practice_date: string
          student_id: string
          tenant_id: string
          tool_used: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          duration_seconds?: number | null
          family_id?: string | null
          id?: string
          instrument?: string | null
          is_manual_entry?: boolean
          logged_by?: string | null
          notes?: string | null
          practice_date?: string
          student_id: string
          tenant_id: string
          tool_used?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          duration_seconds?: number | null
          family_id?: string | null
          id?: string
          instrument?: string | null
          is_manual_entry?: boolean
          logged_by?: string | null
          notes?: string | null
          practice_date?: string
          student_id?: string
          tenant_id?: string
          tool_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "practice_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_profile_edit_requests: {
        Row: {
          created_at: string
          current_value: string | null
          family_id: string | null
          field_name: string
          id: string
          reason: string | null
          requested_by: string
          requested_value: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          current_value?: string | null
          family_id?: string | null
          field_name: string
          id?: string
          reason?: string | null
          requested_by: string
          requested_value?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          current_value?: string | null
          family_id?: string | null
          field_name?: string
          id?: string
          reason?: string | null
          requested_by?: string
          requested_value?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_edit_requests_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_edit_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_edit_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_edit_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "profile_edit_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_edit_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_profile_permission_overrides: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          is_granted: boolean
          permission_key: string
          profile_id: string
          reason: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          is_granted: boolean
          permission_key: string
          profile_id: string
          reason?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          is_granted?: boolean
          permission_key?: string
          profile_id?: string
          reason?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_permission_overrides_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_permission_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_progress_reports: {
        Row: {
          ai_areas_of_growth: string[] | null
          ai_encouragement: string | null
          ai_highlights: string[] | null
          ai_summary: string | null
          attendance_rate: number | null
          created_at: string
          family_id: string
          id: string
          is_sent: boolean
          months_enrolled: number
          percentile_attendance: number | null
          percentile_sessions: number | null
          period_end: string
          period_start: string
          ranking_label: string | null
          report_type: Database["public"]["Enums"]["report_interval"]
          retention_offer_details: Json | null
          retention_offer_type: string | null
          sent_at: string | null
          sent_via: string | null
          sessions_attended: number
          sessions_scheduled: number
          snapshot_html: string | null
          snapshot_shared_url: string | null
          student_id: string
          tenant_id: string
          total_sessions_lifetime: number
          updated_at: string
        }
        Insert: {
          ai_areas_of_growth?: string[] | null
          ai_encouragement?: string | null
          ai_highlights?: string[] | null
          ai_summary?: string | null
          attendance_rate?: number | null
          created_at?: string
          family_id: string
          id?: string
          is_sent?: boolean
          months_enrolled?: number
          percentile_attendance?: number | null
          percentile_sessions?: number | null
          period_end: string
          period_start: string
          ranking_label?: string | null
          report_type: Database["public"]["Enums"]["report_interval"]
          retention_offer_details?: Json | null
          retention_offer_type?: string | null
          sent_at?: string | null
          sent_via?: string | null
          sessions_attended?: number
          sessions_scheduled?: number
          snapshot_html?: string | null
          snapshot_shared_url?: string | null
          student_id: string
          tenant_id: string
          total_sessions_lifetime?: number
          updated_at?: string
        }
        Update: {
          ai_areas_of_growth?: string[] | null
          ai_encouragement?: string | null
          ai_highlights?: string[] | null
          ai_summary?: string | null
          attendance_rate?: number | null
          created_at?: string
          family_id?: string
          id?: string
          is_sent?: boolean
          months_enrolled?: number
          percentile_attendance?: number | null
          percentile_sessions?: number | null
          period_end?: string
          period_start?: string
          ranking_label?: string | null
          report_type?: Database["public"]["Enums"]["report_interval"]
          retention_offer_details?: Json | null
          retention_offer_type?: string | null
          sent_at?: string | null
          sent_via?: string | null
          sessions_attended?: number
          sessions_scheduled?: number
          snapshot_html?: string | null
          snapshot_shared_url?: string | null
          student_id?: string
          tenant_id?: string
          total_sessions_lifetime?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_reports_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "progress_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_query_performance: {
        Row: {
          created_at: string
          execution_time_ms: number
          id: string
          is_slow: boolean | null
          query_label: string
          row_count: number | null
          table_name: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          execution_time_ms: number
          id?: string
          is_slow?: boolean | null
          query_label: string
          row_count?: number | null
          table_name?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          execution_time_ms?: number
          id?: string
          is_slow?: boolean | null
          query_label?: string
          row_count?: number | null
          table_name?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "query_performance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_quiz_scores: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          percent: number | null
          score: number | null
          total: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          percent?: number | null
          score?: number | null
          total?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          percent?: number | null
          score?: number | null
          total?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      _archive_2026_recruitment_prospects: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          instruments: string[] | null
          last_name: string
          location_id: string | null
          notes: string | null
          phone: string | null
          resume_url: string | null
          source: string | null
          source_detail: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          instruments?: string[] | null
          last_name: string
          location_id?: string | null
          notes?: string | null
          phone?: string | null
          resume_url?: string | null
          source?: string | null
          source_detail?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          instruments?: string[] | null
          last_name?: string
          location_id?: string | null
          notes?: string | null
          phone?: string | null
          resume_url?: string | null
          source?: string | null
          source_detail?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_prospects_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_prospects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_refunds: {
        Row: {
          amount_cents: number
          created_at: string | null
          family_id: string
          id: string
          initiated_by: string | null
          payment_history_id: string
          reason: string
          square_refund_id: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          family_id: string
          id?: string
          initiated_by?: string | null
          payment_history_id: string
          reason: string
          square_refund_id?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          family_id?: string
          id?: string
          initiated_by?: string | null
          payment_history_id?: string
          reason?: string
          square_refund_id?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_history_id_fkey"
            columns: ["payment_history_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_payment_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_retention_campaigns: {
        Row: {
          ai_context: Json | null
          body: string | null
          campaign_type: string
          channel: string | null
          communication_id: string | null
          created_at: string
          family_id: string | null
          id: string
          location_id: string | null
          read_at: string | null
          risk_score: number | null
          scheduled_date: string | null
          sent_at: string | null
          status: string | null
          student_id: string
          student_status: string | null
          subject: string | null
          tenant_id: string
          updated_at: string
          wave_number: number
        }
        Insert: {
          ai_context?: Json | null
          body?: string | null
          campaign_type: string
          channel?: string | null
          communication_id?: string | null
          created_at?: string
          family_id?: string | null
          id?: string
          location_id?: string | null
          read_at?: string | null
          risk_score?: number | null
          scheduled_date?: string | null
          sent_at?: string | null
          status?: string | null
          student_id: string
          student_status?: string | null
          subject?: string | null
          tenant_id: string
          updated_at?: string
          wave_number: number
        }
        Update: {
          ai_context?: Json | null
          body?: string | null
          campaign_type?: string
          channel?: string | null
          communication_id?: string | null
          created_at?: string
          family_id?: string | null
          id?: string
          location_id?: string | null
          read_at?: string | null
          risk_score?: number | null
          scheduled_date?: string | null
          sent_at?: string | null
          status?: string | null
          student_id?: string
          student_status?: string | null
          subject?: string | null
          tenant_id?: string
          updated_at?: string
          wave_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "retention_campaigns_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_campaigns_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_campaigns_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_campaigns_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "retention_campaigns_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_retention_outreach: {
        Row: {
          ai_generated: boolean
          campaign_id: string | null
          created_at: string
          family_id: string | null
          id: string
          lead_id: string | null
          location_id: string
          message_content: string | null
          outcome: string | null
          outreach_date: string
          outreach_type: string
          response_content: string | null
          response_date: string | null
          response_received: boolean
          sent_by: string | null
          student_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          campaign_id?: string | null
          created_at?: string
          family_id?: string | null
          id?: string
          lead_id?: string | null
          location_id: string
          message_content?: string | null
          outcome?: string | null
          outreach_date?: string
          outreach_type?: string
          response_content?: string | null
          response_date?: string | null
          response_received?: boolean
          sent_by?: string | null
          student_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          campaign_id?: string | null
          created_at?: string
          family_id?: string | null
          id?: string
          lead_id?: string | null
          location_id?: string
          message_content?: string | null
          outcome?: string | null
          outreach_date?: string
          outreach_type?: string
          response_content?: string | null
          response_date?: string | null
          response_received?: boolean
          sent_by?: string | null
          student_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_outreach_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_retention_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_outreach_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_outreach_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_outreach_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_outreach_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_outreach_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "retention_outreach_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_outreach_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_review_requests: {
        Row: {
          created_at: string
          family_id: string | null
          google_review_url: string | null
          id: string
          location_id: string
          message_id: string | null
          message_text: string | null
          notes: string | null
          requested_by: string | null
          review_date: string | null
          review_received: boolean
          sent_at: string
          student_id: string | null
          tenant_id: string
          trigger_reason: string | null
        }
        Insert: {
          created_at?: string
          family_id?: string | null
          google_review_url?: string | null
          id?: string
          location_id: string
          message_id?: string | null
          message_text?: string | null
          notes?: string | null
          requested_by?: string | null
          review_date?: string | null
          review_received?: boolean
          sent_at?: string
          student_id?: string | null
          tenant_id: string
          trigger_reason?: string | null
        }
        Update: {
          created_at?: string
          family_id?: string | null
          google_review_url?: string | null
          id?: string
          location_id?: string
          message_id?: string | null
          message_text?: string | null
          notes?: string | null
          requested_by?: string | null
          review_date?: string | null
          review_received?: boolean
          sent_at?: string
          student_id?: string | null
          tenant_id?: string
          trigger_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "review_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_role_permissions: {
        Row: {
          allowed: boolean
          id: number
          permission_key: string
          role: string
          scope: string | null
        }
        Insert: {
          allowed?: boolean
          id?: number
          permission_key: string
          role: string
          scope?: string | null
        }
        Update: {
          allowed?: boolean
          id?: number
          permission_key?: string
          role?: string
          scope?: string | null
        }
        Relationships: []
      }
      _archive_2026_schedules: {
        Row: {
          created_at: string
          ends_at: string
          enrollment_id: string
          id: string
          starts_at: string
          status: string
          student_id: string | null
          teacher_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          enrollment_id: string
          id?: string
          starts_at: string
          status?: string
          student_id?: string | null
          teacher_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          enrollment_id?: string
          id?: string
          starts_at?: string
          status?: string
          student_id?: string | null
          teacher_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "schedules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_student_achievements: {
        Row: {
          achievement_emoji: string
          achievement_key: string
          achievement_name: string
          category: string
          earned_at: string
          id: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          achievement_emoji: string
          achievement_key: string
          achievement_name: string
          category: string
          earned_at?: string
          id?: string
          student_id: string
          tenant_id: string
        }
        Update: {
          achievement_emoji?: string
          achievement_key?: string
          achievement_name?: string
          category?: string
          earned_at?: string
          id?: string
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_student_callouts: {
        Row: {
          callout_date: string
          callout_scope: string
          confirmed_at: string | null
          confirmed_by_parent: boolean | null
          created_at: string | null
          family_id: string
          id: string
          initiated_by_user_id: string | null
          is_within_one_hour: boolean | null
          location_id: string
          makeup_session_id: string | null
          no_fifth_week_available: boolean | null
          previous_session_note: string | null
          schedule_block_id: string | null
          student_id: string
          tenant_id: string
        }
        Insert: {
          callout_date: string
          callout_scope: string
          confirmed_at?: string | null
          confirmed_by_parent?: boolean | null
          created_at?: string | null
          family_id: string
          id?: string
          initiated_by_user_id?: string | null
          is_within_one_hour?: boolean | null
          location_id: string
          makeup_session_id?: string | null
          no_fifth_week_available?: boolean | null
          previous_session_note?: string | null
          schedule_block_id?: string | null
          student_id: string
          tenant_id: string
        }
        Update: {
          callout_date?: string
          callout_scope?: string
          confirmed_at?: string | null
          confirmed_by_parent?: boolean | null
          created_at?: string | null
          family_id?: string
          id?: string
          initiated_by_user_id?: string | null
          is_within_one_hour?: boolean | null
          location_id?: string
          makeup_session_id?: string | null
          no_fifth_week_available?: boolean | null
          previous_session_note?: string | null
          schedule_block_id?: string | null
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_callout_makeup"
            columns: ["makeup_session_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_makeup_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_callouts_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_callouts_initiated_by_user_id_fkey"
            columns: ["initiated_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_callouts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_callouts_schedule_block_id_fkey"
            columns: ["schedule_block_id"]
            isOneToOne: false
            referencedRelation: "schedule_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_callouts_schedule_block_id_fkey"
            columns: ["schedule_block_id"]
            isOneToOne: false
            referencedRelation: "scheduling_grid"
            referencedColumns: ["block_id"]
          },
          {
            foreignKeyName: "student_callouts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_callouts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_student_director_notes: {
        Row: {
          author_id: string
          author_name: string
          created_at: string
          id: string
          note_text: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          author_id: string
          author_name: string
          created_at?: string
          id?: string
          note_text: string
          student_id: string
          tenant_id: string
        }
        Update: {
          author_id?: string
          author_name?: string
          created_at?: string
          id?: string
          note_text?: string
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_director_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_director_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_director_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_student_milestones: {
        Row: {
          achieved_at: string
          celebrated: boolean
          celebrated_at: string | null
          created_at: string
          id: string
          milestone_label: string
          milestone_type: string
          milestone_value: number | null
          report_id: string | null
          student_id: string
          tenant_id: string
        }
        Insert: {
          achieved_at?: string
          celebrated?: boolean
          celebrated_at?: string | null
          created_at?: string
          id?: string
          milestone_label: string
          milestone_type: string
          milestone_value?: number | null
          report_id?: string | null
          student_id: string
          tenant_id: string
        }
        Update: {
          achieved_at?: string
          celebrated?: boolean
          celebrated_at?: string | null
          created_at?: string
          id?: string
          milestone_label?: string
          milestone_type?: string
          milestone_value?: number | null
          report_id?: string | null
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_milestones_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_progress_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_milestones_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_milestones_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_milestones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_teacher_callouts: {
        Row: {
          blocks_affected: number
          callout_date: string
          created_at: string
          id: string
          initiated_by: string | null
          location_id: string
          reason: string | null
          teacher_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          blocks_affected?: number
          callout_date: string
          created_at?: string
          id?: string
          initiated_by?: string | null
          location_id: string
          reason?: string | null
          teacher_id: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          blocks_affected?: number
          callout_date?: string
          created_at?: string
          id?: string
          initiated_by?: string | null
          location_id?: string
          reason?: string | null
          teacher_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_callouts_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_callouts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_callouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_callouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_callouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_teacher_closeouts: {
        Row: {
          closed_at: string | null
          closeout_date: string
          created_at: string | null
          id: string
          is_complete: boolean | null
          location_id: string
          override_approved: boolean | null
          override_approved_at: string | null
          override_approved_by: string | null
          override_request_reason: string | null
          override_requested: boolean | null
          sessions_requiring_recap: number | null
          sessions_with_recap: number | null
          teacher_id: string
          tenant_id: string
        }
        Insert: {
          closed_at?: string | null
          closeout_date: string
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          location_id: string
          override_approved?: boolean | null
          override_approved_at?: string | null
          override_approved_by?: string | null
          override_request_reason?: string | null
          override_requested?: boolean | null
          sessions_requiring_recap?: number | null
          sessions_with_recap?: number | null
          teacher_id: string
          tenant_id: string
        }
        Update: {
          closed_at?: string | null
          closeout_date?: string
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          location_id?: string
          override_approved?: boolean | null
          override_approved_at?: string | null
          override_approved_by?: string | null
          override_request_reason?: string | null
          override_requested?: boolean | null
          sessions_requiring_recap?: number | null
          sessions_with_recap?: number | null
          teacher_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_closeouts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_closeouts_override_approved_by_fkey"
            columns: ["override_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_closeouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_closeouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_closeouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_teacher_documents: {
        Row: {
          category: string | null
          file_name: string
          file_url: string
          id: string
          teacher_id: string
          tenant_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          file_name: string
          file_url: string
          id?: string
          teacher_id: string
          tenant_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          file_name?: string
          file_url?: string
          id?: string
          teacher_id?: string
          tenant_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_documents_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_documents_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_documents_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_teacher_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          note_text: string
          teacher_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_text: string
          teacher_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_text?: string
          teacher_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_teacher_session_notes: {
        Row: {
          ai_enhanced_at: string | null
          ai_enhanced_note: string | null
          created_at: string
          id: string
          is_visible_to_parent: boolean
          mood: string | null
          note_date: string
          raw_note: string
          schedule_block_id: string | null
          skills_progressing: string[] | null
          student_id: string
          teacher_id: string
          tenant_id: string
          topics_covered: string[] | null
          updated_at: string
        }
        Insert: {
          ai_enhanced_at?: string | null
          ai_enhanced_note?: string | null
          created_at?: string
          id?: string
          is_visible_to_parent?: boolean
          mood?: string | null
          note_date?: string
          raw_note: string
          schedule_block_id?: string | null
          skills_progressing?: string[] | null
          student_id: string
          teacher_id: string
          tenant_id: string
          topics_covered?: string[] | null
          updated_at?: string
        }
        Update: {
          ai_enhanced_at?: string | null
          ai_enhanced_note?: string | null
          created_at?: string
          id?: string
          is_visible_to_parent?: boolean
          mood?: string | null
          note_date?: string
          raw_note?: string
          schedule_block_id?: string | null
          skills_progressing?: string[] | null
          student_id?: string
          teacher_id?: string
          tenant_id?: string
          topics_covered?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_session_notes_schedule_block_id_fkey"
            columns: ["schedule_block_id"]
            isOneToOne: false
            referencedRelation: "schedule_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_session_notes_schedule_block_id_fkey"
            columns: ["schedule_block_id"]
            isOneToOne: false
            referencedRelation: "scheduling_grid"
            referencedColumns: ["block_id"]
          },
          {
            foreignKeyName: "teacher_session_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "teacher_session_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_session_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_session_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_session_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_session_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_teacher_student_notes: {
        Row: {
          created_at: string
          id: string
          moderation_reason: string | null
          moderation_status: string | null
          note_text: string
          student_id: string
          teacher_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          moderation_reason?: string | null
          moderation_status?: string | null
          note_text: string
          student_id: string
          teacher_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          moderation_reason?: string | null
          moderation_status?: string | null
          note_text?: string
          student_id?: string
          teacher_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "teacher_student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_student_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_student_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_student_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_student_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_teacher_uploads: {
        Row: {
          description: string | null
          download_approved_at: string | null
          download_approved_by: string | null
          download_requires_approval: boolean | null
          downloadable: boolean | null
          file_name: string
          file_name_original: string
          file_size_bytes: number | null
          id: string
          location_id: string | null
          mime_type: string | null
          moderation_reason: string | null
          moderation_status: string
          storage_path: string
          student_id: string
          teacher_id: string
          tenant_id: string
          uploaded_at: string
          visible_to_parent: boolean | null
        }
        Insert: {
          description?: string | null
          download_approved_at?: string | null
          download_approved_by?: string | null
          download_requires_approval?: boolean | null
          downloadable?: boolean | null
          file_name: string
          file_name_original: string
          file_size_bytes?: number | null
          id?: string
          location_id?: string | null
          mime_type?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          storage_path: string
          student_id: string
          teacher_id: string
          tenant_id: string
          uploaded_at?: string
          visible_to_parent?: boolean | null
        }
        Update: {
          description?: string | null
          download_approved_at?: string | null
          download_approved_by?: string | null
          download_requires_approval?: boolean | null
          downloadable?: boolean | null
          file_name?: string
          file_name_original?: string
          file_size_bytes?: number | null
          id?: string
          location_id?: string | null
          mime_type?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          storage_path?: string
          student_id?: string
          teacher_id?: string
          tenant_id?: string
          uploaded_at?: string
          visible_to_parent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_uploads_download_approved_by_fkey"
            columns: ["download_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_uploads_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_uploads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "teacher_uploads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_uploads_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_uploads_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_uploads_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_uploads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_teacher_w9: {
        Row: {
          address: string
          business_name: string | null
          city: string
          created_at: string | null
          exempt_payee_code: string | null
          fatca_exemption_code: string | null
          id: string
          legal_name: string
          pdf_generated_at: string | null
          pdf_url: string | null
          signature_name: string
          signed_at: string
          signed_by_ip: string | null
          state: string
          status: string
          tax_classification: string
          tax_classification_other: string | null
          teacher_id: string
          tenant_id: string
          tin_encrypted: string
          tin_last_four: string
          tin_type: string
          updated_at: string | null
          zip: string
        }
        Insert: {
          address: string
          business_name?: string | null
          city: string
          created_at?: string | null
          exempt_payee_code?: string | null
          fatca_exemption_code?: string | null
          id?: string
          legal_name: string
          pdf_generated_at?: string | null
          pdf_url?: string | null
          signature_name: string
          signed_at?: string
          signed_by_ip?: string | null
          state: string
          status?: string
          tax_classification: string
          tax_classification_other?: string | null
          teacher_id: string
          tenant_id: string
          tin_encrypted: string
          tin_last_four: string
          tin_type: string
          updated_at?: string | null
          zip: string
        }
        Update: {
          address?: string
          business_name?: string | null
          city?: string
          created_at?: string | null
          exempt_payee_code?: string | null
          fatca_exemption_code?: string | null
          id?: string
          legal_name?: string
          pdf_generated_at?: string | null
          pdf_url?: string | null
          signature_name?: string
          signed_at?: string
          signed_by_ip?: string | null
          state?: string
          status?: string
          tax_classification?: string
          tax_classification_other?: string | null
          teacher_id?: string
          tenant_id?: string
          tin_encrypted?: string
          tin_last_four?: string
          tin_type?: string
          updated_at?: string | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_w9_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_w9_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_w9_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_w9_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_tip_attributions: {
        Row: {
          amount: number
          id: string
          teacher_id: string
          tip_id: string
        }
        Insert: {
          amount: number
          id?: string
          teacher_id: string
          tip_id: string
        }
        Update: {
          amount?: number
          id?: string
          teacher_id?: string
          tip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tip_attributions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "tip_attributions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_attributions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_attributions_tip_id_fkey"
            columns: ["tip_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_tips"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_tips: {
        Row: {
          amount: number
          attribution_confirmed: boolean
          created_at: string | null
          id: string
          period_id: string
          split_type: string | null
          student_id: string
          tenant_id: string
        }
        Insert: {
          amount: number
          attribution_confirmed?: boolean
          created_at?: string | null
          id?: string
          period_id: string
          split_type?: string | null
          student_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          attribution_confirmed?: boolean
          created_at?: string | null
          id?: string
          period_id?: string
          split_type?: string | null
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tips_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "tips_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      _archive_2026_ziro_skill_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          skill_id: string
          tenant_id: string
          workflow_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          skill_id: string
          tenant_id: string
          workflow_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          skill_id?: string
          tenant_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ziro_skill_assignments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "ziro_skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_skill_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_skill_assignments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "ai_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_ziro_skill_proposals: {
        Row: {
          created_at: string
          id: string
          promoted_skill_id: string | null
          proposed_allowed_tools: string[]
          proposed_business_context: string | null
          proposed_cost_tier: string
          proposed_description: string | null
          proposed_key: string
          proposed_name: string
          proposed_risk_tier: string
          proposed_runtime: string
          proposed_system_prompt_fragment: string | null
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          promoted_skill_id?: string | null
          proposed_allowed_tools?: string[]
          proposed_business_context?: string | null
          proposed_cost_tier?: string
          proposed_description?: string | null
          proposed_key: string
          proposed_name: string
          proposed_risk_tier?: string
          proposed_runtime?: string
          proposed_system_prompt_fragment?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          promoted_skill_id?: string | null
          proposed_allowed_tools?: string[]
          proposed_business_context?: string | null
          proposed_cost_tier?: string
          proposed_description?: string | null
          proposed_key?: string
          proposed_name?: string
          proposed_risk_tier?: string
          proposed_runtime?: string
          proposed_system_prompt_fragment?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ziro_skill_proposals_promoted_skill_id_fkey"
            columns: ["promoted_skill_id"]
            isOneToOne: false
            referencedRelation: "ziro_skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_skill_proposals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_ziro_task_agents: {
        Row: {
          agent_type: string
          config: Json
          error_text: string | null
          heartbeat_at: string | null
          id: string
          result: Json | null
          retired_at: string | null
          skill_key: string | null
          spawned_at: string
          status: string
          task_run_id: string
          tenant_id: string
        }
        Insert: {
          agent_type?: string
          config?: Json
          error_text?: string | null
          heartbeat_at?: string | null
          id?: string
          result?: Json | null
          retired_at?: string | null
          skill_key?: string | null
          spawned_at?: string
          status?: string
          task_run_id: string
          tenant_id: string
        }
        Update: {
          agent_type?: string
          config?: Json
          error_text?: string | null
          heartbeat_at?: string | null
          id?: string
          result?: Json | null
          retired_at?: string | null
          skill_key?: string | null
          spawned_at?: string
          status?: string
          task_run_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ziro_task_agents_task_run_id_fkey"
            columns: ["task_run_id"]
            isOneToOne: true
            referencedRelation: "_archive_2026_ziro_task_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_task_agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_ziro_task_runs: {
        Row: {
          agent_used_id: string | null
          classification: string
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          created_temp_agent: boolean
          error_text: string | null
          id: string
          idempotency_key: string
          input_payload: Json
          intent_summary: string | null
          origin_message_id: string | null
          output_payload: Json | null
          profile_id: string
          prompt_fragment: string | null
          result_summary: string | null
          retained_after_task: boolean
          route_chosen: string | null
          routing_explanation: string | null
          selected_runtime: string | null
          selected_tools: string[]
          skill_id: string | null
          skill_key: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agent_used_id?: string | null
          classification?: string
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          created_temp_agent?: boolean
          error_text?: string | null
          id?: string
          idempotency_key: string
          input_payload?: Json
          intent_summary?: string | null
          origin_message_id?: string | null
          output_payload?: Json | null
          profile_id: string
          prompt_fragment?: string | null
          result_summary?: string | null
          retained_after_task?: boolean
          route_chosen?: string | null
          routing_explanation?: string | null
          selected_runtime?: string | null
          selected_tools?: string[]
          skill_id?: string | null
          skill_key?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agent_used_id?: string | null
          classification?: string
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          created_temp_agent?: boolean
          error_text?: string | null
          id?: string
          idempotency_key?: string
          input_payload?: Json
          intent_summary?: string | null
          origin_message_id?: string | null
          output_payload?: Json | null
          profile_id?: string
          prompt_fragment?: string | null
          result_summary?: string | null
          retained_after_task?: boolean
          route_chosen?: string | null
          routing_explanation?: string | null
          selected_runtime?: string | null
          selected_tools?: string[]
          skill_id?: string | null
          skill_key?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ziro_task_runs_agent_used_id_fkey"
            columns: ["agent_used_id"]
            isOneToOne: false
            referencedRelation: "ziro_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_task_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_task_runs_origin_message_id_fkey"
            columns: ["origin_message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_task_runs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_task_runs_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "ziro_skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_task_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          location_id: string | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          location_id?: string | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          location_id?: string | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          line1: string | null
          line2: string | null
          postal_code: string | null
          state: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          line1?: string | null
          line2?: string | null
          postal_code?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          line1?: string | null
          line2?: string | null
          postal_code?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_action_logs: {
        Row: {
          action_id: string
          conversation_id: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          ok: boolean
          payload: Json | null
          profile_id: string
          result: Json | null
          tenant_id: string
        }
        Insert: {
          action_id: string
          conversation_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          ok: boolean
          payload?: Json | null
          profile_id: string
          result?: Json | null
          tenant_id: string
        }
        Update: {
          action_id?: string
          conversation_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          ok?: boolean
          payload?: Json | null
          profile_id?: string
          result?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_action_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          client_route: string | null
          created_at: string
          id: string
          metadata: Json
          page_context: Json
          profile_id: string
          source: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_route?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          page_context?: Json
          profile_id: string
          source?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client_route?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          page_context?: Json
          profile_id?: string
          source?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_profile_id_fkey1"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_tenant_id_fkey1"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedback: {
        Row: {
          comment: string | null
          conversation_id: string | null
          created_at: string
          id: string
          message_id: string | null
          profile_id: string
          rating: number | null
          tenant_id: string
        }
        Insert: {
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          profile_id: string
          rating?: number | null
          tenant_id: string
        }
        Update: {
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          profile_id?: string
          rating?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_legacy_message_log: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          profile_id: string
          role: string
          tenant_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          profile_id: string
          role: string
          tenant_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          profile_id?: string
          role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          error_text: string | null
          id: string
          metadata: Json
          model: string | null
          profile_id: string
          role: string
          seq: number
          tenant_id: string
          usage: Json | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          error_text?: string | null
          id?: string
          metadata?: Json
          model?: string | null
          profile_id: string
          role: string
          seq?: number
          tenant_id: string
          usage?: Json | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          error_text?: string | null
          id?: string
          metadata?: Json
          model?: string | null
          profile_id?: string
          role?: string
          seq?: number
          tenant_id?: string
          usage?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workflows: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          description: string | null
          enabled: boolean | null
          id: string
          last_result: Json | null
          last_run_at: string | null
          name: string
          run_count: number | null
          tenant_id: string
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config: Json
          action_type: string
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_result?: Json | null
          last_run_at?: string | null
          name: string
          run_count?: number | null
          tenant_id: string
          trigger_config: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_result?: Json | null
          last_run_at?: string | null
          name?: string
          run_count?: number | null
          tenant_id?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      api_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
          tenant_id: string
          token_hash: string
          token_prefix: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: string[]
          tenant_id?: string
          token_hash: string
          token_prefix: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
          tenant_id?: string
          token_hash?: string
          token_prefix?: string
        }
        Relationships: []
      }
      appointment_notifications: {
        Row: {
          block_id: string
          channel: string
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          message_content: string
          recipient_contact: string | null
          recipient_name: string | null
          recipient_type: string
          sent_at: string
          success: boolean
          tenant_id: string
        }
        Insert: {
          block_id: string
          channel: string
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          message_content: string
          recipient_contact?: string | null
          recipient_name?: string | null
          recipient_type: string
          sent_at?: string
          success?: boolean
          tenant_id: string
        }
        Update: {
          block_id?: string
          channel?: string
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          message_content?: string
          recipient_contact?: string | null
          recipient_name?: string | null
          recipient_type?: string
          sent_at?: string
          success?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity_name: string | null
          id: string
          location_id: string | null
          new_value: Json | null
          old_value: Json | null
          performed_by: string | null
          reason: string | null
          record_id: string | null
          table_name: string
          tenant_id: string
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_name?: string | null
          id?: string
          location_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          tenant_id: string
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_name?: string | null
          id?: string
          location_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          tenant_id?: string
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_adjustments: {
        Row: {
          adjustment_type: string
          amount_cents: number | null
          applied: boolean
          applied_at: string | null
          applied_to_billing_event_id: string | null
          applies_to_cycle: string
          billing_cycle_id: string | null
          created_at: string | null
          created_by: string | null
          family_id: string
          id: string
          notes: string | null
          percent: number | null
          reason: string
          status: string | null
          student_id: string
          tenant_id: string
        }
        Insert: {
          adjustment_type: string
          amount_cents?: number | null
          applied?: boolean
          applied_at?: string | null
          applied_to_billing_event_id?: string | null
          applies_to_cycle: string
          billing_cycle_id?: string | null
          created_at?: string | null
          created_by?: string | null
          family_id: string
          id?: string
          notes?: string | null
          percent?: number | null
          reason: string
          status?: string | null
          student_id: string
          tenant_id: string
        }
        Update: {
          adjustment_type?: string
          amount_cents?: number | null
          applied?: boolean
          applied_at?: string | null
          applied_to_billing_event_id?: string | null
          applies_to_cycle?: string
          billing_cycle_id?: string | null
          created_at?: string | null
          created_by?: string | null
          family_id?: string
          id?: string
          notes?: string | null
          percent?: number | null
          reason?: string
          status?: string | null
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_adjustments_applied_to_billing_event_id_fkey"
            columns: ["applied_to_billing_event_id"]
            isOneToOne: false
            referencedRelation: "billing_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_adjustments_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_adjustments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "billing_adjustments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_adjustments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_cycles: {
        Row: {
          auto_generated_at: string | null
          billing_month: string
          created_at: string | null
          id: string
          label: string
          locked_at: string | null
          sent_at: string | null
          status: string
          tenant_id: string
          total_adjusted_cents: number | null
          total_base_cents: number | null
          total_paid_cents: number | null
          updated_at: string | null
        }
        Insert: {
          auto_generated_at?: string | null
          billing_month: string
          created_at?: string | null
          id?: string
          label: string
          locked_at?: string | null
          sent_at?: string | null
          status?: string
          tenant_id: string
          total_adjusted_cents?: number | null
          total_base_cents?: number | null
          total_paid_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_generated_at?: string | null
          billing_month?: string
          created_at?: string | null
          id?: string
          label?: string
          locked_at?: string | null
          sent_at?: string | null
          status?: string
          tenant_id?: string
          total_adjusted_cents?: number | null
          total_base_cents?: number | null
          total_paid_cents?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_cycles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          amount_cents: number
          attempted_at: string | null
          billing_period_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          failure_reason: string | null
          family_id: string
          id: string
          idempotency_key: string | null
          notes: string | null
          square_payment_id: string | null
          status: string
          student_id: string | null
          tenant_id: string
        }
        Insert: {
          amount_cents: number
          attempted_at?: string | null
          billing_period_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          failure_reason?: string | null
          family_id: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          square_payment_id?: string | null
          status?: string
          student_id?: string | null
          tenant_id: string
        }
        Update: {
          amount_cents?: number
          attempted_at?: string | null
          billing_period_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          failure_reason?: string | null
          family_id?: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          square_payment_id?: string | null
          status?: string
          student_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_billing_period_id_fkey"
            columns: ["billing_period_id"]
            isOneToOne: false
            referencedRelation: "billing_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "billing_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_line_items: {
        Row: {
          billing_event_id: string
          created_at: string | null
          id: string
          rate_per_session_cents: number
          sessions_count: number
          student_id: string
          subtotal_cents: number
        }
        Insert: {
          billing_event_id: string
          created_at?: string | null
          id?: string
          rate_per_session_cents: number
          sessions_count: number
          student_id: string
          subtotal_cents: number
        }
        Update: {
          billing_event_id?: string
          created_at?: string | null
          id?: string
          rate_per_session_cents?: number
          sessions_count?: number
          student_id?: string
          subtotal_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_line_items_billing_event_id_fkey"
            columns: ["billing_event_id"]
            isOneToOne: false
            referencedRelation: "billing_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_line_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "billing_line_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_periods: {
        Row: {
          billing_date: string
          created_at: string | null
          id: string
          period_label: string
          status: string
          tenant_id: string
          total_attempted: number | null
          total_failed: number | null
          total_revenue_cents: number | null
          total_succeeded: number | null
        }
        Insert: {
          billing_date: string
          created_at?: string | null
          id?: string
          period_label: string
          status?: string
          tenant_id: string
          total_attempted?: number | null
          total_failed?: number | null
          total_revenue_cents?: number | null
          total_succeeded?: number | null
        }
        Update: {
          billing_date?: string
          created_at?: string | null
          id?: string
          period_label?: string
          status?: string
          tenant_id?: string
          total_attempted?: number | null
          total_failed?: number | null
          total_revenue_cents?: number | null
          total_succeeded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_settings: {
        Row: {
          address_city: string | null
          address_line1: string | null
          address_state: string | null
          address_zip: string | null
          background_color: string | null
          created_at: string
          email: string | null
          facebook_url: string | null
          ga4_id: string | null
          google_maps_url: string | null
          id: string
          instagram_url: string | null
          location_id: string | null
          logo_circle_path: string | null
          logo_favicon_path: string | null
          logo_wide_path: string | null
          meta_pixel_id: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          studio_name: string | null
          tagline: string | null
          tenant_id: string
          tiktok_pixel_id: string | null
          tiktok_url: string | null
          updated_at: string
          website_domain: string | null
          youtube_url: string | null
        }
        Insert: {
          address_city?: string | null
          address_line1?: string | null
          address_state?: string | null
          address_zip?: string | null
          background_color?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          ga4_id?: string | null
          google_maps_url?: string | null
          id?: string
          instagram_url?: string | null
          location_id?: string | null
          logo_circle_path?: string | null
          logo_favicon_path?: string | null
          logo_wide_path?: string | null
          meta_pixel_id?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          studio_name?: string | null
          tagline?: string | null
          tenant_id: string
          tiktok_pixel_id?: string | null
          tiktok_url?: string | null
          updated_at?: string
          website_domain?: string | null
          youtube_url?: string | null
        }
        Update: {
          address_city?: string | null
          address_line1?: string | null
          address_state?: string | null
          address_zip?: string | null
          background_color?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          ga4_id?: string | null
          google_maps_url?: string | null
          id?: string
          instagram_url?: string | null
          location_id?: string | null
          logo_circle_path?: string | null
          logo_favicon_path?: string | null
          logo_wide_path?: string | null
          meta_pixel_id?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          studio_name?: string | null
          tagline?: string | null
          tenant_id?: string
          tiktok_pixel_id?: string | null
          tiktok_url?: string | null
          updated_at?: string
          website_domain?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_settings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          start_date: string | null
          status: string
          student_id: string
          teacher_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          student_id: string
          teacher_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          student_id?: string
          teacher_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "enrollments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_cents: number
          category: string
          created_at: string
          description: string | null
          effective_date: string | null
          end_date: string | null
          frequency: string | null
          id: string
          is_recurring: boolean | null
          location_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          category: string
          created_at?: string
          description?: string | null
          effective_date?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_recurring?: boolean | null
          location_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          category?: string
          created_at?: string
          description?: string | null
          effective_date?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_recurring?: boolean | null
          location_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          autopay_enabled: boolean | null
          balance: number
          billing_day: number | null
          billing_notes: string | null
          billing_status: string
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last_four: string | null
          created_at: string
          default_payment_method_id: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          id: string
          is_military: boolean
          lifetime_paid_cents: number
          name: string
          notify_via_email: boolean
          notify_via_sms: boolean
          overdue_balance_cents: number
          parent_first_name: string | null
          parent_last_name: string | null
          parent_name: string | null
          primary_contact_name: string | null
          primary_email: string | null
          primary_location_id: string | null
          primary_phone: string | null
          profile_id: string | null
          rate_tier: number
          rate_tier_override: boolean
          rate_tier_override_at: string | null
          rate_tier_override_by: string | null
          rate_tier_reason: string | null
          referral_code: string | null
          referral_count: number | null
          referred_by_family_id: string | null
          reminder_1hr: boolean
          reminder_4hr: boolean
          scheduling_notes: string | null
          sms_opted_out: boolean | null
          square_card_id: string | null
          square_customer_id: string | null
          stripe_customer_id_connect: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          autopay_enabled?: boolean | null
          balance?: number
          billing_day?: number | null
          billing_notes?: string | null
          billing_status?: string
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string
          default_payment_method_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          is_military?: boolean
          lifetime_paid_cents?: number
          name: string
          notify_via_email?: boolean
          notify_via_sms?: boolean
          overdue_balance_cents?: number
          parent_first_name?: string | null
          parent_last_name?: string | null
          parent_name?: string | null
          primary_contact_name?: string | null
          primary_email?: string | null
          primary_location_id?: string | null
          primary_phone?: string | null
          profile_id?: string | null
          rate_tier?: number
          rate_tier_override?: boolean
          rate_tier_override_at?: string | null
          rate_tier_override_by?: string | null
          rate_tier_reason?: string | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by_family_id?: string | null
          reminder_1hr?: boolean
          reminder_4hr?: boolean
          scheduling_notes?: string | null
          sms_opted_out?: boolean | null
          square_card_id?: string | null
          square_customer_id?: string | null
          stripe_customer_id_connect?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          autopay_enabled?: boolean | null
          balance?: number
          billing_day?: number | null
          billing_notes?: string | null
          billing_status?: string
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string
          default_payment_method_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          is_military?: boolean
          lifetime_paid_cents?: number
          name?: string
          notify_via_email?: boolean
          notify_via_sms?: boolean
          overdue_balance_cents?: number
          parent_first_name?: string | null
          parent_last_name?: string | null
          parent_name?: string | null
          primary_contact_name?: string | null
          primary_email?: string | null
          primary_location_id?: string | null
          primary_phone?: string | null
          profile_id?: string | null
          rate_tier?: number
          rate_tier_override?: boolean
          rate_tier_override_at?: string | null
          rate_tier_override_by?: string | null
          rate_tier_reason?: string | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by_family_id?: string | null
          reminder_1hr?: boolean
          reminder_4hr?: boolean
          scheduling_notes?: string | null
          sms_opted_out?: boolean | null
          square_card_id?: string | null
          square_customer_id?: string | null
          stripe_customer_id_connect?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_primary_location_id_fkey"
            columns: ["primary_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_rate_tier_override_by_fkey"
            columns: ["rate_tier_override_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_referred_by_family_id_fkey"
            columns: ["referred_by_family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      family_files: {
        Row: {
          created_at: string | null
          family_id: string
          file_name: string
          file_size_bytes: number | null
          file_type: string
          file_url: string
          id: string
          notes: string | null
          signwell_document_id: string | null
          signwell_status: string | null
          source: string | null
          tenant_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          family_id: string
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          file_url: string
          id?: string
          notes?: string | null
          signwell_document_id?: string | null
          signwell_status?: string | null
          source?: string | null
          tenant_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          family_id?: string
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          signwell_document_id?: string | null
          signwell_status?: string | null
          source?: string | null
          tenant_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_files_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_visible_to_parent: boolean
          student_id: string
          tenant_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_visible_to_parent?: boolean
          student_id: string
          tenant_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_visible_to_parent?: boolean
          student_id?: string
          tenant_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "files_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_accounts: {
        Row: {
          account_name: string
          account_subtype: string | null
          account_type: string | null
          created_at: string
          display_order: number
          id: string
          include_in_financials: boolean
          institution_name: string | null
          is_active: boolean
          is_liquidity_account: boolean
          location_id: string | null
          mask: string | null
          official_name: string | null
          plaid_account_id: string
          plaid_item_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_name: string
          account_subtype?: string | null
          account_type?: string | null
          created_at?: string
          display_order?: number
          id?: string
          include_in_financials?: boolean
          institution_name?: string | null
          is_active?: boolean
          is_liquidity_account?: boolean
          location_id?: string | null
          mask?: string | null
          official_name?: string | null
          plaid_account_id: string
          plaid_item_id: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_subtype?: string | null
          account_type?: string | null
          created_at?: string
          display_order?: number
          id?: string
          include_in_financials?: boolean
          institution_name?: string | null
          is_active?: boolean
          is_liquidity_account?: boolean
          location_id?: string | null
          mask?: string | null
          official_name?: string | null
          plaid_account_id?: string
          plaid_item_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_accounts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "finance_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_accounts_plaid_item_id_fkey"
            columns: ["plaid_item_id"]
            isOneToOne: false
            referencedRelation: "finance_plaid_items"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_balance_snapshots: {
        Row: {
          account_id: string
          available_balance: number | null
          created_at: string
          current_balance: number | null
          id: string
          iso_currency_code: string | null
          snapshot_at: string
          source: string
          tenant_id: string
        }
        Insert: {
          account_id: string
          available_balance?: number | null
          created_at?: string
          current_balance?: number | null
          id?: string
          iso_currency_code?: string | null
          snapshot_at?: string
          source?: string
          tenant_id?: string
        }
        Update: {
          account_id?: string
          available_balance?: number | null
          created_at?: string
          current_balance?: number | null
          id?: string
          iso_currency_code?: string | null
          snapshot_at?: string
          source?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_balance_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          created_at: string
          description: string | null
          group_id: string | null
          id: string
          is_active: boolean
          is_system: boolean
          key: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key: string
          name: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "finance_category_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_category_groups: {
        Row: {
          created_at: string
          direction: string | null
          display_order: number
          id: string
          is_active: boolean
          key: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          direction?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          key: string
          name: string
          tenant_id?: string
        }
        Update: {
          created_at?: string
          direction?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          tenant_id?: string
        }
        Relationships: []
      }
      finance_category_rules: {
        Row: {
          account_id: string | null
          applies_to_direction: string | null
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          location_id: string | null
          match_value: string | null
          match_value_2: string | null
          priority: number
          rule_type: string
          tenant_id: string
        }
        Insert: {
          account_id?: string | null
          applies_to_direction?: string | null
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          match_value?: string | null
          match_value_2?: string | null
          priority?: number
          rule_type: string
          tenant_id?: string
        }
        Update: {
          account_id?: string | null
          applies_to_direction?: string | null
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          match_value?: string | null
          match_value_2?: string | null
          priority?: number
          rule_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_category_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_category_rules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "finance_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_exports: {
        Row: {
          completed_at: string | null
          created_at: string
          export_type: string
          file_url: string | null
          from_month: string | null
          id: string
          location_id: string | null
          requested_by: string | null
          status: string
          tenant_id: string
          to_month: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          export_type: string
          file_url?: string | null
          from_month?: string | null
          id?: string
          location_id?: string | null
          requested_by?: string | null
          status?: string
          tenant_id?: string
          to_month?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          export_type?: string
          file_url?: string | null
          from_month?: string | null
          id?: string
          location_id?: string | null
          requested_by?: string | null
          status?: string
          tenant_id?: string
          to_month?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_exports_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "finance_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_locations: {
        Row: {
          code: string
          core_location_id: string | null
          created_at: string
          id: string
          is_active: boolean
          location_type: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          core_location_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location_type: string
          name: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          code?: string
          core_location_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location_type?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_locations_core_location_id_fkey"
            columns: ["core_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_plaid_items: {
        Row: {
          access_token: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          last_balances_sync_at: string | null
          last_transactions_sync_at: string | null
          last_webhook_at: string | null
          plaid_item_id: string
          status: string
          tenant_id: string
          transactions_cursor: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          last_balances_sync_at?: string | null
          last_transactions_sync_at?: string | null
          last_webhook_at?: string | null
          plaid_item_id: string
          status?: string
          tenant_id?: string
          transactions_cursor?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          last_balances_sync_at?: string | null
          last_transactions_sync_at?: string | null
          last_webhook_at?: string | null
          plaid_item_id?: string
          status?: string
          tenant_id?: string
          transactions_cursor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      finance_recurring_rules: {
        Row: {
          account_id: string | null
          amount_hint: number | null
          cadence: string | null
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          location_id: string | null
          merchant_match: string | null
          name: string
          notes: string | null
          tenant_id: string
          transaction_name_match: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount_hint?: number | null
          cadence?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          merchant_match?: string | null
          name: string
          notes?: string | null
          tenant_id?: string
          transaction_name_match?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount_hint?: number | null
          cadence?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          merchant_match?: string | null
          name?: string
          notes?: string | null
          tenant_id?: string
          transaction_name_match?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_recurring_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_recurring_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_recurring_rules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "finance_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_sync_runs: {
        Row: {
          added_count: number
          completed_at: string | null
          error_message: string | null
          id: string
          metadata: Json
          modified_count: number
          plaid_item_id: string | null
          removed_count: number
          started_at: string
          status: string
          sync_type: string
          tenant_id: string
        }
        Insert: {
          added_count?: number
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json
          modified_count?: number
          plaid_item_id?: string | null
          removed_count?: number
          started_at?: string
          status: string
          sync_type: string
          tenant_id?: string
        }
        Update: {
          added_count?: number
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json
          modified_count?: number
          plaid_item_id?: string | null
          removed_count?: number
          started_at?: string
          status?: string
          sync_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_sync_runs_plaid_item_id_fkey"
            columns: ["plaid_item_id"]
            isOneToOne: false
            referencedRelation: "finance_plaid_items"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transaction_category_assignments: {
        Row: {
          assigned_by: string | null
          assignment_source: string
          category_id: string | null
          confidence: number | null
          created_at: string
          id: string
          tenant_id: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assignment_source: string
          category_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          tenant_id?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assignment_source?: string
          category_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          tenant_id?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transaction_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transaction_category_assignments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "_archive_2026_v_finance_uncategorized_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transaction_category_assignments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          account_id: string
          amount: number
          authorized_date: string | null
          created_at: string
          external_reference: string | null
          id: string
          is_excluded: boolean
          is_pending: boolean
          is_recurring: boolean
          is_transfer: boolean
          iso_currency_code: string | null
          location_id: string | null
          merchant_name: string | null
          month_bucket: string | null
          notes: string | null
          payment_channel: string | null
          pending_plaid_transaction_id: string | null
          plaid_detailed_category: string | null
          plaid_primary_category: string | null
          plaid_transaction_id: string | null
          posted_date: string | null
          raw_payload: Json
          tenant_id: string
          transaction_name: string
          unofficial_currency_code: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          authorized_date?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          is_excluded?: boolean
          is_pending?: boolean
          is_recurring?: boolean
          is_transfer?: boolean
          iso_currency_code?: string | null
          location_id?: string | null
          merchant_name?: string | null
          month_bucket?: string | null
          notes?: string | null
          payment_channel?: string | null
          pending_plaid_transaction_id?: string | null
          plaid_detailed_category?: string | null
          plaid_primary_category?: string | null
          plaid_transaction_id?: string | null
          posted_date?: string | null
          raw_payload?: Json
          tenant_id?: string
          transaction_name: string
          unofficial_currency_code?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          authorized_date?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          is_excluded?: boolean
          is_pending?: boolean
          is_recurring?: boolean
          is_transfer?: boolean
          iso_currency_code?: string | null
          location_id?: string | null
          merchant_name?: string | null
          month_bucket?: string | null
          notes?: string | null
          payment_channel?: string | null
          pending_plaid_transaction_id?: string | null
          plaid_detailed_category?: string | null
          plaid_primary_category?: string | null
          plaid_transaction_id?: string | null
          posted_date?: string | null
          raw_payload?: Json
          tenant_id?: string
          transaction_name?: string
          unofficial_currency_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "finance_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          connected_email: string | null
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          access_token: string
          connected_email?: string | null
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          connected_email?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_oauth_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_submissions: {
        Row: {
          converted_student_id: string | null
          created_at: string
          form_version: string
          id: string
          lead_ids: string[]
          location_id: string | null
          raw_payload: Json
          source: string
          tenant_id: string
        }
        Insert: {
          converted_student_id?: string | null
          created_at?: string
          form_version?: string
          id?: string
          lead_ids?: string[]
          location_id?: string | null
          raw_payload: Json
          source?: string
          tenant_id: string
        }
        Update: {
          converted_student_id?: string | null
          created_at?: string
          form_version?: string
          id?: string
          lead_ids?: string[]
          location_id?: string | null
          raw_payload?: Json
          source?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_submissions_converted_student_id_fkey"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "intake_submissions_converted_student_id_fkey"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_configs: {
        Row: {
          connected_at: string | null
          connected_by: string | null
          credentials: Json | null
          credentials_encrypted: string | null
          enabled: boolean
          health_message: string | null
          health_status: string | null
          id: string
          integration_id: string
          last_activity_at: string | null
          last_health_check: string | null
          settings: Json
          status: string
          tenant_id: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          connected_at?: string | null
          connected_by?: string | null
          credentials?: Json | null
          credentials_encrypted?: string | null
          enabled?: boolean
          health_message?: string | null
          health_status?: string | null
          id?: string
          integration_id: string
          last_activity_at?: string | null
          last_health_check?: string | null
          settings?: Json
          status?: string
          tenant_id?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          connected_at?: string | null
          connected_by?: string | null
          credentials?: Json | null
          credentials_encrypted?: string | null
          enabled?: boolean
          health_message?: string | null
          health_status?: string | null
          id?: string
          integration_id?: string
          last_activity_at?: string | null
          last_health_check?: string | null
          settings?: Json
          status?: string
          tenant_id?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      integration_events: {
        Row: {
          created_at: string | null
          error: string | null
          event_type: string
          id: string
          matched: boolean | null
          matched_entity: string | null
          matched_entity_id: string | null
          payload: Json
          source: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          event_type: string
          id?: string
          matched?: boolean | null
          matched_entity?: string | null
          matched_entity_id?: string | null
          payload?: Json
          source: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          event_type?: string
          id?: string
          matched?: boolean | null
          matched_entity?: string | null
          matched_entity_id?: string | null
          payload?: Json
          source?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_flags: {
        Row: {
          family_id: string
          flagged_at: string | null
          id: string
          invoice_token_id: string
          reason: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          family_id: string
          flagged_at?: string | null
          id?: string
          invoice_token_id: string
          reason: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          family_id?: string
          flagged_at?: string | null
          id?: string
          invoice_token_id?: string
          reason?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_flags_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_flags_invoice_token_id_fkey"
            columns: ["invoice_token_id"]
            isOneToOne: false
            referencedRelation: "invoice_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_tokens: {
        Row: {
          adjustment_total_cents: number | null
          amount_cents: number
          base_amount_cents: number | null
          billing_cycle_id: string | null
          billing_day: number | null
          billing_period_label: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          expires_at: string
          family_id: string
          id: string
          invoice_snapshot: Json | null
          is_prorated: boolean | null
          last_reminder_at: string | null
          location_id: string | null
          paid_at: string | null
          reminder_count: number | null
          sent_at: string | null
          sent_via: string | null
          square_payment_id: string | null
          status: string
          tenant_id: string
          token: string
          viewed_at: string | null
        }
        Insert: {
          adjustment_total_cents?: number | null
          amount_cents: number
          base_amount_cents?: number | null
          billing_cycle_id?: string | null
          billing_day?: number | null
          billing_period_label?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          expires_at?: string
          family_id: string
          id?: string
          invoice_snapshot?: Json | null
          is_prorated?: boolean | null
          last_reminder_at?: string | null
          location_id?: string | null
          paid_at?: string | null
          reminder_count?: number | null
          sent_at?: string | null
          sent_via?: string | null
          square_payment_id?: string | null
          status?: string
          tenant_id: string
          token?: string
          viewed_at?: string | null
        }
        Update: {
          adjustment_total_cents?: number | null
          amount_cents?: number
          base_amount_cents?: number | null
          billing_cycle_id?: string | null
          billing_day?: number | null
          billing_period_label?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          expires_at?: string
          family_id?: string
          id?: string
          invoice_snapshot?: Json | null
          is_prorated?: boolean | null
          last_reminder_at?: string | null
          location_id?: string | null
          paid_at?: string | null
          reminder_count?: number | null
          sent_at?: string | null
          sent_via?: string | null
          square_payment_id?: string | null
          status?: string
          tenant_id?: string
          token?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_tokens_billing_cycle_id_fkey"
            columns: ["billing_cycle_id"]
            isOneToOne: false
            referencedRelation: "billing_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_tokens_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_tokens_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          due_date: string | null
          family_id: string
          id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          family_id: string
          id?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          family_id?: string
          id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          category: string
          created_at: string | null
          deploy_status: string | null
          description: string
          element_description: string
          id: string
          page: string
          pipeline_completed_at: string | null
          pipeline_prompt: string | null
          pipeline_started_at: string | null
          platform: string | null
          related_issue_id: string | null
          reported_by: string
          reported_by_role: string
          reported_from_url: string | null
          reported_screen_height: number | null
          reported_screen_width: number | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          screenshot_path: string | null
          section: string
          severity: string
          status: string
          steps_to_reproduce: string | null
          subsection: string | null
          tenant_id: string
          title: string
          updated_at: string | null
          user_friendly_category: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          deploy_status?: string | null
          description: string
          element_description: string
          id?: string
          page: string
          pipeline_completed_at?: string | null
          pipeline_prompt?: string | null
          pipeline_started_at?: string | null
          platform?: string | null
          related_issue_id?: string | null
          reported_by: string
          reported_by_role: string
          reported_from_url?: string | null
          reported_screen_height?: number | null
          reported_screen_width?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_path?: string | null
          section: string
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          subsection?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
          user_friendly_category?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          deploy_status?: string | null
          description?: string
          element_description?: string
          id?: string
          page?: string
          pipeline_completed_at?: string | null
          pipeline_prompt?: string | null
          pipeline_started_at?: string | null
          platform?: string | null
          related_issue_id?: string | null
          reported_by?: string
          reported_by_role?: string
          reported_from_url?: string | null
          reported_screen_height?: number | null
          reported_screen_width?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_path?: string | null
          section?: string
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          subsection?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          user_friendly_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_related_issue_id_fkey"
            columns: ["related_issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_related_issue_id_fkey"
            columns: ["related_issue_id"]
            isOneToOne: false
            referencedRelation: "issues_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          age: string | null
          age_range: string | null
          ai_context: Json | null
          assigned_teacher_id: string | null
          assigned_to: string | null
          compatibility_score: number | null
          converted_student_id: string | null
          created_at: string
          email: string | null
          experience: string | null
          family_id: string | null
          first_name: string
          follow_up_count: number
          goals: string | null
          has_instrument: string | null
          how_heard: string | null
          id: string
          instrument: string | null
          intake_submission_id: string | null
          is_military: boolean
          last_contact_at: string | null
          last_name: string | null
          location_id: string | null
          lost_category: string | null
          lost_reason: string | null
          matched_block_id: string | null
          matched_teacher_id: string | null
          next_action: string | null
          next_follow_up_at: string | null
          notes: string | null
          parent_name: string | null
          personality_notes: string | null
          phone: string | null
          preferred_days: string[] | null
          preferred_locations: string[] | null
          preferred_times: string | null
          referral_code_used: string | null
          referred_by_family_id: string | null
          secondary_location_ids: string[] | null
          source: string | null
          source_page: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          student_name: string | null
          submission_id: string | null
          tags: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          age?: string | null
          age_range?: string | null
          ai_context?: Json | null
          assigned_teacher_id?: string | null
          assigned_to?: string | null
          compatibility_score?: number | null
          converted_student_id?: string | null
          created_at?: string
          email?: string | null
          experience?: string | null
          family_id?: string | null
          first_name: string
          follow_up_count?: number
          goals?: string | null
          has_instrument?: string | null
          how_heard?: string | null
          id?: string
          instrument?: string | null
          intake_submission_id?: string | null
          is_military?: boolean
          last_contact_at?: string | null
          last_name?: string | null
          location_id?: string | null
          lost_category?: string | null
          lost_reason?: string | null
          matched_block_id?: string | null
          matched_teacher_id?: string | null
          next_action?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          parent_name?: string | null
          personality_notes?: string | null
          phone?: string | null
          preferred_days?: string[] | null
          preferred_locations?: string[] | null
          preferred_times?: string | null
          referral_code_used?: string | null
          referred_by_family_id?: string | null
          secondary_location_ids?: string[] | null
          source?: string | null
          source_page?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          student_name?: string | null
          submission_id?: string | null
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          age?: string | null
          age_range?: string | null
          ai_context?: Json | null
          assigned_teacher_id?: string | null
          assigned_to?: string | null
          compatibility_score?: number | null
          converted_student_id?: string | null
          created_at?: string
          email?: string | null
          experience?: string | null
          family_id?: string | null
          first_name?: string
          follow_up_count?: number
          goals?: string | null
          has_instrument?: string | null
          how_heard?: string | null
          id?: string
          instrument?: string | null
          intake_submission_id?: string | null
          is_military?: boolean
          last_contact_at?: string | null
          last_name?: string | null
          location_id?: string | null
          lost_category?: string | null
          lost_reason?: string | null
          matched_block_id?: string | null
          matched_teacher_id?: string | null
          next_action?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          parent_name?: string | null
          personality_notes?: string | null
          phone?: string | null
          preferred_days?: string[] | null
          preferred_locations?: string[] | null
          preferred_times?: string | null
          referral_code_used?: string | null
          referred_by_family_id?: string | null
          secondary_location_ids?: string[] | null
          source?: string | null
          source_page?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          student_name?: string | null
          submission_id?: string | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_teacher_id_fkey"
            columns: ["assigned_teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "leads_assigned_teacher_id_fkey"
            columns: ["assigned_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_teacher_id_fkey"
            columns: ["assigned_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_student_id_fkey"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "leads_converted_student_id_fkey"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_intake_submission_id_fkey"
            columns: ["intake_submission_id"]
            isOneToOne: false
            referencedRelation: "intake_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_matched_block_id_fkey"
            columns: ["matched_block_id"]
            isOneToOne: false
            referencedRelation: "schedule_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_matched_block_id_fkey"
            columns: ["matched_block_id"]
            isOneToOne: false
            referencedRelation: "scheduling_grid"
            referencedColumns: ["block_id"]
          },
          {
            foreignKeyName: "leads_matched_teacher_id_fkey"
            columns: ["matched_teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "leads_matched_teacher_id_fkey"
            columns: ["matched_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_matched_teacher_id_fkey"
            columns: ["matched_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_referred_by_family_id_fkey"
            columns: ["referred_by_family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      location_hours: {
        Row: {
          close_time: string
          day_of_week: number
          id: string
          is_closed: boolean | null
          location_id: string
          open_time: string
        }
        Insert: {
          close_time: string
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          location_id: string
          open_time: string
        }
        Update: {
          close_time?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          location_id?: string
          open_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_hours_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          city: string
          color: string | null
          created_at: string
          email: string | null
          floorplan_cols: number | null
          floorplan_rows: number | null
          google_review_url: string | null
          hours_json: Json | null
          id: string
          is_active: boolean
          logo_url: string | null
          min_floors: number | null
          name: string
          phone: string | null
          square_location_id: string | null
          state: string
          state_rank: number | null
          students_enrolled: number | null
          students_taught_total: number | null
          tenant_id: string
          updated_at: string
          website: string | null
          zip: string
        }
        Insert: {
          address: string
          city: string
          color?: string | null
          created_at?: string
          email?: string | null
          floorplan_cols?: number | null
          floorplan_rows?: number | null
          google_review_url?: string | null
          hours_json?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          min_floors?: number | null
          name: string
          phone?: string | null
          square_location_id?: string | null
          state?: string
          state_rank?: number | null
          students_enrolled?: number | null
          students_taught_total?: number | null
          tenant_id: string
          updated_at?: string
          website?: string | null
          zip: string
        }
        Update: {
          address?: string
          city?: string
          color?: string | null
          created_at?: string
          email?: string | null
          floorplan_cols?: number | null
          floorplan_rows?: number | null
          google_review_url?: string | null
          hours_json?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          min_floors?: number | null
          name?: string
          phone?: string | null
          square_location_id?: string | null
          state?: string
          state_rank?: number | null
          students_enrolled?: number | null
          students_taught_total?: number | null
          tenant_id?: string
          updated_at?: string
          website?: string | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          profile_id: string
          read: boolean | null
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          route: string | null
          tenant_id: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          profile_id: string
          read?: boolean | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          route?: string | null
          tenant_id: string
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          read?: boolean | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          route?: string | null
          tenant_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_sequences: {
        Row: {
          created_at: string
          day_14_completed_at: string | null
          day_14_due: string | null
          day_14_type: string | null
          day_30_completed_at: string | null
          day_30_due: string | null
          day_30_type: string | null
          day_60_completed_at: string | null
          day_60_due: string | null
          day_60_type: string | null
          day_7_completed_at: string | null
          day_7_due: string | null
          day_7_type: string | null
          day_90_completed_at: string | null
          day_90_due: string | null
          day_90_type: string | null
          enrollment_date: string
          family_id: string | null
          id: string
          location_id: string | null
          risk_flag: boolean | null
          risk_reason: string | null
          status: string
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_14_completed_at?: string | null
          day_14_due?: string | null
          day_14_type?: string | null
          day_30_completed_at?: string | null
          day_30_due?: string | null
          day_30_type?: string | null
          day_60_completed_at?: string | null
          day_60_due?: string | null
          day_60_type?: string | null
          day_7_completed_at?: string | null
          day_7_due?: string | null
          day_7_type?: string | null
          day_90_completed_at?: string | null
          day_90_due?: string | null
          day_90_type?: string | null
          enrollment_date: string
          family_id?: string | null
          id?: string
          location_id?: string | null
          risk_flag?: boolean | null
          risk_reason?: string | null
          status?: string
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_14_completed_at?: string | null
          day_14_due?: string | null
          day_14_type?: string | null
          day_30_completed_at?: string | null
          day_30_due?: string | null
          day_30_type?: string | null
          day_60_completed_at?: string | null
          day_60_due?: string | null
          day_60_type?: string | null
          day_7_completed_at?: string | null
          day_7_due?: string | null
          day_7_type?: string | null
          day_90_completed_at?: string | null
          day_90_due?: string | null
          day_90_type?: string | null
          enrollment_date?: string
          family_id?: string | null
          id?: string
          location_id?: string | null
          risk_flag?: boolean | null
          risk_reason?: string | null
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_sequences_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sequences_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sequences_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "onboarding_sequences_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_reminders: {
        Row: {
          block_id: string
          cancelled: boolean
          created_at: string
          fire_at: string
          fired: boolean
          id: string
          reminder_type: string
        }
        Insert: {
          block_id: string
          cancelled?: boolean
          created_at?: string
          fire_at: string
          fired?: boolean
          id?: string
          reminder_type: string
        }
        Update: {
          block_id?: string
          cancelled?: boolean
          created_at?: string
          fire_at?: string
          fired?: boolean
          id?: string
          reminder_type?: string
        }
        Relationships: []
      }
      performance_alerts: {
        Row: {
          alert_type: string
          created_at: string
          dedupe_key: string
          details: Json | null
          first_seen_at: string
          id: string
          last_seen_at: string
          latest_metric: number | null
          message: string
          muted_until: string | null
          occurrence_count: number
          regressed_at: string | null
          resolution_reason: string | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string
          tenant_id: string
          worst_metric: number | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          dedupe_key: string
          details?: Json | null
          first_seen_at: string
          id?: string
          last_seen_at: string
          latest_metric?: number | null
          message: string
          muted_until?: string | null
          occurrence_count?: number
          regressed_at?: string | null
          resolution_reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
          tenant_id: string
          worst_metric?: number | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          dedupe_key?: string
          details?: Json | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          latest_metric?: number | null
          message?: string
          muted_until?: string | null
          occurrence_count?: number
          regressed_at?: string | null
          resolution_reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          tenant_id?: string
          worst_metric?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          cls_score: number | null
          created_at: string
          fcp_ms: number | null
          id: string
          inp_ms: number | null
          lcp_ms: number | null
          load_time_ms: number | null
          page_route: string
          session_id: string
          tenant_id: string
          ttfb_ms: number | null
        }
        Insert: {
          cls_score?: number | null
          created_at?: string
          fcp_ms?: number | null
          id?: string
          inp_ms?: number | null
          lcp_ms?: number | null
          load_time_ms?: number | null
          page_route: string
          session_id: string
          tenant_id: string
          ttfb_ms?: number | null
        }
        Update: {
          cls_score?: number | null
          created_at?: string
          fcp_ms?: number | null
          id?: string
          inp_ms?: number | null
          lcp_ms?: number | null
          load_time_ms?: number | null
          page_route?: string
          session_id?: string
          tenant_id?: string
          ttfb_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_definitions: {
        Row: {
          category: string
          company_director_default: boolean | null
          created_at: string | null
          description: string | null
          id: string
          key: string
          label: string
          owner_default: boolean | null
          parent_default: boolean | null
          sort_order: number | null
          studio_director_default: boolean | null
          teacher_default: boolean | null
          tenant_id: string
        }
        Insert: {
          category: string
          company_director_default?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          label: string
          owner_default?: boolean | null
          parent_default?: boolean | null
          sort_order?: number | null
          studio_director_default?: boolean | null
          teacher_default?: boolean | null
          tenant_id: string
        }
        Update: {
          category?: string
          company_director_default?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          label?: string
          owner_default?: boolean | null
          parent_default?: boolean | null
          sort_order?: number | null
          studio_director_default?: boolean | null
          teacher_default?: boolean | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_definitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_locations: {
        Row: {
          created_at: string
          id: string
          location_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_locations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          export_pin: string | null
          first_name: string
          id: string
          is_active: boolean
          is_platform_admin: boolean | null
          last_name: string
          onboarding_completed_at: string | null
          onboarding_skipped: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          export_pin?: string | null
          first_name: string
          id: string
          is_active?: boolean
          is_platform_admin?: boolean | null
          last_name: string
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          export_pin?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          is_platform_admin?: boolean | null
          last_name?: string
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean | null
          body: string | null
          created_at: string | null
          family_id: string | null
          featured: boolean | null
          id: string
          instrument_tag: string
          is_active: boolean | null
          location_id: string | null
          location_name: string
          parent_name: string | null
          prompted_by: string | null
          rating: number | null
          review_token: string | null
          reviewer_name: string
          shareable: boolean | null
          student_id: string | null
          student_name: string | null
          tenant_id: string | null
          text_cleaned: string
        }
        Insert: {
          approved?: boolean | null
          body?: string | null
          created_at?: string | null
          family_id?: string | null
          featured?: boolean | null
          id?: string
          instrument_tag?: string
          is_active?: boolean | null
          location_id?: string | null
          location_name: string
          parent_name?: string | null
          prompted_by?: string | null
          rating?: number | null
          review_token?: string | null
          reviewer_name: string
          shareable?: boolean | null
          student_id?: string | null
          student_name?: string | null
          tenant_id?: string | null
          text_cleaned: string
        }
        Update: {
          approved?: boolean | null
          body?: string | null
          created_at?: string | null
          family_id?: string | null
          featured?: boolean | null
          id?: string
          instrument_tag?: string
          is_active?: boolean | null
          location_id?: string | null
          location_name?: string
          parent_name?: string | null
          prompted_by?: string | null
          rating?: number | null
          review_token?: string | null
          reviewer_name?: string
          shareable?: boolean | null
          student_id?: string | null
          student_name?: string | null
          tenant_id?: string | null
          text_cleaned?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      room_inventory: {
        Row: {
          condition: string
          created_at: string | null
          flag_note: string | null
          flagged_at: string | null
          flagged_by: string | null
          id: string
          is_flagged: boolean | null
          item_name: string
          quantity: number | null
          resolve_reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          room_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          condition?: string
          created_at?: string | null
          flag_note?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_flagged?: boolean | null
          item_name: string
          quantity?: number | null
          resolve_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          condition?: string
          created_at?: string | null
          flag_note?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_flagged?: boolean | null
          item_name?: string
          quantity?: number | null
          resolve_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_inventory_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_inventory_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_inventory_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_inventory_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          color: string | null
          created_at: string | null
          display_order: number | null
          floor: number | null
          id: string
          is_active: boolean | null
          layout_h: number | null
          layout_w: number | null
          layout_x: number | null
          layout_y: number | null
          location_id: string | null
          name: string
          notes: string | null
          primary_instruments: string[] | null
          room_type: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          floor?: number | null
          id?: string
          is_active?: boolean | null
          layout_h?: number | null
          layout_w?: number | null
          layout_x?: number | null
          layout_y?: number | null
          location_id?: string | null
          name: string
          notes?: string | null
          primary_instruments?: string[] | null
          room_type?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          floor?: number | null
          id?: string
          is_active?: boolean | null
          layout_h?: number | null
          layout_w?: number | null
          layout_x?: number | null
          layout_y?: number | null
          location_id?: string | null
          name?: string
          notes?: string | null
          primary_instruments?: string[] | null
          room_type?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          ai_context: Json | null
          block_date: string
          block_type: Database["public"]["Enums"]["block_type"]
          callout_id: string | null
          callout_reason: string | null
          checked_in: boolean
          checked_in_at: string | null
          checked_in_by: string | null
          converted_by: string | null
          converted_to_virtual_at: string | null
          created_at: string
          end_time: string
          fifth_week: boolean
          generated_from_availability: boolean | null
          id: string
          is_family_callout: boolean | null
          is_makeup_session: boolean | null
          is_recurring: boolean
          is_virtual: boolean
          location_id: string
          makeup_session_id: string | null
          meet_event_id: string | null
          meet_link: string | null
          notes: string | null
          original_teacher_id: string | null
          original_teacher_name: string | null
          reminder_sent: boolean | null
          room: string | null
          room_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["block_status"]
          student_id: string | null
          teacher_id: string
          teacher_tally: boolean | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ai_context?: Json | null
          block_date: string
          block_type?: Database["public"]["Enums"]["block_type"]
          callout_id?: string | null
          callout_reason?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          converted_by?: string | null
          converted_to_virtual_at?: string | null
          created_at?: string
          end_time: string
          fifth_week?: boolean
          generated_from_availability?: boolean | null
          id?: string
          is_family_callout?: boolean | null
          is_makeup_session?: boolean | null
          is_recurring?: boolean
          is_virtual?: boolean
          location_id: string
          makeup_session_id?: string | null
          meet_event_id?: string | null
          meet_link?: string | null
          notes?: string | null
          original_teacher_id?: string | null
          original_teacher_name?: string | null
          reminder_sent?: boolean | null
          room?: string | null
          room_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["block_status"]
          student_id?: string | null
          teacher_id: string
          teacher_tally?: boolean | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ai_context?: Json | null
          block_date?: string
          block_type?: Database["public"]["Enums"]["block_type"]
          callout_id?: string | null
          callout_reason?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          converted_by?: string | null
          converted_to_virtual_at?: string | null
          created_at?: string
          end_time?: string
          fifth_week?: boolean
          generated_from_availability?: boolean | null
          id?: string
          is_family_callout?: boolean | null
          is_makeup_session?: boolean | null
          is_recurring?: boolean
          is_virtual?: boolean
          location_id?: string
          makeup_session_id?: string | null
          meet_event_id?: string | null
          meet_link?: string | null
          notes?: string | null
          original_teacher_id?: string | null
          original_teacher_name?: string | null
          reminder_sent?: boolean | null
          room?: string | null
          room_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["block_status"]
          student_id?: string | null
          teacher_id?: string
          teacher_tally?: boolean | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_block_callout"
            columns: ["callout_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_student_callouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_block_makeup"
            columns: ["makeup_session_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_makeup_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_converted_by_fkey"
            columns: ["converted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_original_teacher_id_fkey"
            columns: ["original_teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "schedule_blocks_original_teacher_id_fkey"
            columns: ["original_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_original_teacher_id_fkey"
            columns: ["original_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "schedule_blocks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "schedule_blocks_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      session_log: {
        Row: {
          ai_context: Json | null
          ai_summary: string | null
          block_date: string
          communication_id: string | null
          created_at: string
          engagement_level: number | null
          id: string
          instrument: string | null
          lesson_notes: string | null
          location_id: string
          parent_update_status: string | null
          payment_gated: boolean
          progress_indicator: string | null
          schedule_block_id: string
          status: string
          student_id: string
          student_rate: number
          teacher_id: string
          teacher_note: string | null
          teacher_rate: number
          tenant_id: string
          voice_note_url: string | null
          worked_on: string[] | null
        }
        Insert: {
          ai_context?: Json | null
          ai_summary?: string | null
          block_date: string
          communication_id?: string | null
          created_at?: string
          engagement_level?: number | null
          id?: string
          instrument?: string | null
          lesson_notes?: string | null
          location_id: string
          parent_update_status?: string | null
          payment_gated?: boolean
          progress_indicator?: string | null
          schedule_block_id: string
          status?: string
          student_id: string
          student_rate: number
          teacher_id: string
          teacher_note?: string | null
          teacher_rate: number
          tenant_id: string
          voice_note_url?: string | null
          worked_on?: string[] | null
        }
        Update: {
          ai_context?: Json | null
          ai_summary?: string | null
          block_date?: string
          communication_id?: string | null
          created_at?: string
          engagement_level?: number | null
          id?: string
          instrument?: string | null
          lesson_notes?: string | null
          location_id?: string
          parent_update_status?: string | null
          payment_gated?: boolean
          progress_indicator?: string | null
          schedule_block_id?: string
          status?: string
          student_id?: string
          student_rate?: number
          teacher_id?: string
          teacher_note?: string | null
          teacher_rate?: number
          tenant_id?: string
          voice_note_url?: string | null
          worked_on?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "session_log_communication_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_log_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_log_schedule_block_id_fkey"
            columns: ["schedule_block_id"]
            isOneToOne: false
            referencedRelation: "schedule_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_log_schedule_block_id_fkey"
            columns: ["schedule_block_id"]
            isOneToOne: false
            referencedRelation: "scheduling_grid"
            referencedColumns: ["block_id"]
          },
          {
            foreignKeyName: "session_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "session_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_log_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "session_log_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_log_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      square_invoices: {
        Row: {
          amount_cents: number | null
          amount_paid: number | null
          customer_email: string | null
          customer_name: string | null
          due_date: string | null
          family_id: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          location_id: string | null
          paid_at: string | null
          raw_data: Json | null
          recurring_series_id: string | null
          requested_amount: number | null
          scheduled_at: string | null
          square_created_at: string | null
          square_customer_id: string | null
          square_invoice_id: string
          square_location_id: string | null
          status: string | null
          synced_at: string | null
          tenant_id: string
          title: string | null
        }
        Insert: {
          amount_cents?: number | null
          amount_paid?: number | null
          customer_email?: string | null
          customer_name?: string | null
          due_date?: string | null
          family_id?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          location_id?: string | null
          paid_at?: string | null
          raw_data?: Json | null
          recurring_series_id?: string | null
          requested_amount?: number | null
          scheduled_at?: string | null
          square_created_at?: string | null
          square_customer_id?: string | null
          square_invoice_id: string
          square_location_id?: string | null
          status?: string | null
          synced_at?: string | null
          tenant_id: string
          title?: string | null
        }
        Update: {
          amount_cents?: number | null
          amount_paid?: number | null
          customer_email?: string | null
          customer_name?: string | null
          due_date?: string | null
          family_id?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          location_id?: string | null
          paid_at?: string | null
          raw_data?: Json | null
          recurring_series_id?: string | null
          requested_amount?: number | null
          scheduled_at?: string | null
          square_created_at?: string | null
          square_customer_id?: string | null
          square_invoice_id?: string
          square_location_id?: string | null
          status?: string | null
          synced_at?: string | null
          tenant_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "square_invoices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "square_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      square_payments_fact: {
        Row: {
          amount_money_cents: number | null
          application_fee_money_cents: number | null
          created_at_square: string | null
          id: string
          location_id: string | null
          net_total_cents: number | null
          processing_fee_total_cents: number
          raw_json: Json
          refunded_money_cents: number | null
          reporting_date: string
          source_type: string | null
          square_location_id: string | null
          square_payment_id: string
          status: string
          synced_at: string
          tenant_id: string
          tender_bucket: string
          tip_money_cents: number | null
          total_money_cents: number | null
          updated_at_square: string | null
        }
        Insert: {
          amount_money_cents?: number | null
          application_fee_money_cents?: number | null
          created_at_square?: string | null
          id?: string
          location_id?: string | null
          net_total_cents?: number | null
          processing_fee_total_cents?: number
          raw_json?: Json
          refunded_money_cents?: number | null
          reporting_date: string
          source_type?: string | null
          square_location_id?: string | null
          square_payment_id: string
          status: string
          synced_at?: string
          tenant_id: string
          tender_bucket: string
          tip_money_cents?: number | null
          total_money_cents?: number | null
          updated_at_square?: string | null
        }
        Update: {
          amount_money_cents?: number | null
          application_fee_money_cents?: number | null
          created_at_square?: string | null
          id?: string
          location_id?: string | null
          net_total_cents?: number | null
          processing_fee_total_cents?: number
          raw_json?: Json
          refunded_money_cents?: number | null
          reporting_date?: string
          source_type?: string | null
          square_location_id?: string | null
          square_payment_id?: string
          status?: string
          synced_at?: string
          tenant_id?: string
          tender_bucket?: string
          tip_money_cents?: number | null
          total_money_cents?: number | null
          updated_at_square?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "square_payments_fact_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      square_refunds_fact: {
        Row: {
          amount_money_cents: number
          created_at_square: string | null
          id: string
          location_id: string | null
          raw_json: Json
          reporting_date: string
          square_location_id: string | null
          square_payment_id: string
          square_refund_id: string
          status: string | null
          synced_at: string
          tenant_id: string
          updated_at_square: string | null
        }
        Insert: {
          amount_money_cents: number
          created_at_square?: string | null
          id?: string
          location_id?: string | null
          raw_json?: Json
          reporting_date: string
          square_location_id?: string | null
          square_payment_id: string
          square_refund_id: string
          status?: string | null
          synced_at?: string
          tenant_id: string
          updated_at_square?: string | null
        }
        Update: {
          amount_money_cents?: number
          created_at_square?: string | null
          id?: string
          location_id?: string | null
          raw_json?: Json
          reporting_date?: string
          square_location_id?: string | null
          square_payment_id?: string
          square_refund_id?: string
          status?: string | null
          synced_at?: string
          tenant_id?: string
          updated_at_square?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "square_refunds_fact_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      student_duplicate_reviews: {
        Row: {
          candidate_existing_student_id: string
          created_at: string
          family_id: string
          id: string
          lead_id: string | null
          new_student_id: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          candidate_existing_student_id: string
          created_at?: string
          family_id: string
          id?: string
          lead_id?: string | null
          new_student_id: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          candidate_existing_student_id?: string
          created_at?: string
          family_id?: string
          id?: string
          lead_id?: string | null
          new_student_id?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_duplicate_reviews_candidate_existing_student_id_fkey"
            columns: ["candidate_existing_student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_duplicate_reviews_candidate_existing_student_id_fkey"
            columns: ["candidate_existing_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_duplicate_reviews_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_duplicate_reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_duplicate_reviews_new_student_id_fkey"
            columns: ["new_student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_duplicate_reviews_new_student_id_fkey"
            columns: ["new_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_duplicate_reviews_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_duplicate_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          flagged_at: string | null
          flagged_by: string | null
          flagged_for_deletion: boolean | null
          folder: string
          id: string
          student_id: string
          tenant_id: string
          uploaded_by: string | null
          uploaded_by_role: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          flagged_at?: string | null
          flagged_by?: string | null
          flagged_for_deletion?: boolean | null
          folder?: string
          id?: string
          student_id: string
          tenant_id: string
          uploaded_by?: string | null
          uploaded_by_role?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          flagged_at?: string | null
          flagged_by?: string | null
          flagged_for_deletion?: boolean | null
          folder?: string
          id?: string
          student_id?: string
          tenant_id?: string
          uploaded_by?: string | null
          uploaded_by_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_files_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_files_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_followups: {
        Row: {
          ai_draft: string | null
          created_at: string | null
          created_by: string | null
          family_id: string
          followup_date: string
          id: string
          notes: string | null
          reason: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          student_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ai_draft?: string | null
          created_at?: string | null
          created_by?: string | null
          family_id: string
          followup_date: string
          id?: string
          notes?: string | null
          reason?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          student_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ai_draft?: string | null
          created_at?: string | null
          created_by?: string | null
          family_id?: string
          followup_date?: string
          id?: string
          notes?: string | null
          reason?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_followups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_followups_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_followups_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_followups_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_followups_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_followups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_instruments: {
        Row: {
          created_at: string
          id: string
          instrument: string
          is_primary: boolean
          rate_per_session: number
          sessions_per_month: number
          status: string
          student_id: string
          teacher_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrument: string
          is_primary?: boolean
          rate_per_session?: number
          sessions_per_month?: number
          status?: string
          student_id: string
          teacher_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instrument?: string
          is_primary?: boolean
          rate_per_session?: number
          sessions_per_month?: number
          status?: string
          student_id?: string
          teacher_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_instruments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_instruments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_instruments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "student_instruments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_instruments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_instruments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          age: string | null
          ai_context: Json | null
          bio: string | null
          blocks_per_week: number
          card_brand: string | null
          card_last_four: string | null
          coming_back: boolean | null
          counts_toward_family_tier: boolean
          created_at: string
          date_of_birth: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          email: string | null
          end_date: string | null
          enrollment_type: string | null
          exit_category: string | null
          exit_notes: string | null
          exit_reason: string | null
          expected_return_date: string | null
          experience: string | null
          family_id: string | null
          fifth_weeks_used: number | null
          first_lesson_date: string | null
          first_name: string
          first_teacher_id: string | null
          first_teacher_name: string | null
          followup_date: string | null
          followup_sent: boolean | null
          followup_sent_at: string | null
          goals: string | null
          has_instrument: string | null
          id: string
          instrument: string | null
          intake_submission_id: string | null
          is_military: boolean | null
          last_name: string
          last_teacher_id: string | null
          last_teacher_name: string | null
          learning_style: string | null
          lesson_day_of_week: number | null
          location_id: string | null
          may_return: string | null
          notes: string | null
          overdue_amount: number | null
          pause_reason: string | null
          pause_reason_detail: string | null
          phone: string | null
          preferred_days: string[] | null
          previous_teacher_id: string | null
          profile_id: string | null
          rate_per_session: number
          reactivation_date: string | null
          sessions_per_month: number
          source: string | null
          square_customer_id: string | null
          start_date: string | null
          status: string
          student_display_id: string | null
          tags: string[] | null
          teacher_changed_at: string | null
          teacher_id: string | null
          teacher_notes: string | null
          tenant_id: string
          total_callouts: number
          total_fifth_weeks: number
          total_lessons_taken: number | null
          total_paid: number | null
          transferred_to_location_id: string | null
          updated_at: string
        }
        Insert: {
          age?: string | null
          ai_context?: Json | null
          bio?: string | null
          blocks_per_week?: number
          card_brand?: string | null
          card_last_four?: string | null
          coming_back?: boolean | null
          counts_toward_family_tier?: boolean
          created_at?: string
          date_of_birth?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          email?: string | null
          end_date?: string | null
          enrollment_type?: string | null
          exit_category?: string | null
          exit_notes?: string | null
          exit_reason?: string | null
          expected_return_date?: string | null
          experience?: string | null
          family_id?: string | null
          fifth_weeks_used?: number | null
          first_lesson_date?: string | null
          first_name: string
          first_teacher_id?: string | null
          first_teacher_name?: string | null
          followup_date?: string | null
          followup_sent?: boolean | null
          followup_sent_at?: string | null
          goals?: string | null
          has_instrument?: string | null
          id?: string
          instrument?: string | null
          intake_submission_id?: string | null
          is_military?: boolean | null
          last_name: string
          last_teacher_id?: string | null
          last_teacher_name?: string | null
          learning_style?: string | null
          lesson_day_of_week?: number | null
          location_id?: string | null
          may_return?: string | null
          notes?: string | null
          overdue_amount?: number | null
          pause_reason?: string | null
          pause_reason_detail?: string | null
          phone?: string | null
          preferred_days?: string[] | null
          previous_teacher_id?: string | null
          profile_id?: string | null
          rate_per_session?: number
          reactivation_date?: string | null
          sessions_per_month?: number
          source?: string | null
          square_customer_id?: string | null
          start_date?: string | null
          status?: string
          student_display_id?: string | null
          tags?: string[] | null
          teacher_changed_at?: string | null
          teacher_id?: string | null
          teacher_notes?: string | null
          tenant_id: string
          total_callouts?: number
          total_fifth_weeks?: number
          total_lessons_taken?: number | null
          total_paid?: number | null
          transferred_to_location_id?: string | null
          updated_at?: string
        }
        Update: {
          age?: string | null
          ai_context?: Json | null
          bio?: string | null
          blocks_per_week?: number
          card_brand?: string | null
          card_last_four?: string | null
          coming_back?: boolean | null
          counts_toward_family_tier?: boolean
          created_at?: string
          date_of_birth?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          email?: string | null
          end_date?: string | null
          enrollment_type?: string | null
          exit_category?: string | null
          exit_notes?: string | null
          exit_reason?: string | null
          expected_return_date?: string | null
          experience?: string | null
          family_id?: string | null
          fifth_weeks_used?: number | null
          first_lesson_date?: string | null
          first_name?: string
          first_teacher_id?: string | null
          first_teacher_name?: string | null
          followup_date?: string | null
          followup_sent?: boolean | null
          followup_sent_at?: string | null
          goals?: string | null
          has_instrument?: string | null
          id?: string
          instrument?: string | null
          intake_submission_id?: string | null
          is_military?: boolean | null
          last_name?: string
          last_teacher_id?: string | null
          last_teacher_name?: string | null
          learning_style?: string | null
          lesson_day_of_week?: number | null
          location_id?: string | null
          may_return?: string | null
          notes?: string | null
          overdue_amount?: number | null
          pause_reason?: string | null
          pause_reason_detail?: string | null
          phone?: string | null
          preferred_days?: string[] | null
          previous_teacher_id?: string | null
          profile_id?: string | null
          rate_per_session?: number
          reactivation_date?: string | null
          sessions_per_month?: number
          source?: string | null
          square_customer_id?: string | null
          start_date?: string | null
          status?: string
          student_display_id?: string | null
          tags?: string[] | null
          teacher_changed_at?: string | null
          teacher_id?: string | null
          teacher_notes?: string | null
          tenant_id?: string
          total_callouts?: number
          total_fifth_weeks?: number
          total_lessons_taken?: number | null
          total_paid?: number | null
          transferred_to_location_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_first_teacher_id_fkey"
            columns: ["first_teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "students_first_teacher_id_fkey"
            columns: ["first_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_first_teacher_id_fkey"
            columns: ["first_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_intake_submission_id_fkey"
            columns: ["intake_submission_id"]
            isOneToOne: false
            referencedRelation: "intake_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_last_teacher_id_fkey"
            columns: ["last_teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "students_last_teacher_id_fkey"
            columns: ["last_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_last_teacher_id_fkey"
            columns: ["last_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_previous_teacher_id_fkey"
            columns: ["previous_teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "students_previous_teacher_id_fkey"
            columns: ["previous_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_previous_teacher_id_fkey"
            columns: ["previous_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_transferred_to_location_id_fkey"
            columns: ["transferred_to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_closures: {
        Row: {
          affects_billing: boolean | null
          closure_date: string
          created_at: string | null
          created_by: string | null
          emoji: string | null
          id: string
          label: string
          location_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          affects_billing?: boolean | null
          closure_date: string
          created_at?: string | null
          created_by?: string | null
          emoji?: string | null
          id?: string
          label: string
          location_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          affects_billing?: boolean | null
          closure_date?: string
          created_at?: string | null
          created_by?: string | null
          emoji?: string | null
          id?: string
          label?: string
          location_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_closures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_closures_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_messages: {
        Row: {
          created_at: string | null
          direction: string
          family_id: string
          from_phone: string | null
          id: string
          location_id: string | null
          message_text: string
          quo_delivered_at: string | null
          quo_queued: boolean | null
          read: boolean | null
          read_at: string | null
          read_by: string | null
          sent_by_profile_id: string | null
          sent_via: string
          student_id: string | null
          tenant_id: string
          to_phone: string | null
        }
        Insert: {
          created_at?: string | null
          direction: string
          family_id: string
          from_phone?: string | null
          id?: string
          location_id?: string | null
          message_text: string
          quo_delivered_at?: string | null
          quo_queued?: boolean | null
          read?: boolean | null
          read_at?: string | null
          read_by?: string | null
          sent_by_profile_id?: string | null
          sent_via?: string
          student_id?: string | null
          tenant_id: string
          to_phone?: string | null
        }
        Update: {
          created_at?: string | null
          direction?: string
          family_id?: string
          from_phone?: string | null
          id?: string
          location_id?: string | null
          message_text?: string
          quo_delivered_at?: string | null
          quo_queued?: boolean | null
          read?: boolean | null
          read_at?: string | null
          read_by?: string | null
          sent_by_profile_id?: string | null
          sent_via?: string
          student_id?: string | null
          tenant_id?: string
          to_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_messages_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_messages_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_messages_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_messages_sent_by_profile_id_fkey"
            columns: ["sent_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "studio_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_role: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          completion_note: string | null
          created_at: string | null
          created_by: string | null
          created_by_role: string | null
          dedup_key: string | null
          description: string | null
          due_date: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          escalated: boolean | null
          escalated_task_id: string | null
          file_verified: boolean | null
          id: string
          location_id: string | null
          priority: string
          recurring: string | null
          snoozed_until: string | null
          status: string
          task_type: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_role?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_note?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_role?: string | null
          dedup_key?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          escalated?: boolean | null
          escalated_task_id?: string | null
          file_verified?: boolean | null
          id?: string
          location_id?: string | null
          priority?: string
          recurring?: string | null
          snoozed_until?: string | null
          status?: string
          task_type: string
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_role?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_note?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_role?: string | null
          dedup_key?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          escalated?: boolean | null
          escalated_task_id?: string | null
          file_verified?: boolean | null
          id?: string
          location_id?: string | null
          priority?: string
          recurring?: string | null
          snoozed_until?: string | null
          status?: string
          task_type?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_escalated_task_id_fkey"
            columns: ["escalated_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_availability: {
        Row: {
          created_at: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          is_active: boolean
          location_id: string
          start_time: string
          teacher_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          is_active?: boolean
          location_id: string
          start_time: string
          teacher_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          is_active?: boolean
          location_id?: string
          start_time?: string
          teacher_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_locations: {
        Row: {
          created_at: string | null
          id: string
          location_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_locations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_locations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_locations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_room_assignments: {
        Row: {
          assignment_date: string
          created_at: string | null
          created_by: string | null
          id: string
          location_id: string | null
          room_id: string | null
          teacher_id: string | null
          tenant_id: string | null
        }
        Insert: {
          assignment_date: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          location_id?: string | null
          room_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          assignment_date?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          location_id?: string | null
          room_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_room_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_room_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_room_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_room_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_room_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_room_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          acceptable_age_range: string | null
          ai_context: Json | null
          best_age_range: string | null
          best_first_lesson_fit: string | null
          best_match_students: string | null
          bio: string | null
          contract_pdf_url: string | null
          contract_signed_at: string | null
          contract_status: string | null
          created_at: string
          customer_facing_match_summary: string | null
          director_notes: string | null
          display_name: string | null
          documents_locked: boolean
          email: string | null
          first_name: string | null
          hire_date: string | null
          id: string
          instruments: string[]
          internal_match_notes: string | null
          internal_matching_tags: string | null
          is_active: boolean
          is_sub_available: boolean
          last_name: string | null
          lesson_style: string | null
          meet_and_greet_fit: string | null
          musical_strengths_background: string | null
          needs_1099: boolean
          pay_rate_per_half_hour: number | null
          personality: string | null
          phone: string | null
          photo_url: string | null
          preferred_age_range: string | null
          primary_instruments: string | null
          profile_id: string | null
          rate_per_block: number
          secondary_instruments: string | null
          skill_levels_by_instrument: string | null
          square_team_member_id: string | null
          status: string | null
          style_genre_strengths: string | null
          sub_available: boolean | null
          substitute_coverage: string | null
          teacher_role: string | null
          teaching_strengths: string | null
          tenant_id: string
          termination_date: string | null
          updated_at: string
          use_caution_internal_placement_notes: string | null
          w9_completed_at: string | null
          w9_status: string | null
        }
        Insert: {
          acceptable_age_range?: string | null
          ai_context?: Json | null
          best_age_range?: string | null
          best_first_lesson_fit?: string | null
          best_match_students?: string | null
          bio?: string | null
          contract_pdf_url?: string | null
          contract_signed_at?: string | null
          contract_status?: string | null
          created_at?: string
          customer_facing_match_summary?: string | null
          director_notes?: string | null
          display_name?: string | null
          documents_locked?: boolean
          email?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string
          instruments: string[]
          internal_match_notes?: string | null
          internal_matching_tags?: string | null
          is_active?: boolean
          is_sub_available?: boolean
          last_name?: string | null
          lesson_style?: string | null
          meet_and_greet_fit?: string | null
          musical_strengths_background?: string | null
          needs_1099?: boolean
          pay_rate_per_half_hour?: number | null
          personality?: string | null
          phone?: string | null
          photo_url?: string | null
          preferred_age_range?: string | null
          primary_instruments?: string | null
          profile_id?: string | null
          rate_per_block?: number
          secondary_instruments?: string | null
          skill_levels_by_instrument?: string | null
          square_team_member_id?: string | null
          status?: string | null
          style_genre_strengths?: string | null
          sub_available?: boolean | null
          substitute_coverage?: string | null
          teacher_role?: string | null
          teaching_strengths?: string | null
          tenant_id: string
          termination_date?: string | null
          updated_at?: string
          use_caution_internal_placement_notes?: string | null
          w9_completed_at?: string | null
          w9_status?: string | null
        }
        Update: {
          acceptable_age_range?: string | null
          ai_context?: Json | null
          best_age_range?: string | null
          best_first_lesson_fit?: string | null
          best_match_students?: string | null
          bio?: string | null
          contract_pdf_url?: string | null
          contract_signed_at?: string | null
          contract_status?: string | null
          created_at?: string
          customer_facing_match_summary?: string | null
          director_notes?: string | null
          display_name?: string | null
          documents_locked?: boolean
          email?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string
          instruments?: string[]
          internal_match_notes?: string | null
          internal_matching_tags?: string | null
          is_active?: boolean
          is_sub_available?: boolean
          last_name?: string | null
          lesson_style?: string | null
          meet_and_greet_fit?: string | null
          musical_strengths_background?: string | null
          needs_1099?: boolean
          pay_rate_per_half_hour?: number | null
          personality?: string | null
          phone?: string | null
          photo_url?: string | null
          preferred_age_range?: string | null
          primary_instruments?: string | null
          profile_id?: string | null
          rate_per_block?: number
          secondary_instruments?: string | null
          skill_levels_by_instrument?: string | null
          square_team_member_id?: string | null
          status?: string | null
          style_genre_strengths?: string | null
          sub_available?: boolean | null
          substitute_coverage?: string | null
          teacher_role?: string | null
          teaching_strengths?: string | null
          tenant_id?: string
          termination_date?: string | null
          updated_at?: string
          use_caution_internal_placement_notes?: string | null
          w9_completed_at?: string | null
          w9_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          accent_color: string | null
          billing_email: string | null
          created_at: string
          id: string
          location_count_billed: number | null
          logo_url: string | null
          name: string
          onboarding_emails_sent: Json | null
          onboarding_progress: Json | null
          plan: string | null
          pricing_tier: string | null
          primary_color: string | null
          slug: string
          stripe_connect_account_id: string | null
          stripe_connect_status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          timezone: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          billing_email?: string | null
          created_at?: string
          id?: string
          location_count_billed?: number | null
          logo_url?: string | null
          name: string
          onboarding_emails_sent?: Json | null
          onboarding_progress?: Json | null
          plan?: string | null
          pricing_tier?: string | null
          primary_color?: string | null
          slug: string
          stripe_connect_account_id?: string | null
          stripe_connect_status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          billing_email?: string | null
          created_at?: string
          id?: string
          location_count_billed?: number | null
          logo_url?: string | null
          name?: string
          onboarding_emails_sent?: Json | null
          onboarding_progress?: Json | null
          plan?: string | null
          pricing_tier?: string | null
          primary_color?: string | null
          slug?: string
          stripe_connect_account_id?: string | null
          stripe_connect_status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      value_cards: {
        Row: {
          ai_summary: string | null
          attendance_rate: number | null
          attended_sessions_period: number
          created_at: string
          family_id: string | null
          id: string
          instrument: string | null
          location_id: string
          milestones: Json | null
          months_enrolled: number
          percentile_rank: number | null
          period_end: string
          period_start: string
          sent_at: string | null
          sent_via: string | null
          skills_worked_on: Json | null
          student_id: string
          teacher_highlights: Json | null
          teacher_name: string | null
          tenant_id: string
          total_sessions_lifetime: number
          total_sessions_period: number
        }
        Insert: {
          ai_summary?: string | null
          attendance_rate?: number | null
          attended_sessions_period?: number
          created_at?: string
          family_id?: string | null
          id?: string
          instrument?: string | null
          location_id: string
          milestones?: Json | null
          months_enrolled?: number
          percentile_rank?: number | null
          period_end: string
          period_start: string
          sent_at?: string | null
          sent_via?: string | null
          skills_worked_on?: Json | null
          student_id: string
          teacher_highlights?: Json | null
          teacher_name?: string | null
          tenant_id: string
          total_sessions_lifetime?: number
          total_sessions_period?: number
        }
        Update: {
          ai_summary?: string | null
          attendance_rate?: number | null
          attended_sessions_period?: number
          created_at?: string
          family_id?: string | null
          id?: string
          instrument?: string | null
          location_id?: string
          milestones?: Json | null
          months_enrolled?: number
          percentile_rank?: number | null
          period_end?: string
          period_start?: string
          sent_at?: string | null
          sent_via?: string | null
          skills_worked_on?: Json | null
          student_id?: string
          teacher_highlights?: Json | null
          teacher_name?: string | null
          tenant_id?: string
          total_sessions_lifetime?: number
          total_sessions_period?: number
        }
        Relationships: [
          {
            foreignKeyName: "value_cards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "value_cards_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "value_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "value_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "value_cards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          attempt_count: number
          created_at: string
          delivery_id: string | null
          direction: string
          error_message: string | null
          event_type: string
          id: string
          integration_id: string
          latency_ms: number | null
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_code: number | null
          status: string
          target_url: string | null
          tenant_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          delivery_id?: string | null
          direction: string
          error_message?: string | null
          event_type: string
          id?: string
          integration_id: string
          latency_ms?: number | null
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_code?: number | null
          status?: string
          target_url?: string | null
          tenant_id?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          delivery_id?: string | null
          direction?: string
          error_message?: string | null
          event_type?: string
          id?: string
          integration_id?: string
          latency_ms?: number | null
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_code?: number | null
          status?: string
          target_url?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      ziro_agent_skills: {
        Row: {
          agent_id: string
          attached_at: string
          id: string
          is_primary: boolean
          skill_id: string
          tenant_id: string
        }
        Insert: {
          agent_id: string
          attached_at?: string
          id?: string
          is_primary?: boolean
          skill_id: string
          tenant_id: string
        }
        Update: {
          agent_id?: string
          attached_at?: string
          id?: string
          is_primary?: boolean
          skill_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ziro_agent_skills_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ziro_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_agent_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "ziro_skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_agent_skills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ziro_agents: {
        Row: {
          auto_use_by_ziro: boolean
          business_context: string
          created_at: string
          created_by: string | null
          id: string
          instructions: string | null
          invocation_rules: Json
          is_archived: boolean
          is_visible_in_ui: boolean
          last_used_at: string | null
          lifecycle_type: string
          name: string
          owner_type: string
          profile_summary: string | null
          purpose: string | null
          retired_at: string | null
          role: string | null
          status: string
          tenant_id: string
          updated_at: string
          usage_triggers: Json
        }
        Insert: {
          auto_use_by_ziro?: boolean
          business_context?: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructions?: string | null
          invocation_rules?: Json
          is_archived?: boolean
          is_visible_in_ui?: boolean
          last_used_at?: string | null
          lifecycle_type?: string
          name: string
          owner_type?: string
          profile_summary?: string | null
          purpose?: string | null
          retired_at?: string | null
          role?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          usage_triggers?: Json
        }
        Update: {
          auto_use_by_ziro?: boolean
          business_context?: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructions?: string | null
          invocation_rules?: Json
          is_archived?: boolean
          is_visible_in_ui?: boolean
          last_used_at?: string | null
          lifecycle_type?: string
          name?: string
          owner_type?: string
          profile_summary?: string | null
          purpose?: string | null
          retired_at?: string | null
          role?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          usage_triggers?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ziro_agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ziro_config: {
        Row: {
          created_at: string
          default_skill_ids: string[]
          delegation_rules: Json
          id: string
          instructions: string | null
          routing_rules: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_skill_ids?: string[]
          delegation_rules?: Json
          id?: string
          instructions?: string | null
          routing_rules?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_skill_ids?: string[]
          delegation_rules?: Json
          id?: string
          instructions?: string | null
          routing_rules?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ziro_star_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ziro_idempotency_keys: {
        Row: {
          action_type: string
          created_at: string
          idempotency_key: string
          profile_id: string
          result: Json
          tenant_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          idempotency_key: string
          profile_id: string
          result: Json
          tenant_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          idempotency_key?: string
          profile_id?: string
          result?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ziro_idempotency_keys_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_idempotency_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ziro_page_intelligence_bindings: {
        Row: {
          id: string
          page_key: string
          primary_agent_id: string | null
          supporting_agent_ids: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_key: string
          primary_agent_id?: string | null
          supporting_agent_ids?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_key?: string
          primary_agent_id?: string | null
          supporting_agent_ids?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ziro_page_intelligence_bindings_primary_agent_id_fkey"
            columns: ["primary_agent_id"]
            isOneToOne: false
            referencedRelation: "ziro_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziro_page_intelligence_bindings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ziro_skills: {
        Row: {
          allowed_tools: string[]
          approved_at: string | null
          approved_by: string | null
          business_context: string | null
          cost_tier: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          key: string
          last_used_at: string | null
          name: string
          risk_tier: string
          runtime: string
          system_prompt_fragment: string | null
          tenant_id: string
          updated_at: string
          use_count: number
        }
        Insert: {
          allowed_tools?: string[]
          approved_at?: string | null
          approved_by?: string | null
          business_context?: string | null
          cost_tier?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key: string
          last_used_at?: string | null
          name: string
          risk_tier?: string
          runtime?: string
          system_prompt_fragment?: string | null
          tenant_id: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          allowed_tools?: string[]
          approved_at?: string | null
          approved_by?: string | null
          business_context?: string | null
          cost_tier?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key?: string
          last_used_at?: string | null
          name?: string
          risk_tier?: string
          runtime?: string
          system_prompt_fragment?: string | null
          tenant_id?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ziro_skills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      _archive_2026_teacher_callout_tally: {
        Row: {
          callouts_last_60_days: number | null
          callouts_this_month: number | null
          first_name: string | null
          last_callout_date: string | null
          last_name: string | null
          location_id: string | null
          teacher_id: string | null
          total_blocks_affected: number | null
          total_callouts: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_callouts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_teacher_payroll_summary: {
        Row: {
          blocks_taught: number | null
          gross_pay: number | null
          location_id: string | null
          location_name: string | null
          pay_month: string | null
          profile_id: string | null
          rate_per_block: number | null
          teacher_id: string | null
          teacher_name: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_log_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_log_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "session_log_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_log_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      _archive_2026_v_finance_monthly_summary: {
        Row: {
          location_code: string | null
          location_name: string | null
          month_bucket: string | null
          total_expense: number | null
          total_income: number | null
          total_transfers: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      _archive_2026_v_finance_uncategorized_transactions: {
        Row: {
          account_name: string | null
          amount: number | null
          id: string | null
          is_pending: boolean | null
          location_name: string | null
          merchant_name: string | null
          month_bucket: string | null
          posted_date: string | null
          transaction_name: string | null
        }
        Relationships: []
      }
      issues_safe: {
        Row: {
          category: string | null
          created_at: string | null
          deploy_status: string | null
          description: string | null
          element_description: string | null
          id: string | null
          page: string | null
          pipeline_completed_at: string | null
          pipeline_prompt: string | null
          pipeline_started_at: string | null
          platform: string | null
          related_issue_id: string | null
          reported_by: string | null
          reported_by_role: string | null
          reported_from_url: string | null
          reported_screen_height: number | null
          reported_screen_width: number | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          screenshot_path: string | null
          section: string | null
          severity: string | null
          status: string | null
          tenant_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deploy_status?: never
          description?: string | null
          element_description?: string | null
          id?: string | null
          page?: string | null
          pipeline_completed_at?: never
          pipeline_prompt?: never
          pipeline_started_at?: never
          platform?: string | null
          related_issue_id?: string | null
          reported_by?: string | null
          reported_by_role?: string | null
          reported_from_url?: string | null
          reported_screen_height?: number | null
          reported_screen_width?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: never
          screenshot_path?: string | null
          section?: string | null
          severity?: string | null
          status?: string | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deploy_status?: never
          description?: string | null
          element_description?: string | null
          id?: string | null
          page?: string | null
          pipeline_completed_at?: never
          pipeline_prompt?: never
          pipeline_started_at?: never
          platform?: string | null
          related_issue_id?: string | null
          reported_by?: string | null
          reported_by_role?: string | null
          reported_from_url?: string | null
          reported_screen_height?: number | null
          reported_screen_width?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: never
          screenshot_path?: string | null
          section?: string | null
          severity?: string | null
          status?: string | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_related_issue_id_fkey"
            columns: ["related_issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_related_issue_id_fkey"
            columns: ["related_issue_id"]
            isOneToOne: false
            referencedRelation: "issues_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduling_grid: {
        Row: {
          ai_context: Json | null
          block_date: string | null
          block_id: string | null
          end_time: string | null
          instrument: string | null
          is_recurring: boolean | null
          location_id: string | null
          location_name: string | null
          notes: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["block_status"] | null
          student_id: string | null
          student_name: string | null
          teacher_id: string | null
          teacher_name: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_effective_rate"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "schedule_blocks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "_archive_2026_teacher_callout_tally"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "schedule_blocks_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_effective_rate: {
        Row: {
          billing_day: number | null
          billing_status: string | null
          family_id: string | null
          family_name: string | null
          first_name: string | null
          instrument: string | null
          last_name: string | null
          location_id: string | null
          monthly_cents: number | null
          rate_per_session: number | null
          rate_tier: number | null
          sessions_per_month: number | null
          status: string | null
          student_id: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers_safe: {
        Row: {
          ai_context: Json | null
          best_age_range: string | null
          bio: string | null
          contract_pdf_url: string | null
          contract_signed_at: string | null
          contract_status: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          hire_date: string | null
          id: string | null
          instruments: string[] | null
          is_active: boolean | null
          is_sub_available: boolean | null
          last_name: string | null
          lesson_style: string | null
          needs_1099: boolean | null
          pay_rate_per_half_hour: number | null
          personality: string | null
          phone: string | null
          photo_url: string | null
          profile_id: string | null
          rate_per_block: number | null
          square_team_member_id: string | null
          status: string | null
          sub_available: boolean | null
          teacher_role: string | null
          tenant_id: string | null
          termination_date: string | null
          w9_completed_at: string | null
          w9_status: string | null
        }
        Insert: {
          ai_context?: Json | null
          best_age_range?: string | null
          bio?: string | null
          contract_pdf_url?: never
          contract_signed_at?: never
          contract_status?: never
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string | null
          instruments?: string[] | null
          is_active?: boolean | null
          is_sub_available?: boolean | null
          last_name?: string | null
          lesson_style?: string | null
          needs_1099?: never
          pay_rate_per_half_hour?: never
          personality?: string | null
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          rate_per_block?: never
          square_team_member_id?: string | null
          status?: string | null
          sub_available?: boolean | null
          teacher_role?: string | null
          tenant_id?: string | null
          termination_date?: string | null
          w9_completed_at?: never
          w9_status?: never
        }
        Update: {
          ai_context?: Json | null
          best_age_range?: string | null
          bio?: string | null
          contract_pdf_url?: never
          contract_signed_at?: never
          contract_status?: never
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string | null
          instruments?: string[] | null
          is_active?: boolean | null
          is_sub_available?: boolean | null
          last_name?: string | null
          lesson_style?: string | null
          needs_1099?: never
          pay_rate_per_half_hour?: never
          personality?: string | null
          phone?: string | null
          photo_url?: string | null
          profile_id?: string | null
          rate_per_block?: never
          square_team_member_id?: string | null
          status?: string | null
          sub_available?: boolean | null
          teacher_role?: string | null
          tenant_id?: string | null
          termination_date?: string | null
          w9_completed_at?: never
          w9_status?: never
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _ziro_schedule_move_analyze_move: {
        Args: {
          p_allowed_location_ids: string[]
          p_exp_student: string
          p_mode: string
          p_move_index: number
          p_override_ack: Json
          p_role: string
          p_src_id: string
          p_tenant_id: string
          p_tgt_id: string
        }
        Returns: Json
      }
      adjust_family_balance: {
        Args: {
          p_amount_cents: number
          p_family_id: string
          p_performed_by?: string
          p_reason: string
        }
        Returns: number
      }
      apply_family_rate_tier: {
        Args: { p_family_id: string }
        Returns: undefined
      }
      apply_family_rate_tier_full: {
        Args: { p_family_id: string }
        Returns: undefined
      }
      block_series_all: {
        Args: { p_action?: string; p_block_id: string }
        Returns: Json
      }
      block_series_future: {
        Args: { p_action?: string; p_block_id: string }
        Returns: Json
      }
      block_series_single: {
        Args: { p_action?: string; p_block_id: string }
        Returns: Json
      }
      calculate_family_rate_tier: {
        Args: { p_family_id: string }
        Returns: number
      }
      check_in_block: {
        Args: { p_action?: string; p_block_id: string; p_user_id?: string }
        Returns: Json
      }
      convert_lead_to_student: {
        Args: {
          p_block_id?: string
          p_blocks_per_week?: number
          p_family_id?: string
          p_family_name?: string
          p_lead_id: string
          p_rate?: number
          p_recurring?: boolean
          p_teacher_id?: string
        }
        Returns: Json
      }
      count_fifth_weeks_in_year: {
        Args: { p_day_of_week: number; p_year: number }
        Returns: number
      }
      count_first_day_notbookable: {
        Args: { p_block_id: string }
        Returns: number
      }
      count_last_day_revert: { Args: { p_block_id: string }; Returns: number }
      decrypt_integration_credentials: {
        Args: { encrypted_creds: string }
        Returns: string
      }
      detect_all_fifth_weeks: { Args: { p_tenant_id: string }; Returns: Json }
      detect_fifth_weeks: { Args: { p_student_id: string }; Returns: Json }
      encrypt_integration_credentials:
        | {
            Args: { plain_creds: Json }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.encrypt_integration_credentials(plain_creds => text), public.encrypt_integration_credentials(plain_creds => jsonb). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { plain_creds: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.encrypt_integration_credentials(plain_creds => text), public.encrypt_integration_credentials(plain_creds => jsonb). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      exec_sql: { Args: { query: string }; Returns: Json }
      find_coverage: {
        Args: { p_date: string; p_teacher_id: string; p_tenant_id: string }
        Returns: Json
      }
      generate_all_open_blocks: {
        Args: { p_generate_from?: string; p_generate_weeks?: number }
        Returns: number
      }
      generate_open_blocks_for_availability: {
        Args: {
          p_availability_id: string
          p_generate_from?: string
          p_generate_weeks?: number
        }
        Returns: number
      }
      generate_schedule_blocks: {
        Args: { p_tenant_id: string; p_weeks_ahead?: number }
        Returns: Json
      }
      generate_student_display_id: {
        Args: { p_location_id: string }
        Returns: string
      }
      get_at_risk_students: {
        Args: {
          p_cutoff_date: string
          p_limit?: number
          p_sixty_day_floor: string
          p_tenant_id: string
        }
        Returns: {
          days_since_session: number
          id: string
          instrument: string
          location_name: string
          name: string
        }[]
      }
      get_dashboard_snapshot: {
        Args: {
          p_fourteen_days_ago: string
          p_location_ids?: string[]
          p_month_start: string
          p_seven_days_ago: string
          p_sixty_days_ago: string
          p_tenant_id: string
          p_today: string
          p_week_end: string
          p_week_start: string
        }
        Returns: Json
      }
      get_dashboard_stats: {
        Args: { p_location_ids?: string[]; p_tenant_id: string }
        Returns: Json
      }
      get_families_roster_bundle: {
        Args: {
          p_family_tab: string
          p_limit?: number
          p_location_id?: string
          p_offset?: number
          p_rate_filter?: number
          p_search?: string
          p_sort_by?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_family_ids_at_locations: {
        Args: { loc_ids: string[] }
        Returns: string[]
      }
      get_family_ids_for_parent: {
        Args: { parent_profile_id: string }
        Returns: string[]
      }
      get_leads_list_for_tenant: {
        Args: {
          p_instrument?: string
          p_limit?: number
          p_location_id?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_recent_session_logs_enriched: {
        Args: { p_limit?: number; p_since: string; p_tenant_id: string }
        Returns: {
          block_date: string
          instrument: string
          progress_indicator: string
          student_name: string
          teacher_name: string
          worked_on: Json
        }[]
      }
      get_schedule_blocks_for_students: {
        Args: {
          p_end_date: string
          p_start_date: string
          p_student_ids: string[]
        }
        Returns: {
          block_date: string
          location_id: string
          start_time: string
          student_id: string
          teacher_id: string
        }[]
      }
      get_schedule_grid: {
        Args: {
          p_block_date: string
          p_location_id?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_student_ids_at_locations: {
        Args: { loc_ids: string[] }
        Returns: string[]
      }
      get_student_ids_for_parent: {
        Args: { parent_profile_id: string }
        Returns: string[]
      }
      get_teacher_day_summary: {
        Args: { p_date: string; p_teacher_id: string }
        Returns: Json
      }
      get_teacher_id_for_profile: { Args: { p_id: string }; Returns: string }
      get_teacher_locations_for_tenant: {
        Args: { p_tenant_id: string }
        Returns: {
          location_id: string
          teacher_id: string
        }[]
      }
      get_teacher_profile_ids_at_locations: {
        Args: { loc_ids: string[] }
        Returns: string[]
      }
      get_teacher_student_ids: {
        Args: { teacher_profile_id: string }
        Returns: string[]
      }
      get_teachers_list_bundle: {
        Args: { p_tenant_id: string; p_week_end: string; p_week_start: string }
        Returns: Json
      }
      get_user_location_ids: { Args: never; Returns: string[] }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      get_ziro_context: { Args: { p_tenant_id?: string }; Returns: Json }
      handle_first_day_notbookable: {
        Args: { p_block_id: string }
        Returns: Json
      }
      handle_last_day_revert: { Args: { p_block_id: string }; Returns: Json }
      increment_skill_use_count: {
        Args: { p_skill_id: string }
        Returns: undefined
      }
      is_fifth_week: { Args: { p_date: string }; Returns: boolean }
      match_teacher: {
        Args: {
          p_age_range: string
          p_instrument: string
          p_location_names: string[]
          p_personality_notes: string
          p_tenant_id: string
        }
        Returns: {
          first_name: string
          score: number
          teacher_id: string
          total_teachers_checked: number
        }[]
      }
      move_student_block: {
        Args: {
          p_source_block_id: string
          p_target_block_id?: string
          p_target_date?: string
          p_target_end_time?: string
          p_target_location_id?: string
          p_target_start_time?: string
          p_target_teacher_id?: string
          p_target_tenant_id?: string
        }
        Returns: Json
      }
      next_fifth_week_date: {
        Args: {
          p_day_of_week: number
          p_from_date: string
          p_location_id: string
          p_tenant_id: string
        }
        Returns: string
      }
      normalize_phone_digits: { Args: { p_phone: string }; Returns: string }
      queue_outbound_webhooks: {
        Args: { p_event_type: string; p_payload: Json; p_tenant_id: string }
        Returns: number
      }
      resolve_held_tallies: { Args: { p_family_id: string }; Returns: Json }
      resolve_student_duplicate_review: {
        Args: {
          p_canonical_student_id?: string
          p_resolution: string
          p_review_id: string
        }
        Returns: Json
      }
      safe_delete_family: { Args: { p_family_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      speed_upsert_performance_alerts: {
        Args: { p_rows: Json }
        Returns: undefined
      }
      star_apply_star_context_policy: {
        Args: {
          p_allowed_location_ids: string[]
          p_payload: Json
          p_role: string
        }
        Returns: Json
      }
      transfer_block_to_sub: {
        Args: {
          p_available_block_id?: string
          p_block_id: string
          p_new_teacher_id: string
        }
        Returns: Json
      }
      ziro_move_schedule_sessions:
        | {
            Args: {
              p_idempotency_key: string
              p_moves: Json
              p_tenant_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_apply_partial?: boolean
              p_idempotency_key: string
              p_moves: Json
              p_override_ack?: Json
              p_tenant_id: string
            }
            Returns: Json
          }
      ziro_preflight_schedule_moves: {
        Args: { p_moves: Json; p_tenant_id: string }
        Returns: Json
      }
      ziro_reassign_students_to_teacher: {
        Args: {
          p_expected_prior_teacher_id: string
          p_idempotency_key: string
          p_student_ids: string[]
          p_target_teacher_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      block_status: "available" | "booked"
      block_type:
        | "open_time"
        | "student_session"
        | "first_day"
        | "last_day"
        | "not_bookable"
        | "sub"
        | "call_out"
        | "meet_greet"
        | "teacher_training"
        | "makeup_session"
        | "virtual"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      lead_stage: "inquiry" | "contacted" | "scheduled" | "enrolled" | "lost"
      message_channel: "sms" | "email" | "in_app" | "phone_call"
      message_direction: "outgoing" | "incoming"
      report_interval:
        | "weekly"
        | "monthly"
        | "quarterly"
        | "semi_annual"
        | "annual"
      student_status: "active" | "inactive" | "former" | "paused"
      user_role:
        | "owner"
        | "admin"
        | "teacher"
        | "parent"
        | "student"
        | "company_director"
        | "studio_director"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      block_status: ["available", "booked"],
      block_type: [
        "open_time",
        "student_session",
        "first_day",
        "last_day",
        "not_bookable",
        "sub",
        "call_out",
        "meet_greet",
        "teacher_training",
        "makeup_session",
        "virtual",
      ],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      lead_stage: ["inquiry", "contacted", "scheduled", "enrolled", "lost"],
      message_channel: ["sms", "email", "in_app", "phone_call"],
      message_direction: ["outgoing", "incoming"],
      report_interval: [
        "weekly",
        "monthly",
        "quarterly",
        "semi_annual",
        "annual",
      ],
      student_status: ["active", "inactive", "former", "paused"],
      user_role: [
        "owner",
        "admin",
        "teacher",
        "parent",
        "student",
        "company_director",
        "studio_director",
      ],
    },
  },
} as const
