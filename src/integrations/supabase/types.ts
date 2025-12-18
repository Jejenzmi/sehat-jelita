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
        }
        Relationships: []
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
          prescription_date: string
          prescription_number: string
          processed_at: string | null
          processed_by: string | null
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
          prescription_date?: string
          prescription_number: string
          processed_at?: string | null
          processed_by?: string | null
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
          prescription_date?: string
          prescription_number?: string
          processed_at?: string | null
          processed_by?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_medical_record_number: { Args: never; Returns: string }
      generate_visit_number: { Args: never; Returns: string }
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
