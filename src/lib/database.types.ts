export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          marked_by: string | null;
          status: "present" | "absent";
          student_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          marked_by?: string | null;
          status: "present" | "absent";
          student_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Insert"]>;
      };
      batches: {
        Row: {
          branch_id: string | null;
          capacity: number | null;
          centre_id: string;
          created_at: string;
          grade: string | null;
          id: string;
          name: string;
          schedule: string | null;
          subject: string | null;
          updated_at: string;
        };
        Insert: {
          branch_id?: string | null;
          capacity?: number | null;
          centre_id: string;
          created_at?: string;
          grade?: string | null;
          id?: string;
          name: string;
          schedule?: string | null;
          subject?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["batches"]["Insert"]>;
      };
      branches: {
        Row: {
          address: string | null;
          centre_id: string;
          created_at: string;
          id: string;
          is_main: boolean;
          name: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          centre_id: string;
          created_at?: string;
          id?: string;
          is_main?: boolean;
          name: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
      };
      broadcast_messages: {
        Row: {
          batch_id: string | null;
          branch_id: string | null;
          centre_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          message: string;
          title: string;
        };
        Insert: {
          batch_id?: string | null;
          branch_id?: string | null;
          centre_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          message: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["broadcast_messages"]["Insert"]>;
      };
      centres: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          owner_id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["centres"]["Insert"]>;
      };
      enrollment_forms: {
        Row: {
          branch_id: string | null;
          centre_id: string;
          created_at: string;
          id: string;
          is_active: boolean;
          token: string;
        };
        Insert: {
          branch_id?: string | null;
          centre_id: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          token: string;
        };
        Update: Partial<Database["public"]["Tables"]["enrollment_forms"]["Insert"]>;
      };
      enrollment_submissions: {
        Row: {
          branch_id: string | null;
          centre_id: string;
          created_at: string;
          grade: string | null;
          id: string;
          linked_student_id: string | null;
          notes: string | null;
          parent_name: string | null;
          parent_phone: string;
          preferred_batch: string | null;
          status: "new" | "accepted" | "rejected";
          student_name: string;
        };
        Insert: {
          branch_id?: string | null;
          centre_id: string;
          created_at?: string;
          grade?: string | null;
          id?: string;
          linked_student_id?: string | null;
          notes?: string | null;
          parent_name?: string | null;
          parent_phone: string;
          preferred_batch?: string | null;
          status?: "new" | "accepted" | "rejected";
          student_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["enrollment_submissions"]["Insert"]>;
      };
      fees: {
        Row: {
          amount_due: number;
          amount_paid: number | null;
          created_at: string;
          id: string;
          month: string;
          paid_at: string | null;
          reminder_stage: string | null;
          status: "paid" | "unpaid" | "overdue";
          student_id: string;
          updated_at: string;
        };
        Insert: {
          amount_due?: number;
          amount_paid?: number | null;
          created_at?: string;
          id?: string;
          month: string;
          paid_at?: string | null;
          reminder_stage?: string | null;
          status?: "paid" | "unpaid" | "overdue";
          student_id: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fees"]["Insert"]>;
      };
      holidays: {
        Row: {
          branch_id: string | null;
          centre_id: string;
          created_at: string;
          holiday_date: string;
          id: string;
          notes: string | null;
          title: string;
        };
        Insert: {
          branch_id?: string | null;
          centre_id: string;
          created_at?: string;
          holiday_date: string;
          id?: string;
          notes?: string | null;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["holidays"]["Insert"]>;
      };
      notification_messages: {
        Row: {
          batch_id: string | null;
          branch_id: string | null;
          category: string;
          centre_id: string;
          channel: string;
          created_at: string;
          id: string;
          message_body: string;
          payload: Json;
          provider_message_id: string | null;
          recipient_phone: string;
          scheduled_for: string;
          sent_at: string | null;
          status: "queued" | "sent" | "failed";
          student_id: string | null;
        };
        Insert: {
          batch_id?: string | null;
          branch_id?: string | null;
          category: string;
          centre_id: string;
          channel?: string;
          created_at?: string;
          id?: string;
          message_body: string;
          payload?: Json;
          provider_message_id?: string | null;
          recipient_phone: string;
          scheduled_for?: string;
          sent_at?: string | null;
          status?: "queued" | "sent" | "failed";
          student_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notification_messages"]["Insert"]>;
      };
      payment_events: {
        Row: {
          centre_id: string;
          created_at: string;
          event_type: string;
          id: string;
          payload: Json;
          stripe_event_id: string;
        };
        Insert: {
          centre_id: string;
          created_at?: string;
          event_type: string;
          id?: string;
          payload?: Json;
          stripe_event_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_events"]["Insert"]>;
      };
      risk_alerts: {
        Row: {
          alert_type: "consecutive_absence" | "low_attendance";
          centre_id: string;
          created_at: string;
          id: string;
          metadata: Json;
          resolved_at: string | null;
          severity: "low" | "medium" | "high";
          status: "open" | "resolved";
          student_id: string;
        };
        Insert: {
          alert_type: "consecutive_absence" | "low_attendance";
          centre_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          resolved_at?: string | null;
          severity?: "low" | "medium" | "high";
          status?: "open" | "resolved";
          student_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["risk_alerts"]["Insert"]>;
      };
      staff_invites: {
        Row: {
          branch_id: string | null;
          centre_id: string;
          claimed_by_user_id: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string;
          role: "admin" | "teacher";
        };
        Insert: {
          branch_id?: string | null;
          centre_id: string;
          claimed_by_user_id?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone: string;
          role: "admin" | "teacher";
        };
        Update: Partial<Database["public"]["Tables"]["staff_invites"]["Insert"]>;
      };
      staff_memberships: {
        Row: {
          branch_id: string | null;
          centre_id: string;
          created_at: string;
          id: string;
          role: "owner" | "admin" | "teacher";
          user_id: string;
        };
        Insert: {
          branch_id?: string | null;
          centre_id: string;
          created_at?: string;
          id?: string;
          role: "owner" | "admin" | "teacher";
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_memberships"]["Insert"]>;
      };
      students: {
        Row: {
          batch_id: string | null;
          branch_id: string | null;
          centre_id: string;
          created_at: string;
          fee_amount: number;
          fee_due_date: number;
          id: string;
          joined_on: string;
          name: string;
          notes: string | null;
          parent_name: string | null;
          parent_phone: string;
          portal_token: string | null;
          roll_number: string | null;
          status: "active" | "inactive" | "dropped";
          updated_at: string;
        };
        Insert: {
          batch_id?: string | null;
          branch_id?: string | null;
          centre_id: string;
          created_at?: string;
          fee_amount?: number;
          fee_due_date?: number;
          id?: string;
          joined_on?: string;
          name: string;
          notes?: string | null;
          parent_name?: string | null;
          parent_phone: string;
          portal_token?: string | null;
          roll_number?: string | null;
          status?: "active" | "inactive" | "dropped";
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          centre_id: string;
          created_at: string;
          current_period_end: string | null;
          id: string;
          plan_key: string | null;
          status: string;
          stripe_customer_id: string | null;
          stripe_price_id: string | null;
          stripe_subscription_id: string | null;
          trial_ends_at: string | null;
          updated_at: string;
        };
        Insert: {
          cancel_at_period_end?: boolean;
          centre_id: string;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          plan_key?: string | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      teacher_batch_assignments: {
        Row: {
          batch_id: string;
          created_at: string;
          id: string;
          teacher_user_id: string;
        };
        Insert: {
          batch_id: string;
          created_at?: string;
          id?: string;
          teacher_user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["teacher_batch_assignments"]["Insert"]>;
      };
      test_scores: {
        Row: {
          created_at: string;
          id: string;
          marks: number;
          remarks: string | null;
          student_id: string;
          test_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          marks: number;
          remarks?: string | null;
          student_id: string;
          test_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["test_scores"]["Insert"]>;
      };
      tests: {
        Row: {
          batch_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          max_marks: number;
          test_date: string;
          title: string;
        };
        Insert: {
          batch_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          max_marks: number;
          test_date: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["tests"]["Insert"]>;
      };
      timetable_entries: {
        Row: {
          batch_id: string;
          created_at: string;
          end_time: string;
          id: string;
          room: string | null;
          start_time: string;
          topic: string | null;
          weekday: number;
        };
        Insert: {
          batch_id: string;
          created_at?: string;
          end_time: string;
          id?: string;
          room?: string | null;
          start_time: string;
          topic?: string | null;
          weekday: number;
        };
        Update: Partial<Database["public"]["Tables"]["timetable_entries"]["Insert"]>;
      };
      user_profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          phone: string | null;
          role_hint: string | null;
          updated_at: string;
          username: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          phone?: string | null;
          role_hint?: string | null;
          updated_at?: string;
          username?: string | null;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type WithRelationships<TDatabase extends { public: { Tables: Record<string, unknown> } }> = {
  [TSchema in keyof TDatabase]: TDatabase[TSchema] extends {
    Tables: infer TTables extends Record<string, unknown>;
  }
    ? TDatabase[TSchema] & {
        Tables: {
          [TTableName in keyof TTables]: TTables[TTableName] & {
            Relationships: [];
          };
        };
      }
    : TDatabase[TSchema];
};

export type AppDatabase = WithRelationships<Database>;
