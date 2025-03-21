export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budget_goal_history: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          month: number
          start_date: string
          user_id: string
          year: number
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          month: number
          start_date: string
          user_id: string
          year: number
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          month?: number
          start_date?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      budget_goals: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          month: number
          user_id: string
          year: number
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          month: number
          user_id: string
          year: number
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          month?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          icon: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          date: string
          description: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          date: string
          description: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          gender: string | null
          id: string
          name: string | null
          onboarding_completed: boolean | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          gender?: string | null
          id: string
          name?: string | null
          onboarding_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          gender?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
          updated_at?: string
        }
        Relationships: []
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
