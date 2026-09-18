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
      accounts: {
        Row: {
          active_role: Database["public"]["Enums"]["app_role"]
          avatar_path: string | null
          created_at: string
          full_name: string
          id: string
          is_admin: boolean
          phone: string
        }
        Insert: {
          active_role?: Database["public"]["Enums"]["app_role"]
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          id: string
          is_admin?: boolean
          phone?: string
        }
        Update: {
          active_role?: Database["public"]["Enums"]["app_role"]
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_admin?: boolean
          phone?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          account_id: string
          city: string
          created_at: string
          detail: string
          district: string
          id: string
          is_default: boolean
          label: string
          lat: number | null
          lng: number | null
          note: string
        }
        Insert: {
          account_id: string
          city: string
          created_at?: string
          detail: string
          district: string
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          lng?: number | null
          note?: string
        }
        Update: {
          account_id?: string
          city?: string
          created_at?: string
          detail?: string
          district?: string
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          lng?: number | null
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string
          address_note: string
          at_home: boolean
          blocked_range: unknown
          buffer_min: number
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: Database["public"]["Enums"]["app_role"] | null
          city: string
          commission: number
          commission_rate: number
          completed_at: string | null
          confirm_by: string
          confirmed_at: string | null
          created_at: string
          customer_id: string
          distance_km: number | null
          district: string
          duration_min: number
          ends_at: string
          id: string
          lat: number | null
          lng: number | null
          note: string
          offer_id: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payout: number | null
          pro_id: string
          quantity: number
          refunded_amount: number
          reschedule_by: Database["public"]["Enums"]["app_role"] | null
          reschedule_to: string | null
          service_price: number
          source: string
          started_at: string | null
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          template_id: string
          total: number | null
          travel_fee: number
          urgent_fee: number
          variant_id: string
        }
        Insert: {
          address?: string
          address_note?: string
          at_home: boolean
          blocked_range?: unknown
          buffer_min?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: Database["public"]["Enums"]["app_role"] | null
          city: string
          commission: number
          commission_rate: number
          completed_at?: string | null
          confirm_by: string
          confirmed_at?: string | null
          created_at?: string
          customer_id: string
          distance_km?: number | null
          district: string
          duration_min: number
          ends_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string
          offer_id?: string | null
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payout?: number | null
          pro_id: string
          quantity?: number
          refunded_amount?: number
          reschedule_by?: Database["public"]["Enums"]["app_role"] | null
          reschedule_to?: string | null
          service_price: number
          source?: string
          started_at?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          template_id: string
          total?: number | null
          travel_fee?: number
          urgent_fee?: number
          variant_id: string
        }
        Update: {
          address?: string
          address_note?: string
          at_home?: boolean
          blocked_range?: unknown
          buffer_min?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: Database["public"]["Enums"]["app_role"] | null
          city?: string
          commission?: number
          commission_rate?: number
          completed_at?: string | null
          confirm_by?: string
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string
          distance_km?: number | null
          district?: string
          duration_min?: number
          ends_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string
          offer_id?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payout?: number | null
          pro_id?: string
          quantity?: number
          refunded_amount?: number
          reschedule_by?: Database["public"]["Enums"]["app_role"] | null
          reschedule_to?: string | null
          service_price?: number
          source?: string
          started_at?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          template_id?: string
          total?: number | null
          travel_fee?: number
          urgent_fee?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_template_id_variant_id_fkey"
            columns: ["template_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "service_variants"
            referencedColumns: ["template_id", "id"]
          },
        ]
      }
      days_off: {
        Row: {
          ends_on: string
          id: string
          pro_id: string
          reason: string
          starts_on: string
        }
        Insert: {
          ends_on: string
          id?: string
          pro_id: string
          reason?: string
          starts_on: string
        }
        Update: {
          ends_on?: string
          id?: string
          pro_id?: string
          reason?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "days_off_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          city: string
          district: string
          lat: number
          lng: number
          sort_order: number
        }
        Insert: {
          city: string
          district: string
          lat: number
          lng: number
          sort_order?: number
        }
        Update: {
          city?: string
          district?: string
          lat?: number
          lng?: number
          sort_order?: number
        }
        Relationships: []
      }
      fee_policy: {
        Row: {
          commission_rate: number
          confirm_within_hours: number
          default_buffer_min: number
          free_cancel_hours: number
          free_travel_km: number
          id: boolean
          late_cancel_rate: number
          min_lead_minutes: number
          road_factor: number
          travel_fee_cap: number
          travel_fee_per_km: number
          updated_at: string
          urgent_fee: number
          urgent_within_hours: number
        }
        Insert: {
          commission_rate?: number
          confirm_within_hours?: number
          default_buffer_min?: number
          free_cancel_hours?: number
          free_travel_km?: number
          id?: boolean
          late_cancel_rate?: number
          min_lead_minutes?: number
          road_factor?: number
          travel_fee_cap?: number
          travel_fee_per_km?: number
          updated_at?: string
          urgent_fee?: number
          urgent_within_hours?: number
        }
        Update: {
          commission_rate?: number
          confirm_within_hours?: number
          default_buffer_min?: number
          free_cancel_hours?: number
          free_travel_km?: number
          id?: boolean
          late_cancel_rate?: number
          min_lead_minutes?: number
          road_factor?: number
          travel_fee_cap?: number
          travel_fee_per_km?: number
          updated_at?: string
          urgent_fee?: number
          urgent_within_hours?: number
        }
        Relationships: []
      }
      follows: {
        Row: {
          account_id: string
          created_at: string
          pro_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          pro_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          pro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_checks: {
        Row: {
          card_hash: string | null
          confidence: number | null
          consent_at: string
          created_at: string
          decided_at: string | null
          id: string
          model: string
          name_matches: boolean | null
          name_on_card: string | null
          pro_id: string
          reject_reason: string | null
          same_person: string | null
          status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          card_hash?: string | null
          confidence?: number | null
          consent_at: string
          created_at?: string
          decided_at?: string | null
          id?: string
          model: string
          name_matches?: boolean | null
          name_on_card?: string | null
          pro_id: string
          reject_reason?: string | null
          same_person?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          card_hash?: string | null
          confidence?: number | null
          consent_at?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          model?: string
          name_matches?: boolean | null
          name_on_card?: string | null
          pro_id?: string
          reject_reason?: string | null
          same_person?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "identity_checks_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address_id: string | null
          at_home: boolean
          city: string
          created_at: string
          customer_id: string
          description: string
          district: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          quantity: number
          starts_at: string
          status: Database["public"]["Enums"]["job_status"]
          template_id: string
          variant_id: string
        }
        Insert: {
          address_id?: string | null
          at_home?: boolean
          city: string
          created_at?: string
          customer_id: string
          description?: string
          district: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          quantity?: number
          starts_at: string
          status?: Database["public"]["Enums"]["job_status"]
          template_id: string
          variant_id: string
        }
        Update: {
          address_id?: string | null
          at_home?: boolean
          city?: string
          created_at?: string
          customer_id?: string
          description?: string
          district?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          quantity?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          template_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_template_id_variant_id_fkey"
            columns: ["template_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "service_variants"
            referencedColumns: ["template_id", "id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          image_paths: string[]
          read_at: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          image_paths?: string[]
          read_at?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_paths?: string[]
          read_at?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          account_id: string
          body: string
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
        }
        Insert: {
          account_id: string
          body?: string
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
        }
        Update: {
          account_id?: string
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          job_id: string
          message: string
          price: number
          pro_id: string
          status: Database["public"]["Enums"]["offer_status"]
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          job_id: string
          message: string
          price: number
          pro_id: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          job_id?: string
          message?: string
          price?: number
          pro_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "offers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_service_prices: {
        Row: {
          price: number
          pro_id: string
          template_id: string
          variant_id: string
        }
        Insert: {
          price: number
          pro_id: string
          template_id: string
          variant_id: string
        }
        Update: {
          price?: number
          pro_id?: string
          template_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_service_prices_pro_id_template_id_fkey"
            columns: ["pro_id", "template_id"]
            isOneToOne: false
            referencedRelation: "pro_services"
            referencedColumns: ["pro_id", "template_id"]
          },
          {
            foreignKeyName: "pro_service_prices_template_id_variant_id_fkey"
            columns: ["template_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "service_variants"
            referencedColumns: ["template_id", "id"]
          },
        ]
      }
      pro_services: {
        Row: {
          active: boolean
          pro_id: string
          template_id: string
        }
        Insert: {
          active?: boolean
          pro_id: string
          template_id: string
        }
        Update: {
          active?: boolean
          pro_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_services_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_services_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "service_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pros: {
        Row: {
          accepting_jobs: boolean
          areas: string[]
          bio: string
          buffer_min: number
          categories: Database["public"]["Enums"]["category_id"][]
          city: string
          completed_jobs: number
          created_at: string
          district: string
          highlights: string[]
          home_service: boolean
          id: string
          identity_name: string | null
          identity_status: Database["public"]["Enums"]["verification_status"]
          lat: number | null
          lng: number | null
          max_jobs_per_day: number
          max_travel_km: number
          published: boolean
          rating_avg: number
          rating_count: number
          response_minutes: number
          slug: string
          studio_address: string | null
          suspended_at: string | null
          title: string
          years_exp: number
        }
        Insert: {
          accepting_jobs?: boolean
          areas?: string[]
          bio?: string
          buffer_min?: number
          categories?: Database["public"]["Enums"]["category_id"][]
          city: string
          completed_jobs?: number
          created_at?: string
          district: string
          highlights?: string[]
          home_service?: boolean
          id: string
          identity_name?: string | null
          identity_status?: Database["public"]["Enums"]["verification_status"]
          lat?: number | null
          lng?: number | null
          max_jobs_per_day?: number
          max_travel_km?: number
          published?: boolean
          rating_avg?: number
          rating_count?: number
          response_minutes?: number
          slug: string
          studio_address?: string | null
          suspended_at?: string | null
          title?: string
          years_exp?: number
        }
        Update: {
          accepting_jobs?: boolean
          areas?: string[]
          bio?: string
          buffer_min?: number
          categories?: Database["public"]["Enums"]["category_id"][]
          city?: string
          completed_jobs?: number
          created_at?: string
          district?: string
          highlights?: string[]
          home_service?: boolean
          id?: string
          identity_name?: string | null
          identity_status?: Database["public"]["Enums"]["verification_status"]
          lat?: number | null
          lng?: number | null
          max_jobs_per_day?: number
          max_travel_km?: number
          published?: boolean
          rating_avg?: number
          rating_count?: number
          response_minutes?: number
          slug?: string
          studio_address?: string | null
          suspended_at?: string | null
          title?: string
          years_exp?: number
        }
        Relationships: [
          {
            foreignKeyName: "pros_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          booking_id: string | null
          created_at: string
          detail: string
          id: string
          reason: string
          reporter_id: string
          resolution: string | null
          resolved_at: string | null
          review_booking_id: string | null
          status: string
          target_account_id: string | null
          work_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          detail?: string
          id?: string
          reason: string
          reporter_id: string
          resolution?: string | null
          resolved_at?: string | null
          review_booking_id?: string | null
          status?: string
          target_account_id?: string | null
          work_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          detail?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolution?: string | null
          resolved_at?: string | null
          review_booking_id?: string | null
          status?: string
          target_account_id?: string | null
          work_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_review_booking_id_fkey"
            columns: ["review_booking_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "reports_target_account_id_fkey"
            columns: ["target_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          customer_id: string
          hidden_at: string | null
          photo_paths: string[]
          pro_id: string
          rating: number
          replied_at: string | null
          reply: string | null
          tags: string[]
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          customer_id: string
          hidden_at?: string | null
          photo_paths?: string[]
          pro_id: string
          rating: number
          replied_at?: string | null
          reply?: string | null
          tags?: string[]
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          customer_id?: string
          hidden_at?: string | null
          photo_paths?: string[]
          pro_id?: string
          rating?: number
          replied_at?: string | null
          reply?: string | null
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_works: {
        Row: {
          account_id: string
          created_at: string
          work_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          work_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_works_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_works_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      service_templates: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["category_id"]
          description: string
          id: string
          includes: string[]
          name: string
          sort_order: number
          studio_only: boolean
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["category_id"]
          description?: string
          id: string
          includes?: string[]
          name: string
          sort_order?: number
          studio_only?: boolean
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["category_id"]
          description?: string
          id?: string
          includes?: string[]
          name?: string
          sort_order?: number
          studio_only?: boolean
        }
        Relationships: []
      }
      service_variants: {
        Row: {
          duration_min: number
          id: string
          label: string
          max_price: number
          max_quantity: number
          min_price: number
          per_person: boolean
          sort_order: number
          suggested_price: number
          template_id: string
        }
        Insert: {
          duration_min: number
          id: string
          label: string
          max_price: number
          max_quantity?: number
          min_price: number
          per_person?: boolean
          sort_order?: number
          suggested_price: number
          template_id: string
        }
        Update: {
          duration_min?: number
          id?: string
          label?: string
          max_price?: number
          max_quantity?: number
          min_price?: number
          per_person?: boolean
          sort_order?: number
          suggested_price?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_variants_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "service_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string
          id: string
          last_message_at: string
          pro_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          last_message_at?: string
          pro_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          last_message_at?: string
          pro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_entries: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          kind: string
          note: string
          pro_id: string
          ref: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          kind: string
          note?: string
          pro_id: string
          ref?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          note?: string
          pro_id?: string
          ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_entries_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          end_min: number
          id: string
          pro_id: string
          start_min: number
          weekday: number
        }
        Insert: {
          end_min: number
          id?: string
          pro_id: string
          start_min: number
          weekday: number
        }
        Update: {
          end_min?: number
          id?: string
          pro_id?: string
          start_min?: number
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          created_at: string
          description: string
          id: string
          image_paths: string[]
          is_cover: boolean
          pro_id: string
          sort_order: number
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_paths: string[]
          is_cover?: boolean
          pro_id: string
          sort_order?: number
          template_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_paths?: string[]
          is_cover?: boolean
          pro_id?: string
          sort_order?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "works_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "service_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_offer: { Args: { p_offer: string }; Returns: string }
      app_timezone: { Args: never; Returns: string }
      availability_problem: {
        Args: {
          p_at_home: boolean
          p_ignore_booking?: string
          p_lat?: number
          p_lng?: number
          p_pro: string
          p_quantity: number
          p_starts_at: string
          p_template: string
          p_variant: string
        }
        Returns: string
      }
      booking_for_caller: {
        Args: {
          p_as: Database["public"]["Enums"]["app_role"]
          p_booking: string
        }
        Returns: {
          address: string
          address_note: string
          at_home: boolean
          blocked_range: unknown
          buffer_min: number
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: Database["public"]["Enums"]["app_role"] | null
          city: string
          commission: number
          commission_rate: number
          completed_at: string | null
          confirm_by: string
          confirmed_at: string | null
          created_at: string
          customer_id: string
          distance_km: number | null
          district: string
          duration_min: number
          ends_at: string
          id: string
          lat: number | null
          lng: number | null
          note: string
          offer_id: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payout: number | null
          pro_id: string
          quantity: number
          refunded_amount: number
          reschedule_by: Database["public"]["Enums"]["app_role"] | null
          reschedule_to: string | null
          service_price: number
          source: string
          started_at: string | null
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          template_id: string
          total: number | null
          travel_fee: number
          urgent_fee: number
          variant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      build_quote: {
        Args: {
          at_home: boolean
          distance_km: number
          quantity: number
          unit_price: number
          urgent: boolean
        }
        Returns: Database["public"]["CompositeTypes"]["quote"]
        SetofOptions: {
          from: "*"
          to: "quote"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_booking: {
        Args: { p_booking: string; p_reason?: string }
        Returns: undefined
      }
      commission_for: {
        Args: { rate: number; service_price: number }
        Returns: number
      }
      complete_booking: { Args: { p_booking: string }; Returns: undefined }
      confirm_booking: { Args: { p_booking: string }; Returns: undefined }
      create_booking: {
        Args: {
          p_address_id?: string
          p_at_home: boolean
          p_note?: string
          p_payment?: Database["public"]["Enums"]["payment_method"]
          p_pro: string
          p_quantity?: number
          p_starts_at: string
          p_template: string
          p_variant: string
        }
        Returns: string
      }
      decline_booking: {
        Args: { p_booking: string; p_reason?: string }
        Returns: undefined
      }
      enforce_wallet_threshold: { Args: { p_limit?: number }; Returns: number }
      expire_stale_bookings: { Args: never; Returns: number }
      expire_stale_jobs: { Args: never; Returns: number }
      free_slots: {
        Args: {
          p_at_home?: boolean
          p_date: string
          p_lat?: number
          p_lng?: number
          p_pro: string
          p_quantity: number
          p_template: string
          p_variant: string
        }
        Returns: string[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_privileged: { Args: never; Returns: boolean }
      is_pro: { Args: never; Returns: boolean }
      is_urgent: { Args: { at?: string; starts_at: string }; Returns: boolean }
      listed_price: {
        Args: { p_pro: string; p_template: string; p_variant: string }
        Returns: number
      }
      mark_no_show: {
        Args: { p_booking: string; p_reason?: string }
        Returns: undefined
      }
      notify: {
        Args: {
          p_account: string
          p_body: string
          p_kind: string
          p_link: string
          p_title: string
        }
        Returns: undefined
      }
      post_job: {
        Args: {
          p_address_id?: string
          p_at_home: boolean
          p_description?: string
          p_payment?: Database["public"]["Enums"]["payment_method"]
          p_quantity?: number
          p_starts_at: string
          p_template: string
          p_variant: string
        }
        Returns: string
      }
      recompute_pro_metrics: { Args: never; Returns: undefined }
      refresh_pro_rating: { Args: { p_pro: string }; Returns: undefined }
      reply_review: {
        Args: { p_booking: string; p_reply: string }
        Returns: undefined
      }
      request_reschedule: {
        Args: { p_booking: string; p_starts_at: string }
        Returns: undefined
      }
      respond_reschedule: {
        Args: { p_accept: boolean; p_booking: string }
        Returns: undefined
      }
      send_booking_reminders: { Args: never; Returns: number }
      send_offer: {
        Args: { p_job: string; p_message: string; p_price: number }
        Returns: string
      }
      service_duration_min: {
        Args: { p_quantity?: number; p_template: string; p_variant: string }
        Returns: number
      }
      start_booking: { Args: { p_booking: string }; Returns: undefined }
      travel_distance_km: {
        Args: {
          lat1: number
          lat2: number
          lng1: number
          lng2: number
          road_factor?: number
        }
        Returns: number
      }
      travel_fee: { Args: { distance_km: number }; Returns: number }
      wallet_balance: { Args: { p_pro: string }; Returns: number }
      withdraw_offer: { Args: { p_offer: string }; Returns: undefined }
      within_working_hours: {
        Args: { p_minutes: number; p_pro: string; p_starts_at: string }
        Returns: boolean
      }
      write_review: {
        Args: {
          p_body: string
          p_booking: string
          p_photo_paths?: string[]
          p_rating: number
          p_tags: string[]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "pro"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "declined"
        | "cancelled"
        | "expired"
        | "no_show"
      category_id:
        | "nail"
        | "makeup"
        | "skincare"
        | "hair"
        | "lash-brow"
        | "massage"
      job_status: "open" | "booked" | "expired" | "closed"
      offer_status: "pending" | "accepted" | "rejected" | "withdrawn"
      payment_method: "online" | "cash"
      verification_status: "none" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      quote: {
        service_price: number | null
        distance_km: number | null
        travel_fee: number | null
        urgent_fee: number | null
        total: number | null
        commission_rate: number | null
        commission: number | null
        payout: number | null
      }
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
      app_role: ["customer", "pro"],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "declined",
        "cancelled",
        "expired",
        "no_show",
      ],
      category_id: [
        "nail",
        "makeup",
        "skincare",
        "hair",
        "lash-brow",
        "massage",
      ],
      job_status: ["open", "booked", "expired", "closed"],
      offer_status: ["pending", "accepted", "rejected", "withdrawn"],
      payment_method: ["online", "cash"],
      verification_status: ["none", "pending", "verified", "rejected"],
    },
  },
} as const

