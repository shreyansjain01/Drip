export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          currency: string;
          timezone: string;
          monthly_salary_paise: number | null;
          salary_day: number | null;
          onboarding_done: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          timezone?: string;
          monthly_salary_paise?: number | null;
          salary_day?: number | null;
          onboarding_done?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          timezone?: string;
          monthly_salary_paise?: number | null;
          salary_day?: number | null;
          onboarding_done?: boolean;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          icon: string;
          color: string;
          keywords: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          icon: string;
          color?: string;
          keywords?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          icon?: string;
          color?: string;
          keywords?: string[];
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          amount_paise: number;
          category_id: string;
          label: string;
          source: 'voice' | 'manual' | 'shortcut';
          needs_review: boolean;
          spent_at: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_paise: number;
          category_id: string;
          label: string;
          source: 'voice' | 'manual' | 'shortcut';
          needs_review?: boolean;
          spent_at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount_paise?: number;
          category_id?: string;
          label?: string;
          source?: 'voice' | 'manual' | 'shortcut';
          needs_review?: boolean;
          spent_at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_paise: number;
          deadline: string | null;
          icon: string;
          color: string;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_paise: number;
          deadline?: string | null;
          icon?: string;
          color?: string;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_paise?: number;
          deadline?: string | null;
          icon?: string;
          color?: string;
          created_at?: string;
          archived_at?: string | null;
        };
      };
      plan_fields: {
        Row: {
          id: string;
          user_id: string;
          kind: 'expenses' | 'savings' | 'goal';
          goal_id: string | null;
          name: string;
          planned_paise: number;
          sort_order: number;
          locked: boolean;
          archived_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: 'expenses' | 'savings' | 'goal';
          goal_id?: string | null;
          name: string;
          planned_paise?: number;
          sort_order?: number;
          locked?: boolean;
          archived_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: 'expenses' | 'savings' | 'goal';
          goal_id?: string | null;
          name?: string;
          planned_paise?: number;
          sort_order?: number;
          locked?: boolean;
          archived_at?: string | null;
          created_at?: string;
        };
      };
      incomes: {
        Row: {
          id: string;
          user_id: string;
          kind: 'salary' | 'extra';
          amount_paise: number;
          label: string;
          received_at: string;
          effective_month: string;
          source: 'onboarding' | 'month_end_prompt' | 'manual' | 'voice' | 'shortcut';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: 'salary' | 'extra';
          amount_paise: number;
          label: string;
          received_at?: string;
          effective_month: string;
          source: 'onboarding' | 'month_end_prompt' | 'manual' | 'voice' | 'shortcut';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: 'salary' | 'extra';
          amount_paise?: number;
          label?: string;
          received_at?: string;
          effective_month?: string;
          source?: 'onboarding' | 'month_end_prompt' | 'manual' | 'voice' | 'shortcut';
          created_at?: string;
        };
      };
      goal_contributions: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          field_id: string | null;
          amount_paise: number;
          note: string | null;
          source: 'manual' | 'voice' | 'shortcut' | 'extra_income_allocation';
          contributed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_id: string;
          field_id?: string | null;
          amount_paise: number;
          note?: string | null;
          source: 'manual' | 'voice' | 'shortcut' | 'extra_income_allocation';
          contributed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_id?: string;
          field_id?: string | null;
          amount_paise?: number;
          note?: string | null;
          source?: 'manual' | 'voice' | 'shortcut' | 'extra_income_allocation';
          contributed_at?: string;
        };
      };
      reminder_slots: {
        Row: {
          id: string;
          user_id: string;
          local_time: string;
          label: string;
          enabled: boolean;
          origin: 'learned' | 'default' | 'user';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          local_time: string;
          label: string;
          enabled?: boolean;
          origin: 'learned' | 'default' | 'user';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          local_time?: string;
          label?: string;
          enabled?: boolean;
          origin?: 'learned' | 'default' | 'user';
          created_at?: string;
        };
      };
      notification_log: {
        Row: {
          id: string;
          user_id: string;
          kind: 'reminder' | 'month_end_ask' | 'month_end_congrats' | 'system';
          slot_id: string | null;
          local_date: string;
          title: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: 'reminder' | 'month_end_ask' | 'month_end_congrats' | 'system';
          slot_id?: string | null;
          local_date: string;
          title: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: 'reminder' | 'month_end_ask' | 'month_end_congrats' | 'system';
          slot_id?: string | null;
          local_date?: string;
          title?: string;
          body?: string;
          read_at?: string | null;
          created_at?: string;
        };
      };
      api_tokens: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          token_hash: string;
          scopes: string[];
          last_used_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          token_hash: string;
          scopes?: string[];
          last_used_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          token_hash?: string;
          scopes?: string[];
          last_used_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
      };
      monthly_results: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          income_paise: number;
          plan_snapshot: Json;
          total_spent_paise: number;
          total_saved_paise: number;
          expense_target_paise: number;
          savings_target_paise: number;
          expense_goal_met: boolean;
          savings_goal_met: boolean;
          notified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          income_paise: number;
          plan_snapshot?: Json;
          total_spent_paise?: number;
          total_saved_paise?: number;
          expense_target_paise?: number;
          savings_target_paise?: number;
          expense_goal_met?: boolean;
          savings_goal_met?: boolean;
          notified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: string;
          income_paise?: number;
          plan_snapshot?: Json;
          total_spent_paise?: number;
          total_saved_paise?: number;
          expense_target_paise?: number;
          savings_target_paise?: number;
          expense_goal_met?: boolean;
          savings_goal_met?: boolean;
          notified_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
