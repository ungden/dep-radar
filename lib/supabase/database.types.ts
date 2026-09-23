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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          active_role: Database["public"]["Enums"]["app_role"]
          avatar_path: string | null
          created_at: string
          full_name: string
          id: string
          interests: Database["public"]["Enums"]["category_id"][]
          is_admin: boolean
          phone: string
          referral_code: string | null
          referred_at: string | null
          referred_by: string | null
        }
        Insert: {
          active_role?: Database["public"]["Enums"]["app_role"]
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          id: string
          interests?: Database["public"]["Enums"]["category_id"][]
          is_admin?: boolean
          phone?: string
          referral_code?: string | null
          referred_at?: string | null
          referred_by?: string | null
        }
        Update: {
          active_role?: Database["public"]["Enums"]["app_role"]
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          id?: string
          interests?: Database["public"]["Enums"]["category_id"][]
          is_admin?: boolean
          phone?: string
          referral_code?: string | null
          referred_at?: string | null
          referred_by?: string | null
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
          booking_group_id: string | null
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
          consent_repost: boolean
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_accepted_at: string | null
          delivery_due_at: string | null
          delivery_note: string | null
          delivery_url: string | null
          discount: number
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
          usage_scope: string
          variant_id: string
          voucher_id: string | null
        }
        Insert: {
          address?: string
          address_note?: string
          at_home: boolean
          blocked_range?: unknown
          booking_group_id?: string | null
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
          consent_repost?: boolean
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          delivery_accepted_at?: string | null
          delivery_due_at?: string | null
          delivery_note?: string | null
          delivery_url?: string | null
          discount?: number
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
          usage_scope?: string
          variant_id: string
          voucher_id?: string | null
        }
        Update: {
          address?: string
          address_note?: string
          at_home?: boolean
          blocked_range?: unknown
          booking_group_id?: string | null
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
          consent_repost?: boolean
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_accepted_at?: string | null
          delivery_due_at?: string | null
          delivery_note?: string | null
          delivery_url?: string | null
          discount?: number
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
          usage_scope?: string
          variant_id?: string
          voucher_id?: string | null
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
      casting_applications: {
        Row: {
          account_id: string
          applicant_name: string
          casting_id: string
          created_at: string
          decided_at: string | null
          id: string
          message: string
          status: string
        }
        Insert: {
          account_id: string
          applicant_name?: string
          casting_id: string
          created_at?: string
          decided_at?: string | null
          id?: string
          message?: string
          status?: string
        }
        Update: {
          account_id?: string
          applicant_name?: string
          casting_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          message?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "casting_applications_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casting_applications_casting_id_fkey"
            columns: ["casting_id"]
            isOneToOne: false
            referencedRelation: "castings"
            referencedColumns: ["id"]
          },
        ]
      }
      castings: {
        Row: {
          accepted_count: number
          category: Database["public"]["Enums"]["category_id"]
          city: string
          compensation: string
          created_at: string
          description: string
          discount_percent: number | null
          district: string
          fee: number | null
          id: string
          pro_id: string
          slots: number
          starts_at: string
          status: string
          title: string
        }
        Insert: {
          accepted_count?: number
          category: Database["public"]["Enums"]["category_id"]
          city: string
          compensation: string
          created_at?: string
          description?: string
          discount_percent?: number | null
          district: string
          fee?: number | null
          id?: string
          pro_id: string
          slots?: number
          starts_at: string
          status?: string
          title: string
        }
        Update: {
          accepted_count?: number
          category?: Database["public"]["Enums"]["category_id"]
          city?: string
          compensation?: string
          created_at?: string
          description?: string
          discount_percent?: number | null
          district?: string
          fee?: number | null
          id?: string
          pro_id?: string
          slots?: number
          starts_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "castings_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_reviews: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          customer_id: string
          pro_id: string
          published_at: string | null
          rating: number
        }
        Insert: {
          body?: string
          booking_id: string
          created_at?: string
          customer_id: string
          pro_id: string
          published_at?: string | null
          rating: number
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          customer_id?: string
          pro_id?: string
          published_at?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reviews_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
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
          wallet_floor: number
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
          wallet_floor?: number
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
          wallet_floor?: number
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
          booking_id: string | null
          city: string
          created_at: string
          customer_id: string
          description: string
          district: string
          id: string
          notified: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          price: number | null
          quantity: number
          starts_at: string
          status: Database["public"]["Enums"]["job_status"]
          template_id: string
          variant_id: string
        }
        Insert: {
          address_id?: string | null
          at_home?: boolean
          booking_id?: string | null
          city: string
          created_at?: string
          customer_id: string
          description?: string
          district: string
          id?: string
          notified?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          price?: number | null
          quantity?: number
          starts_at: string
          status?: Database["public"]["Enums"]["job_status"]
          template_id: string
          variant_id: string
        }
        Update: {
          address_id?: string | null
          at_home?: boolean
          booking_id?: string | null
          city?: string
          created_at?: string
          customer_id?: string
          description?: string
          district?: string
          id?: string
          notified?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          price?: number | null
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
      model_profiles: {
        Row: {
          accepts: string[]
          bottom_size: string
          height_cm: number | null
          pro_id: string
          refuses: string[]
          shoe_size: string
          styles: string[]
          top_size: string
          updated_at: string
        }
        Insert: {
          accepts?: string[]
          bottom_size?: string
          height_cm?: number | null
          pro_id: string
          refuses?: string[]
          shoe_size?: string
          styles?: string[]
          top_size?: string
          updated_at?: string
        }
        Update: {
          accepts?: string[]
          bottom_size?: string
          height_cm?: number | null
          pro_id?: string
          refuses?: string[]
          shoe_size?: string
          styles?: string[]
          top_size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_profiles_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: true
            referencedRelation: "pros"
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
      platform_settings: {
        Row: {
          company_address: string | null
          company_name: string | null
          company_tax_id: string | null
          id: boolean
          referral_customer_amount: number
          referral_enabled: boolean
          referral_min_total: number
          referral_monthly_cap: number
          referral_pro_amount: number
          support_email: string | null
          support_zalo: string | null
          topup_account_name: string | null
          topup_account_no: string | null
          topup_bank_bin: string | null
          voucher_days: number
        }
        Insert: {
          company_address?: string | null
          company_name?: string | null
          company_tax_id?: string | null
          id?: boolean
          referral_customer_amount?: number
          referral_enabled?: boolean
          referral_min_total?: number
          referral_monthly_cap?: number
          referral_pro_amount?: number
          support_email?: string | null
          support_zalo?: string | null
          topup_account_name?: string | null
          topup_account_no?: string | null
          topup_bank_bin?: string | null
          voucher_days?: number
        }
        Update: {
          company_address?: string | null
          company_name?: string | null
          company_tax_id?: string | null
          id?: boolean
          referral_customer_amount?: number
          referral_enabled?: boolean
          referral_min_total?: number
          referral_monthly_cap?: number
          referral_pro_amount?: number
          support_email?: string | null
          support_zalo?: string | null
          topup_account_name?: string | null
          topup_account_no?: string | null
          topup_bank_bin?: string | null
          voucher_days?: number
        }
        Relationships: []
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
          adult: boolean | null
          areas: string[]
          avatar_path: string | null
          bio: string
          birth_year: number | null
          buffer_min: number
          categories: Database["public"]["Enums"]["category_id"][]
          city: string
          completed_jobs: number
          created_at: string
          display_name: string
          district: string
          equipment: string | null
          highlights: string[]
          home_service: boolean
          id: string
          identity_name: string | null
          identity_status: Database["public"]["Enums"]["verification_status"]
          lat: number | null
          lng: number | null
          max_jobs_per_day: number
          max_travel_km: number
          pay_code: string
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
          adult?: boolean | null
          areas?: string[]
          avatar_path?: string | null
          bio?: string
          birth_year?: number | null
          buffer_min?: number
          categories?: Database["public"]["Enums"]["category_id"][]
          city: string
          completed_jobs?: number
          created_at?: string
          display_name?: string
          district: string
          equipment?: string | null
          highlights?: string[]
          home_service?: boolean
          id: string
          identity_name?: string | null
          identity_status?: Database["public"]["Enums"]["verification_status"]
          lat?: number | null
          lng?: number | null
          max_jobs_per_day?: number
          max_travel_km?: number
          pay_code?: string
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
          adult?: boolean | null
          areas?: string[]
          avatar_path?: string | null
          bio?: string
          birth_year?: number | null
          buffer_min?: number
          categories?: Database["public"]["Enums"]["category_id"][]
          city?: string
          completed_jobs?: number
          created_at?: string
          display_name?: string
          district?: string
          equipment?: string | null
          highlights?: string[]
          home_service?: boolean
          id?: string
          identity_name?: string | null
          identity_status?: Database["public"]["Enums"]["verification_status"]
          lat?: number | null
          lng?: number | null
          max_jobs_per_day?: number
          max_travel_km?: number
          pay_code?: string
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
      push_tokens: {
        Row: {
          account_id: string
          created_at: string
          last_seen_at: string
          platform: string
          token: string
        }
        Insert: {
          account_id: string
          created_at?: string
          last_seen_at?: string
          platform: string
          token: string
        }
        Update: {
          account_id?: string
          created_at?: string
          last_seen_at?: string
          platform?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          booking_id: string | null
          created_at: string
          kind: string
          referee: string
          referee_amount: number
          referrer: string
          referrer_amount: number
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          kind: string
          referee: string
          referee_amount: number
          referrer: string
          referrer_amount: number
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          kind?: string
          referee?: string
          referee_amount?: number
          referrer?: string
          referrer_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referee_fkey"
            columns: ["referee"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referrer_fkey"
            columns: ["referrer"]
            isOneToOne: false
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
          author_name: string
          body: string
          booking_id: string
          created_at: string
          customer_id: string
          hidden_at: string | null
          photo_paths: string[]
          pro_id: string
          published_at: string | null
          rating: number
          replied_at: string | null
          reply: string | null
          service_label: string
          tags: string[]
        }
        Insert: {
          author_name?: string
          body: string
          booking_id: string
          created_at?: string
          customer_id: string
          hidden_at?: string | null
          photo_paths?: string[]
          pro_id: string
          published_at?: string | null
          rating: number
          replied_at?: string | null
          reply?: string | null
          service_label?: string
          tags?: string[]
        }
        Update: {
          author_name?: string
          body?: string
          booking_id?: string
          created_at?: string
          customer_id?: string
          hidden_at?: string | null
          photo_paths?: string[]
          pro_id?: string
          published_at?: string | null
          rating?: number
          replied_at?: string | null
          reply?: string | null
          service_label?: string
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
          deliverable: string | null
          delivery_days: number | null
          description: string
          id: string
          includes: string[]
          name: string
          on_location: boolean
          requires_verification: boolean
          sort_order: number
          studio_only: boolean
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["category_id"]
          deliverable?: string | null
          delivery_days?: number | null
          description?: string
          id: string
          includes?: string[]
          name: string
          on_location?: boolean
          requires_verification?: boolean
          sort_order?: number
          studio_only?: boolean
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["category_id"]
          deliverable?: string | null
          delivery_days?: number | null
          description?: string
          id?: string
          includes?: string[]
          name?: string
          on_location?: boolean
          requires_verification?: boolean
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
          customer_name: string
          id: string
          last_message_at: string
          pro_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id: string
          customer_name?: string
          id?: string
          last_message_at?: string
          pro_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
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
      time_blocks: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          note: string
          pro_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          note?: string
          pro_id: string
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          note?: string
          pro_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked: string
          blocker: string
          created_at: string
        }
        Insert: {
          blocked: string
          blocker: string
          created_at?: string
        }
        Update: {
          blocked?: string
          blocker?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_fkey"
            columns: ["blocked"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_fkey"
            columns: ["blocker"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          account_id: string
          amount: number
          booking_id: string | null
          created_at: string
          expires_at: string
          id: string
          min_total: number
          note: string
          source: string
          used_at: string | null
        }
        Insert: {
          account_id: string
          amount: number
          booking_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          min_total?: number
          note?: string
          source?: string
          used_at?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          booking_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          min_total?: number
          note?: string
          source?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
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
          kind: string
          pro_id: string
          slug: string
          sort_order: number
          template_id: string
          title: string
          video_path: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_paths: string[]
          is_cover?: boolean
          kind?: string
          pro_id: string
          slug: string
          sort_order?: number
          template_id: string
          title: string
          video_path?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_paths?: string[]
          is_cover?: boolean
          kind?: string
          pro_id?: string
          slug?: string
          sort_order?: number
          template_id?: string
          title?: string
          video_path?: string | null
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
      work_stats_daily: {
        Row: {
          book_clicks: number
          day: string
          impressions: number
          opens: number
          saves: number
          work_id: string
        }
        Insert: {
          book_clicks?: number
          day: string
          impressions?: number
          opens?: number
          saves?: number
          work_id: string
        }
        Update: {
          book_clicks?: number
          day?: string
          impressions?: number
          opens?: number
          saves?: number
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_stats_daily_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_delivery: { Args: { p_booking: string }; Returns: undefined }
      accept_offer: { Args: { p_offer: string }; Returns: string }
      add_time_block: {
        Args: { p_ends_at: string; p_note?: string; p_starts_at: string }
        Returns: string
      }
      app_timezone: { Args: never; Returns: string }
      applied_to_casting: { Args: { p_casting: string }; Returns: boolean }
      apply_casting: {
        Args: { p_casting: string; p_message?: string }
        Returns: string
      }
      apply_voucher: {
        Args: { p_booking: string; p_voucher: string }
        Returns: undefined
      }
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
      banned_content: { Args: { p_text: string }; Returns: boolean }
      block_user: { Args: { p_account: string }; Returns: undefined }
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
      claim_referral: { Args: { p_code: string }; Returns: string }
      close_casting: { Args: { p_casting: string }; Returns: undefined }
      commission_for: {
        Args: { rate: number; service_price: number }
        Returns: number
      }
      complete_booking: { Args: { p_booking: string }; Returns: undefined }
      confirm_booking: { Args: { p_booking: string }; Returns: undefined }
      confirm_booking_done: { Args: { p_booking: string }; Returns: undefined }
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
      create_casting: {
        Args: {
          p_category: Database["public"]["Enums"]["category_id"]
          p_city: string
          p_compensation: string
          p_description: string
          p_discount_percent?: number
          p_district: string
          p_fee?: number
          p_slots: number
          p_starts_at: string
          p_title: string
        }
        Returns: string
      }
      decide_application: {
        Args: { p_accept: boolean; p_application: string }
        Returns: string
      }
      decide_identity_check: {
        Args: { p_approve: boolean; p_check: string; p_reason?: string }
        Returns: undefined
      }
      decline_booking: {
        Args: { p_booking: string; p_reason?: string }
        Returns: undefined
      }
      delete_my_account: { Args: never; Returns: undefined }
      deliver_booking: {
        Args: { p_booking: string; p_note?: string; p_url: string }
        Returns: undefined
      }
      dispute_no_show: {
        Args: { p_booking: string; p_reason: string }
        Returns: string
      }
      enforce_wallet_threshold: { Args: { p_limit?: number }; Returns: number }
      expire_stale_bookings: { Args: never; Returns: number }
      expire_stale_jobs: { Args: never; Returns: number }
      free_days: {
        Args: {
          p_at_home?: boolean
          p_days: number
          p_from: string
          p_lat?: number
          p_lng?: number
          p_pro: string
          p_quantity: number
          p_template: string
          p_variant: string
        }
        Returns: string[]
      }
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
      link_bookings: { Args: { p_bookings: string[] }; Returns: string }
      listed_price: {
        Args: { p_pro: string; p_template: string; p_variant: string }
        Returns: number
      }
      log_work_events: { Args: { p_events: Json }; Returns: number }
      mark_no_show: {
        Args: { p_booking: string; p_reason?: string }
        Returns: undefined
      }
      mark_thread_read: {
        Args: { p_thread: string }
        Returns: undefined
      }
      my_referral_code: { Args: never; Returns: string }
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
      open_thread: {
        Args: { p_booking?: string; p_pro: string }
        Returns: string
      }
      post_job: {
        Args: {
          p_address_id?: string
          p_at_home: boolean
          p_description?: string
          p_payment?: Database["public"]["Enums"]["payment_method"]
          p_price?: number
          p_quantity?: number
          p_starts_at: string
          p_template: string
          p_variant: string
        }
        Returns: string
      }
      record_bank_topup: {
        Args: { p_amount: number; p_content: string; p_ref: string }
        Returns: boolean
      }
      record_topup: {
        Args: { p_amount: number; p_pro: string; p_ref?: string }
        Returns: undefined
      }
      recompute_pro_metrics: { Args: never; Returns: undefined }
      refresh_pro_rating: { Args: { p_pro: string }; Returns: undefined }
      register_push_token: {
        Args: { p_platform: string; p_token: string }
        Returns: undefined
      }
      remind_overdue_deliveries: { Args: never; Returns: number }
      remove_time_block: { Args: { p_id: string }; Returns: undefined }
      remove_voucher: { Args: { p_booking: string }; Returns: undefined }
      reply_review: {
        Args: { p_booking: string; p_reply: string }
        Returns: undefined
      }
      report_pro_no_show: {
        Args: { p_booking: string; p_detail?: string }
        Returns: undefined
      }
      request_reschedule: {
        Args: { p_booking: string; p_starts_at: string }
        Returns: undefined
      }
      resolve_report: {
        Args: { p_report: string; p_resolution?: string; p_status: string }
        Returns: undefined
      }
      respond_reschedule: {
        Args: { p_accept: boolean; p_booking: string }
        Returns: undefined
      }
      review_customer: {
        Args: { p_body?: string; p_booking: string; p_rating: number }
        Returns: undefined
      }
      take_job: { Args: { p_job: string }; Returns: string }
      send_booking_reminders: { Args: never; Returns: number }
      send_message: {
        Args: { p_body?: string; p_image_paths?: string[]; p_thread: string }
        Returns: boolean
      }
      send_offer: {
        Args: { p_job: string; p_message: string; p_price: number }
        Returns: string
      }
      service_duration_min: {
        Args: { p_quantity?: number; p_template: string; p_variant: string }
        Returns: number
      }
      set_booking_terms: {
        Args: {
          p_booking: string
          p_consent_repost: boolean
          p_usage_scope: string
        }
        Returns: undefined
      }
      set_interests: {
        Args: { p_categories: Database["public"]["Enums"]["category_id"][] }
        Returns: undefined
      }
      set_pro_suspended: {
        Args: { p_pro: string; p_reason?: string; p_suspended: boolean }
        Returns: undefined
      }
      set_review_hidden: {
        Args: { p_booking: string; p_hidden: boolean }
        Returns: undefined
      }
      slugify: { Args: { input: string }; Returns: string }
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
      unblock_user: { Args: { p_account: string }; Returns: undefined }
      wallet_balance: { Args: { p_pro: string }; Returns: number }
      withdraw_application: { Args: { p_application: string }; Returns: undefined }
      withdraw_offer: { Args: { p_offer: string }; Returns: undefined }
      within_working_hours: {
        Args: { p_minutes: number; p_pro: string; p_starts_at: string }
        Returns: boolean
      }
      work_stats_30d: {
        Args: never
        Returns: {
          book_clicks: number
          impressions: number
          opens: number
          saves: number
          work_id: string
        }[]
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
        | "photophone"
        | "camera"
        | "short-video"
        | "product-photo"
        | "model-photo"
        | "model-video"
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
        "photophone",
        "camera",
        "short-video",
        "product-photo",
        "model-photo",
        "model-video",
      ],
      job_status: ["open", "booked", "expired", "closed"],
      offer_status: ["pending", "accepted", "rejected", "withdrawn"],
      payment_method: ["online", "cash"],
      verification_status: ["none", "pending", "verified", "rejected"],
    },
  },
} as const
