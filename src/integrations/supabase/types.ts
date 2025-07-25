export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          id: string
          restrict_content_to_departments: boolean
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          restrict_content_to_departments?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
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
      can_add_company_member: {
        Args: { user_id: string; company_id: string }
        Returns: boolean
      }
      delete_company_cascade: {
        Args: { company_id_param: string }
        Returns: undefined
      }
      get_all_experiments_for_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          hypothesisid: string
          startdate: string
          enddate: string
          status: string
          notes: string
          notes_history: Json
          observationcontent: Json
          createdat: string
          updatedat: string
          userid: string
          username: string
          company_id: string
          company_name: string
          hypothesis_observation: string
          idea_title: string
        }[]
      }
      get_all_hypotheses_for_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
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
          company_id: string
          createdat: string
          company_name: string
          idea_title: string
          idea_description: string
        }[]
      }
      get_all_ideas_for_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          description: string
          category: string
          departmentid: string
          createdat: string
          userid: string
          username: string
          tags: string[]
          company_id: string
          is_public: boolean
          company_name: string
          department_name: string
        }[]
      }
      get_companies_with_owners_for_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          created_at: string
          created_by: string
          member_count: number
          owner_name: string
          owner_email: string
        }[]
      }
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_company_role: {
        Args: { user_id: string; company_id: string }
        Returns: string
      }
      has_company_invitation: {
        Args: { user_email: string; company_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_member_of_same_company: {
        Args: { company_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      user_has_company_access: {
        Args: { user_id: string; company_id: string }
        Returns: boolean
      }
      user_has_company_admin_role: {
        Args: { user_id: string; company_id: string }
        Returns: boolean
      }
      user_has_department_access: {
        Args: { user_id: string; department_id: string }
        Returns: boolean
      }
      user_is_company_member: {
        Args: { user_id: string; company_id: string }
        Returns: boolean
      }
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
