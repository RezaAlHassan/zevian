/**
 * Supabase Database types.
 *
 * HOW TO GENERATE:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 *
 * Until then, this stub keeps TypeScript happy.
 * Replace the entire file with the generated output once your schema is ready.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:              string
          full_name:       string
          role:            'manager' | 'employee'
          organization_id: string
          is_active:       boolean
          created_at:      string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      organizations: {
        Row: {
          id:         string
          name:       string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      projects: {
        Row: {
          id:              string
          name:            string
          emoji:           string
          category:        string
          frequency:       'daily' | 'weekly' | 'biweekly' | 'monthly'
          avg_score:       number | null
          report_count:    number
          goal_count:      number
          last_report_at:  string | null
          status:          'active' | 'archived'
          organization_id: string
          created_by:      string
          created_at:      string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'avg_score' | 'report_count' | 'goal_count' | 'last_report_at' | 'created_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      goals: {
        Row: {
          id:           string
          name:         string
          instructions: string
          deadline:     string | null
          avg_score:    number | null
          report_count: number
          status:       'active' | 'archived' | 'completed'
          project_id:   string
          created_by:   string
          created_at:   string
        }
        Insert: Omit<Database['public']['Tables']['goals']['Row'], 'id' | 'avg_score' | 'report_count' | 'created_at'>
        Update: Partial<Database['public']['Tables']['goals']['Insert']>
      }
      criteria: {
        Row: {
          id:                 string
          name:               string
          weight:             number
          goal_id:            string
          display_order:      number
          target_description: string | null
          created_at:         string | null
        }
        Insert: Omit<Database['public']['Tables']['criteria']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['criteria']['Insert']>
      }
      reports: {
        Row: {
          id:                    string
          content:               string
          score:                 number | null
          status:                'pending' | 'scored' | 'reviewed' | 'late'
          ai_summary:            string | null
          manager_override_score: number | null
          manager_note:          string | null
          employee_id:           string
          goal_id:               string
          created_at:            string
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'score' | 'ai_summary' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
      }
      criterion_scores: {
        Row: {
          id:           string
          report_id:    string
          criterion_id: string
          score:        number
          ai_feedback:  string | null
        }
        Insert: Omit<Database['public']['Tables']['criterion_scores']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['criterion_scores']['Insert']>
      }
    }
    Views: {}
    Functions: {
      get_team_stats: {
        Args: {}
        Returns: {
          avg_score:       number
          total_employees: number
          reports_this_week: number
          on_track_count:  number
          at_risk_count:   number
        }
      }
    }
    Enums: {}
  }
}
