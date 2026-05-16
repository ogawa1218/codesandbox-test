export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          image_path: string | null
          store_id: string
          title: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          image_path?: string | null
          store_id: string
          title: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          image_path?: string | null
          store_id?: string
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: number
          store_id: string | null
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: number
          store_id?: string | null
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: number
          store_id?: string | null
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      daily_budgets: {
        Row: {
          amount: number
          business_date: string
          store_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          business_date: string
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          business_date?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_kpi_snapshots: {
        Row: {
          business_date: string
          generated_at: string
          labor_cost: number
          labor_ratio: number
          sales_actual: number
          sales_budget: number
          store_id: string
        }
        Insert: {
          business_date: string
          generated_at?: string
          labor_cost?: number
          labor_ratio?: number
          sales_actual?: number
          sales_budget?: number
          store_id: string
        }
        Update: {
          business_date?: string
          generated_at?: string
          labor_cost?: number
          labor_ratio?: number
          sales_actual?: number
          sales_budget?: number
          store_id?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          date: string
          id: string
          name: string
          store_id: string | null
        }
        Insert: {
          date: string
          id?: string
          name: string
          store_id?: string | null
        }
        Update: {
          date?: string
          id?: string
          name?: string
          store_id?: string | null
        }
        Relationships: []
      }
      hourly_forecasts: {
        Row: {
          actual_amount: number
          business_date: string
          hour: number
          id: string
          predicted_amount: number
          store_id: string
          updated_at: string
        }
        Insert: {
          actual_amount?: number
          business_date: string
          hour: number
          id?: string
          predicted_amount?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          actual_amount?: number
          business_date?: string
          hour?: number
          id?: string
          predicted_amount?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          consumed_at: string | null
          created_at: string
          email: string | null
          expires_at: string
          full_name: string
          hourly_wage: number | null
          id: string
          invited_by: string | null
          license: Database["public"]["Enums"]["staff_license"]
          role: Database["public"]["Enums"]["user_role"]
          store_id: string
          token: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          email?: string | null
          expires_at: string
          full_name: string
          hourly_wage?: number | null
          id?: string
          invited_by?: string | null
          license?: Database["public"]["Enums"]["staff_license"]
          role?: Database["public"]["Enums"]["user_role"]
          store_id: string
          token: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          full_name?: string
          hourly_wage?: number | null
          id?: string
          invited_by?: string | null
          license?: Database["public"]["Enums"]["staff_license"]
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string
          token?: string
        }
        Relationships: []
      }
      manuals: {
        Row: {
          created_at: string
          id: string
          pdf_path: string
          store_id: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          pdf_path: string
          store_id: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          pdf_path?: string
          store_id?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      notification_outbox: {
        Row: {
          channel: string
          created_at: string
          id: string
          payload: Json
          sent_at: string | null
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          payload: Json
          sent_at?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          payload?: Json
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          archived: boolean
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
          store_id: string
        }
        Insert: {
          archived?: boolean
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          store_id: string
        }
        Update: {
          archived?: boolean
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          store_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          full_name: string
          hourly_wage: number | null
          id: string
          license: Database["public"]["Enums"]["staff_license"]
          line_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          store_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          full_name: string
          hourly_wage?: number | null
          id: string
          license?: Database["public"]["Enums"]["staff_license"]
          line_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          full_name?: string
          hourly_wage?: number | null
          id?: string
          license?: Database["public"]["Enums"]["staff_license"]
          line_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_actuals: {
        Row: {
          amount: number
          amount_cosmetics: number
          amount_dispensing: number
          amount_food: number
          amount_otc: number
          business_date: string
          id: string
          rx_count: number
          store_id: string
          tax_included: boolean
          tax_rate: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount?: number
          amount_cosmetics?: number
          amount_dispensing?: number
          amount_food?: number
          amount_otc?: number
          business_date: string
          id?: string
          rx_count?: number
          store_id: string
          tax_included?: boolean
          tax_rate?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          amount_cosmetics?: number
          amount_dispensing?: number
          amount_food?: number
          amount_otc?: number
          business_date?: string
          id?: string
          rx_count?: number
          store_id?: string
          tax_included?: boolean
          tax_rate?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sales_forecasts: {
        Row: {
          budget_amount: number
          business_date: string
          id: string
          note: string | null
          predicted_amount: number
          store_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          budget_amount?: number
          business_date: string
          id?: string
          note?: string | null
          predicted_amount?: number
          store_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          budget_amount?: number
          business_date?: string
          id?: string
          note?: string | null
          predicted_amount?: number
          store_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      shift_actuals: {
        Row: {
          break_minutes: number
          clock_in_at: string | null
          clock_out_at: string | null
          created_at: string
          id: string
          shift_id: string
          store_id: string
        }
        Insert: {
          break_minutes?: number
          clock_in_at?: string | null
          clock_out_at?: string | null
          created_at?: string
          id?: string
          shift_id: string
          store_id: string
        }
        Update: {
          break_minutes?: number
          clock_in_at?: string | null
          clock_out_at?: string | null
          created_at?: string
          id?: string
          shift_id?: string
          store_id?: string
        }
        Relationships: []
      }
      shift_revisions: {
        Row: {
          changed_at: string
          changed_by: string | null
          diff: Json
          id: string
          shift_id: string
          store_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          diff: Json
          id?: string
          shift_id: string
          store_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          diff?: Json
          id?: string
          shift_id?: string
          store_id?: string
        }
        Relationships: []
      }
      shift_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          store_id?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          business_date: string
          client_request_id: string
          created_at: string
          created_by: string | null
          employee_id: string
          ends_at: string
          id: string
          note: string | null
          position_id: string
          starts_at: string
          status: Database["public"]["Enums"]["shift_status"]
          store_id: string
          updated_at: string
        }
        Insert: {
          business_date: string
          client_request_id: string
          created_at?: string
          created_by?: string | null
          employee_id: string
          ends_at: string
          id?: string
          note?: string | null
          position_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["shift_status"]
          store_id: string
          updated_at?: string
        }
        Update: {
          business_date?: string
          client_request_id?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string
          ends_at?: string
          id?: string
          note?: string | null
          position_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["shift_status"]
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          business_close_at: string
          business_open_at: string
          created_at: string
          id: string
          name: string
          timezone: string
        }
        Insert: {
          business_close_at?: string
          business_open_at?: string
          created_at?: string
          id?: string
          name: string
          timezone?: string
        }
        Update: {
          business_close_at?: string
          business_open_at?: string
          created_at?: string
          id?: string
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      template_slots: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          position_id: string
          required_count: number
          start_time: string
          store_id: string
          template_id: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          position_id: string
          required_count?: number
          start_time: string
          store_id: string
          template_id: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          position_id?: string
          required_count?: number
          start_time?: string
          store_id?: string
          template_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          full_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          store_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          store_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          store_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      jwt_role: { Args: never; Returns: string }
      jwt_store_id: { Args: never; Returns: string }
      kpi_monthly: {
        Args: { p_month: string; p_store: string }
        Returns: {
          labor_cost: number
          labor_ratio: number
          otc_sales: number
          rx_count: number
          rx_ratio: number
          rx_sales: number
          rx_unit_price: number
          sales_actual: number
          sales_budget: number
        }[]
      }
      net_amount: {
        Args: { amount: number; included: boolean; rate: number }
        Returns: number
      }
    }
    Enums: {
      shift_status: "draft" | "confirmed" | "canceled"
      staff_license: "pharmacist" | "registered_seller" | "none"
      user_role: "manager" | "employee"
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

export const Constants = {
  public: {
    Enums: {
      shift_status: ["draft", "confirmed", "canceled"],
      user_role: ["manager", "employee"],
    },
  },
} as const
