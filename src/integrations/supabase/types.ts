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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      loan_applications: {
        Row: {
          amount: number
          applicant_address: string | null
          applicant_phone: string | null
          approved_at: string | null
          approved_by: string | null
          bank_statement_url: string | null
          created_at: string
          credit_score: number | null
          date_of_birth: string | null
          dependents: number | null
          documents_uploaded: boolean | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employer_name: string | null
          employment_duration: string | null
          employment_status: string
          existing_loans_amount: number | null
          first_name: string | null
          gender: string | null
          id: string
          id_document_back_url: string | null
          id_document_front_url: string | null
          interest_rate: number
          last_name: string | null
          marital_status: string | null
          monthly_income: number
          monthly_payment: number
          processing_fee: number
          proof_of_income_url: string | null
          purpose: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["loan_status"]
          tenure_days: number
          total_payment: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          applicant_address?: string | null
          applicant_phone?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_statement_url?: string | null
          created_at?: string
          credit_score?: number | null
          date_of_birth?: string | null
          dependents?: number | null
          documents_uploaded?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employer_name?: string | null
          employment_duration?: string | null
          employment_status: string
          existing_loans_amount?: number | null
          first_name?: string | null
          gender?: string | null
          id?: string
          id_document_back_url?: string | null
          id_document_front_url?: string | null
          interest_rate: number
          last_name?: string | null
          marital_status?: string | null
          monthly_income: number
          monthly_payment: number
          processing_fee?: number
          proof_of_income_url?: string | null
          purpose: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          tenure_days: number
          total_payment: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          applicant_address?: string | null
          applicant_phone?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_statement_url?: string | null
          created_at?: string
          credit_score?: number | null
          date_of_birth?: string | null
          dependents?: number | null
          documents_uploaded?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employer_name?: string | null
          employment_duration?: string | null
          employment_status?: string
          existing_loans_amount?: number | null
          first_name?: string | null
          gender?: string | null
          id?: string
          id_document_back_url?: string | null
          id_document_front_url?: string | null
          interest_rate?: number
          last_name?: string | null
          marital_status?: string | null
          monthly_income?: number
          monthly_payment?: number
          processing_fee?: number
          proof_of_income_url?: string | null
          purpose?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          tenure_days?: number
          total_payment?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loan_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          max_amount: number
          max_interest_rate: number
          max_tenure_days: number
          min_amount: number
          min_interest_rate: number
          min_tenure_days: number
          processing_fee_percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_amount?: number
          max_interest_rate?: number
          max_tenure_days?: number
          min_amount?: number
          min_interest_rate?: number
          min_tenure_days?: number
          processing_fee_percentage?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_amount?: number
          max_interest_rate?: number
          max_tenure_days?: number
          min_amount?: number
          min_interest_rate?: number
          min_tenure_days?: number
          processing_fee_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean | null
          created_at: string
          email_verified: boolean | null
          full_name: string
          id: string
          is_admin: boolean | null
          referral_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean | null
          created_at?: string
          email_verified?: boolean | null
          full_name: string
          id?: string
          is_admin?: boolean | null
          referral_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean | null
          created_at?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          is_admin?: boolean | null
          referral_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          email: string | null
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_amount: number | null
          reward_paid: boolean | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_amount?: number | null
          reward_paid?: boolean | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_amount?: number | null
          reward_paid?: boolean | null
          status?: string
        }
        Relationships: []
      }
      system_maintenance: {
        Row: {
          created_at: string | null
          enabled_at: string | null
          enabled_by: string | null
          id: string
          is_enabled: boolean | null
          message: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          is_enabled?: boolean | null
          message?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          is_enabled?: boolean | null
          message?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachments: string[] | null
          created_at: string
          id: string
          is_internal: boolean | null
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          attachments: string[] | null
          category: string
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          category: string
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      system_access: {
        Row: {
          access_status: string | null
          maintenance_message: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_admin_role: {
        Args: { _user_id: string }
        Returns: undefined
      }
      can_user_access_system: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      check_maintenance_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_users_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          email_confirmed_at: string
          created_at: string
          last_sign_in_at: string
          phone: string
          full_name: string
          banned: boolean
          avatar_url: string
          role: Database["public"]["Enums"]["app_role"]
          email_verified: boolean
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_maintenance_mode_enabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_banned: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          _action: string
          _resource_type: string
          _resource_id?: string
          _details?: Json
        }
        Returns: undefined
      }
      send_notification_to_all_admins: {
        Args: {
          _title: string
          _message: string
          _type?: Database["public"]["Enums"]["notification_type"]
        }
        Returns: undefined
      }
      send_notification_to_all_users: {
        Args: {
          _title: string
          _message: string
          _type?: Database["public"]["Enums"]["notification_type"]
        }
        Returns: undefined
      }
      send_notification_to_user: {
        Args: {
          _user_id: string
          _title: string
          _message: string
          _type?: Database["public"]["Enums"]["notification_type"]
          _action_url?: string
          _metadata?: Json
        }
        Returns: string
      }
      toggle_maintenance_mode: {
        Args: { enable_maintenance: boolean; maintenance_message?: string }
        Returns: boolean
      }
      toggle_user_ban: {
        Args: { target_user_id: string; ban_status: boolean }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin" | "superadmin"
      loan_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "disbursed"
        | "completed"
      notification_type: "info" | "success" | "warning" | "error"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: ["user", "admin", "superadmin"],
      loan_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "disbursed",
        "completed",
      ],
      notification_type: ["info", "success", "warning", "error"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
