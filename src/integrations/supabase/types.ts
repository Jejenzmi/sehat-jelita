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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          booking_source: string | null
          chief_complaint: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          doctor_id: string
          end_time: string | null
          id: string
          notes: string | null
          patient_id: string
          reminder_sent: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type?: string
          booking_source?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          doctor_id: string
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          booking_source?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          doctor_id?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          check_in: string | null
          check_out: string | null
          created_at: string
          employee_id: string
          id: string
          location_in: string | null
          location_out: string | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attendance_date?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          employee_id: string
          id?: string
          location_in?: string | null
          location_out?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          location_in?: string | null
          location_out?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      beds: {
        Row: {
          bed_number: string
          created_at: string
          current_patient_id: string | null
          id: string
          notes: string | null
          room_id: string
          status: Database["public"]["Enums"]["bed_status"]
          updated_at: string
        }
        Insert: {
          bed_number: string
          created_at?: string
          current_patient_id?: string | null
          id?: string
          notes?: string | null
          room_id: string
          status?: Database["public"]["Enums"]["bed_status"]
          updated_at?: string
        }
        Update: {
          bed_number?: string
          created_at?: string
          current_patient_id?: string | null
          id?: string
          notes?: string | null
          room_id?: string
          status?: Database["public"]["Enums"]["bed_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_current_patient_id_fkey"
            columns: ["current_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_items: {
        Row: {
          billing_id: string
          created_at: string
          id: string
          item_name: string
          item_type: string
          notes: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          billing_id: string
          created_at?: string
          id?: string
          item_name: string
          item_type: string
          notes?: string | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          billing_id?: string
          created_at?: string
          id?: string
          item_name?: string
          item_type?: string
          notes?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_items_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billings"
            referencedColumns: ["id"]
          },
        ]
      }
      billings: {
        Row: {
          billing_date: string
          created_at: string
          created_by: string | null
          discount: number | null
          id: string
          invoice_number: string
          notes: string | null
          paid_amount: number | null
          paid_by: string | null
          patient_id: string
          payment_date: string | null
          payment_method: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          status: Database["public"]["Enums"]["billing_status"]
          subtotal: number
          tax: number | null
          total: number
          updated_at: string
          visit_id: string
        }
        Insert: {
          billing_date?: string
          created_at?: string
          created_by?: string | null
          discount?: number | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number | null
          paid_by?: string | null
          patient_id: string
          payment_date?: string | null
          payment_method?: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          status?: Database["public"]["Enums"]["billing_status"]
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string
          visit_id: string
        }
        Update: {
          billing_date?: string
          created_at?: string
          created_by?: string | null
          discount?: number | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number | null
          paid_by?: string | null
          patient_id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          status?: Database["public"]["Enums"]["billing_status"]
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billings_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      bpjs_claims: {
        Row: {
          approved_amount: number | null
          claim_amount: number
          claim_date: string
          claim_number: string
          created_at: string
          created_by: string | null
          id: string
          inacbg_code: string | null
          inacbg_description: string | null
          notes: string | null
          patient_id: string
          rejection_reason: string | null
          sep_number: string
          status: Database["public"]["Enums"]["claim_status"]
          submission_date: string | null
          updated_at: string
          verification_date: string | null
          visit_id: string
        }
        Insert: {
          approved_amount?: number | null
          claim_amount: number
          claim_date?: string
          claim_number: string
          created_at?: string
          created_by?: string | null
          id?: string
          inacbg_code?: string | null
          inacbg_description?: string | null
          notes?: string | null
          patient_id: string
          rejection_reason?: string | null
          sep_number: string
          status?: Database["public"]["Enums"]["claim_status"]
          submission_date?: string | null
          updated_at?: string
          verification_date?: string | null
          visit_id: string
        }
        Update: {
          approved_amount?: number | null
          claim_amount?: number
          claim_date?: string
          claim_number?: string
          created_at?: string
          created_by?: string | null
          id?: string
          inacbg_code?: string | null
          inacbg_description?: string | null
          notes?: string | null
          patient_id?: string
          rejection_reason?: string | null
          sep_number?: string
          status?: Database["public"]["Enums"]["claim_status"]
          submission_date?: string | null
          updated_at?: string
          verification_date?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bpjs_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bpjs_claims_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          file_url: string | null
          id: string
          is_edited: boolean
          message_type: string
          room_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_edited?: boolean
          message_type?: string
          room_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_edited?: boolean
          message_type?: string
          room_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          last_read_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string | null
          id: string
          name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          name?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          created_at: string
          description: string
          diagnosis_type: string
          icd10_code: string
          icd10_code_id: string | null
          id: string
          medical_record_id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          description: string
          diagnosis_type?: string
          icd10_code: string
          icd10_code_id?: string | null
          id?: string
          medical_record_id: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          diagnosis_type?: string
          icd10_code?: string
          icd10_code_id?: string | null
          id?: string
          medical_record_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_icd10_code_id_fkey"
            columns: ["icd10_code_id"]
            isOneToOne: false
            referencedRelation: "icd10_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedule_exceptions: {
        Row: {
          alternative_end_time: string | null
          alternative_start_time: string | null
          created_at: string
          doctor_id: string
          exception_date: string
          exception_type: string
          id: string
          is_available: boolean
          reason: string | null
        }
        Insert: {
          alternative_end_time?: string | null
          alternative_start_time?: string | null
          created_at?: string
          doctor_id: string
          exception_date: string
          exception_type: string
          id?: string
          is_available?: boolean
          reason?: string | null
        }
        Update: {
          alternative_end_time?: string | null
          alternative_start_time?: string | null
          created_at?: string
          doctor_id?: string
          exception_date?: string
          exception_type?: string
          id?: string
          is_available?: boolean
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedule_exceptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_active: boolean
          max_patients: number | null
          notes: string | null
          room_number: string | null
          slot_duration: number
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_active?: boolean
          max_patients?: number | null
          notes?: string | null
          room_number?: string | null
          slot_duration?: number
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_active?: boolean
          max_patients?: number | null
          notes?: string | null
          room_number?: string | null
          slot_duration?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          consultation_fee: number | null
          created_at: string
          department_id: string | null
          full_name: string
          id: string
          is_active: boolean
          profile_id: string | null
          sip_number: string
          specialization: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          consultation_fee?: number | null
          created_at?: string
          department_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          profile_id?: string | null
          sip_number: string
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          consultation_fee?: number | null
          created_at?: string
          department_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          profile_id?: string | null
          sip_number?: string
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_visits: {
        Row: {
          arrival_mode: string | null
          arrival_time: string
          chief_complaint: string
          consciousness_level: string | null
          created_at: string
          disposition: string | null
          disposition_time: string | null
          id: string
          is_critical: boolean | null
          notes: string | null
          patient_id: string
          trauma_type: string | null
          triage_by: string | null
          triage_level: Database["public"]["Enums"]["triage_level"]
          triage_time: string | null
          updated_at: string
          visit_id: string
        }
        Insert: {
          arrival_mode?: string | null
          arrival_time?: string
          chief_complaint: string
          consciousness_level?: string | null
          created_at?: string
          disposition?: string | null
          disposition_time?: string | null
          id?: string
          is_critical?: boolean | null
          notes?: string | null
          patient_id: string
          trauma_type?: string | null
          triage_by?: string | null
          triage_level: Database["public"]["Enums"]["triage_level"]
          triage_time?: string | null
          updated_at?: string
          visit_id: string
        }
        Update: {
          arrival_mode?: string | null
          arrival_time?: string
          chief_complaint?: string
          consciousness_level?: string | null
          created_at?: string
          disposition?: string | null
          disposition_time?: string | null
          id?: string
          is_critical?: boolean | null
          notes?: string | null
          patient_id?: string
          trauma_type?: string | null
          triage_by?: string | null
          triage_level?: Database["public"]["Enums"]["triage_level"]
          triage_time?: string | null
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_visits_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_name: string | null
          birth_date: string | null
          birth_place: string | null
          bpjs_kesehatan: string | null
          bpjs_ketenagakerjaan: string | null
          created_at: string
          department_id: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_number: string
          employment_type: string
          end_date: string | null
          full_name: string
          gender: string | null
          id: string
          join_date: string
          nik: string | null
          notes: string | null
          npwp: string | null
          phone: string | null
          position: string
          salary: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          bpjs_kesehatan?: string | null
          bpjs_ketenagakerjaan?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number: string
          employment_type?: string
          end_date?: string | null
          full_name: string
          gender?: string | null
          id?: string
          join_date: string
          nik?: string | null
          notes?: string | null
          npwp?: string | null
          phone?: string | null
          position: string
          salary?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          bpjs_kesehatan?: string | null
          bpjs_ketenagakerjaan?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string
          employment_type?: string
          end_date?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          join_date?: string
          nik?: string | null
          notes?: string | null
          npwp?: string | null
          phone?: string | null
          position?: string
          salary?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      icd10_codes: {
        Row: {
          category: string | null
          code: string
          description_en: string
          description_id: string | null
          id: string
          is_active: boolean
        }
        Insert: {
          category?: string | null
          code: string
          description_en: string
          description_id?: string | null
          id?: string
          is_active?: boolean
        }
        Update: {
          category?: string | null
          code?: string
          description_en?: string
          description_id?: string | null
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      icd9_codes: {
        Row: {
          category: string | null
          code: string
          description_en: string
          description_id: string | null
          id: string
          is_active: boolean
        }
        Insert: {
          category?: string | null
          code: string
          description_en: string
          description_id?: string | null
          id?: string
          is_active?: boolean
        }
        Update: {
          category?: string | null
          code?: string
          description_en?: string
          description_id?: string | null
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      inpatient_admissions: {
        Row: {
          actual_discharge_date: string | null
          admission_date: string
          attending_doctor_id: string | null
          bed_id: string | null
          created_at: string
          discharge_summary: string | null
          discharge_type: string | null
          id: string
          nursing_notes: string | null
          patient_id: string
          planned_discharge_date: string | null
          room_id: string
          status: string
          updated_at: string
          visit_id: string
        }
        Insert: {
          actual_discharge_date?: string | null
          admission_date?: string
          attending_doctor_id?: string | null
          bed_id?: string | null
          created_at?: string
          discharge_summary?: string | null
          discharge_type?: string | null
          id?: string
          nursing_notes?: string | null
          patient_id: string
          planned_discharge_date?: string | null
          room_id: string
          status?: string
          updated_at?: string
          visit_id: string
        }
        Update: {
          actual_discharge_date?: string | null
          admission_date?: string
          attending_doctor_id?: string | null
          bed_id?: string | null
          created_at?: string
          discharge_summary?: string | null
          discharge_type?: string | null
          id?: string
          nursing_notes?: string | null
          patient_id?: string
          planned_discharge_date?: string | null
          room_id?: string
          status?: string
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inpatient_admissions_attending_doctor_id_fkey"
            columns: ["attending_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inpatient_admissions_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inpatient_admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inpatient_admissions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inpatient_admissions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          accident_date: string | null
          accident_location: string | null
          approval_date: string | null
          approved_amount: number | null
          approved_by: string | null
          claim_amount: number
          claim_date: string | null
          claim_number: string
          created_at: string | null
          created_by: string | null
          documents: Json | null
          id: string
          inacbg_code: string | null
          inacbg_description: string | null
          lp_number: string | null
          notes: string | null
          paid_amount: number | null
          patient_id: string
          patient_insurance_id: string
          patient_responsibility: number | null
          payment_date: string | null
          police_report_number: string | null
          priority_order: number | null
          rejection_reason: string | null
          sep_number: string | null
          status: Database["public"]["Enums"]["insurance_claim_status"] | null
          submission_date: string | null
          updated_at: string | null
          verification_date: string | null
          verified_by: string | null
          visit_id: string
        }
        Insert: {
          accident_date?: string | null
          accident_location?: string | null
          approval_date?: string | null
          approved_amount?: number | null
          approved_by?: string | null
          claim_amount: number
          claim_date?: string | null
          claim_number: string
          created_at?: string | null
          created_by?: string | null
          documents?: Json | null
          id?: string
          inacbg_code?: string | null
          inacbg_description?: string | null
          lp_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          patient_id: string
          patient_insurance_id: string
          patient_responsibility?: number | null
          payment_date?: string | null
          police_report_number?: string | null
          priority_order?: number | null
          rejection_reason?: string | null
          sep_number?: string | null
          status?: Database["public"]["Enums"]["insurance_claim_status"] | null
          submission_date?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verified_by?: string | null
          visit_id: string
        }
        Update: {
          accident_date?: string | null
          accident_location?: string | null
          approval_date?: string | null
          approved_amount?: number | null
          approved_by?: string | null
          claim_amount?: number
          claim_date?: string | null
          claim_number?: string
          created_at?: string | null
          created_by?: string | null
          documents?: Json | null
          id?: string
          inacbg_code?: string | null
          inacbg_description?: string | null
          lp_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string
          patient_insurance_id?: string
          patient_responsibility?: number | null
          payment_date?: string | null
          police_report_number?: string | null
          priority_order?: number | null
          rejection_reason?: string | null
          sep_number?: string | null
          status?: Database["public"]["Enums"]["insurance_claim_status"] | null
          submission_date?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verified_by?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_patient_insurance_id_fkey"
            columns: ["patient_insurance_id"]
            isOneToOne: false
            referencedRelation: "patient_insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_providers: {
        Row: {
          address: string | null
          code: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          pic_name: string | null
          pic_phone: string | null
          type: Database["public"]["Enums"]["insurance_type"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          type: Database["public"]["Enums"]["insurance_type"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          type?: Database["public"]["Enums"]["insurance_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_settings: {
        Row: {
          auto_reorder_enabled: boolean | null
          created_at: string | null
          id: string
          last_auto_order_date: string | null
          lead_time_days: number | null
          max_stock: number | null
          medicine_id: string
          preferred_supplier: string | null
          reorder_point: number
          reorder_quantity: number
          updated_at: string | null
        }
        Insert: {
          auto_reorder_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_auto_order_date?: string | null
          lead_time_days?: number | null
          max_stock?: number | null
          medicine_id: string
          preferred_supplier?: string | null
          reorder_point: number
          reorder_quantity: number
          updated_at?: string | null
        }
        Update: {
          auto_reorder_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_auto_order_date?: string | null
          lead_time_days?: number | null
          max_stock?: number | null
          medicine_id?: string
          preferred_supplier?: string | null
          reorder_point?: number
          reorder_quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_settings_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: true
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          batch_id: string | null
          created_at: string | null
          id: string
          medicine_id: string
          new_stock: number
          notes: string | null
          performed_by: string | null
          previous_stock: number
          quantity: number
          reference_id: string | null
          reference_type: string | null
          total_price: number | null
          transaction_type: string
          unit_price: number | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          medicine_id: string
          new_stock: number
          notes?: string | null
          performed_by?: string | null
          previous_stock: number
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          total_price?: number | null
          transaction_type: string
          unit_price?: number | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          medicine_id?: string
          new_stock?: number
          notes?: string | null
          performed_by?: string | null
          previous_stock?: number
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          total_price?: number | null
          transaction_type?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "medicine_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          created_at: string
          id: string
          lab_number: string
          medical_record_id: string | null
          notes: string | null
          patient_id: string
          processed_by: string | null
          request_date: string
          requested_by: string | null
          result_date: string | null
          results: Json
          sample_date: string | null
          status: string
          template_id: string
          updated_at: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lab_number: string
          medical_record_id?: string | null
          notes?: string | null
          patient_id: string
          processed_by?: string | null
          request_date?: string
          requested_by?: string | null
          result_date?: string | null
          results?: Json
          sample_date?: string | null
          status?: string
          template_id: string
          updated_at?: string
          visit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lab_number?: string
          medical_record_id?: string | null
          notes?: string | null
          patient_id?: string
          processed_by?: string | null
          request_date?: string
          requested_by?: string | null
          result_date?: string | null
          results?: Json
          sample_date?: string | null
          status?: string
          template_id?: string
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "lab_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_templates: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          normal_values: Json | null
          parameters: Json
          price: number | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          normal_values?: Json | null
          parameters?: Json
          price?: number | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          normal_values?: Json | null
          parameters?: Json
          price?: number | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          total_days: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          additional_notes: string | null
          assessment: string | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          created_by: string | null
          doctor_id: string
          heart_rate: number | null
          height: number | null
          id: string
          objective: string | null
          oxygen_saturation: number | null
          patient_id: string
          physical_examination: string | null
          plan: string | null
          record_date: string
          respiratory_rate: number | null
          subjective: string | null
          temperature: number | null
          updated_at: string
          visit_id: string
          weight: number | null
        }
        Insert: {
          additional_notes?: string | null
          assessment?: string | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          created_by?: string | null
          doctor_id: string
          heart_rate?: number | null
          height?: number | null
          id?: string
          objective?: string | null
          oxygen_saturation?: number | null
          patient_id: string
          physical_examination?: string | null
          plan?: string | null
          record_date?: string
          respiratory_rate?: number | null
          subjective?: string | null
          temperature?: number | null
          updated_at?: string
          visit_id: string
          weight?: number | null
        }
        Update: {
          additional_notes?: string | null
          assessment?: string | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          heart_rate?: number | null
          height?: number | null
          id?: string
          objective?: string | null
          oxygen_saturation?: number | null
          patient_id?: string
          physical_examination?: string | null
          plan?: string | null
          record_date?: string
          respiratory_rate?: number | null
          subjective?: string | null
          temperature?: number | null
          updated_at?: string
          visit_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_batches: {
        Row: {
          batch_number: string
          created_at: string | null
          expiry_date: string
          id: string
          initial_quantity: number
          manufacture_date: string | null
          medicine_id: string
          notes: string | null
          quantity: number
          received_date: string | null
          status: string
          supplier_name: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          created_at?: string | null
          expiry_date: string
          id?: string
          initial_quantity: number
          manufacture_date?: string | null
          medicine_id: string
          notes?: string | null
          quantity?: number
          received_date?: string | null
          status?: string
          supplier_name?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          created_at?: string | null
          expiry_date?: string
          id?: string
          initial_quantity?: number
          manufacture_date?: string | null
          medicine_id?: string
          notes?: string | null
          quantity?: number
          received_date?: string | null
          status?: string
          supplier_name?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_batches_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          category: string | null
          code: string
          created_at: string
          generic_name: string | null
          id: string
          is_active: boolean
          min_stock: number | null
          name: string
          price: number
          stock: number
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          generic_name?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number | null
          name: string
          price?: number
          stock?: number
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          generic_name?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number | null
          name?: string
          price?: number
          stock?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_access: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          menu_path: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          menu_path: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          menu_path?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          target_roles: string[] | null
          target_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          target_roles?: string[] | null
          target_user_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          target_roles?: string[] | null
          target_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      nursing_notes: {
        Row: {
          admission_id: string | null
          content: string
          cosigned_at: string | null
          cosigned_by: string | null
          created_at: string
          id: string
          interventions: Json | null
          note_datetime: string
          note_type: string
          nurse_id: string
          patient_id: string
          shift: string | null
          updated_at: string
          visit_id: string
        }
        Insert: {
          admission_id?: string | null
          content: string
          cosigned_at?: string | null
          cosigned_by?: string | null
          created_at?: string
          id?: string
          interventions?: Json | null
          note_datetime?: string
          note_type: string
          nurse_id: string
          patient_id: string
          shift?: string | null
          updated_at?: string
          visit_id: string
        }
        Update: {
          admission_id?: string | null
          content?: string
          cosigned_at?: string | null
          cosigned_by?: string | null
          created_at?: string
          id?: string
          interventions?: Json | null
          note_datetime?: string
          note_type?: string
          nurse_id?: string
          patient_id?: string
          shift?: string | null
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nursing_notes_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "inpatient_admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_notes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_insurances: {
        Row: {
          class: string | null
          coverage_percentage: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          max_coverage: number | null
          member_id: string | null
          notes: string | null
          patient_id: string
          policy_number: string
          provider_id: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          class?: string | null
          coverage_percentage?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          max_coverage?: number | null
          member_id?: string | null
          notes?: string | null
          patient_id: string
          policy_number: string
          provider_id: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          class?: string | null
          coverage_percentage?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          max_coverage?: number | null
          member_id?: string | null
          notes?: string | null
          patient_id?: string
          policy_number?: string
          provider_id?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_insurances_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_insurances_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_portal_sessions: {
        Row: {
          id: string
          ip_address: string | null
          login_at: string | null
          patient_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_at?: string | null
          patient_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_at?: string | null
          patient_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_portal_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergy_notes: string | null
          birth_date: string
          birth_place: string | null
          blood_type: string | null
          bpjs_number: string | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          medical_record_number: string
          nik: string
          phone: string | null
          postal_code: string | null
          province: string | null
          status: Database["public"]["Enums"]["patient_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          allergy_notes?: string | null
          birth_date: string
          birth_place?: string | null
          blood_type?: string | null
          bpjs_number?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          medical_record_number: string
          nik: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          allergy_notes?: string | null
          birth_date?: string
          birth_place?: string | null
          blood_type?: string | null
          bpjs_number?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          medical_record_number?: string
          nik?: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payroll: {
        Row: {
          allowances: Json | null
          approved_by: string | null
          basic_salary: number
          created_at: string
          created_by: string | null
          deductions: Json | null
          employee_id: string
          gross_salary: number
          id: string
          net_salary: number
          notes: string | null
          overtime_amount: number | null
          overtime_hours: number | null
          payment_date: string | null
          payment_method: string | null
          period_month: number
          period_year: number
          status: string
          tax_amount: number | null
          updated_at: string
        }
        Insert: {
          allowances?: Json | null
          approved_by?: string | null
          basic_salary?: number
          created_at?: string
          created_by?: string | null
          deductions?: Json | null
          employee_id: string
          gross_salary?: number
          id?: string
          net_salary?: number
          notes?: string | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          payment_date?: string | null
          payment_method?: string | null
          period_month: number
          period_year: number
          status?: string
          tax_amount?: number | null
          updated_at?: string
        }
        Update: {
          allowances?: Json | null
          approved_by?: string | null
          basic_salary?: number
          created_at?: string
          created_by?: string | null
          deductions?: Json | null
          employee_id?: string
          gross_salary?: number
          id?: string
          net_salary?: number
          notes?: string | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          payment_date?: string | null
          payment_method?: string | null
          period_month?: number
          period_year?: number
          status?: string
          tax_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_items: {
        Row: {
          created_at: string
          dosage: string
          duration: string | null
          frequency: string
          id: string
          instructions: string | null
          medicine_id: string
          prescription_id: string
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          dosage: string
          duration?: string | null
          frequency: string
          id?: string
          instructions?: string | null
          medicine_id: string
          prescription_id: string
          price?: number
          quantity: number
        }
        Update: {
          created_at?: string
          dosage?: string
          duration?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          medicine_id?: string
          prescription_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          pickup_code: string | null
          prescription_date: string
          prescription_number: string
          processed_at: string | null
          processed_by: string | null
          qr_generated_at: string | null
          qr_token: string | null
          status: Database["public"]["Enums"]["prescription_status"]
          updated_at: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          notes?: string | null
          patient_id: string
          pickup_code?: string | null
          prescription_date?: string
          prescription_number: string
          processed_at?: string | null
          processed_by?: string | null
          qr_generated_at?: string | null
          qr_token?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
          visit_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          pickup_code?: string | null
          prescription_date?: string
          prescription_number?: string
          processed_at?: string | null
          processed_by?: string | null
          qr_generated_at?: string | null
          qr_token?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          created_at: string
          description: string
          icd9_code: string
          icd9_code_id: string | null
          id: string
          medical_record_id: string
          notes: string | null
          procedure_date: string | null
        }
        Insert: {
          created_at?: string
          description: string
          icd9_code: string
          icd9_code_id?: string | null
          id?: string
          medical_record_id: string
          notes?: string | null
          procedure_date?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          icd9_code?: string
          icd9_code_id?: string | null
          id?: string
          medical_record_id?: string
          notes?: string | null
          procedure_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedures_icd9_code_id_fkey"
            columns: ["icd9_code_id"]
            isOneToOne: false
            referencedRelation: "icd9_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          nip: string | null
          phone: string | null
          specialization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          nip?: string | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          nip?: string | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          medicine_id: string
          notes: string | null
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          medicine_id: string
          notes?: string | null
          purchase_order_id: string
          quantity: number
          received_quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          medicine_id?: string
          notes?: string | null
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          approved_at: string | null
          approved_by: string | null
          auto_generated: boolean | null
          created_at: string | null
          created_by: string | null
          discount: number | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string | null
          order_number: string
          status: string
          subtotal: number | null
          supplier_name: string
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_generated?: boolean | null
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number: string
          status?: string
          subtotal?: number | null
          supplier_name: string
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_generated?: boolean | null
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string
          status?: string
          subtotal?: number | null
          supplier_name?: string
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      queue_display: {
        Row: {
          called_at: string | null
          counter_number: number | null
          current_number: number | null
          department_id: string
          id: string
          last_called_number: number | null
          status: string
          updated_at: string
        }
        Insert: {
          called_at?: string | null
          counter_number?: number | null
          current_number?: number | null
          department_id: string
          id?: string
          last_called_number?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          called_at?: string | null
          counter_number?: number | null
          current_number?: number | null
          department_id?: string
          id?: string
          last_called_number?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_display_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_tickets: {
        Row: {
          called_at: string | null
          completed_at: string | null
          counter_number: string | null
          created_at: string
          department_id: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          patient_id: string | null
          priority: number | null
          queue_date: string
          served_at: string | null
          service_type: string
          status: string
          ticket_number: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          called_at?: string | null
          completed_at?: string | null
          counter_number?: string | null
          created_at?: string
          department_id?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          priority?: number | null
          queue_date?: string
          served_at?: string | null
          service_type: string
          status?: string
          ticket_number: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          called_at?: string | null
          completed_at?: string | null
          counter_number?: string | null
          created_at?: string
          department_id?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          priority?: number | null
          queue_date?: string
          served_at?: string | null
          service_type?: string
          status?: string
          ticket_number?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_tickets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      radiology_results: {
        Row: {
          contrast_type: string | null
          contrast_used: boolean | null
          created_at: string
          exam_date: string | null
          findings: string | null
          id: string
          image_urls: Json | null
          impression: string | null
          medical_record_id: string | null
          notes: string | null
          patient_id: string
          performed_by: string | null
          radiation_dose: string | null
          radiology_number: string
          recommendation: string | null
          reported_by: string | null
          request_date: string
          requested_by: string | null
          result_date: string | null
          status: string
          template_id: string
          updated_at: string
          visit_id: string
        }
        Insert: {
          contrast_type?: string | null
          contrast_used?: boolean | null
          created_at?: string
          exam_date?: string | null
          findings?: string | null
          id?: string
          image_urls?: Json | null
          impression?: string | null
          medical_record_id?: string | null
          notes?: string | null
          patient_id: string
          performed_by?: string | null
          radiation_dose?: string | null
          radiology_number: string
          recommendation?: string | null
          reported_by?: string | null
          request_date?: string
          requested_by?: string | null
          result_date?: string | null
          status?: string
          template_id: string
          updated_at?: string
          visit_id: string
        }
        Update: {
          contrast_type?: string | null
          contrast_used?: boolean | null
          created_at?: string
          exam_date?: string | null
          findings?: string | null
          id?: string
          image_urls?: Json | null
          impression?: string | null
          medical_record_id?: string | null
          notes?: string | null
          patient_id?: string
          performed_by?: string | null
          radiation_dose?: string | null
          radiology_number?: string
          recommendation?: string | null
          reported_by?: string | null
          request_date?: string
          requested_by?: string | null
          result_date?: string | null
          status?: string
          template_id?: string
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "radiology_results_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_results_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "radiology_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_results_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      radiology_templates: {
        Row: {
          body_part: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          modality: string
          name: string
          price: number | null
          protocol: string | null
        }
        Insert: {
          body_part?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          modality: string
          name: string
          price?: number | null
          protocol?: string | null
        }
        Update: {
          body_part?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          modality?: string
          name?: string
          price?: number | null
          protocol?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          daily_rate: number | null
          department_id: string | null
          id: string
          is_active: boolean
          name: string
          room_class: string
          total_beds: number
        }
        Insert: {
          code: string
          created_at?: string
          daily_rate?: number | null
          department_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          room_class: string
          total_beds?: number
        }
        Update: {
          code?: string
          created_at?: string
          daily_rate?: number | null
          department_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          room_class?: string
          total_beds?: number
        }
        Relationships: [
          {
            foreignKeyName: "rooms_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      satusehat_config: {
        Row: {
          auto_sync_enabled: boolean | null
          created_at: string
          environment: string
          id: string
          last_token_refresh: string | null
          organization_id: string
          sync_interval_minutes: number | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          created_at?: string
          environment?: string
          id?: string
          last_token_refresh?: string | null
          organization_id: string
          sync_interval_minutes?: number | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          auto_sync_enabled?: boolean | null
          created_at?: string
          environment?: string
          id?: string
          last_token_refresh?: string | null
          organization_id?: string
          sync_interval_minutes?: number | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      satusehat_resource_mappings: {
        Row: {
          created_at: string
          id: string
          local_id: string
          resource_type: string
          satusehat_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          local_id: string
          resource_type: string
          satusehat_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          local_id?: string
          resource_type?: string
          satusehat_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      satusehat_sync_logs: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          local_table: string
          request_payload: Json | null
          resource_id: string
          resource_type: string
          response_payload: Json | null
          retry_count: number | null
          satusehat_id: string | null
          status: string
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          local_table: string
          request_payload?: Json | null
          resource_id: string
          resource_type: string
          response_payload?: Json | null
          retry_count?: number | null
          satusehat_id?: string | null
          status?: string
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          local_table?: string
          request_payload?: Json | null
          resource_id?: string
          resource_type?: string
          response_payload?: Json | null
          retry_count?: number | null
          satusehat_id?: string | null
          status?: string
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      satusehat_sync_stats: {
        Row: {
          created_at: string
          failed_count: number | null
          id: string
          pending_count: number | null
          resource_type: string
          sync_date: string
          synced_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          failed_count?: number | null
          id?: string
          pending_count?: number | null
          resource_type: string
          sync_date?: string
          synced_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          failed_count?: number | null
          id?: string
          pending_count?: number | null
          resource_type?: string
          sync_date?: string
          synced_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      service_tariffs: {
        Row: {
          base_price: number
          bpjs_price: number | null
          category: string
          code: string
          created_at: string
          department_id: string | null
          id: string
          insurance_price: number | null
          is_active: boolean | null
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          bpjs_price?: number | null
          category: string
          code: string
          created_at?: string
          department_id?: string | null
          id?: string
          insurance_price?: number | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          bpjs_price?: number | null
          category?: string
          code?: string
          created_at?: string
          department_id?: string | null
          id?: string
          insurance_price?: number | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_tariffs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_type?: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      telemedicine_sessions: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          appointment_id: string
          created_at: string
          doctor_id: string
          doctor_joined_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          patient_joined_at: string | null
          recording_url: string | null
          room_name: string
          scheduled_start: string
          session_token: string | null
          status: string
          technical_issues: string | null
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          appointment_id: string
          created_at?: string
          doctor_id: string
          doctor_joined_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          patient_joined_at?: string | null
          recording_url?: string | null
          room_name: string
          scheduled_start: string
          session_token?: string | null
          status?: string
          technical_issues?: string | null
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          appointment_id?: string
          created_at?: string
          doctor_id?: string
          doctor_joined_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          patient_joined_at?: string | null
          recording_url?: string | null
          room_name?: string
          scheduled_start?: string
          session_token?: string | null
          status?: string
          technical_issues?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemedicine_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          admission_date: string | null
          bed_id: string | null
          bpjs_sep_number: string | null
          chief_complaint: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          discharge_date: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          patient_id: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          queue_number: number | null
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
          visit_date: string
          visit_number: string
          visit_time: string
          visit_type: Database["public"]["Enums"]["visit_type"]
        }
        Insert: {
          admission_date?: string | null
          bed_id?: string | null
          bpjs_sep_number?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          discharge_date?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          queue_number?: number | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          visit_date?: string
          visit_number: string
          visit_time?: string
          visit_type: Database["public"]["Enums"]["visit_type"]
        }
        Update: {
          admission_date?: string | null
          bed_id?: string | null
          bpjs_sep_number?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          discharge_date?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          queue_number?: number | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          visit_date?: string
          visit_number?: string
          visit_time?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
        }
        Relationships: [
          {
            foreignKeyName: "visits_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_signs: {
        Row: {
          blood_glucose: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          heart_rate: number | null
          height: number | null
          id: string
          measured_at: string
          measured_by: string | null
          medical_record_id: string | null
          notes: string | null
          oxygen_saturation: number | null
          pain_scale: number | null
          patient_id: string
          respiratory_rate: number | null
          temperature: number | null
          visit_id: string
          weight: number | null
        }
        Insert: {
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          heart_rate?: number | null
          height?: number | null
          id?: string
          measured_at?: string
          measured_by?: string | null
          medical_record_id?: string | null
          notes?: string | null
          oxygen_saturation?: number | null
          pain_scale?: number | null
          patient_id: string
          respiratory_rate?: number | null
          temperature?: number | null
          visit_id: string
          weight?: number | null
        }
        Update: {
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          heart_rate?: number | null
          height?: number | null
          id?: string
          measured_at?: string
          measured_by?: string | null
          medical_record_id?: string | null
          notes?: string | null
          oxygen_saturation?: number | null
          pain_scale?: number | null
          patient_id?: string
          respiratory_rate?: number | null
          temperature?: number | null
          visit_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_signs_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_signs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_signs_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_claim_number: { Args: never; Returns: string }
      generate_employee_number: { Args: never; Returns: string }
      generate_insurance_claim_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_lab_number: { Args: never; Returns: string }
      generate_medical_record_number: { Args: never; Returns: string }
      generate_po_number: { Args: never; Returns: string }
      generate_queue_number: {
        Args: { p_service_type: string }
        Returns: string
      }
      generate_visit_number: { Args: never; Returns: string }
      get_user_menu_access: {
        Args: { _user_id: string }
        Returns: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          menu_path: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "dokter"
        | "perawat"
        | "kasir"
        | "farmasi"
        | "laboratorium"
        | "radiologi"
        | "pendaftaran"
      bed_status: "tersedia" | "terisi" | "maintenance" | "reserved"
      billing_status: "pending" | "lunas" | "batal"
      claim_status: "draft" | "submitted" | "approved" | "rejected" | "paid"
      gender_type: "L" | "P"
      insurance_claim_status:
        | "draft"
        | "submitted"
        | "verified"
        | "approved"
        | "partial"
        | "rejected"
        | "paid"
      insurance_type: "bpjs" | "jasa_raharja" | "private" | "corporate"
      patient_status: "aktif" | "non_aktif" | "meninggal"
      payment_type: "bpjs" | "umum" | "asuransi"
      prescription_status:
        | "menunggu"
        | "diproses"
        | "siap"
        | "diserahkan"
        | "batal"
      triage_level: "merah" | "kuning" | "hijau" | "hitam"
      visit_status: "menunggu" | "dipanggil" | "dilayani" | "selesai" | "batal"
      visit_type: "rawat_jalan" | "rawat_inap" | "igd"
    }
    CompositeTypes: {
      [_ in never]: never
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
      app_role: [
        "admin",
        "dokter",
        "perawat",
        "kasir",
        "farmasi",
        "laboratorium",
        "radiologi",
        "pendaftaran",
      ],
      bed_status: ["tersedia", "terisi", "maintenance", "reserved"],
      billing_status: ["pending", "lunas", "batal"],
      claim_status: ["draft", "submitted", "approved", "rejected", "paid"],
      gender_type: ["L", "P"],
      insurance_claim_status: [
        "draft",
        "submitted",
        "verified",
        "approved",
        "partial",
        "rejected",
        "paid",
      ],
      insurance_type: ["bpjs", "jasa_raharja", "private", "corporate"],
      patient_status: ["aktif", "non_aktif", "meninggal"],
      payment_type: ["bpjs", "umum", "asuransi"],
      prescription_status: [
        "menunggu",
        "diproses",
        "siap",
        "diserahkan",
        "batal",
      ],
      triage_level: ["merah", "kuning", "hijau", "hitam"],
      visit_status: ["menunggu", "dipanggil", "dilayani", "selesai", "batal"],
      visit_type: ["rawat_jalan", "rawat_inap", "igd"],
    },
  },
} as const
