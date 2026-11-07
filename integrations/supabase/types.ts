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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      chart_entries: {
        Row: {
          adjustment: string | null
          asset: string | null
          attention_zones: string | null
          concept: string | null
          conclusion: string | null
          created_at: string
          day_high_low: string | null
          entry_date: string
          hypothesis: string | null
          id: string
          image_path: string | null
          lesson_id: string | null
          macro_context: string | null
          market_context: string | null
          module_id: string | null
          observation: string | null
          outcome: string | null
          poc: string | null
          risk_regime: string | null
          support_resistance: string | null
          tags: string[]
          timeframe: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adjustment?: string | null
          asset?: string | null
          attention_zones?: string | null
          concept?: string | null
          conclusion?: string | null
          created_at?: string
          day_high_low?: string | null
          entry_date?: string
          hypothesis?: string | null
          id?: string
          image_path?: string | null
          lesson_id?: string | null
          macro_context?: string | null
          market_context?: string | null
          module_id?: string | null
          observation?: string | null
          outcome?: string | null
          poc?: string | null
          risk_regime?: string | null
          support_resistance?: string | null
          tags?: string[]
          timeframe?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          adjustment?: string | null
          asset?: string | null
          attention_zones?: string | null
          concept?: string | null
          conclusion?: string | null
          created_at?: string
          day_high_low?: string | null
          entry_date?: string
          hypothesis?: string | null
          id?: string
          image_path?: string | null
          lesson_id?: string | null
          macro_context?: string | null
          market_context?: string | null
          module_id?: string | null
          observation?: string | null
          outcome?: string | null
          poc?: string | null
          risk_regime?: string | null
          support_resistance?: string | null
          tags?: string[]
          timeframe?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_entries_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_entries_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      doubts: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          lesson_id: string | null
          question: string
          resolved_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          question: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          question?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          created_at: string
          doubts_text: string
          free_notes: string
          id: string
          important: boolean
          lesson_id: string
          practical: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doubts_text?: string
          free_notes?: string
          id?: string
          important?: boolean
          lesson_id: string
          practical?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          doubts_text?: string
          free_notes?: string
          id?: string
          important?: boolean
          lesson_id?: string
          practical?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          last_accessed_at: string | null
          last_reviewed_at: string | null
          module_id: string
          needs_review: boolean
          next_review_at: string | null
          position: number
          quick_notes: string | null
          review_note: string | null
          review_status: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          last_accessed_at?: string | null
          last_reviewed_at?: string | null
          module_id: string
          needs_review?: boolean
          next_review_at?: string | null
          position?: number
          quick_notes?: string | null
          review_note?: string | null
          review_status?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
          youtube_url?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          last_accessed_at?: string | null
          last_reviewed_at?: string | null
          module_id?: string
          needs_review?: boolean
          next_review_at?: string | null
          position?: number
          quick_notes?: string | null
          review_note?: string | null
          review_status?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          position: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_logs: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          note: string | null
          reviewed_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          note?: string | null
          reviewed_at?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          note?: string | null
          reviewed_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_logs_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
