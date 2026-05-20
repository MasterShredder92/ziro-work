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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
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
        Relationships: []
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
      agent_tenants: {
        Row: {
          created_at: string
          id: string
          intake_api_key: string | null
          integrations_enabled: Json
          name: string
          plan_tier: string
          status: string
          supabase_service_key: string
          supabase_url: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          intake_api_key?: string | null
          integrations_enabled?: Json
          name: string
          plan_tier?: string
          status?: string
          supabase_service_key: string
          supabase_url: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          intake_api_key?: string | null
          integrations_enabled?: Json
          name?: string
          plan_tier?: string
          status?: string
          supabase_service_key?: string
          supabase_url?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      agreements: {
        Row: {
          created_at: string
          id: string
          signed: boolean
          signed_at: string | null
          studentid: string | null
          tenant_id: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          signed?: boolean
          signed_at?: string | null
          studentid?: string | null
          tenant_id: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          signed?: boolean
          signed_at?: string | null
          studentid?: string | null
          tenant_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreements_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "agreements_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
        ]
      }
      anchor_job_locks: {
        Row: {
          acquired_at: string
          expires_at: string
          job_id: string
        }
        Insert: {
          acquired_at?: string
          expires_at: string
          job_id: string
        }
        Update: {
          acquired_at?: string
          expires_at?: string
          job_id?: string
        }
        Relationships: []
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
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          id: string
          lesson_date: string
          present: boolean
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_date: string
          present: boolean
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_date?: string
          present?: boolean
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
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
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_number_masked: string
          bank_name: string
          id: string
          ingestion_method: string | null
          last_synced_at: string | null
          name: string
          routing_number: string | null
        }
        Insert: {
          account_number_masked: string
          bank_name: string
          id?: string
          ingestion_method?: string | null
          last_synced_at?: string | null
          name: string
          routing_number?: string | null
        }
        Update: {
          account_number_masked?: string
          bank_name?: string
          id?: string
          ingestion_method?: string | null
          last_synced_at?: string | null
          name?: string
          routing_number?: string | null
        }
        Relationships: []
      }
      bank_statements: {
        Row: {
          bank_account_id: string | null
          file_path: string
          file_type: string | null
          id: string
          statement_month: number | null
          statement_year: number | null
          uploaded_at: string | null
        }
        Insert: {
          bank_account_id?: string | null
          file_path: string
          file_type?: string | null
          id?: string
          statement_month?: number | null
          statement_year?: number | null
          uploaded_at?: string | null
        }
        Update: {
          bank_account_id?: string | null
          file_path?: string
          file_type?: string | null
          id?: string
          statement_month?: number | null
          statement_year?: number | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_statements_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          bank_account_id: string | null
          category: string | null
          created_at: string | null
          date: string
          description: string
          fitid: string | null
          hash: string | null
          id: string
          source_statement_id: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          bank_account_id?: string | null
          category?: string | null
          created_at?: string | null
          date: string
          description: string
          fitid?: string | null
          hash?: string | null
          id?: string
          source_statement_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          bank_account_id?: string | null
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string
          fitid?: string | null
          hash?: string | null
          id?: string
          source_statement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_source_statement_id_fkey"
            columns: ["source_statement_id"]
            isOneToOne: false
            referencedRelation: "bank_statements"
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      billing_plans: {
        Row: {
          active: boolean
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          id: string
          interval: string
          interval_count: number
          metadata: Json
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string
          interval_count?: number
          metadata?: Json
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string
          interval_count?: number
          metadata?: Json
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_settings: {
        Row: {
          created_at: string
          default_currency: string
          default_net_days: number
          default_tax_rate_bp: number
          default_terms: string | null
          invoice_next_number: number
          invoice_pad_width: number
          invoice_prefix: string
          late_fee_cents: number
          late_fee_grace_days: number
          metadata: Json | null
          payment_methods: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_currency?: string
          default_net_days?: number
          default_tax_rate_bp?: number
          default_terms?: string | null
          invoice_next_number?: number
          invoice_pad_width?: number
          invoice_prefix?: string
          late_fee_cents?: number
          late_fee_grace_days?: number
          metadata?: Json | null
          payment_methods?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_currency?: string
          default_net_days?: number
          default_tax_rate_bp?: number
          default_terms?: string | null
          invoice_next_number?: number
          invoice_pad_width?: number
          invoice_prefix?: string
          late_fee_cents?: number
          late_fee_grace_days?: number
          metadata?: Json | null
          payment_methods?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      contacts: {
        Row: {
          business_name: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          email_score: number | null
          id: string
          landing_url: string | null
          last_touched: string | null
          notes: string | null
          owner_name: string | null
          phone: string | null
          sequence_step: number | null
          source: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          vertical: string | null
        }
        Insert: {
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          email_score?: number | null
          id?: string
          landing_url?: string | null
          last_touched?: string | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          sequence_step?: number | null
          source?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          vertical?: string | null
        }
        Update: {
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          email_score?: number | null
          id?: string
          landing_url?: string | null
          last_touched?: string | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          sequence_step?: number | null
          source?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          vertical?: string | null
        }
        Relationships: []
      }
      credits: {
        Row: {
          amount_cents: number
          applied_at: string | null
          created_at: string
          expires_at: string | null
          family_id: string | null
          id: string
          invoice_id: string | null
          metadata: Json
          reason: string | null
          status: string
          student_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          applied_at?: string | null
          created_at?: string
          expires_at?: string | null
          family_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          reason?: string | null
          status?: string
          student_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          applied_at?: string | null
          created_at?: string
          expires_at?: string | null
          family_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          reason?: string | null
          status?: string
          student_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          business_name: string | null
          contact_id: string | null
          converted_at: string | null
          created_at: string | null
          email: string
          id: string
          mrr: number | null
          owner_name: string | null
          plan: string
          status: string | null
          stripe_customer_id: string | null
          trial_started_at: string | null
          vertical: string | null
        }
        Insert: {
          business_name?: string | null
          contact_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          mrr?: number | null
          owner_name?: string | null
          plan: string
          status?: string | null
          stripe_customer_id?: string | null
          trial_started_at?: string | null
          vertical?: string | null
        }
        Update: {
          business_name?: string | null
          contact_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          mrr?: number | null
          owner_name?: string | null
          plan?: string
          status?: string | null
          stripe_customer_id?: string | null
          trial_started_at?: string | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          metadata: Json
          name: string
          tenant_id: string
          type: string
          updated_at: string
          uses: number
          value: number
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          metadata?: Json
          name: string
          tenant_id: string
          type?: string
          updated_at?: string
          uses?: number
          value?: number
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          metadata?: Json
          name?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          uses?: number
          value?: number
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          archived_at: string | null
          created_at: string
          end_date: string | null
          id: string
          metadata: Json | null
          notes: string | null
          start_date: string | null
          status: string
          student_id: string
          teacher_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          start_date?: string | null
          status?: string
          student_id: string
          teacher_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
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
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      error_resolution_logs: {
        Row: {
          created_at: string
          error_code: string | null
          id: string
          input_payload: Json | null
          message: string
          notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          route: string | null
          stack_trace: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          id?: string
          input_payload?: Json | null
          message: string
          notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          stack_trace?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          id?: string
          input_payload?: Json | null
          message?: string
          notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          stack_trace?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          actor_id: string | null
          actor_type: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          tenant_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          tenant_id: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string
        }
        Relationships: []
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
        Relationships: []
      }
      families: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          archived_at: string | null
          autopay_enabled: boolean | null
          balance: number
          billing_day: number | null
          billing_notes: string | null
          billing_status: string
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last_four: string | null
          city: string | null
          country: string | null
          created_at: string
          default_payment_method_id: string | null
          discount_tier: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          id: string
          is_military: boolean
          lifetime_paid_cents: number
          name: string
          notes: string | null
          notify_via_email: boolean
          notify_via_sms: boolean
          overdue_balance_cents: number
          parent_first_name: string | null
          parent_last_name: string | null
          parent_name: string | null
          postal_code: string | null
          primary_contact_id: string | null
          primary_contact_name: string | null
          primary_email: string | null
          primary_location_id: string
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
          state: string | null
          status: string | null
          stripe_customer_id_connect: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          autopay_enabled?: boolean | null
          balance?: number
          billing_day?: number | null
          billing_notes?: string | null
          billing_status?: string
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_payment_method_id?: string | null
          discount_tier?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          is_military?: boolean
          lifetime_paid_cents?: number
          name: string
          notes?: string | null
          notify_via_email?: boolean
          notify_via_sms?: boolean
          overdue_balance_cents?: number
          parent_first_name?: string | null
          parent_last_name?: string | null
          parent_name?: string | null
          postal_code?: string | null
          primary_contact_id?: string | null
          primary_contact_name?: string | null
          primary_email?: string | null
          primary_location_id: string
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
          state?: string | null
          status?: string | null
          stripe_customer_id_connect?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          autopay_enabled?: boolean | null
          balance?: number
          billing_day?: number | null
          billing_notes?: string | null
          billing_status?: string
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_payment_method_id?: string | null
          discount_tier?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          is_military?: boolean
          lifetime_paid_cents?: number
          name?: string
          notes?: string | null
          notify_via_email?: boolean
          notify_via_sms?: boolean
          overdue_balance_cents?: number
          parent_first_name?: string | null
          parent_last_name?: string | null
          parent_name?: string | null
          postal_code?: string | null
          primary_contact_id?: string | null
          primary_contact_name?: string | null
          primary_email?: string | null
          primary_location_id?: string
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
          state?: string | null
          status?: string | null
          stripe_customer_id_connect?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      intake_submissions: {
        Row: {
          archived_at: string | null
          converted_student_id: string | null
          created_at: string
          form_version: string
          id: string
          lead_ids: string[]
          location_id: string | null
          metadata: Json | null
          raw_payload: Json
          source: string
          status: string | null
          tenant_id: string
        }
        Insert: {
          archived_at?: string | null
          converted_student_id?: string | null
          created_at?: string
          form_version?: string
          id?: string
          lead_ids?: string[]
          location_id?: string | null
          metadata?: Json | null
          raw_payload: Json
          source?: string
          status?: string | null
          tenant_id: string
        }
        Update: {
          archived_at?: string | null
          converted_student_id?: string | null
          created_at?: string
          form_version?: string
          id?: string
          lead_ids?: string[]
          location_id?: string | null
          metadata?: Json | null
          raw_payload?: Json
          source?: string
          status?: string | null
          tenant_id?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          is_fifth_week: boolean
          is_makeup_session: boolean
          quantity: number
          session_date: string | null
          sort_order: number
          student_id: string | null
          tenant_id: string
          unit_price: number
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string
          id?: string
          invoice_id: string
          is_fifth_week?: boolean
          is_makeup_session?: boolean
          quantity?: number
          session_date?: string | null
          sort_order?: number
          student_id?: string | null
          tenant_id: string
          unit_price?: number
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          is_fifth_week?: boolean
          is_makeup_session?: boolean
          quantity?: number
          session_date?: string | null
          sort_order?: number
          student_id?: string | null
          tenant_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "invoice_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount_cents: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          kind: string
          metadata: Json
          quantity: number
          schedule_block_id: string | null
          session_log_id: string | null
          sort_order: number
          student_id: string | null
          taxable: boolean
          tenant_id: string
          unit_amount_cents: number
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          kind?: string
          metadata?: Json
          quantity?: number
          schedule_block_id?: string | null
          session_log_id?: string | null
          sort_order?: number
          student_id?: string | null
          taxable?: boolean
          tenant_id: string
          unit_amount_cents?: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          kind?: string
          metadata?: Json
          quantity?: number
          schedule_block_id?: string | null
          session_log_id?: string | null
          sort_order?: number
          student_id?: string | null
          taxable?: boolean
          tenant_id?: string
          unit_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
        Relationships: []
      }
      invoices: {
        Row: {
          amount_cents: number
          amount_paid_cents: number
          archived_at: string | null
          balance_cents: number
          billing_plan_id: string | null
          created_at: string
          currency: string
          description: string | null
          discount_cents: number
          due_at: string | null
          due_date: string | null
          external_ref: string | null
          family_id: string | null
          google_review_enabled: boolean | null
          id: string
          invoice_month: string | null
          is_recurring: boolean | null
          issued_at: string | null
          live_url_token: string | null
          location_id: string
          metadata: Json
          next_invoice_date: string | null
          notes: string | null
          number: string | null
          paid_at: string | null
          parent_invoice_id: string | null
          pdf_generated_at: string | null
          pdf_url: string | null
          recurring_day: number | null
          sent_at: string | null
          show_practice_timer: boolean | null
          square_invoice_id: string | null
          square_order_id: string | null
          square_public_url: string | null
          square_push_error: string | null
          square_pushed_at: string | null
          status: string
          student_id: string | null
          subscription_id: string | null
          subtotal_cents: number
          tax_cents: number
          tenant_id: string
          terms: string | null
          theme_preference: string | null
          total_cents: number
          updated_at: string
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          amount_cents?: number
          amount_paid_cents?: number
          archived_at?: string | null
          balance_cents?: number
          billing_plan_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          discount_cents?: number
          due_at?: string | null
          due_date?: string | null
          external_ref?: string | null
          family_id?: string | null
          google_review_enabled?: boolean | null
          id?: string
          invoice_month?: string | null
          is_recurring?: boolean | null
          issued_at?: string | null
          live_url_token?: string | null
          location_id: string
          metadata?: Json
          next_invoice_date?: string | null
          notes?: string | null
          number?: string | null
          paid_at?: string | null
          parent_invoice_id?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          recurring_day?: number | null
          sent_at?: string | null
          show_practice_timer?: boolean | null
          square_invoice_id?: string | null
          square_order_id?: string | null
          square_public_url?: string | null
          square_push_error?: string | null
          square_pushed_at?: string | null
          status?: string
          student_id?: string | null
          subscription_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          tenant_id: string
          terms?: string | null
          theme_preference?: string | null
          total_cents?: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          amount_cents?: number
          amount_paid_cents?: number
          archived_at?: string | null
          balance_cents?: number
          billing_plan_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          discount_cents?: number
          due_at?: string | null
          due_date?: string | null
          external_ref?: string | null
          family_id?: string | null
          google_review_enabled?: boolean | null
          id?: string
          invoice_month?: string | null
          is_recurring?: boolean | null
          issued_at?: string | null
          live_url_token?: string | null
          location_id?: string
          metadata?: Json
          next_invoice_date?: string | null
          notes?: string | null
          number?: string | null
          paid_at?: string | null
          parent_invoice_id?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          recurring_day?: number | null
          sent_at?: string | null
          show_practice_timer?: boolean | null
          square_invoice_id?: string | null
          square_order_id?: string | null
          square_public_url?: string | null
          square_push_error?: string | null
          square_pushed_at?: string | null
          status?: string
          student_id?: string | null
          subscription_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          tenant_id?: string
          terms?: string | null
          theme_preference?: string | null
          total_cents?: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "v_family_billing"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "invoices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "view_family_account_summary"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "invoices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "invoices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_parent_invoice_id_fkey"
            columns: ["parent_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
        Relationships: []
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
          first_name: string | null
          follow_up_count: number
          goals: string | null
          has_instrument: string | null
          how_heard: string | null
          id: string
          inactivity_bucket: string | null
          instrument: string | null
          intake_submission_id: string | null
          is_military: boolean
          last_contact_at: string | null
          last_contacted_at: string | null
          last_name: string | null
          location_id: string | null
          lost_category: string | null
          lost_reason: string | null
          matched_block_id: string | null
          matched_teacher_id: string | null
          name: string | null
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
          stage: string | null
          status: string
          student_id: string | null
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
          first_name?: string | null
          follow_up_count?: number
          goals?: string | null
          has_instrument?: string | null
          how_heard?: string | null
          id?: string
          inactivity_bucket?: string | null
          instrument?: string | null
          intake_submission_id?: string | null
          is_military?: boolean
          last_contact_at?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          location_id?: string | null
          lost_category?: string | null
          lost_reason?: string | null
          matched_block_id?: string | null
          matched_teacher_id?: string | null
          name?: string | null
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
          stage?: string | null
          status?: string
          student_id?: string | null
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
          first_name?: string | null
          follow_up_count?: number
          goals?: string | null
          has_instrument?: string | null
          how_heard?: string | null
          id?: string
          inactivity_bucket?: string | null
          instrument?: string | null
          intake_submission_id?: string | null
          is_military?: boolean
          last_contact_at?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          location_id?: string | null
          lost_category?: string | null
          lost_reason?: string | null
          matched_block_id?: string | null
          matched_teacher_id?: string | null
          name?: string | null
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
          stage?: string | null
          status?: string
          student_id?: string | null
          student_name?: string | null
          submission_id?: string | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "leads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          agentid: string | null
          created_at: string
          id: string
          lessonid: string | null
          notes: string | null
        }
        Insert: {
          agentid?: string | null
          created_at?: string
          id?: string
          lessonid?: string | null
          notes?: string | null
        }
        Update: {
          agentid?: string | null
          created_at?: string
          id?: string
          lessonid?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_lessonid_fkey"
            columns: ["lessonid"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          content: string
          created_at: string
          event_id: string | null
          id: string
          student_id: string | null
          teacher_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id?: string | null
          id?: string
          student_id?: string | null
          teacher_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string | null
          id?: string
          student_id?: string | null
          teacher_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "lesson_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "lesson_plans_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          end_time: string
          id: string
          schedule_block_id: string | null
          start_time: string
          status: string
          studentid: string | null
          teacherid: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          schedule_block_id?: string | null
          start_time: string
          status?: string
          studentid?: string | null
          teacherid?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          schedule_block_id?: string | null
          start_time?: string
          status?: string
          studentid?: string | null
          teacherid?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_schedule_block_id_fkey"
            columns: ["schedule_block_id"]
            isOneToOne: false
            referencedRelation: "schedule_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_schedule_block_id_fkey"
            columns: ["schedule_block_id"]
            isOneToOne: false
            referencedRelation: "view_schedule_blocks_extended"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "lessons_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "lessons_teacherid_fkey"
            columns: ["teacherid"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      lifecycle: {
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
        Relationships: []
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
        Relationships: []
      }
      metric_snapshots: {
        Row: {
          created_at: string | null
          id: string
          metrics: Json
          snapshot_date: string
          source: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metrics?: Json
          snapshot_date?: string
          source: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metrics?: Json
          snapshot_date?: string
          source?: string
        }
        Relationships: []
      }
      notes: {
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
        Relationships: []
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
        Relationships: []
      }
      operator_sessions: {
        Row: {
          active_date: string | null
          active_location_id: string | null
          active_modal: string | null
          active_view: string | null
          focused_block_id: string | null
          id: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_date?: string | null
          active_location_id?: string | null
          active_modal?: string | null
          active_view?: string | null
          focused_block_id?: string | null
          id?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_date?: string | null
          active_location_id?: string | null
          active_modal?: string | null
          active_view?: string | null
          focused_block_id?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          family_id: string | null
          id: string
          invoice_id: string | null
          metadata: Json
          method: string | null
          notes: string | null
          paid_at: string | null
          reference: string | null
          refunded_cents: number
          status: string
          student_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          family_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          reference?: string | null
          refunded_cents?: number
          status?: string
          student_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          family_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          reference?: string | null
          refunded_cents?: number
          status?: string
          student_id?: string | null
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
          archived_at: string | null
          created_at: string
          dedupe_key: string
          details: Json | null
          first_seen_at: string
          id: string
          last_seen_at: string
          latest_metric: number | null
          message: string
          metadata: Json | null
          muted_until: string | null
          occurrence_count: number
          regressed_at: string | null
          resolution_reason: string | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string
          status: string | null
          tenant_id: string
          worst_metric: number | null
        }
        Insert: {
          alert_type: string
          archived_at?: string | null
          created_at?: string
          dedupe_key: string
          details?: Json | null
          first_seen_at: string
          id?: string
          last_seen_at: string
          latest_metric?: number | null
          message: string
          metadata?: Json | null
          muted_until?: string | null
          occurrence_count?: number
          regressed_at?: string | null
          resolution_reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
          status?: string | null
          tenant_id: string
          worst_metric?: number | null
        }
        Update: {
          alert_type?: string
          archived_at?: string | null
          created_at?: string
          dedupe_key?: string
          details?: Json | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          latest_metric?: number | null
          message?: string
          metadata?: Json | null
          muted_until?: string | null
          occurrence_count?: number
          regressed_at?: string | null
          resolution_reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          tenant_id?: string
          worst_metric?: number | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          archived_at: string | null
          cls_score: number | null
          created_at: string
          fcp_ms: number | null
          id: string
          inp_ms: number | null
          lcp_ms: number | null
          load_time_ms: number | null
          metadata: Json | null
          page_route: string
          session_id: string
          tenant_id: string
          ttfb_ms: number | null
        }
        Insert: {
          archived_at?: string | null
          cls_score?: number | null
          created_at?: string
          fcp_ms?: number | null
          id?: string
          inp_ms?: number | null
          lcp_ms?: number | null
          load_time_ms?: number | null
          metadata?: Json | null
          page_route: string
          session_id: string
          tenant_id: string
          ttfb_ms?: number | null
        }
        Update: {
          archived_at?: string | null
          cls_score?: number | null
          created_at?: string
          fcp_ms?: number | null
          id?: string
          inp_ms?: number | null
          lcp_ms?: number | null
          load_time_ms?: number | null
          metadata?: Json | null
          page_route?: string
          session_id?: string
          tenant_id?: string
          ttfb_ms?: number | null
        }
        Relationships: []
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
        Relationships: []
      }
      portal_activity: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string | null
          file_attachments: Json | null
          id: string
          is_locked: boolean | null
          student_id: string | null
          visibility: string | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          file_attachments?: Json | null
          id?: string
          is_locked?: boolean | null
          student_id?: string | null
          visibility?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          file_attachments?: Json | null
          id?: string
          is_locked?: boolean | null
          student_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_activity_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_activity_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_activity_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "portal_activity_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_activity_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
        ]
      }
      portalsessions: {
        Row: {
          ended_at: string | null
          id: string
          started_at: string
          tenant_id: string
          userid: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          started_at?: string
          tenant_id: string
          userid?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          started_at?: string
          tenant_id?: string
          userid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portalsessions_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          billing_cadence: string | null
          created_at: string
          currency: string | null
          display_name: string | null
          id: string
          is_active: boolean
          max_active_students: number
          max_locations: number | null
          max_teachers: number | null
          min_active_students: number
          notes: string | null
          price_cents: number | null
          rate_per_session_cents: number
          sessions_per_month_default: number
          square_location_id: string | null
          square_plan_variation_id: string | null
          tenant_id: string | null
          tier_name: string | null
          updated_at: string
        }
        Insert: {
          billing_cadence?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          max_active_students: number
          max_locations?: number | null
          max_teachers?: number | null
          min_active_students: number
          notes?: string | null
          price_cents?: number | null
          rate_per_session_cents: number
          sessions_per_month_default?: number
          square_location_id?: string | null
          square_plan_variation_id?: string | null
          tenant_id?: string | null
          tier_name?: string | null
          updated_at?: string
        }
        Update: {
          billing_cadence?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          max_active_students?: number
          max_locations?: number | null
          max_teachers?: number | null
          min_active_students?: number
          notes?: string | null
          price_cents?: number | null
          rate_per_session_cents?: number
          sessions_per_month_default?: number
          square_location_id?: string | null
          square_plan_variation_id?: string | null
          tenant_id?: string | null
          tier_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      privacy_violation_log: {
        Row: {
          blocked: boolean | null
          created_at: string | null
          detected_at: string | null
          id: string
          query_text: string | null
          requested_field: string
          student_id: string | null
          teacher_id: string | null
          tenant_id: string
        }
        Insert: {
          blocked?: boolean | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          query_text?: string | null
          requested_field: string
          student_id?: string | null
          teacher_id?: string | null
          tenant_id: string
        }
        Update: {
          blocked?: boolean | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          query_text?: string | null
          requested_field?: string
          student_id?: string | null
          teacher_id?: string | null
          tenant_id?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      rate_limit_hits: {
        Row: {
          created_at: string
          id: string
          ip: string | null
          key: string
          max_allowed: number
          policy_id: string
          route: string | null
          tenant_id: string | null
          window_ms: number
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: string | null
          key: string
          max_allowed: number
          policy_id: string
          route?: string | null
          tenant_id?: string | null
          window_ms: number
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string | null
          key?: string
          max_allowed?: number
          policy_id?: string
          route?: string | null
          tenant_id?: string | null
          window_ms?: number
        }
        Relationships: []
      }
      raven_escalations: {
        Row: {
          agent_context: Json | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          conversation_id: string | null
          created_at: string
          id: string
          original_message: string | null
          raven_response: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          tenant_id: string
          trigger_reason: string
        }
        Insert: {
          agent_context?: Json | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          original_message?: string | null
          raven_response?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          tenant_id: string
          trigger_reason: string
        }
        Update: {
          agent_context?: Json | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          original_message?: string | null
          raven_response?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          tenant_id?: string
          trigger_reason?: string
        }
        Relationships: []
      }
      raven_knowledge_base: {
        Row: {
          banned_phrases: Json
          branch_logic: Json | null
          category: string
          channel: string
          created_at: string
          framework_id: string
          id: string
          is_active: boolean
          priority: number
          required_elements: Json
          template: string
          trigger_conditions: Json
          updated_at: string
          variables: Json
          version: number
        }
        Insert: {
          banned_phrases?: Json
          branch_logic?: Json | null
          category: string
          channel?: string
          created_at?: string
          framework_id: string
          id?: string
          is_active?: boolean
          priority?: number
          required_elements?: Json
          template: string
          trigger_conditions?: Json
          updated_at?: string
          variables?: Json
          version?: number
        }
        Update: {
          banned_phrases?: Json
          branch_logic?: Json | null
          category?: string
          channel?: string
          created_at?: string
          framework_id?: string
          id?: string
          is_active?: boolean
          priority?: number
          required_elements?: Json
          template?: string
          trigger_conditions?: Json
          updated_at?: string
          variables?: Json
          version?: number
        }
        Relationships: []
      }
      raven_message_log: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          channel: string
          created_at: string
          direction: string
          error_message: string | null
          event_id: string | null
          framework_used: string | null
          from_agent: string
          id: string
          location_id: string | null
          message_body: string
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          requires_approval: boolean
          retry_count: number
          sent_at: string | null
          sms_enabled: boolean
          status: string
          subject: string | null
          tenant_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          channel: string
          created_at?: string
          direction?: string
          error_message?: string | null
          event_id?: string | null
          framework_used?: string | null
          from_agent: string
          id?: string
          location_id?: string | null
          message_body: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          requires_approval?: boolean
          retry_count?: number
          sent_at?: string | null
          sms_enabled?: boolean
          status?: string
          subject?: string | null
          tenant_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          channel?: string
          created_at?: string
          direction?: string
          error_message?: string | null
          event_id?: string | null
          framework_used?: string | null
          from_agent?: string
          id?: string
          location_id?: string | null
          message_body?: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          requires_approval?: boolean
          retry_count?: number
          sent_at?: string | null
          sms_enabled?: boolean
          status?: string
          subject?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      recruitment_prospects: {
        Row: {
          acceptable_age_range: string | null
          audition_notes: string | null
          availability_notes: string | null
          best_first_lesson_fit: string | null
          best_match_students: string | null
          bio: string | null
          created_at: string | null
          customer_facing_match_summary: string | null
          director_notes: string | null
          email: string | null
          first_name: string
          id: string
          instruments: string[] | null
          internal_match_notes: string | null
          internal_matching_tags: string | null
          interview_date: string | null
          last_name: string
          lesson_style: string | null
          location_id: string | null
          meet_and_greet_fit: string | null
          musical_strengths_background: string | null
          notes: string | null
          pay_rate_requested: number | null
          personality: string | null
          phone: string | null
          preferred_age_range: string | null
          primary_instruments: string | null
          resume_url: string | null
          secondary_instruments: string | null
          skill_levels_by_instrument: string | null
          source: string | null
          source_detail: string | null
          status: string | null
          style_genre_strengths: string | null
          substitute_coverage: string | null
          teaching_strengths: string | null
          tenant_id: string
          updated_at: string | null
          use_caution_internal_placement_notes: string | null
        }
        Insert: {
          acceptable_age_range?: string | null
          audition_notes?: string | null
          availability_notes?: string | null
          best_first_lesson_fit?: string | null
          best_match_students?: string | null
          bio?: string | null
          created_at?: string | null
          customer_facing_match_summary?: string | null
          director_notes?: string | null
          email?: string | null
          first_name: string
          id?: string
          instruments?: string[] | null
          internal_match_notes?: string | null
          internal_matching_tags?: string | null
          interview_date?: string | null
          last_name: string
          lesson_style?: string | null
          location_id?: string | null
          meet_and_greet_fit?: string | null
          musical_strengths_background?: string | null
          notes?: string | null
          pay_rate_requested?: number | null
          personality?: string | null
          phone?: string | null
          preferred_age_range?: string | null
          primary_instruments?: string | null
          resume_url?: string | null
          secondary_instruments?: string | null
          skill_levels_by_instrument?: string | null
          source?: string | null
          source_detail?: string | null
          status?: string | null
          style_genre_strengths?: string | null
          substitute_coverage?: string | null
          teaching_strengths?: string | null
          tenant_id: string
          updated_at?: string | null
          use_caution_internal_placement_notes?: string | null
        }
        Update: {
          acceptable_age_range?: string | null
          audition_notes?: string | null
          availability_notes?: string | null
          best_first_lesson_fit?: string | null
          best_match_students?: string | null
          bio?: string | null
          created_at?: string | null
          customer_facing_match_summary?: string | null
          director_notes?: string | null
          email?: string | null
          first_name?: string
          id?: string
          instruments?: string[] | null
          internal_match_notes?: string | null
          internal_matching_tags?: string | null
          interview_date?: string | null
          last_name?: string
          lesson_style?: string | null
          location_id?: string | null
          meet_and_greet_fit?: string | null
          musical_strengths_background?: string | null
          notes?: string | null
          pay_rate_requested?: number | null
          personality?: string | null
          phone?: string | null
          preferred_age_range?: string | null
          primary_instruments?: string | null
          resume_url?: string | null
          secondary_instruments?: string | null
          skill_levels_by_instrument?: string | null
          source?: string | null
          source_detail?: string | null
          status?: string | null
          style_genre_strengths?: string | null
          substitute_coverage?: string | null
          teaching_strengths?: string | null
          tenant_id?: string
          updated_at?: string | null
          use_caution_internal_placement_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_prospects_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_lessons: {
        Row: {
          created_at: string
          day_of_week: number
          effective_from: string
          effective_until: string | null
          end_time: string
          id: string
          instrument: string | null
          is_active: boolean
          location_id: string
          room_id: string | null
          start_time: string
          student_id: string
          teacher_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          effective_from?: string
          effective_until?: string | null
          end_time: string
          id?: string
          instrument?: string | null
          is_active?: boolean
          location_id: string
          room_id?: string | null
          start_time: string
          student_id: string
          teacher_id: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          effective_from?: string
          effective_until?: string | null
          end_time?: string
          id?: string
          instrument?: string | null
          is_active?: boolean
          location_id?: string
          room_id?: string | null
          start_time?: string
          student_id?: string
          teacher_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_lessons_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_lessons_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "recurring_lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "recurring_lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          created_at: string
          id: string
          sent_at: string | null
          status: string
          studentid: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sent_at?: string | null
          status?: string
          studentid?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sent_at?: string | null
          status?: string
          studentid?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "review_requests_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_studentid_fkey"
            columns: ["studentid"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
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
        Relationships: []
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
        Relationships: []
      }
      rooms: {
        Row: {
          ai_context: Json | null
          archived_at: string | null
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
          metadata: Json | null
          name: string
          notes: string | null
          primary_instruments: string[] | null
          room_type: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_context?: Json | null
          archived_at?: string | null
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
          metadata?: Json | null
          name: string
          notes?: string | null
          primary_instruments?: string[] | null
          room_type?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_context?: Json | null
          archived_at?: string | null
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
          metadata?: Json | null
          name?: string
          notes?: string | null
          primary_instruments?: string[] | null
          room_type?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          ai_context: Json | null
          archived_at: string | null
          block_date: string
          block_type: Database["public"]["Enums"]["block_type"]
          callout_id: string | null
          callout_reason: string | null
          checked_in: boolean
          checked_in_at: string | null
          checked_in_by: string | null
          checkin_status: string | null
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
          metadata: Json | null
          notes: string | null
          original_teacher_id: string | null
          original_teacher_name: string | null
          reminder_sent: boolean | null
          room_id: string | null
          series_anchor: boolean
          series_id: string | null
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
          archived_at?: string | null
          block_date: string
          block_type?: Database["public"]["Enums"]["block_type"]
          callout_id?: string | null
          callout_reason?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          checkin_status?: string | null
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
          metadata?: Json | null
          notes?: string | null
          original_teacher_id?: string | null
          original_teacher_name?: string | null
          reminder_sent?: boolean | null
          room_id?: string | null
          series_anchor?: boolean
          series_id?: string | null
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
          archived_at?: string | null
          block_date?: string
          block_type?: Database["public"]["Enums"]["block_type"]
          callout_id?: string | null
          callout_reason?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          checkin_status?: string | null
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
          metadata?: Json | null
          notes?: string | null
          original_teacher_id?: string | null
          original_teacher_name?: string | null
          reminder_sent?: boolean | null
          room_id?: string | null
          series_anchor?: boolean
          series_id?: string | null
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
            foreignKeyName: "fk_schedule_blocks_series"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "schedule_series"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_series: {
        Row: {
          created_at: string
          day_of_week: number
          duration_blocks: number
          effective_from: string
          effective_until: string | null
          end_time: string
          id: string
          is_active: boolean
          is_recurring: boolean
          last_generated: string | null
          location_id: string
          notes: string | null
          start_time: string
          student_id: string
          teacher_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          duration_blocks?: number
          effective_from: string
          effective_until?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_generated?: string | null
          location_id: string
          notes?: string | null
          start_time: string
          student_id: string
          teacher_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          duration_blocks?: number
          effective_from?: string
          effective_until?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_generated?: string | null
          location_id?: string
          notes?: string | null
          start_time?: string
          student_id?: string
          teacher_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          day_of_week: number | null
          ends_at: string | null
          enrollment_id: string | null
          id: string
          instrument: string | null
          location_id: string | null
          start_time: string | null
          starts_at: string | null
          status: string
          student_id: string | null
          teacher_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          ends_at?: string | null
          enrollment_id?: string | null
          id?: string
          instrument?: string | null
          location_id?: string | null
          start_time?: string | null
          starts_at?: string | null
          status?: string
          student_id?: string | null
          teacher_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          ends_at?: string | null
          enrollment_id?: string | null
          id?: string
          instrument?: string | null
          location_id?: string | null
          start_time?: string | null
          starts_at?: string | null
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
            foreignKeyName: "schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "schedules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          actor_id: string | null
          created_at: string
          details: Json | null
          event: string
          id: string
          ip: string | null
          request_id: string | null
          severity: string
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          event: string
          id?: string
          ip?: string | null
          request_id?: string | null
          severity?: string
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          event?: string
          id?: string
          ip?: string | null
          request_id?: string | null
          severity?: string
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      services_catalog: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          is_core: boolean
          name: string
          sort_order: number
          sub_category: string | null
          taxable: boolean
          tenant_id: string
          unit_label: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_core?: boolean
          name: string
          sort_order?: number
          sub_category?: string | null
          taxable?: boolean
          tenant_id: string
          unit_label?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_core?: boolean
          name?: string
          sort_order?: number
          sub_category?: string | null
          taxable?: boolean
          tenant_id?: string
          unit_label?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      session_log: {
        Row: {
          ai_context: Json | null
          ai_summary: string | null
          archived_at: string | null
          block_date: string
          communication_id: string | null
          created_at: string
          engagement_level: number | null
          id: string
          instrument: string | null
          lesson_notes: string | null
          location_id: string
          metadata: Json | null
          notes: string | null
          parent_update_status: string | null
          payment_gated: boolean
          progress_indicator: string | null
          schedule_block_id: string
          service_quality: string | null
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
          archived_at?: string | null
          block_date: string
          communication_id?: string | null
          created_at?: string
          engagement_level?: number | null
          id?: string
          instrument?: string | null
          lesson_notes?: string | null
          location_id: string
          metadata?: Json | null
          notes?: string | null
          parent_update_status?: string | null
          payment_gated?: boolean
          progress_indicator?: string | null
          schedule_block_id: string
          service_quality?: string | null
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
          archived_at?: string | null
          block_date?: string
          communication_id?: string | null
          created_at?: string
          engagement_level?: number | null
          id?: string
          instrument?: string | null
          lesson_notes?: string | null
          location_id?: string
          metadata?: Json | null
          notes?: string | null
          parent_update_status?: string | null
          payment_gated?: boolean
          progress_indicator?: string | null
          schedule_block_id?: string
          service_quality?: string | null
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
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      sid_context_cache: {
        Row: {
          built_at: string | null
          context_json: Json
          id: string
          invalidated_at: string | null
          student_id: string
          tenant_id: string
        }
        Insert: {
          built_at?: string | null
          context_json: Json
          id?: string
          invalidated_at?: string | null
          student_id: string
          tenant_id: string
        }
        Update: {
          built_at?: string | null
          context_json?: Json
          id?: string
          invalidated_at?: string | null
          student_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      square_invoices: {
        Row: {
          amount_cents: number | null
          amount_paid: number | null
          archived_at: string | null
          customer_email: string | null
          customer_name: string | null
          due_date: string | null
          family_id: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          location_id: string | null
          metadata: Json | null
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
          archived_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          due_date?: string | null
          family_id?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          location_id?: string | null
          metadata?: Json | null
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
          archived_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          due_date?: string | null
          family_id?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          location_id?: string | null
          metadata?: Json | null
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
        Relationships: []
      }
      square_invoices_fact: {
        Row: {
          amount_cents: number
          amount_paid_cents: number
          created_at: string
          customer_email: string | null
          customer_name: string | null
          due_date: string | null
          family_id: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          location_id: string | null
          metadata: Json | null
          paid_at: string | null
          raw_json: Json | null
          recurring_series_id: string | null
          requested_amount: number | null
          square_created_at: string | null
          square_customer_id: string | null
          square_invoice_id: string | null
          square_location_id: string | null
          square_order_id: string | null
          status: string | null
          student_id: string | null
          synced_at: string | null
          tenant_id: string
          title: string | null
        }
        Insert: {
          amount_cents?: number
          amount_paid_cents?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          due_date?: string | null
          family_id?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          location_id?: string | null
          metadata?: Json | null
          paid_at?: string | null
          raw_json?: Json | null
          recurring_series_id?: string | null
          requested_amount?: number | null
          square_created_at?: string | null
          square_customer_id?: string | null
          square_invoice_id?: string | null
          square_location_id?: string | null
          square_order_id?: string | null
          status?: string | null
          student_id?: string | null
          synced_at?: string | null
          tenant_id: string
          title?: string | null
        }
        Update: {
          amount_cents?: number
          amount_paid_cents?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          due_date?: string | null
          family_id?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          location_id?: string | null
          metadata?: Json | null
          paid_at?: string | null
          raw_json?: Json | null
          recurring_series_id?: string | null
          requested_amount?: number | null
          square_created_at?: string | null
          square_customer_id?: string | null
          square_invoice_id?: string | null
          square_location_id?: string | null
          square_order_id?: string | null
          status?: string | null
          student_id?: string | null
          synced_at?: string | null
          tenant_id?: string
          title?: string | null
        }
        Relationships: []
      }
      square_payments_fact: {
        Row: {
          amount_money_cents: number | null
          application_fee_money_cents: number | null
          created_at_square: string | null
          id: string
          location_id: string | null
          metadata: Json | null
          net_total_cents: number | null
          processing_fee_total_cents: number
          raw_json: Json
          refunded_money_cents: number | null
          reporting_date: string
          source_type: string | null
          square_location_id: string | null
          square_order_id: string | null
          square_payment_id: string
          status: string
          synced_at: string
          team_member_id: string | null
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
          metadata?: Json | null
          net_total_cents?: number | null
          processing_fee_total_cents?: number
          raw_json?: Json
          refunded_money_cents?: number | null
          reporting_date: string
          source_type?: string | null
          square_location_id?: string | null
          square_order_id?: string | null
          square_payment_id: string
          status: string
          synced_at?: string
          team_member_id?: string | null
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
          metadata?: Json | null
          net_total_cents?: number | null
          processing_fee_total_cents?: number
          raw_json?: Json
          refunded_money_cents?: number | null
          reporting_date?: string
          source_type?: string | null
          square_location_id?: string | null
          square_order_id?: string | null
          square_payment_id?: string
          status?: string
          synced_at?: string
          team_member_id?: string | null
          tenant_id?: string
          tender_bucket?: string
          tip_money_cents?: number | null
          total_money_cents?: number | null
          updated_at_square?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      star_config: {
        Row: {
          approved_agent_ids: string[]
          business_context: string
          created_at: string
          default_skill_ids: string[]
          delegation_mode: string
          id: string
          instructions: string | null
          routing_rules: Json
          updated_at: string
        }
        Insert: {
          approved_agent_ids?: string[]
          business_context?: string
          created_at?: string
          default_skill_ids?: string[]
          delegation_mode?: string
          id?: string
          instructions?: string | null
          routing_rules?: Json
          updated_at?: string
        }
        Update: {
          approved_agent_ids?: string[]
          business_context?: string
          created_at?: string
          default_skill_ids?: string[]
          delegation_mode?: string
          id?: string
          instructions?: string | null
          routing_rules?: Json
          updated_at?: string
        }
        Relationships: []
      }
      star_reviews: {
        Row: {
          created_at: string
          id: string
          next_action: string | null
          summary: string
          task_id: string
          verdict: Database["public"]["Enums"]["review_verdict"]
          what_failed: string | null
          what_worked: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          next_action?: string | null
          summary: string
          task_id: string
          verdict: Database["public"]["Enums"]["review_verdict"]
          what_failed?: string | null
          what_worked?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          next_action?: string | null
          summary?: string
          task_id?: string
          verdict?: Database["public"]["Enums"]["review_verdict"]
          what_failed?: string | null
          what_worked?: string | null
        }
        Relationships: []
      }
      stewie_risk_log: {
        Row: {
          churn_signals: Json
          created_at: string | null
          id: string
          next_check_after: string
          resolution_reason: string | null
          resolved_at: string | null
          risk_stage: number
          stage_entered_at: string | null
          student_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          churn_signals?: Json
          created_at?: string | null
          id?: string
          next_check_after: string
          resolution_reason?: string | null
          resolved_at?: string | null
          risk_stage?: number
          stage_entered_at?: string | null
          student_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          churn_signals?: Json
          created_at?: string | null
          id?: string
          next_check_after?: string
          resolution_reason?: string | null
          resolved_at?: string | null
          risk_stage?: number
          stage_entered_at?: string | null
          student_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string
          email: string | null
          family_id: string | null
          id: string
          metadata: Json
          stripe_customer_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          family_id?: string | null
          id?: string
          metadata?: Json
          stripe_customer_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          family_id?: string | null
          id?: string
          metadata?: Json
          stripe_customer_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      student_events: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_name: string | null
          created_by_role: string | null
          description: string
          event_type: string
          family_id: string | null
          id: string
          source_id: string | null
          student_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          description: string
          event_type: string
          family_id?: string | null
          id?: string
          source_id?: string | null
          student_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          description?: string
          event_type?: string
          family_id?: string | null
          id?: string
          source_id?: string | null
          student_id?: string
          tenant_id?: string
        }
        Relationships: []
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
          storage_path: string | null
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
          storage_path?: string | null
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
          storage_path?: string | null
          student_id?: string
          tenant_id?: string
          uploaded_by?: string | null
          uploaded_by_role?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      student_messages: {
        Row: {
          admin_reviewed: boolean
          category: string
          content: string
          created_at: string
          family_id: string | null
          forwarded_to_teacher: boolean
          id: string
          is_anonymous: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          student_id: string | null
          tenant_id: string
        }
        Insert: {
          admin_reviewed?: boolean
          category?: string
          content: string
          created_at?: string
          family_id?: string | null
          forwarded_to_teacher?: boolean
          id?: string
          is_anonymous?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          student_id?: string | null
          tenant_id: string
        }
        Update: {
          admin_reviewed?: boolean
          category?: string
          content?: string
          created_at?: string
          family_id?: string | null
          forwarded_to_teacher?: boolean
          id?: string
          is_anonymous?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          student_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_messages_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_messages_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "v_family_billing"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "student_messages_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "view_family_account_summary"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "student_messages_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "student_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          author_role: string | null
          body: string
          created_at: string
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_lesson_card: boolean
          note_type: string
          prompt_assignment: string | null
          prompt_context: string | null
          prompt_focus: string | null
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          author_role?: string | null
          body: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_lesson_card?: boolean
          note_type?: string
          prompt_assignment?: string | null
          prompt_context?: string | null
          prompt_focus?: string | null
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          author_role?: string | null
          body?: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_lesson_card?: boolean
          note_type?: string
          prompt_assignment?: string | null
          prompt_context?: string | null
          prompt_focus?: string | null
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
        ]
      }
      students: {
        Row: {
          age: string | null
          ai_context: Json | null
          archived_at: string | null
          attendance_streak: number | null
          bio: string | null
          blocks_per_week: number
          churn_risk: string | null
          coming_back: boolean | null
          counts_toward_family_tier: boolean
          created_at: string
          date_of_birth: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          end_date: string | null
          enrollment_date: string | null
          enrollment_type: string | null
          exit_category: string | null
          exit_notes: string | null
          exit_reason: string | null
          expected_return_date: string | null
          experience: string | null
          experience_level: string | null
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
          last_attendance_at: string | null
          last_name: string
          last_teacher_id: string | null
          last_teacher_name: string | null
          lead_id: string | null
          learning_style: string | null
          lesson_day_of_week: number | null
          location_id: string
          may_return: string | null
          notes: string | null
          onboarding_stage: string | null
          overdue_amount: number | null
          pause_reason: string | null
          pause_reason_detail: string | null
          photo_url: string | null
          preferred_days: string[] | null
          previous_teacher_id: string | null
          profile_id: string | null
          rate_per_session: number
          reactivation_date: string | null
          sessions_per_month: number
          source: string | null
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
          archived_at?: string | null
          attendance_streak?: number | null
          bio?: string | null
          blocks_per_week?: number
          churn_risk?: string | null
          coming_back?: boolean | null
          counts_toward_family_tier?: boolean
          created_at?: string
          date_of_birth?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          end_date?: string | null
          enrollment_date?: string | null
          enrollment_type?: string | null
          exit_category?: string | null
          exit_notes?: string | null
          exit_reason?: string | null
          expected_return_date?: string | null
          experience?: string | null
          experience_level?: string | null
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
          last_attendance_at?: string | null
          last_name?: string
          last_teacher_id?: string | null
          last_teacher_name?: string | null
          lead_id?: string | null
          learning_style?: string | null
          lesson_day_of_week?: number | null
          location_id: string
          may_return?: string | null
          notes?: string | null
          onboarding_stage?: string | null
          overdue_amount?: number | null
          pause_reason?: string | null
          pause_reason_detail?: string | null
          photo_url?: string | null
          preferred_days?: string[] | null
          previous_teacher_id?: string | null
          profile_id?: string | null
          rate_per_session?: number
          reactivation_date?: string | null
          sessions_per_month?: number
          source?: string | null
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
          archived_at?: string | null
          attendance_streak?: number | null
          bio?: string | null
          blocks_per_week?: number
          churn_risk?: string | null
          coming_back?: boolean | null
          counts_toward_family_tier?: boolean
          created_at?: string
          date_of_birth?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          end_date?: string | null
          enrollment_date?: string | null
          enrollment_type?: string | null
          exit_category?: string | null
          exit_notes?: string | null
          exit_reason?: string | null
          expected_return_date?: string | null
          experience?: string | null
          experience_level?: string | null
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
          last_attendance_at?: string | null
          last_name?: string
          last_teacher_id?: string | null
          last_teacher_name?: string | null
          lead_id?: string | null
          learning_style?: string | null
          lesson_day_of_week?: number | null
          location_id?: string
          may_return?: string | null
          notes?: string | null
          onboarding_stage?: string | null
          overdue_amount?: number | null
          pause_reason?: string | null
          pause_reason_detail?: string | null
          photo_url?: string | null
          preferred_days?: string[] | null
          previous_teacher_id?: string | null
          profile_id?: string | null
          rate_per_session?: number
          reactivation_date?: string | null
          sessions_per_month?: number
          source?: string | null
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
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "v_family_billing"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "view_family_account_summary"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
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
        Relationships: []
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
        Relationships: []
      }
      subscription_items: {
        Row: {
          created_at: string
          description: string
          id: string
          metadata: Json
          quantity: number
          subscription_id: string
          tenant_id: string
          unit_amount_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          metadata?: Json
          quantity?: number
          subscription_id: string
          tenant_id: string
          unit_amount_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          metadata?: Json
          quantity?: number
          subscription_id?: string
          tenant_id?: string
          unit_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_plan_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          family_id: string | null
          id: string
          metadata: Json
          next_invoice_at: string | null
          status: string
          student_id: string | null
          subscription_plan_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          billing_plan_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          family_id?: string | null
          id?: string
          metadata?: Json
          next_invoice_at?: string | null
          status?: string
          student_id?: string | null
          subscription_plan_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          billing_plan_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          family_id?: string | null
          id?: string
          metadata?: Json
          next_invoice_at?: string | null
          status?: string
          student_id?: string | null
          subscription_plan_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_health: {
        Row: {
          checked_at: string
          component: string
          id: string
          metrics: Json | null
          status: string
        }
        Insert: {
          checked_at?: string
          component: string
          id?: string
          metrics?: Json | null
          status?: string
        }
        Update: {
          checked_at?: string
          component?: string
          id?: string
          metrics?: Json | null
          status?: string
        }
        Relationships: []
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
        Relationships: []
      }
      teacher_locations: {
        Row: {
          can_sub: boolean
          created_at: string | null
          id: string
          is_regular: boolean
          location_id: string
          teacher_id: string
        }
        Insert: {
          can_sub?: boolean
          created_at?: string | null
          id?: string
          is_regular?: boolean
          location_id: string
          teacher_id: string
        }
        Update: {
          can_sub?: boolean
          created_at?: string | null
          id?: string
          is_regular?: boolean
          location_id?: string
          teacher_id?: string
        }
        Relationships: []
      }
      teacher_room_assignments: {
        Row: {
          assignment_date: string | null
          created_at: string | null
          created_by: string | null
          day_of_week: string | null
          id: string
          is_recurring: boolean
          location_id: string | null
          room_id: string | null
          teacher_id: string | null
          tenant_id: string | null
        }
        Insert: {
          assignment_date?: string | null
          created_at?: string | null
          created_by?: string | null
          day_of_week?: string | null
          id?: string
          is_recurring?: boolean
          location_id?: string | null
          room_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          assignment_date?: string | null
          created_at?: string | null
          created_by?: string | null
          day_of_week?: string | null
          id?: string
          is_recurring?: boolean
          location_id?: string | null
          room_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      teacher_w9: {
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
          signed_at: string | null
          signed_by_ip: string | null
          state: string
          status: string | null
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
          signed_at?: string | null
          signed_by_ip?: string | null
          state: string
          status?: string | null
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
          signed_at?: string | null
          signed_by_ip?: string | null
          state?: string
          status?: string | null
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
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          acceptable_age_range: string | null
          ai_context: Json | null
          archived_at: string | null
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
          first_name: string
          hire_date: string | null
          id: string
          instruments: string[] | null
          internal_match_notes: string | null
          internal_matching_tags: string | null
          is_active: boolean
          last_name: string
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
          status: string
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
          archived_at?: string | null
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
          first_name: string
          hire_date?: string | null
          id?: string
          instruments?: string[] | null
          internal_match_notes?: string | null
          internal_matching_tags?: string | null
          is_active?: boolean
          last_name: string
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
          status?: string
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
          archived_at?: string | null
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
          first_name?: string
          hire_date?: string | null
          id?: string
          instruments?: string[] | null
          internal_match_notes?: string | null
          internal_matching_tags?: string | null
          is_active?: boolean
          last_name?: string
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
          status?: string
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
        Relationships: []
      }
      tenant_agent_config: {
        Row: {
          created_at: string
          director_name: string | null
          google_review_link: string | null
          id: string
          military_price: string | null
          monthly_price: string | null
          multi_student_price: string | null
          registration_link: string | null
          studio_name: string | null
          tagline: string | null
          tenant_id: string
          updated_at: string
          years_open: string | null
        }
        Insert: {
          created_at?: string
          director_name?: string | null
          google_review_link?: string | null
          id?: string
          military_price?: string | null
          monthly_price?: string | null
          multi_student_price?: string | null
          registration_link?: string | null
          studio_name?: string | null
          tagline?: string | null
          tenant_id: string
          updated_at?: string
          years_open?: string | null
        }
        Update: {
          created_at?: string
          director_name?: string | null
          google_review_link?: string | null
          id?: string
          military_price?: string | null
          monthly_price?: string | null
          multi_student_price?: string | null
          registration_link?: string | null
          studio_name?: string | null
          tagline?: string | null
          tenant_id?: string
          updated_at?: string
          years_open?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_agent_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "agent_tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          created_at: string | null
          enrollment_pipeline: Json | null
          events: Json | null
          kpi_settings: Json | null
          lead_pipeline: Json | null
          pipelines: Json | null
          retention_pipeline: Json | null
          schedule: Json | null
          tenant_id: string
          trial_pipeline: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enrollment_pipeline?: Json | null
          events?: Json | null
          kpi_settings?: Json | null
          lead_pipeline?: Json | null
          pipelines?: Json | null
          retention_pipeline?: Json | null
          schedule?: Json | null
          tenant_id: string
          trial_pipeline?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enrollment_pipeline?: Json | null
          events?: Json | null
          kpi_settings?: Json | null
          lead_pipeline?: Json | null
          pipelines?: Json | null
          retention_pipeline?: Json | null
          schedule?: Json | null
          tenant_id?: string
          trial_pipeline?: Json | null
          updated_at?: string | null
        }
        Relationships: []
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
      touches: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          source: string | null
          type: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          type: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "touches_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      trials: {
        Row: {
          attended: boolean | null
          created_at: string
          enrollment_decision: string | null
          id: string
          inactivity_bucket: string | null
          last_reminded_at: string | null
          lead_id: string | null
          scheduled_at: string | null
          status: string | null
          student_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attended?: boolean | null
          created_at?: string
          enrollment_decision?: string | null
          id?: string
          inactivity_bucket?: string | null
          last_reminded_at?: string | null
          lead_id?: string | null
          scheduled_at?: string | null
          status?: string | null
          student_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attended?: boolean | null
          created_at?: string
          enrollment_decision?: string | null
          id?: string
          inactivity_bucket?: string | null
          last_reminded_at?: string | null
          lead_id?: string | null
          scheduled_at?: string | null
          status?: string | null
          student_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trials_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_lifecycle_context"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "trials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "view_student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["student_id"]
          },
        ]
      }
      usage_records: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          metric: string
          period_end: string | null
          period_start: string | null
          quantity: number
          student_id: string | null
          subscription_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          metric: string
          period_end?: string | null
          period_start?: string | null
          quantity?: number
          student_id?: string | null
          subscription_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          metric?: string
          period_end?: string | null
          period_start?: string | null
          quantity?: number
          student_id?: string | null
          subscription_id?: string | null
          tenant_id?: string
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
        Relationships: []
      }
      vault_delivery_attempts: {
        Row: {
          channel: string
          created_at: string
          error_code: string | null
          error_message: string | null
          fulfillment_event_id: string | null
          id: string
          payload: Json | null
          provider: string | null
          provider_message_id: string | null
          recipient: string
          sent_at: string | null
          status: string
          vault_user_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          fulfillment_event_id?: string | null
          id?: string
          payload?: Json | null
          provider?: string | null
          provider_message_id?: string | null
          recipient: string
          sent_at?: string | null
          status?: string
          vault_user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          fulfillment_event_id?: string | null
          id?: string
          payload?: Json | null
          provider?: string | null
          provider_message_id?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string
          vault_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_delivery_attempts_fulfillment_event_id_fkey"
            columns: ["fulfillment_event_id"]
            isOneToOne: false
            referencedRelation: "vault_fulfillment_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_delivery_attempts_vault_user_id_fkey"
            columns: ["vault_user_id"]
            isOneToOne: false
            referencedRelation: "vault_users"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_fulfillment_events: {
        Row: {
          amount_cents: number | null
          buyer_email: string | null
          buyer_first_name: string | null
          buyer_last_name: string | null
          buyer_phone: string | null
          canonical_product_slug: string | null
          created_at: string
          currency: string | null
          dry_run: boolean
          error_code: string | null
          error_message: string | null
          id: string
          parsed_payload: Json | null
          processed_at: string | null
          provider: string
          provider_customer_id: string | null
          provider_event_id: string | null
          provider_event_type: string | null
          provider_order_id: string | null
          provider_payment_id: string | null
          raw_event: Json
          status: string
          vault_product_slug: string | null
        }
        Insert: {
          amount_cents?: number | null
          buyer_email?: string | null
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_phone?: string | null
          canonical_product_slug?: string | null
          created_at?: string
          currency?: string | null
          dry_run?: boolean
          error_code?: string | null
          error_message?: string | null
          id?: string
          parsed_payload?: Json | null
          processed_at?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_event_id?: string | null
          provider_event_type?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          raw_event: Json
          status?: string
          vault_product_slug?: string | null
        }
        Update: {
          amount_cents?: number | null
          buyer_email?: string | null
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_phone?: string | null
          canonical_product_slug?: string | null
          created_at?: string
          currency?: string | null
          dry_run?: boolean
          error_code?: string | null
          error_message?: string | null
          id?: string
          parsed_payload?: Json | null
          processed_at?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_event_id?: string | null
          provider_event_type?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          raw_event?: Json
          status?: string
          vault_product_slug?: string | null
        }
        Relationships: []
      }
      vault_product_modules: {
        Row: {
          content_type: string
          content_url: string | null
          created_at: string
          description: string | null
          id: string
          lesson_id: string | null
          product_id: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          content_type: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          product_id: string
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          product_id?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_product_modules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vault_products"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_product_square_map: {
        Row: {
          canonical_product_slug: string
          created_at: string
          expected_price_cents: number | null
          grant_slugs: string[]
          id: string
          is_active: boolean
          is_bundle: boolean
          square_catalog_object_id: string | null
          square_checkout_id: string | null
          square_link_code: string | null
          square_link_url: string | null
          square_variation_id: string | null
          updated_at: string
          vault_product_slug: string
        }
        Insert: {
          canonical_product_slug: string
          created_at?: string
          expected_price_cents?: number | null
          grant_slugs: string[]
          id?: string
          is_active?: boolean
          is_bundle?: boolean
          square_catalog_object_id?: string | null
          square_checkout_id?: string | null
          square_link_code?: string | null
          square_link_url?: string | null
          square_variation_id?: string | null
          updated_at?: string
          vault_product_slug: string
        }
        Update: {
          canonical_product_slug?: string
          created_at?: string
          expected_price_cents?: number | null
          grant_slugs?: string[]
          id?: string
          is_active?: boolean
          is_bundle?: boolean
          square_catalog_object_id?: string | null
          square_checkout_id?: string | null
          square_link_code?: string | null
          square_link_url?: string | null
          square_variation_id?: string | null
          updated_at?: string
          vault_product_slug?: string
        }
        Relationships: []
      }
      vault_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          price_cents: number
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price_cents?: number
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price_cents?: number
          slug?: string
          title?: string
        }
        Relationships: []
      }
      vault_user_module_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_accessed_at: string | null
          module_id: string
          progress: number
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_accessed_at?: string | null
          module_id: string
          progress?: number
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_accessed_at?: string | null
          module_id?: string
          progress?: number
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_user_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "vault_product_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_user_module_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_users"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_user_products: {
        Row: {
          id: string
          product_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          product_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          product_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_user_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vault_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_user_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vault_users"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_users: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_login: string | null
          license_key: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_login?: string | null
          license_key?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_login?: string | null
          license_key?: string
        }
        Relationships: []
      }
      verticals: {
        Row: {
          created_at: string | null
          headline: string
          id: string
          label: string
          primary_color: string
          slug: string
          subdomain: string
          subheadline: string
          terminology: Json | null
        }
        Insert: {
          created_at?: string | null
          headline: string
          id?: string
          label: string
          primary_color: string
          slug: string
          subdomain: string
          subheadline: string
          terminology?: Json | null
        }
        Update: {
          created_at?: string | null
          headline?: string
          id?: string
          label?: string
          primary_color?: string
          slug?: string
          subdomain?: string
          subheadline?: string
          terminology?: Json | null
        }
        Relationships: []
      }
      ziro_events: {
        Row: {
          agent_assigned: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          input_summary: string | null
          output_summary: string | null
          status: string
          tenant_id: string
          tokens_used: number | null
        }
        Insert: {
          agent_assigned: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          input_summary?: string | null
          output_summary?: string | null
          status: string
          tenant_id?: string
          tokens_used?: number | null
        }
        Update: {
          agent_assigned?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          input_summary?: string | null
          output_summary?: string | null
          status?: string
          tenant_id?: string
          tokens_used?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      v_family_billing: {
        Row: {
          active_student_count: number | null
          applied_tier_id: string | null
          billing_health: string | null
          family_id: string | null
          family_monthly_total_cents: number | null
          family_name: string | null
          monthly_per_student_cents: number | null
          square_card_id: string | null
          square_customer_id: string | null
          stamped_rate_per_session_cents: number | null
          tenant_id: string | null
          tier_max: number | null
          tier_min: number | null
          tier_rate_per_session_cents: number | null
          tier_sessions_per_month: number | null
        }
        Relationships: []
      }
      view_family_account_summary: {
        Row: {
          credit_balance_cents: number | null
          family_id: string | null
          name: string | null
          open_invoice_count: number | null
          outstanding_cents: number | null
          overdue_invoice_count: number | null
          paid_cents: number | null
          primary_email: string | null
          primary_location_id: string | null
          primary_phone: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      view_schedule_blocks_extended: {
        Row: {
          ai_context: Json | null
          archived_at: string | null
          block_date: string | null
          block_type: Database["public"]["Enums"]["block_type"] | null
          callout_id: string | null
          callout_reason: string | null
          checked_in: boolean | null
          checked_in_at: string | null
          checked_in_by: string | null
          checkin_status: string | null
          converted_by: string | null
          converted_to_virtual_at: string | null
          created_at: string | null
          end_time: string | null
          fifth_week: boolean | null
          generated_from_availability: boolean | null
          id: string | null
          is_checked_in: boolean | null
          is_family_callout: boolean | null
          is_makeup_session: boolean | null
          is_recurring: boolean | null
          is_virtual: boolean | null
          location_id: string | null
          makeup_session_id: string | null
          meet_event_id: string | null
          meet_link: string | null
          metadata: Json | null
          notes: string | null
          original_teacher_id: string | null
          original_teacher_name: string | null
          reminder_sent: boolean | null
          room_id: string | null
          series_anchor: boolean | null
          series_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["block_status"] | null
          student_id: string | null
          teacher_id: string | null
          teacher_tally: boolean | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_context?: Json | null
          archived_at?: string | null
          block_date?: string | null
          block_type?: Database["public"]["Enums"]["block_type"] | null
          callout_id?: string | null
          callout_reason?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          checkin_status?: string | null
          converted_by?: string | null
          converted_to_virtual_at?: string | null
          created_at?: string | null
          end_time?: string | null
          fifth_week?: boolean | null
          generated_from_availability?: boolean | null
          id?: string | null
          is_checked_in?: never
          is_family_callout?: boolean | null
          is_makeup_session?: boolean | null
          is_recurring?: boolean | null
          is_virtual?: boolean | null
          location_id?: string | null
          makeup_session_id?: string | null
          meet_event_id?: string | null
          meet_link?: string | null
          metadata?: Json | null
          notes?: string | null
          original_teacher_id?: string | null
          original_teacher_name?: string | null
          reminder_sent?: boolean | null
          room_id?: string | null
          series_anchor?: boolean | null
          series_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["block_status"] | null
          student_id?: string | null
          teacher_id?: string | null
          teacher_tally?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_context?: Json | null
          archived_at?: string | null
          block_date?: string | null
          block_type?: Database["public"]["Enums"]["block_type"] | null
          callout_id?: string | null
          callout_reason?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          checkin_status?: string | null
          converted_by?: string | null
          converted_to_virtual_at?: string | null
          created_at?: string | null
          end_time?: string | null
          fifth_week?: boolean | null
          generated_from_availability?: boolean | null
          id?: string | null
          is_checked_in?: never
          is_family_callout?: boolean | null
          is_makeup_session?: boolean | null
          is_recurring?: boolean | null
          is_virtual?: boolean | null
          location_id?: string | null
          makeup_session_id?: string | null
          meet_event_id?: string | null
          meet_link?: string | null
          metadata?: Json | null
          notes?: string | null
          original_teacher_id?: string | null
          original_teacher_name?: string | null
          reminder_sent?: boolean | null
          room_id?: string | null
          series_anchor?: boolean | null
          series_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["block_status"] | null
          student_id?: string | null
          teacher_id?: string | null
          teacher_tally?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_schedule_blocks_series"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "schedule_series"
            referencedColumns: ["id"]
          },
        ]
      }
      view_student_lifecycle_context: {
        Row: {
          enrolled: boolean | null
          last_activity_date: string | null
          lead: Json | null
          missed_lessons_30d: number | null
          negative_events_30d: number | null
          overdue_invoices: number | null
          scheduled: boolean | null
          service_started: boolean | null
          stage_events: Json | null
          student: Json | null
          student_id: string | null
          teacher_assigned: boolean | null
          tenant_id: string | null
          trial: Json | null
        }
        Relationships: []
      }
      view_student_profiles: {
        Row: {
          age: string | null
          age_years: number | null
          ai_context: Json | null
          archived_at: string | null
          attendance_streak: number | null
          bio: string | null
          blocks_per_week: number | null
          churn_risk: string | null
          coming_back: boolean | null
          counts_toward_family_tier: boolean | null
          created_at: string | null
          date_of_birth: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          end_date: string | null
          enrollment_date: string | null
          enrollment_type: string | null
          exit_category: string | null
          exit_notes: string | null
          exit_reason: string | null
          expected_return_date: string | null
          experience: string | null
          experience_level: string | null
          family_id: string | null
          fifth_weeks_used: number | null
          first_lesson_date: string | null
          first_name: string | null
          first_teacher_id: string | null
          first_teacher_name: string | null
          followup_date: string | null
          followup_sent: boolean | null
          followup_sent_at: string | null
          goals: string | null
          has_instrument: string | null
          id: string | null
          instrument: string | null
          intake_submission_id: string | null
          last_attendance_at: string | null
          last_name: string | null
          last_teacher_id: string | null
          last_teacher_name: string | null
          lead_id: string | null
          learning_style: string | null
          lesson_day_of_week: number | null
          location_id: string | null
          may_return: string | null
          notes: string | null
          onboarding_stage: string | null
          overdue_amount: number | null
          pause_reason: string | null
          pause_reason_detail: string | null
          photo_url: string | null
          preferred_days: string[] | null
          previous_teacher_id: string | null
          profile_id: string | null
          rate_per_session: number | null
          reactivation_date: string | null
          sessions_per_month: number | null
          source: string | null
          start_date: string | null
          status: string | null
          student_display_id: string | null
          tags: string[] | null
          teacher_changed_at: string | null
          teacher_id: string | null
          teacher_notes: string | null
          tenant_id: string | null
          total_callouts: number | null
          total_fifth_weeks: number | null
          total_lessons_taken: number | null
          total_paid: number | null
          transferred_to_location_id: string | null
          updated_at: string | null
        }
        Insert: {
          age?: string | null
          age_years?: never
          ai_context?: Json | null
          archived_at?: string | null
          attendance_streak?: number | null
          bio?: string | null
          blocks_per_week?: number | null
          churn_risk?: string | null
          coming_back?: boolean | null
          counts_toward_family_tier?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          end_date?: string | null
          enrollment_date?: string | null
          enrollment_type?: string | null
          exit_category?: string | null
          exit_notes?: string | null
          exit_reason?: string | null
          expected_return_date?: string | null
          experience?: string | null
          experience_level?: string | null
          family_id?: string | null
          fifth_weeks_used?: number | null
          first_lesson_date?: string | null
          first_name?: string | null
          first_teacher_id?: string | null
          first_teacher_name?: string | null
          followup_date?: string | null
          followup_sent?: boolean | null
          followup_sent_at?: string | null
          goals?: string | null
          has_instrument?: string | null
          id?: string | null
          instrument?: string | null
          intake_submission_id?: string | null
          last_attendance_at?: string | null
          last_name?: string | null
          last_teacher_id?: string | null
          last_teacher_name?: string | null
          lead_id?: string | null
          learning_style?: string | null
          lesson_day_of_week?: number | null
          location_id?: string | null
          may_return?: string | null
          notes?: string | null
          onboarding_stage?: string | null
          overdue_amount?: number | null
          pause_reason?: string | null
          pause_reason_detail?: string | null
          photo_url?: string | null
          preferred_days?: string[] | null
          previous_teacher_id?: string | null
          profile_id?: string | null
          rate_per_session?: number | null
          reactivation_date?: string | null
          sessions_per_month?: number | null
          source?: string | null
          start_date?: string | null
          status?: string | null
          student_display_id?: string | null
          tags?: string[] | null
          teacher_changed_at?: string | null
          teacher_id?: string | null
          teacher_notes?: string | null
          tenant_id?: string | null
          total_callouts?: number | null
          total_fifth_weeks?: number | null
          total_lessons_taken?: number | null
          total_paid?: number | null
          transferred_to_location_id?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: string | null
          age_years?: never
          ai_context?: Json | null
          archived_at?: string | null
          attendance_streak?: number | null
          bio?: string | null
          blocks_per_week?: number | null
          churn_risk?: string | null
          coming_back?: boolean | null
          counts_toward_family_tier?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          end_date?: string | null
          enrollment_date?: string | null
          enrollment_type?: string | null
          exit_category?: string | null
          exit_notes?: string | null
          exit_reason?: string | null
          expected_return_date?: string | null
          experience?: string | null
          experience_level?: string | null
          family_id?: string | null
          fifth_weeks_used?: number | null
          first_lesson_date?: string | null
          first_name?: string | null
          first_teacher_id?: string | null
          first_teacher_name?: string | null
          followup_date?: string | null
          followup_sent?: boolean | null
          followup_sent_at?: string | null
          goals?: string | null
          has_instrument?: string | null
          id?: string | null
          instrument?: string | null
          intake_submission_id?: string | null
          last_attendance_at?: string | null
          last_name?: string | null
          last_teacher_id?: string | null
          last_teacher_name?: string | null
          lead_id?: string | null
          learning_style?: string | null
          lesson_day_of_week?: number | null
          location_id?: string | null
          may_return?: string | null
          notes?: string | null
          onboarding_stage?: string | null
          overdue_amount?: number | null
          pause_reason?: string | null
          pause_reason_detail?: string | null
          photo_url?: string | null
          preferred_days?: string[] | null
          previous_teacher_id?: string | null
          profile_id?: string | null
          rate_per_session?: number | null
          reactivation_date?: string | null
          sessions_per_month?: number | null
          source?: string | null
          start_date?: string | null
          status?: string | null
          student_display_id?: string | null
          tags?: string[] | null
          teacher_changed_at?: string | null
          teacher_id?: string | null
          teacher_notes?: string | null
          tenant_id?: string | null
          total_callouts?: number | null
          total_fifth_weeks?: number | null
          total_lessons_taken?: number | null
          total_paid?: number | null
          transferred_to_location_id?: string | null
          updated_at?: string | null
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
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "v_family_billing"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "view_family_account_summary"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "vw_student_family_search"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      view_tenant_billing_aging: {
        Row: {
          bucket_id: string | null
          bucket_label: string | null
          invoice_count: number | null
          outstanding_cents: number | null
          tenant_id: string | null
        }
        Relationships: []
      }
      vw_student_family_search: {
        Row: {
          family_billing_status: string | null
          family_id: string | null
          family_name: string | null
          family_primary_email: string | null
          family_primary_phone: string | null
          family_status: string | null
          search_terms: string | null
          student_first_name: string | null
          student_id: string | null
          student_instrument: string | null
          student_last_name: string | null
          student_location_id: string | null
          student_status: string | null
          student_teacher_id: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["student_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      recompute_family_rate_tier: {
        Args: { p_family_id: string }
        Returns: undefined
      }
      vault_get_data: {
        Args: { p_email: string; p_license_key: string }
        Returns: Json
      }
      vault_login: {
        Args: { p_email: string; p_license_key: string }
        Returns: {
          email: string
          first_name: string
          id: string
        }[]
      }
      vault_update_progress: {
        Args: {
          p_email: string
          p_license_key: string
          p_module_id: string
          p_progress: number
        }
        Returns: boolean
      }
    }
    Enums: {
      agent_mode: "persistent" | "ephemeral"
      agent_status: "active" | "paused" | "retired" | "failed"
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
        | "booked_session"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      lead_stage: "inquiry" | "contacted" | "scheduled" | "enrolled" | "lost"
      review_verdict: "approved" | "retry" | "escalate" | "needs_human"
      run_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "failed_permanent"
        | "cancelled"
      skill_runtime: "claude_code" | "browser" | "api" | "manual"
      task_priority: "low" | "normal" | "high" | "urgent"
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
      agent_mode: ["persistent", "ephemeral"],
      agent_status: ["active", "paused", "retired", "failed"],
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
        "booked_session",
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
      review_verdict: ["approved", "retry", "escalate", "needs_human"],
      run_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "failed_permanent",
        "cancelled",
      ],
      skill_runtime: ["claude_code", "browser", "api", "manual"],
      task_priority: ["low", "normal", "high", "urgent"],
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
