// Hand-authored to match supabase/migrations/*.sql.
// Regenerate with `supabase gen types typescript` once you have a live
// project linked, then diff against this file.

export type ProfileRole = "admin" | "leader" | "member";
export type PositionStatus = "draft" | "invited" | "accepted" | "declined";
export type PlanItemType =
  | "header"
  | "note"
  | "item"
  | "song"
  | "bible"
  | "content"
  | "media";
export type ThreadScope = "role_group" | "role" | "service";
export type NotificationType =
  | "invite"
  | "accepted"
  | "declined"
  | "reminder"
  | "message"
  | "service_updated"
  | "service_cancelled"
  | "position_removed";
export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          timezone: string;
          join_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          timezone?: string;
          join_token?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          role: ProfileRole;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          name?: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: ProfileRole;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      org_invites: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          role: ProfileRole;
          token: string;
          invited_by: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          role?: ProfileRole;
          token?: string;
          invited_by: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["org_invites"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "org_invites_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      role_groups: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["role_groups"]["Insert"]>;
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          org_id: string;
          role_group_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          role_group_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "roles_role_group_id_fkey";
            columns: ["role_group_id"];
            isOneToOne: false;
            referencedRelation: "role_groups";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      service_series: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          campus: string | null;
          frequency: RecurrenceFrequency;
          day_of_week: number;
          time_of_day: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          campus?: string | null;
          frequency?: RecurrenceFrequency;
          day_of_week?: number;
          time_of_day?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_series"]["Insert"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          org_id: string;
          series_id: string | null;
          title: string;
          starts_at: string;
          campus: string | null;
          notes: string | null;
          share_token: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          series_id?: string | null;
          title: string;
          starts_at: string;
          campus?: string | null;
          notes?: string | null;
          share_token?: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "services_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "service_series";
            referencedColumns: ["id"];
          }
        ];
      };
      service_plan_items: {
        Row: {
          id: string;
          service_id: string;
          type: PlanItemType;
          title: string;
          description: string | null;
          duration_minutes: number;
          sort_order: number;
          assigned_user_id: string | null;
          song_id: string | null;
          song_key: string | null;
          bible_reference: string | null;
          bible_translation: string | null;
          bible_verses_override: Record<string, unknown>[] | null;
          content_text: string | null;
          projection_format: Record<string, unknown> | null;
          media_config: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          type?: PlanItemType;
          title?: string;
          description?: string | null;
          duration_minutes?: number;
          sort_order?: number;
          assigned_user_id?: string | null;
          song_id?: string | null;
          song_key?: string | null;
          bible_reference?: string | null;
          bible_translation?: string | null;
          bible_verses_override?: Record<string, unknown>[] | null;
          content_text?: string | null;
          projection_format?: Record<string, unknown> | null;
          media_config?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_plan_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "service_plan_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_plan_items_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          }
        ];
      };
      songs: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          artist: string | null;
          default_key: string | null;
          bpm: number | null;
          ccli_number: string | null;
          youtube_url: string | null;
          lyrics: string | null;
          projection_format: Record<string, unknown> | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          artist?: string | null;
          default_key?: string | null;
          bpm?: number | null;
          ccli_number?: string | null;
          youtube_url?: string | null;
          lyrics?: string | null;
          projection_format?: Record<string, unknown> | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["songs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "songs_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      bibles: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bibles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bibles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      bible_verses: {
        Row: {
          bible_id: string;
          book: number;
          chapter: number;
          verse: number;
          text: string;
        };
        Insert: {
          bible_id: string;
          book: number;
          chapter: number;
          verse: number;
          text: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["bible_verses"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "bible_verses_bible_id_fkey";
            columns: ["bible_id"];
            isOneToOne: false;
            referencedRelation: "bibles";
            referencedColumns: ["id"];
          }
        ];
      };
      projection_settings: {
        Row: {
          org_id: string;
          settings: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          org_id: string;
          settings?: Record<string, unknown>;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["projection_settings"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "projection_settings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      positions: {
        Row: {
          id: string;
          org_id: string;
          service_id: string;
          role_id: string;
          user_id: string | null;
          status: PositionStatus;
          invited_at: string | null;
          responded_at: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          service_id: string;
          role_id: string;
          user_id?: string | null;
          status?: PositionStatus;
          invited_at?: string | null;
          responded_at?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["positions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "positions_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "positions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "positions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      blockout_dates: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blockout_dates"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "blockout_dates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      message_threads: {
        Row: {
          id: string;
          org_id: string;
          scope_type: ThreadScope;
          scope_id: string;
          title: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          scope_type: ThreadScope;
          scope_id: string;
          title: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["message_threads"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          user_id: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "message_threads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      thread_reads: {
        Row: {
          thread_id: string;
          user_id: string;
          last_read_at: string;
        };
        Insert: {
          thread_id: string;
          user_id: string;
          last_read_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["thread_reads"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "thread_reads_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "message_threads";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          category: NotificationType;
          email_enabled: boolean;
        };
        Insert: {
          user_id: string;
          category: NotificationType;
          email_enabled?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["notification_preferences"]["Insert"]>;
        Relationships: [];
      };
      reminder_log: {
        Row: {
          id: string;
          position_id: string;
          kind: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          position_id: string;
          kind: string;
          sent_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reminder_log"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reminder_log_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: { p_name: string; p_timezone?: string };
        Returns: string;
      };
      accept_org_invite: {
        Args: { p_token: string };
        Returns: string;
      };
      scheduling_conflicts: {
        Args: { p_user_id: string; p_service_id: string };
        Returns: { conflict_type: string; detail: string | null }[];
      };
      get_org_invite: {
        Args: { p_token: string };
        Returns: { email: string; role: ProfileRole; org_name: string; accepted: boolean }[];
      };
      get_shared_service: {
        Args: { p_token: string };
        Returns: {
          id: string;
          title: string;
          starts_at: string;
          campus: string | null;
          notes: string | null;
          org_name: string;
        }[];
      };
      get_shared_service_plan_items: {
        Args: { p_token: string };
        Returns: {
          id: string;
          type: PlanItemType;
          title: string;
          description: string | null;
          duration_minutes: number;
          sort_order: number;
        }[];
      };
      notify_position_response: {
        Args: { p_position_id: string };
        Returns: void;
      };
      notify_self_signup: {
        Args: { p_position_id: string };
        Returns: void;
      };
      notify_thread_message: {
        Args: { p_thread_id: string; p_message_id: string };
        Returns: void;
      };
      get_email_preference: {
        Args: { p_user_id: string; p_category: NotificationType };
        Returns: boolean;
      };
      get_my_pending_invites: {
        Args: Record<string, never>;
        Returns: {
          token: string;
          org_name: string;
          role: ProfileRole;
          created_at: string;
        }[];
      };
      get_org_by_join_token: {
        Args: { p_token: string };
        Returns: { org_name: string }[];
      };
      join_org_by_token: {
        Args: { p_token: string };
        Returns: string;
      };
      regenerate_join_token: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
