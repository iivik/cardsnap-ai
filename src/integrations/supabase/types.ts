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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          address: string | null
          card_image_url: string | null
          category: Database["public"]["Enums"]["contact_category_type"] | null
          company: string
          created_at: string
          email: string
          gps_latitude: number | null
          gps_longitude: number | null
          handwritten_notes: string | null
          id: string
          location_city: string | null
          location_country: string | null
          meeting_context:
            | Database["public"]["Enums"]["meeting_context_type"]
            | null
          meeting_context_other: string | null
          name: string
          phone: string | null
          synced_to_google: boolean | null
          synced_to_hubspot: boolean | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          card_image_url?: string | null
          category?: Database["public"]["Enums"]["contact_category_type"] | null
          company: string
          created_at?: string
          email: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          handwritten_notes?: string | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          meeting_context?:
            | Database["public"]["Enums"]["meeting_context_type"]
            | null
          meeting_context_other?: string | null
          name: string
          phone?: string | null
          synced_to_google?: boolean | null
          synced_to_hubspot?: boolean | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          card_image_url?: string | null
          category?: Database["public"]["Enums"]["contact_category_type"] | null
          company?: string
          created_at?: string
          email?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          handwritten_notes?: string | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          meeting_context?:
            | Database["public"]["Enums"]["meeting_context_type"]
            | null
          meeting_context_other?: string | null
          name?: string
          phone?: string | null
          synced_to_google?: boolean | null
          synced_to_hubspot?: boolean | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          promo_code_used: string | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          scan_credits: number
          subscription_currency: string
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          total_scans_used: number
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          promo_code_used?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          scan_credits?: number
          subscription_currency?: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          total_scans_used?: number
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          promo_code_used?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          scan_credits?: number
          subscription_currency?: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          total_scans_used?: number
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          free_scans_bonus: number
          id: string
          is_active: boolean
          max_uses: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          free_scans_bonus?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          free_scans_bonus?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      user_categories: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          is_hidden: boolean
          is_system: boolean
          label: string
          sort_order: number
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_hidden?: boolean
          is_system?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_hidden?: boolean
          is_system?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      user_meeting_contexts: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          is_hidden: boolean
          is_system: boolean
          label: string
          sort_order: number
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_hidden?: boolean
          is_system?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_hidden?: boolean
          is_system?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
          value?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_promo_code: {
        Args: { code_to_check: string }
        Returns: {
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          free_scans_bonus: number
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      contact_category_type:
        | "client"
        | "prospect_client"
        | "prospect_partner"
        | "partner"
        | "influencer"
        | "random"
      discount_type: "free_month" | "percentage_off" | "free_scans"
      meeting_context_type:
        | "office_my"
        | "office_client"
        | "office_partner"
        | "event"
        | "other"
      subscription_status:
        | "none"
        | "trialing"
        | "active"
        | "canceled"
        | "expired"
      subscription_tier: "free" | "pro" | "business"
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
      app_role: ["admin", "user"],
      contact_category_type: [
        "client",
        "prospect_client",
        "prospect_partner",
        "partner",
        "influencer",
        "random",
      ],
      discount_type: ["free_month", "percentage_off", "free_scans"],
      meeting_context_type: [
        "office_my",
        "office_client",
        "office_partner",
        "event",
        "other",
      ],
      subscription_status: [
        "none",
        "trialing",
        "active",
        "canceled",
        "expired",
      ],
      subscription_tier: ["free", "pro", "business"],
    },
  },
} as const
