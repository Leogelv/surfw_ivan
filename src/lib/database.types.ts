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
      users: {
        Row: {
          id: string
          username: string | null
          telegram_id: string | null
          telegram_username: string | null
          avatar_url: string | null
          preferences: Json | null
          created_at: string | null
          updated_at: string | null
          first_name: string | null
          last_name: string | null
          last_login: string | null
          photo_url: string | null
          telegram_auth_date: string | null
          telegram_hash: string | null
        }
        Insert: {
          id: string
          username?: string | null
          telegram_id?: string | null
          telegram_username?: string | null
          avatar_url?: string | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
          first_name?: string | null
          last_name?: string | null
          last_login?: string | null
          photo_url?: string | null
          telegram_auth_date?: string | null
          telegram_hash?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          telegram_id?: string | null
          telegram_username?: string | null
          avatar_url?: string | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
          first_name?: string | null
          last_name?: string | null
          last_login?: string | null
          photo_url?: string | null
          telegram_auth_date?: string | null
          telegram_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      logs: {
        Row: {
          id: string
          level: string
          message: string
          module: string
          user_id: string | null
          data: Json | null
          created_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          level: string
          message: string
          module: string
          user_id?: string | null
          data?: Json | null
          created_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          level?: string
          message?: string
          module?: string
          user_id?: string | null
          data?: Json | null
          created_at?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      user_settings: {
        Row: {
          user_id: string
          notifications_enabled: boolean | null
          language: string | null
          theme: string | null
          auto_play: boolean | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          notifications_enabled?: boolean | null
          language?: string | null
          theme?: string | null
          auto_play?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          notifications_enabled?: boolean | null
          language?: string | null
          theme?: string | null
          auto_play?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      view_history: {
        Row: {
          id: string
          user_id: string | null
          content_id: string | null
          started_at: string | null
          ended_at: string | null
          duration: number | null
          completion_percentage: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          content_id?: string | null
          started_at?: string | null
          ended_at?: string | null
          duration?: number | null
          completion_percentage?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          content_id?: string | null
          started_at?: string | null
          ended_at?: string | null
          duration?: number | null
          completion_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "view_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "view_history_content_id_fkey"
            columns: ["content_id"]
            referencedRelation: "contents"
            referencedColumns: ["id"]
          }
        ]
      },
      quizlogic: {
        Row: {
          id: string
          type: string
          duration: string | null
          goal: string
          approach: string | null
          content_type: string
          content_url: string
          title: string
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          type: string
          duration?: string | null
          goal: string
          approach?: string | null
          content_type: string
          content_url: string
          title: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          duration?: string | null
          goal?: string
          approach?: string | null
          content_type?: string
          content_url?: string
          title?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    },
    Views: {},
    Functions: {
      telegram_auth_user: {
        Args: {
          auth_data: Json
          bot_token: string
        }
        Returns: Json
      },
      verify_telegram_auth: {
        Args: {
          auth_data: Json
          bot_token: string
        }
        Returns: boolean
      }
    },
    Enums: {}
  }
} 