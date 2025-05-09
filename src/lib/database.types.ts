export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      logs: {
        Row: {
          id: string
          level: string
          message: string
          module: string
          data: Json | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          level: string
          message: string
          module: string
          data?: Json | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          level?: string
          message?: string
          module?: string
          data?: Json | null
          user_id?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          telegram_id: string | null
          username: string | null
          first_name: string | null
          last_name: string | null
          photo_url: string | null
          auth_date: number | null
          preferences: Json | null
          created_at: string | null
          updated_at: string | null
          last_login: string | null
        }
        Insert: {
          id?: string
          telegram_id?: string | null
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          photo_url?: string | null
          auth_date?: number | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
        }
        Update: {
          id?: string
          telegram_id?: string | null
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          photo_url?: string | null
          auth_date?: number | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          notification_enabled: boolean
          theme: string
          last_updated: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_enabled?: boolean
          theme?: string
          last_updated?: string
        }
        Update: {
          id?: string
          user_id?: string
          notification_enabled?: boolean
          theme?: string
          last_updated?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_telegram_user: {
        Args: {
          p_id: string
          p_telegram_id: string
          p_first_name: string
          p_last_name: string
          p_username: string
          p_photo_url: string
        }
        Returns: {
          id: string
          telegram_id: string
          first_name: string
          last_name: string
          username: string
          photo_url: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 