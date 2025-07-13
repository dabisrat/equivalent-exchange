export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      organization: {
        Row: {
          created_at: string
          email: string | null
          id: string
          max_points: number
          organization_name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          max_points: number
          organization_name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          max_points?: number
          organization_name?: string | null
        }
        Relationships: []
      }
      reward_card: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string
          points?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_card_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      stamp: {
        Row: {
          created_at: string
          reward_card_id: string
          stamp_index: number
          stamped: boolean | null
          stamper_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          reward_card_id: string
          stamp_index?: number
          stamped?: boolean | null
          stamper_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          reward_card_id?: string
          stamp_index?: number
          stamped?: boolean | null
          stamper_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stamp_reward_card_id_fkey"
            columns: ["reward_card_id"]
            isOneToOne: false
            referencedRelation: "reward_card"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          email: string | null
          name: string | null
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          is_active: boolean
          invited_at: string | null
          invited_by: string | null
          last_active_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          name?: string | null
          organization_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          is_active?: boolean
          invited_at?: string | null
          invited_by?: string | null
          last_active_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          name?: string | null
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          is_active?: boolean
          invited_at?: string | null
          invited_by?: string | null
          last_active_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // Keep old interface for backward compatibility during migration
      stamper: {
        Row: {
          created_at: string
          email: string | null
          name: string | null
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          is_active: boolean
          invited_at: string | null
          invited_by: string | null
          last_active_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          name?: string | null
          organization_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          is_active?: boolean
          invited_at?: string | null
          invited_by?: string | null
          last_active_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          name?: string | null
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          is_active?: boolean
          invited_at?: string | null
          invited_by?: string | null
          last_active_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_stamper_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrementpoints: {
        Args: {
          card_id: string
        }
        Returns: number
      }
      incrementpoints: {
        Args: {
          card_id: string
        }
        Returns: number
      }
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

