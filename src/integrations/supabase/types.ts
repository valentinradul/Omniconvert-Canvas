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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      company_content_settings: {
        Row: {
          company_id: string
          created_at: string
          enable_financial_tracking: boolean
          enable_gtm_calculator: boolean
          enable_reporting: boolean
          id: string
          restrict_content_to_departments: boolean
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          enable_financial_tracking?: boolean
          enable_gtm_calculator?: boolean
          enable_reporting?: boolean
          id?: string
          restrict_content_to_departments?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          enable_financial_tracking?: boolean
          enable_gtm_calculator?: boolean
          enable_reporting?: boolean
          id?: string
          restrict_content_to_departments?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_content_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_integrations: {
        Row: {
          company_id: string
          config: Json | null
          created_at: string
          encrypted_credentials: string | null
          id: string
          integration_type: string
          is_active: boolean
          last_sync_at: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          config?: Json | null
          created_at?: string
          encrypted_credentials?: string | null
          id?: string
          integration_type: string
          is_active?: boolean
          last_sync_at?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          config?: Json | null
          created_at?: string
          encrypted_credentials?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean
          last_sync_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invitations: {
        Row: {
          accepted: boolean | null
          company_id: string
          created_at: string
          department_permissions: Json | null
          email: string
          id: string
          invited_by: string
          role: string
        }
        Insert: {
          accepted?: boolean | null
          company_id: string
          created_at?: string
          department_permissions?: Json | null
          email: string
          id?: string
          invited_by: string
          role: string
        }
        Update: {
          accepted?: boolean | null
          company_id?: string
          created_at?: string
          department_permissions?: Json | null
          email?: string
          id?: string
          invited_by?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_company_members_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_financials: {
        Row: {
          added_by: string
          amount: number
          created_at: string
          description: string | null
          experiment_id: string
          id: string
          name: string
          period_end: string
          period_start: string
          type: string
          updated_at: string
        }
        Insert: {
          added_by: string
          amount: number
          created_at?: string
          description?: string | null
          experiment_id: string
          id?: string
          name: string
          period_end: string
          period_start: string
          type: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          amount?: number
          created_at?: string
          description?: string | null
          experiment_id?: string
          id?: string
          name?: string
          period_end?: string
          period_start?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      experiments: {
        Row: {
          company_id: string | null
          createdat: string
          enddate: string | null
          hypothesisid: string | null
          id: string
          notes: string | null
          notes_history: Json | null
          observationcontent: Json | null
          responsibleuserid: string | null
          startdate: string | null
          status: string | null
          statusupdatedat: string | null
          title: string | null
          total_cost: number | null
          total_revenue: number | null
          totalcost: number | null
          totalreturn: number | null
          updatedat: string
          userid: string | null
          username: string | null
        }
        Insert: {
          company_id?: string | null
          createdat?: string
          enddate?: string | null
          hypothesisid?: string | null
          id?: string
          notes?: string | null
          notes_history?: Json | null
          observationcontent?: Json | null
          responsibleuserid?: string | null
          startdate?: string | null
          status?: string | null
          statusupdatedat?: string | null
          title?: string | null
          total_cost?: number | null
          total_revenue?: number | null
          totalcost?: number | null
          totalreturn?: number | null
          updatedat?: string
          userid?: string | null
          username?: string | null
        }
        Update: {
          company_id?: string | null
          createdat?: string
          enddate?: string | null
          hypothesisid?: string | null
          id?: string
          notes?: string | null
          notes_history?: Json | null
          observationcontent?: Json | null
          responsibleuserid?: string | null
          startdate?: string | null
          status?: string | null
          statusupdatedat?: string | null
          title?: string | null
          total_cost?: number | null
          total_revenue?: number | null
          totalcost?: number | null
          totalreturn?: number | null
          updatedat?: string
          userid?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_hypothesisid_fkey"
            columns: ["hypothesisid"]
            isOneToOne: false
            referencedRelation: "hypotheses"
            referencedColumns: ["id"]
          },
        ]
      }
      gtm_ad_campaigns: {
        Row: {
          actual_agency_cost: number | null
          actual_clicks: number | null
          actual_creative_cost: number | null
          actual_media_cost: number | null
          actual_paid_customers: number | null
          actual_revenue: number | null
          actual_signups: number | null
          agency_cost: number | null
          cac: number | null
          captured_revenue: number | null
          channel: string
          clicks: number | null
          company_id: string | null
          conversion_rate: number | null
          cost_per_signup: number | null
          cpc: number | null
          created_at: string | null
          creative_cost: number | null
          end_date: string | null
          id: string
          media_cost: number | null
          name: string
          notes: string | null
          paid_customers: number | null
          revenue_per_customer: number | null
          roas: number | null
          signup_to_customer_rate: number | null
          signups: number | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          target_cost_per_signup: number | null
          total_cost: number | null
          total_revenue: number | null
          transactions_per_customer: number | null
          user_id: string
        }
        Insert: {
          actual_agency_cost?: number | null
          actual_clicks?: number | null
          actual_creative_cost?: number | null
          actual_media_cost?: number | null
          actual_paid_customers?: number | null
          actual_revenue?: number | null
          actual_signups?: number | null
          agency_cost?: number | null
          cac?: number | null
          captured_revenue?: number | null
          channel: string
          clicks?: number | null
          company_id?: string | null
          conversion_rate?: number | null
          cost_per_signup?: number | null
          cpc?: number | null
          created_at?: string | null
          creative_cost?: number | null
          end_date?: string | null
          id?: string
          media_cost?: number | null
          name: string
          notes?: string | null
          paid_customers?: number | null
          revenue_per_customer?: number | null
          roas?: number | null
          signup_to_customer_rate?: number | null
          signups?: number | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          target_cost_per_signup?: number | null
          total_cost?: number | null
          total_revenue?: number | null
          transactions_per_customer?: number | null
          user_id: string
        }
        Update: {
          actual_agency_cost?: number | null
          actual_clicks?: number | null
          actual_creative_cost?: number | null
          actual_media_cost?: number | null
          actual_paid_customers?: number | null
          actual_revenue?: number | null
          actual_signups?: number | null
          agency_cost?: number | null
          cac?: number | null
          captured_revenue?: number | null
          channel?: string
          clicks?: number | null
          company_id?: string | null
          conversion_rate?: number | null
          cost_per_signup?: number | null
          cpc?: number | null
          created_at?: string | null
          creative_cost?: number | null
          end_date?: string | null
          id?: string
          media_cost?: number | null
          name?: string
          notes?: string | null
          paid_customers?: number | null
          revenue_per_customer?: number | null
          roas?: number | null
          signup_to_customer_rate?: number | null
          signups?: number | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          target_cost_per_signup?: number | null
          total_cost?: number | null
          total_revenue?: number | null
          transactions_per_customer?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gtm_ad_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      gtm_outreach_campaigns: {
        Row: {
          actual_cost: number | null
          actual_deals: number | null
          actual_emails_sent: number | null
          actual_meetings_booked: number | null
          actual_opportunities: number | null
          actual_revenue: number | null
          campaign_duration: number | null
          closing_rate: number | null
          company_id: string | null
          contacts_per_company: number | null
          created_at: string | null
          customers: number | null
          email_agency_cost: number | null
          email_enabled: boolean | null
          email_internal_cost: number | null
          email_tech_cost: number | null
          emails_per_contact: number | null
          end_date: string | null
          follow_up_interval: number | null
          id: string
          linkedin_agency_cost: number | null
          linkedin_enabled: boolean | null
          linkedin_internal_cost: number | null
          linkedin_tech_cost: number | null
          meeting_rate: number | null
          name: string
          notes: string | null
          opportunity_conversion_rate: number | null
          revenue: number | null
          revenue_per_customer: number | null
          roi: number | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          targeted_companies: number | null
          total_contacts: number | null
          total_cost: number | null
          user_id: string
        }
        Insert: {
          actual_cost?: number | null
          actual_deals?: number | null
          actual_emails_sent?: number | null
          actual_meetings_booked?: number | null
          actual_opportunities?: number | null
          actual_revenue?: number | null
          campaign_duration?: number | null
          closing_rate?: number | null
          company_id?: string | null
          contacts_per_company?: number | null
          created_at?: string | null
          customers?: number | null
          email_agency_cost?: number | null
          email_enabled?: boolean | null
          email_internal_cost?: number | null
          email_tech_cost?: number | null
          emails_per_contact?: number | null
          end_date?: string | null
          follow_up_interval?: number | null
          id?: string
          linkedin_agency_cost?: number | null
          linkedin_enabled?: boolean | null
          linkedin_internal_cost?: number | null
          linkedin_tech_cost?: number | null
          meeting_rate?: number | null
          name: string
          notes?: string | null
          opportunity_conversion_rate?: number | null
          revenue?: number | null
          revenue_per_customer?: number | null
          roi?: number | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          targeted_companies?: number | null
          total_contacts?: number | null
          total_cost?: number | null
          user_id: string
        }
        Update: {
          actual_cost?: number | null
          actual_deals?: number | null
          actual_emails_sent?: number | null
          actual_meetings_booked?: number | null
          actual_opportunities?: number | null
          actual_revenue?: number | null
          campaign_duration?: number | null
          closing_rate?: number | null
          company_id?: string | null
          contacts_per_company?: number | null
          created_at?: string | null
          customers?: number | null
          email_agency_cost?: number | null
          email_enabled?: boolean | null
          email_internal_cost?: number | null
          email_tech_cost?: number | null
          emails_per_contact?: number | null
          end_date?: string | null
          follow_up_interval?: number | null
          id?: string
          linkedin_agency_cost?: number | null
          linkedin_enabled?: boolean | null
          linkedin_internal_cost?: number | null
          linkedin_tech_cost?: number | null
          meeting_rate?: number | null
          name?: string
          notes?: string | null
          opportunity_conversion_rate?: number | null
          revenue?: number | null
          revenue_per_customer?: number | null
          roi?: number | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          targeted_companies?: number | null
          total_contacts?: number | null
          total_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gtm_outreach_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hypotheses: {
        Row: {
          company_id: string | null
          createdat: string
          id: string
          ideaid: string | null
          initiative: string | null
          metric: string | null
          observation: string | null
          observationcontent: Json | null
          pectiscore: Json | null
          responsibleuserid: string | null
          status: string | null
          userid: string | null
          username: string | null
        }
        Insert: {
          company_id?: string | null
          createdat?: string
          id?: string
          ideaid?: string | null
          initiative?: string | null
          metric?: string | null
          observation?: string | null
          observationcontent?: Json | null
          pectiscore?: Json | null
          responsibleuserid?: string | null
          status?: string | null
          userid?: string | null
          username?: string | null
        }
        Update: {
          company_id?: string | null
          createdat?: string
          id?: string
          ideaid?: string | null
          initiative?: string | null
          metric?: string | null
          observation?: string | null
          observationcontent?: Json | null
          pectiscore?: Json | null
          responsibleuserid?: string | null
          status?: string | null
          userid?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hypotheses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hypotheses_ideaid_fkey"
            columns: ["ideaid"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          category: string | null
          company_id: string | null
          createdat: string
          departmentid: string | null
          description: string | null
          id: string
          is_public: boolean | null
          responsibleuserid: string | null
          tags: string[] | null
          title: string
          userid: string
          username: string | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          createdat?: string
          departmentid?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          responsibleuserid?: string | null
          tags?: string[] | null
          title: string
          userid: string
          username?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          createdat?: string
          departmentid?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          responsibleuserid?: string | null
          tags?: string[] | null
          title?: string
          userid?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_log: {
        Row: {
          company_id: string
          completed_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          integration_id: string
          records_created: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          integration_id: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          integration_id?: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_log_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "company_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_department_permissions: {
        Row: {
          created_at: string
          department_id: string
          id: string
          member_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          member_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_department_permissions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_department_permissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "company_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_personal: boolean
          name: string
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_personal?: boolean
          name: string
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_personal?: boolean
          name?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      reporting_categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reporting_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporting_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "reporting_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reporting_metric_values: {
        Row: {
          created_at: string
          id: string
          is_manual_override: boolean
          metric_id: string
          period_date: string
          updated_at: string
          updated_by: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_manual_override?: boolean
          metric_id: string
          period_date: string
          updated_at?: string
          updated_by?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_manual_override?: boolean
          metric_id?: string
          period_date?: string
          updated_at?: string
          updated_by?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reporting_metric_values_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "reporting_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      reporting_metrics: {
        Row: {
          calculation_formula: string | null
          category_id: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          integration_field: string | null
          integration_type: string | null
          is_calculated: boolean
          name: string
          sort_order: number
          source: string | null
          updated_at: string
          visible_in_categories: string[] | null
        }
        Insert: {
          calculation_formula?: string | null
          category_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          integration_field?: string | null
          integration_type?: string | null
          is_calculated?: boolean
          name: string
          sort_order?: number
          source?: string | null
          updated_at?: string
          visible_in_categories?: string[] | null
        }
        Update: {
          calculation_formula?: string | null
          category_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          integration_field?: string | null
          integration_type?: string | null
          is_calculated?: boolean
          name?: string
          sort_order?: number
          source?: string | null
          updated_at?: string
          visible_in_categories?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "reporting_metrics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "reporting_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporting_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_charts: {
        Row: {
          chart_type: string
          company_id: string
          created_at: string
          created_by: string | null
          custom_end_date: string | null
          custom_start_date: string | null
          date_range_preset: string | null
          granularity: string
          id: string
          metric_ids: string[]
          name: string
          updated_at: string
        }
        Insert: {
          chart_type?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          custom_end_date?: string | null
          custom_start_date?: string | null
          date_range_preset?: string | null
          granularity?: string
          id?: string
          metric_ids: string[]
          name: string
          updated_at?: string
        }
        Update: {
          chart_type?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          custom_end_date?: string | null
          custom_start_date?: string | null
          date_range_preset?: string | null
          granularity?: string
          id?: string
          metric_ids?: string[]
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_charts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_users: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          department: string | null
          id: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          role: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_company_invitation: {
        Args: { accepting_user_id: string; invitation_id_param: string }
        Returns: Json
      }
      can_add_company_member: {
        Args: { company_id: string; user_id: string }
        Returns: boolean
      }
      delete_company_cascade: {
        Args: { company_id_param: string }
        Returns: undefined
      }
      fix_orphaned_invitation: {
        Args: { invitation_id_param: string }
        Returns: Json
      }
      get_all_experiments_for_super_admin: {
        Args: never
        Returns: {
          company_id: string
          company_name: string
          createdat: string
          enddate: string
          hypothesis_observation: string
          hypothesisid: string
          id: string
          idea_title: string
          notes: string
          notes_history: Json
          observationcontent: Json
          startdate: string
          status: string
          updatedat: string
          userid: string
          username: string
        }[]
      }
      get_all_hypotheses_for_super_admin: {
        Args: never
        Returns: {
          company_id: string
          company_name: string
          createdat: string
          id: string
          idea_description: string
          idea_title: string
          ideaid: string
          initiative: string
          metric: string
          observation: string
          observationcontent: Json
          pectiscore: Json
          responsibleuserid: string
          status: string
          userid: string
          username: string
        }[]
      }
      get_all_ideas_for_super_admin: {
        Args: never
        Returns: {
          category: string
          company_id: string
          company_name: string
          createdat: string
          department_name: string
          departmentid: string
          description: string
          id: string
          is_public: boolean
          tags: string[]
          title: string
          userid: string
          username: string
        }[]
      }
      get_companies_with_owners_for_super_admin: {
        Args: never
        Returns: {
          created_at: string
          created_by: string
          id: string
          member_count: number
          name: string
          owner_email: string
          owner_name: string
        }[]
      }
      get_current_user_email: { Args: never; Returns: string }
      get_orphaned_invitations: {
        Args: never
        Returns: {
          company_id: string
          company_name: string
          created_at: string
          email: string
          invitation_id: string
          role: string
          user_id: string
          user_name: string
        }[]
      }
      get_user_company_role: {
        Args: { company_id: string; user_id: string }
        Returns: string
      }
      has_company_invitation: {
        Args: { company_id: string; user_email: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member_of_same_company: {
        Args: { company_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { user_id?: string }; Returns: boolean }
      user_has_company_access: {
        Args: { company_id: string; user_id: string }
        Returns: boolean
      }
      user_has_company_admin_role: {
        Args: { company_id: string; user_id: string }
        Returns: boolean
      }
      user_has_department_access: {
        Args: { department_id: string; user_id: string }
        Returns: boolean
      }
      user_is_company_member: {
        Args: { company_id: string; user_id: string }
        Returns: boolean
      }
      user_is_team_admin_or_owner: {
        Args: { team_id_param: string }
        Returns: boolean
      }
      user_is_team_member: { Args: { team_id_param: string }; Returns: boolean }
      user_is_team_owner: { Args: { team_id_param: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "member"
      super_admin_role: "super_admin"
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
      app_role: ["admin", "manager", "member"],
      super_admin_role: ["super_admin"],
    },
  },
} as const
