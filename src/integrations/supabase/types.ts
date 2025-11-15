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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          analysis_text: string
          created_at: string
          id: string
          key_themes: string[] | null
          psychological_insights: string | null
          response_id: string
          sentiment: string | null
        }
        Insert: {
          analysis_text: string
          created_at?: string
          id?: string
          key_themes?: string[] | null
          psychological_insights?: string | null
          response_id: string
          sentiment?: string | null
        }
        Update: {
          analysis_text?: string
          created_at?: string
          id?: string
          key_themes?: string[] | null
          psychological_insights?: string | null
          response_id?: string
          sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "card_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      card_responses: {
        Row: {
          audio_url: string | null
          card_id: string
          created_at: string
          id: string
          response_text: string
          response_type: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          card_id: string
          created_at?: string
          id?: string
          response_text: string
          response_type: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          card_id?: string
          created_at?: string
          id?: string
          response_text?: string
          response_type?: string
          user_id?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          created_at: string
          current_card_index: number
          deck_ids: string[]
          host_id: string
          id: string
          mode: string
          session_code: string
          spice_level: string
          status: string
          subtypes: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_card_index?: number
          deck_ids: string[]
          host_id: string
          id?: string
          mode: string
          session_code: string
          spice_level: string
          status?: string
          subtypes: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_card_index?: number
          deck_ids?: string[]
          host_id?: string
          id?: string
          mode?: string
          session_code?: string
          spice_level?: string
          status?: string
          subtypes?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_cards: {
        Row: {
          card_id: string
          card_order: number
          created_at: string
          id: string
          session_id: string
        }
        Insert: {
          card_id: string
          card_order: number
          created_at?: string
          id?: string
          session_id: string
        }
        Update: {
          card_id?: string
          card_order?: number
          created_at?: string
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_cards_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_participants: {
        Row: {
          display_name: string | null
          id: string
          joined_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          id?: string
          joined_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          id?: string
          joined_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_responses: {
        Row: {
          card_id: string
          choice: string | null
          created_at: string
          id: string
          response_text: string | null
          response_type: string
          session_id: string
          user_id: string
        }
        Insert: {
          card_id: string
          choice?: string | null
          created_at?: string
          id?: string
          response_text?: string | null
          response_type: string
          session_id: string
          user_id: string
        }
        Update: {
          card_id?: string
          choice?: string | null
          created_at?: string
          id?: string
          response_text?: string | null
          response_type?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invite_code: string
          invited_email: string | null
          inviter_id: string
          status: string
          subscription_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          invite_code: string
          invited_email?: string | null
          inviter_id: string
          status?: string
          subscription_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invite_code?: string
          invited_email?: string | null
          inviter_id?: string
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invites_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          bundle_type: Database["public"]["Enums"]["bundle_type"]
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          linked_users: string[] | null
          owner_id: string
          plan_interval: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          bundle_type?: Database["public"]["Enums"]["bundle_type"]
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          linked_users?: string[] | null
          owner_id: string
          plan_interval: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          bundle_type?: Database["public"]["Enums"]["bundle_type"]
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          linked_users?: string[] | null
          owner_id?: string
          plan_interval?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_session_participant: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      bundle_type: "individual" | "couple"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
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
      bundle_type: ["individual", "couple"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
    },
  },
} as const
