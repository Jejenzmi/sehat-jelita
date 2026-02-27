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
  __InternalPostgres: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_activities: {
        Row: {
          activity_code: string
          activity_date: string
          activity_type: string
          created_at: string
          department_id: string | null
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          max_participants: number | null
          organizer_id: string | null
          registered_count: number | null
          skp_points: number | null
          speaker_names: string[] | null
          start_time: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_code: string
          activity_date: string
          activity_type: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          registered_count?: number | null
          skp_points?: number | null
          speaker_names?: string[] | null
          start_time?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_code?: string
          activity_date?: string
          activity_type?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          registered_count?: number | null
          skp_points?: number | null
          speaker_names?: string[] | null
          start_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_activities_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "academic_activities_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_activities_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      account_cash_flow_mapping: {
        Row: {
          account_id: string
          cash_flow_category_id: string
          created_at: string | null
          id: string
          is_cash_account: boolean | null
        }
        Insert: {
          account_id: string
          cash_flow_category_id: string
          created_at?: string | null
          id?: string
          is_cash_account?: boolean | null
        }
        Update: {
          account_id?: string
          cash_flow_category_id?: string
          created_at?: string | null
          id?: string
          is_cash_account?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "account_cash_flow_mapping_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_cash_flow_mapping_cash_flow_category_id_fkey"
            columns: ["cash_flow_category_id"]
            isOneToOne: false
            referencedRelation: "cash_flow_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      accreditation_assessments: {
        Row: {
          action_required: string | null
          assessment_date: string
          assessor_id: string | null
          completed_date: string | null
          created_at: string
          due_date: string | null
          element_id: string | null
          evidence: string[] | null
          findings: string | null
          id: string
          notes: string | null
          score: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          action_required?: string | null
          assessment_date: string
          assessor_id?: string | null
          completed_date?: string | null
          created_at?: string
          due_date?: string | null
          element_id?: string | null
          evidence?: string[] | null
          findings?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          action_required?: string | null
          assessment_date?: string
          assessor_id?: string | null
          completed_date?: string | null
          created_at?: string
          due_date?: string | null
          element_id?: string | null
          evidence?: string[] | null
          findings?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accreditation_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accreditation_assessments_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "accreditation_elements"
            referencedColumns: ["id"]
          },
        ]
      }
      accreditation_elements: {
        Row: {
          created_at: string
          description: string | null
          document_requirements: string[] | null
          element_code: string
          element_name: string
          id: string
          max_score: number | null
          scoring_criteria: string | null
          standard_id: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_requirements?: string[] | null
          element_code: string
          element_name: string
          id?: string
          max_score?: number | null
          scoring_criteria?: string | null
          standard_id?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_requirements?: string[] | null
          element_code?: string
          element_name?: string
          id?: string
          max_score?: number | null
          scoring_criteria?: string | null
          standard_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "accreditation_elements_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "accreditation_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      accreditation_standards: {
        Row: {
          accreditation_body: string
          chapter: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          standard_code: string
          standard_name: string
          version: string | null
        }
        Insert: {
          accreditation_body: string
          chapter?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          standard_code: string
          standard_name: string
          version?: string | null
        }
        Update: {
          accreditation_body?: string
          chapter?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          standard_code?: string
          standard_name?: string
          version?: string | null
        }
        Relationships: []
      }
      ambulance_dispatches: {
        Row: {
          ambulance_id: string | null
          arrival_time: string | null
          caller_name: string | null
          caller_phone: string | null
          completion_time: string | null
          created_at: string
          destination: string
          dispatch_number: string
          dispatch_time: string | null
          dispatched_by: string | null
          id: string
          notes: string | null
          patient_info: string
          pickup_location: string
          priority: string
          request_time: string
          status: string
          updated_at: string
        }
        Insert: {
          ambulance_id?: string | null
          arrival_time?: string | null
          caller_name?: string | null
          caller_phone?: string | null
          completion_time?: string | null
          created_at?: string
          destination: string
          dispatch_number: string
          dispatch_time?: string | null
          dispatched_by?: string | null
          id?: string
          notes?: string | null
          patient_info: string
          pickup_location: string
          priority?: string
          request_time?: string
          status?: string
          updated_at?: string
        }
        Update: {
          ambulance_id?: string | null
          arrival_time?: string | null
          caller_name?: string | null
          caller_phone?: string | null
          completion_time?: string | null
          created_at?: string
          destination?: string
          dispatch_number?: string
          dispatch_time?: string | null
          dispatched_by?: string | null
          id?: string
          notes?: string | null
          patient_info?: string
          pickup_location?: string
          priority?: string
          request_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_dispatches_ambulance_id_fkey"
            columns: ["ambulance_id"]
            isOneToOne: false
            referencedRelation: "ambulance_fleet"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulance_fleet: {
        Row: {
          ambulance_code: string
          ambulance_type: string
          created_at: string
          crew_names: string | null
          driver_name: string | null
          equipment_status: string | null
          id: string
          last_service_date: string | null
          next_service_date: string | null
          notes: string | null
          plate_number: string
          status: string
          updated_at: string
        }
        Insert: {
          ambulance_code: string
          ambulance_type?: string
          created_at?: string
          crew_names?: string | null
          driver_name?: string | null
          equipment_status?: string | null
          id?: string
          last_service_date?: string | null
          next_service_date?: string | null
          notes?: string | null
          plate_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          ambulance_code?: string
          ambulance_type?: string
          created_at?: string
          crew_names?: string | null
          driver_name?: string | null
          equipment_status?: string | null
          id?: string
          last_service_date?: string | null
          next_service_date?: string | null
          notes?: string | null
          plate_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      anesthesia_records: {
        Row: {
          airway_assessment: Json | null
          airway_device: string | null
          aldrete_score_admission: number | null
          aldrete_score_discharge: number | null
          allergies: string | null
          anesthesia_complications: string | null
          anesthesiologist_id: string | null
          anesthesiologist_name: string
          blood_products: Json | null
          created_at: string
          emergence_time: string | null
          estimated_blood_loss: number | null
          ett_size: string | null
          extubation_time: string | null
          id: string
          induction_agents: Json | null
          intubation_grade: string | null
          iv_fluids: Json | null
          maintenance_agents: Json | null
          notes: string | null
          npo_status: string | null
          pacu_admission_time: string | null
          pre_anesthesia_assessment: string | null
          premedication: Json | null
          surgery_id: string
          updated_at: string
          urine_output: number | null
          vital_signs_timeline: Json | null
        }
        Insert: {
          airway_assessment?: Json | null
          airway_device?: string | null
          aldrete_score_admission?: number | null
          aldrete_score_discharge?: number | null
          allergies?: string | null
          anesthesia_complications?: string | null
          anesthesiologist_id?: string | null
          anesthesiologist_name: string
          blood_products?: Json | null
          created_at?: string
          emergence_time?: string | null
          estimated_blood_loss?: number | null
          ett_size?: string | null
          extubation_time?: string | null
          id?: string
          induction_agents?: Json | null
          intubation_grade?: string | null
          iv_fluids?: Json | null
          maintenance_agents?: Json | null
          notes?: string | null
          npo_status?: string | null
          pacu_admission_time?: string | null
          pre_anesthesia_assessment?: string | null
          premedication?: Json | null
          surgery_id: string
          updated_at?: string
          urine_output?: number | null
          vital_signs_timeline?: Json | null
        }
        Update: {
          airway_assessment?: Json | null
          airway_device?: string | null
          aldrete_score_admission?: number | null
          aldrete_score_discharge?: number | null
          allergies?: string | null
          anesthesia_complications?: string | null
          anesthesiologist_id?: string | null
          anesthesiologist_name?: string
          blood_products?: Json | null
          created_at?: string
          emergence_time?: string | null
          estimated_blood_loss?: number | null
          ett_size?: string | null
          extubation_time?: string | null
          id?: string
          induction_agents?: Json | null
          intubation_grade?: string | null
          iv_fluids?: Json | null
          maintenance_agents?: Json | null
          notes?: string | null
          npo_status?: string | null
          pacu_admission_time?: string | null
          pre_anesthesia_assessment?: string | null
          premedication?: Json | null
          surgery_id?: string
          updated_at?: string
          urine_output?: number | null
          vital_signs_timeline?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "anesthesia_records_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
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
      aspak_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_count: number | null
          error_details: Json | null
          id: string
          initiated_by: string | null
          notes: string | null
          started_at: string | null
          success_count: number | null
          sync_direction: string | null
          sync_status: string | null
          sync_type: string | null
          total_records: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          error_details?: Json | null
          id?: string
          initiated_by?: string | null
          notes?: string | null
          started_at?: string | null
          success_count?: number | null
          sync_direction?: string | null
          sync_status?: string | null
          sync_type?: string | null
          total_records?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          error_details?: Json | null
          id?: string
          initiated_by?: string | null
          notes?: string | null
          started_at?: string | null
          success_count?: number | null
          sync_direction?: string | null
          sync_status?: string | null
          sync_type?: string | null
          total_records?: number | null
        }
        Relationships: []
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
      autopsy_records: {
        Row: {
          assistant_names: string[] | null
          autopsy_date: string | null
          autopsy_number: string
          autopsy_type: string | null
          case_id: string
          cause_of_death_primary: string | null
          cause_of_death_secondary: string | null
          completed_date: string | null
          contributing_factors: string[] | null
          created_at: string
          external_examination: Json | null
          id: string
          internal_examination: Json | null
          manner_of_death: string | null
          microscopic_findings: string | null
          notes: string | null
          opinion: string | null
          organ_weights: Json | null
          pathologist_id: string | null
          pathologist_name: string | null
          report_finalized: boolean | null
          request_date: string | null
          requested_by: string | null
          status: string | null
          toxicology_results: string | null
          updated_at: string
        }
        Insert: {
          assistant_names?: string[] | null
          autopsy_date?: string | null
          autopsy_number: string
          autopsy_type?: string | null
          case_id: string
          cause_of_death_primary?: string | null
          cause_of_death_secondary?: string | null
          completed_date?: string | null
          contributing_factors?: string[] | null
          created_at?: string
          external_examination?: Json | null
          id?: string
          internal_examination?: Json | null
          manner_of_death?: string | null
          microscopic_findings?: string | null
          notes?: string | null
          opinion?: string | null
          organ_weights?: Json | null
          pathologist_id?: string | null
          pathologist_name?: string | null
          report_finalized?: boolean | null
          request_date?: string | null
          requested_by?: string | null
          status?: string | null
          toxicology_results?: string | null
          updated_at?: string
        }
        Update: {
          assistant_names?: string[] | null
          autopsy_date?: string | null
          autopsy_number?: string
          autopsy_type?: string | null
          case_id?: string
          cause_of_death_primary?: string | null
          cause_of_death_secondary?: string | null
          completed_date?: string | null
          contributing_factors?: string[] | null
          created_at?: string
          external_examination?: Json | null
          id?: string
          internal_examination?: Json | null
          manner_of_death?: string | null
          microscopic_findings?: string | null
          notes?: string | null
          opinion?: string | null
          organ_weights?: Json | null
          pathologist_id?: string | null
          pathologist_name?: string | null
          report_finalized?: boolean | null
          request_date?: string | null
          requested_by?: string | null
          status?: string | null
          toxicology_results?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "autopsy_records_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "mortuary_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autopsy_records_pathologist_id_fkey"
            columns: ["pathologist_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
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
      blood_inventory: {
        Row: {
          bag_number: string
          blood_type: Database["public"]["Enums"]["blood_type"]
          collection_date: string
          created_at: string
          donor_id: string | null
          expiry_date: string
          hbsag_status: string | null
          hcv_status: string | null
          hiv_status: string | null
          id: string
          issued_by: string | null
          issued_date: string | null
          issued_to_department: string | null
          malaria_status: string | null
          notes: string | null
          product_type: Database["public"]["Enums"]["blood_product_type"]
          reserved_for_patient_id: string | null
          screened_by: string | null
          screening_date: string | null
          source_blood_bank: string | null
          status: Database["public"]["Enums"]["blood_status"] | null
          storage_location: string | null
          updated_at: string
          vdrl_status: string | null
          volume: number | null
        }
        Insert: {
          bag_number: string
          blood_type: Database["public"]["Enums"]["blood_type"]
          collection_date: string
          created_at?: string
          donor_id?: string | null
          expiry_date: string
          hbsag_status?: string | null
          hcv_status?: string | null
          hiv_status?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          issued_to_department?: string | null
          malaria_status?: string | null
          notes?: string | null
          product_type: Database["public"]["Enums"]["blood_product_type"]
          reserved_for_patient_id?: string | null
          screened_by?: string | null
          screening_date?: string | null
          source_blood_bank?: string | null
          status?: Database["public"]["Enums"]["blood_status"] | null
          storage_location?: string | null
          updated_at?: string
          vdrl_status?: string | null
          volume?: number | null
        }
        Update: {
          bag_number?: string
          blood_type?: Database["public"]["Enums"]["blood_type"]
          collection_date?: string
          created_at?: string
          donor_id?: string | null
          expiry_date?: string
          hbsag_status?: string | null
          hcv_status?: string | null
          hiv_status?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          issued_to_department?: string | null
          malaria_status?: string | null
          notes?: string | null
          product_type?: Database["public"]["Enums"]["blood_product_type"]
          reserved_for_patient_id?: string | null
          screened_by?: string | null
          screening_date?: string | null
          source_blood_bank?: string | null
          status?: Database["public"]["Enums"]["blood_status"] | null
          storage_location?: string | null
          updated_at?: string
          vdrl_status?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_inventory_reserved_for_patient_id_fkey"
            columns: ["reserved_for_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
      budgets: {
        Row: {
          account_id: string
          actual_amount: number | null
          budget_amount: number | null
          created_at: string | null
          fiscal_year: number
          id: string
          notes: string | null
          period_month: number
          updated_at: string | null
          variance: number | null
        }
        Insert: {
          account_id: string
          actual_amount?: number | null
          budget_amount?: number | null
          created_at?: string | null
          fiscal_year: number
          id?: string
          notes?: string | null
          period_month: number
          updated_at?: string | null
          variance?: number | null
        }
        Update: {
          account_id?: string
          actual_amount?: number | null
          budget_amount?: number | null
          created_at?: string | null
          fiscal_year?: number
          id?: string
          notes?: string | null
          period_month?: number
          updated_at?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_categories: {
        Row: {
          category_name: string
          category_type: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          category_name: string
          category_type: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          category_name?: string
          category_type?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_category: string | null
          account_code: string
          account_name: string
          account_type: string
          created_at: string | null
          current_balance: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_header: boolean | null
          level: number | null
          normal_balance: string | null
          opening_balance: number | null
          parent_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_category?: string | null
          account_code: string
          account_name: string
          account_type: string
          created_at?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_header?: boolean | null
          level?: number | null
          normal_balance?: string | null
          opening_balance?: number | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_category?: string | null
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_header?: boolean | null
          level?: number | null
          normal_balance?: string | null
          opening_balance?: number | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
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
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "chat_rooms_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_rotations: {
        Row: {
          created_at: string
          department_id: string | null
          end_date: string
          evaluation_notes: string | null
          evaluation_score: number | null
          id: string
          rotation_type: string | null
          start_date: string
          status: string | null
          supervisor_id: string | null
          trainee_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          end_date: string
          evaluation_notes?: string | null
          evaluation_score?: number | null
          id?: string
          rotation_type?: string | null
          start_date: string
          status?: string | null
          supervisor_id?: string | null
          trainee_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          end_date?: string
          evaluation_notes?: string | null
          evaluation_score?: number | null
          id?: string
          rotation_type?: string | null
          start_date?: string
          status?: string | null
          supervisor_id?: string | null
          trainee_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_rotations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "clinical_rotations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_rotations_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_rotations_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "medical_trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_templates: {
        Row: {
          alternatives_explanation: string | null
          category: string
          content_template: string
          created_at: string
          id: string
          is_active: boolean | null
          language: string | null
          risks_explanation: string | null
          template_code: string
          template_name: string
          updated_at: string
          version: string | null
        }
        Insert: {
          alternatives_explanation?: string | null
          category: string
          content_template: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          risks_explanation?: string | null
          template_code: string
          template_name: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          alternatives_explanation?: string | null
          category?: string
          content_template?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          risks_explanation?: string | null
          template_code?: string
          template_name?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      corporate_clients: {
        Row: {
          address: string | null
          company_code: string | null
          company_name: string
          contract_end: string | null
          contract_start: string | null
          created_at: string
          discount_percentage: number | null
          email: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          payment_terms: string | null
          phone: string | null
          pic_name: string | null
          pic_phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_code?: string | null
          company_name: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          discount_percentage?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_code?: string | null
          company_name?: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          discount_percentage?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crossmatch_tests: {
        Row: {
          antibody_screen: string | null
          blood_bag_id: string
          created_at: string
          dat_result: string | null
          iat_result: string | null
          id: string
          is_compatible: boolean | null
          major_crossmatch:
            | Database["public"]["Enums"]["crossmatch_result"]
            | null
          minor_crossmatch:
            | Database["public"]["Enums"]["crossmatch_result"]
            | null
          notes: string | null
          patient_id: string
          request_id: string | null
          test_date: string
          tested_by: string | null
          valid_until: string | null
        }
        Insert: {
          antibody_screen?: string | null
          blood_bag_id: string
          created_at?: string
          dat_result?: string | null
          iat_result?: string | null
          id?: string
          is_compatible?: boolean | null
          major_crossmatch?:
            | Database["public"]["Enums"]["crossmatch_result"]
            | null
          minor_crossmatch?:
            | Database["public"]["Enums"]["crossmatch_result"]
            | null
          notes?: string | null
          patient_id: string
          request_id?: string | null
          test_date?: string
          tested_by?: string | null
          valid_until?: string | null
        }
        Update: {
          antibody_screen?: string | null
          blood_bag_id?: string
          created_at?: string
          dat_result?: string | null
          iat_result?: string | null
          id?: string
          is_compatible?: boolean | null
          major_crossmatch?:
            | Database["public"]["Enums"]["crossmatch_result"]
            | null
          minor_crossmatch?:
            | Database["public"]["Enums"]["crossmatch_result"]
            | null
          notes?: string | null
          patient_id?: string
          request_id?: string | null
          test_date?: string
          tested_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crossmatch_tests_blood_bag_id_fkey"
            columns: ["blood_bag_id"]
            isOneToOne: false
            referencedRelation: "blood_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crossmatch_tests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crossmatch_tests_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "transfusion_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_form_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          fields: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_report_templates: {
        Row: {
          chart_type: string
          columns: Json
          created_at: string
          created_by: string | null
          data_source: string
          description: string | null
          filters: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          chart_type?: string
          columns?: Json
          created_at?: string
          created_by?: string | null
          data_source: string
          description?: string | null
          filters?: Json
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          chart_type?: string
          columns?: Json
          created_at?: string
          created_by?: string | null
          data_source?: string
          description?: string | null
          filters?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      death_certificates: {
        Row: {
          address: string | null
          antecedent_cause: string | null
          autopsy_performed: boolean | null
          burial_permit_issued: boolean | null
          burial_permit_number: string | null
          case_id: string | null
          certificate_number: string
          certification_date: string
          certifying_doctor_id: string | null
          certifying_doctor_name: string
          contributing_conditions: string | null
          created_at: string
          date_of_birth: string | null
          date_of_death: string
          deceased_name: string
          gender: string | null
          id: string
          immediate_cause: string | null
          issued_date: string | null
          manner_of_death: string | null
          marital_status: string | null
          nationality: string | null
          nik: string | null
          notes: string | null
          occupation: string | null
          patient_id: string | null
          place_of_birth: string | null
          place_of_death: string | null
          religion: string | null
          status: string | null
          underlying_cause: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          antecedent_cause?: string | null
          autopsy_performed?: boolean | null
          burial_permit_issued?: boolean | null
          burial_permit_number?: string | null
          case_id?: string | null
          certificate_number: string
          certification_date?: string
          certifying_doctor_id?: string | null
          certifying_doctor_name: string
          contributing_conditions?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death: string
          deceased_name: string
          gender?: string | null
          id?: string
          immediate_cause?: string | null
          issued_date?: string | null
          manner_of_death?: string | null
          marital_status?: string | null
          nationality?: string | null
          nik?: string | null
          notes?: string | null
          occupation?: string | null
          patient_id?: string | null
          place_of_birth?: string | null
          place_of_death?: string | null
          religion?: string | null
          status?: string | null
          underlying_cause?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          antecedent_cause?: string | null
          autopsy_performed?: boolean | null
          burial_permit_issued?: boolean | null
          burial_permit_number?: string | null
          case_id?: string | null
          certificate_number?: string
          certification_date?: string
          certifying_doctor_id?: string | null
          certifying_doctor_name?: string
          contributing_conditions?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string
          deceased_name?: string
          gender?: string | null
          id?: string
          immediate_cause?: string | null
          issued_date?: string | null
          manner_of_death?: string | null
          marital_status?: string | null
          nationality?: string | null
          nik?: string | null
          notes?: string | null
          occupation?: string | null
          patient_id?: string | null
          place_of_birth?: string | null
          place_of_death?: string | null
          religion?: string | null
          status?: string | null
          underlying_cause?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "death_certificates_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "mortuary_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "death_certificates_certifying_doctor_id_fkey"
            columns: ["certifying_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "death_certificates_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_accounts: {
        Row: {
          created_at: string | null
          description: string | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          email: string
          full_name: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          satusehat_location_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          satusehat_location_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          satusehat_location_id?: string | null
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
      diagnosis_drg_mapping: {
        Row: {
          created_at: string
          drg_id: string | null
          icd10_code: string
          icd9cm_code: string | null
          id: string
          los_max: number | null
          los_min: number | null
          notes: string | null
        }
        Insert: {
          created_at?: string
          drg_id?: string | null
          icd10_code: string
          icd9cm_code?: string | null
          id?: string
          los_max?: number | null
          los_min?: number | null
          notes?: string | null
        }
        Update: {
          created_at?: string
          drg_id?: string | null
          icd10_code?: string
          icd9cm_code?: string | null
          id?: string
          los_max?: number | null
          los_min?: number | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnosis_drg_mapping_drg_id_fkey"
            columns: ["drg_id"]
            isOneToOne: false
            referencedRelation: "inadrg_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      dialysis_machines: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          is_available: boolean | null
          last_maintenance_date: string | null
          machine_number: string
          model: string | null
          next_maintenance_date: string | null
          notes: string | null
          serial_number: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          last_maintenance_date?: string | null
          machine_number: string
          model?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          serial_number?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          last_maintenance_date?: string | null
          machine_number?: string
          model?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          serial_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dialysis_monitoring: {
        Row: {
          arterial_pressure: number | null
          blood_flow_rate: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          conductivity: number | null
          created_at: string
          heart_rate: number | null
          id: string
          interventions: string | null
          recorded_at: string
          recorded_by: string | null
          session_id: string
          symptoms: string | null
          temperature: number | null
          time_elapsed: number | null
          tmp: number | null
          uf_rate: number | null
          uf_total: number | null
          venous_pressure: number | null
        }
        Insert: {
          arterial_pressure?: number | null
          blood_flow_rate?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          conductivity?: number | null
          created_at?: string
          heart_rate?: number | null
          id?: string
          interventions?: string | null
          recorded_at?: string
          recorded_by?: string | null
          session_id: string
          symptoms?: string | null
          temperature?: number | null
          time_elapsed?: number | null
          tmp?: number | null
          uf_rate?: number | null
          uf_total?: number | null
          venous_pressure?: number | null
        }
        Update: {
          arterial_pressure?: number | null
          blood_flow_rate?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          conductivity?: number | null
          created_at?: string
          heart_rate?: number | null
          id?: string
          interventions?: string | null
          recorded_at?: string
          recorded_by?: string | null
          session_id?: string
          symptoms?: string | null
          temperature?: number | null
          time_elapsed?: number | null
          tmp?: number | null
          uf_rate?: number | null
          uf_total?: number | null
          venous_pressure?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dialysis_monitoring_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dialysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dialysis_sessions: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          actual_uf: number | null
          attending_doctor_id: string | null
          blood_flow_rate: number | null
          created_at: string
          dialysate_composition: string | null
          dialysate_flow_rate: number | null
          dialysis_type: Database["public"]["Enums"]["dialysis_type"] | null
          dialyzer_type: string | null
          dry_weight: number | null
          duration_actual: number | null
          duration_planned: number | null
          heparin_dose: string | null
          id: string
          interventions: string | null
          intradialytic_complications: Json | null
          kt_v: number | null
          machine_id: string | null
          notes: string | null
          nurse_id: string | null
          patient_id: string
          post_bp_diastolic: number | null
          post_bp_systolic: number | null
          post_heart_rate: number | null
          post_weight: number | null
          pre_bp_diastolic: number | null
          pre_bp_systolic: number | null
          pre_heart_rate: number | null
          pre_temperature: number | null
          pre_weight: number | null
          scheduled_time: string | null
          session_date: string
          session_number: string
          sodium_profile: string | null
          status: Database["public"]["Enums"]["session_status"] | null
          target_uf: number | null
          uf_profile: string | null
          updated_at: string
          urr: number | null
          vascular_access_id: string | null
          visit_id: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          actual_uf?: number | null
          attending_doctor_id?: string | null
          blood_flow_rate?: number | null
          created_at?: string
          dialysate_composition?: string | null
          dialysate_flow_rate?: number | null
          dialysis_type?: Database["public"]["Enums"]["dialysis_type"] | null
          dialyzer_type?: string | null
          dry_weight?: number | null
          duration_actual?: number | null
          duration_planned?: number | null
          heparin_dose?: string | null
          id?: string
          interventions?: string | null
          intradialytic_complications?: Json | null
          kt_v?: number | null
          machine_id?: string | null
          notes?: string | null
          nurse_id?: string | null
          patient_id: string
          post_bp_diastolic?: number | null
          post_bp_systolic?: number | null
          post_heart_rate?: number | null
          post_weight?: number | null
          pre_bp_diastolic?: number | null
          pre_bp_systolic?: number | null
          pre_heart_rate?: number | null
          pre_temperature?: number | null
          pre_weight?: number | null
          scheduled_time?: string | null
          session_date: string
          session_number: string
          sodium_profile?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          target_uf?: number | null
          uf_profile?: string | null
          updated_at?: string
          urr?: number | null
          vascular_access_id?: string | null
          visit_id?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          actual_uf?: number | null
          attending_doctor_id?: string | null
          blood_flow_rate?: number | null
          created_at?: string
          dialysate_composition?: string | null
          dialysate_flow_rate?: number | null
          dialysis_type?: Database["public"]["Enums"]["dialysis_type"] | null
          dialyzer_type?: string | null
          dry_weight?: number | null
          duration_actual?: number | null
          duration_planned?: number | null
          heparin_dose?: string | null
          id?: string
          interventions?: string | null
          intradialytic_complications?: Json | null
          kt_v?: number | null
          machine_id?: string | null
          notes?: string | null
          nurse_id?: string | null
          patient_id?: string
          post_bp_diastolic?: number | null
          post_bp_systolic?: number | null
          post_heart_rate?: number | null
          post_weight?: number | null
          pre_bp_diastolic?: number | null
          pre_bp_systolic?: number | null
          pre_heart_rate?: number | null
          pre_temperature?: number | null
          pre_weight?: number | null
          scheduled_time?: string | null
          session_date?: string
          session_number?: string
          sodium_profile?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          target_uf?: number | null
          uf_profile?: string | null
          updated_at?: string
          urr?: number | null
          vascular_access_id?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dialysis_sessions_attending_doctor_id_fkey"
            columns: ["attending_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialysis_sessions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "dialysis_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialysis_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialysis_sessions_vascular_access_id_fkey"
            columns: ["vascular_access_id"]
            isOneToOne: false
            referencedRelation: "vascular_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dialysis_sessions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      dicom_server_configs: {
        Row: {
          ae_title: string | null
          created_at: string
          created_by: string | null
          host: string
          id: string
          is_active: boolean
          last_checked_at: string | null
          last_status: string | null
          port: number
          protocol: string | null
          server_name: string
          server_type: string
          updated_at: string
        }
        Insert: {
          ae_title?: string | null
          created_at?: string
          created_by?: string | null
          host: string
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          last_status?: string | null
          port?: number
          protocol?: string | null
          server_name: string
          server_type?: string
          updated_at?: string
        }
        Update: {
          ae_title?: string | null
          created_at?: string
          created_by?: string | null
          host?: string
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          last_status?: string | null
          port?: number
          protocol?: string | null
          server_name?: string
          server_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      diet_types: {
        Row: {
          calories_target: number | null
          carbs_target: number | null
          category: Database["public"]["Enums"]["diet_category"]
          created_at: string
          description: string | null
          fat_target: number | null
          id: string
          is_active: boolean | null
          name: string
          protein_target: number | null
          restrictions: string[] | null
        }
        Insert: {
          calories_target?: number | null
          carbs_target?: number | null
          category?: Database["public"]["Enums"]["diet_category"]
          created_at?: string
          description?: string | null
          fat_target?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          protein_target?: number | null
          restrictions?: string[] | null
        }
        Update: {
          calories_target?: number | null
          carbs_target?: number | null
          category?: Database["public"]["Enums"]["diet_category"]
          created_at?: string
          description?: string | null
          fat_target?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          protein_target?: number | null
          restrictions?: string[] | null
        }
        Relationships: []
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
          academic_title: string | null
          consultation_fee: number | null
          created_at: string
          department_id: string | null
          full_name: string
          id: string
          is_active: boolean
          is_subspecialist: boolean | null
          nik: string | null
          profile_id: string | null
          satusehat_practitioner_id: string | null
          sip_number: string
          specialization: string | null
          subspecialty_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          academic_title?: string | null
          consultation_fee?: number | null
          created_at?: string
          department_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          is_subspecialist?: boolean | null
          nik?: string | null
          profile_id?: string | null
          satusehat_practitioner_id?: string | null
          sip_number: string
          specialization?: string | null
          subspecialty_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          academic_title?: string | null
          consultation_fee?: number | null
          created_at?: string
          department_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_subspecialist?: boolean | null
          nik?: string | null
          profile_id?: string | null
          satusehat_practitioner_id?: string | null
          sip_number?: string
          specialization?: string | null
          subspecialty_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
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
          {
            foreignKeyName: "doctors_subspecialty_id_fkey"
            columns: ["subspecialty_id"]
            isOneToOne: false
            referencedRelation: "subspecialties"
            referencedColumns: ["id"]
          },
        ]
      }
      education_programs: {
        Row: {
          accreditation_status: string | null
          affiliated_university: string | null
          coordinator_id: string | null
          created_at: string
          department_id: string | null
          duration_months: number | null
          id: string
          is_active: boolean | null
          max_students: number | null
          program_code: string
          program_name: string
          program_type: string
          updated_at: string
        }
        Insert: {
          accreditation_status?: string | null
          affiliated_university?: string | null
          coordinator_id?: string | null
          created_at?: string
          department_id?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          program_code: string
          program_name: string
          program_type: string
          updated_at?: string
        }
        Update: {
          accreditation_status?: string | null
          affiliated_university?: string | null
          coordinator_id?: string | null
          created_at?: string
          department_id?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          program_code?: string
          program_name?: string
          program_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_programs_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_programs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "education_programs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
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
      employee_allowances: {
        Row: {
          amount: number
          component_id: string
          created_at: string
          effective_date: string
          employee_id: string
          end_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          component_id: string
          created_at?: string
          effective_date: string
          employee_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          component_id?: string
          created_at?: string
          effective_date?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_allowances_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "salary_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_allowances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_deductions: {
        Row: {
          amount: number
          component_id: string
          created_at: string
          effective_date: string
          employee_id: string
          end_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          component_id: string
          created_at?: string
          effective_date: string
          employee_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          component_id?: string
          created_at?: string
          effective_date?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_deductions_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "salary_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_deductions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          document_name: string
          document_number: string | null
          document_type: string
          employee_id: string
          expiry_date: string | null
          file_url: string | null
          id: string
          is_verified: boolean | null
          issue_date: string | null
          notes: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_name: string
          document_number?: string | null
          document_type: string
          employee_id: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          notes?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_name?: string
          document_number?: string | null
          document_type?: string
          employee_id?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          notes?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      employee_grades: {
        Row: {
          created_at: string
          description: string | null
          grade_code: string
          grade_name: string
          id: string
          is_active: boolean | null
          level: number
          max_salary: number | null
          min_salary: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          grade_code: string
          grade_name: string
          id?: string
          is_active?: boolean | null
          level: number
          max_salary?: number | null
          min_salary?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          grade_code?: string
          grade_name?: string
          id?: string
          is_active?: boolean | null
          level?: number
          max_salary?: number | null
          min_salary?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_schedules: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          is_off_day: boolean | null
          notes: string | null
          schedule_date: string
          shift_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          is_off_day?: boolean | null
          notes?: string | null
          schedule_date: string
          shift_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          is_off_day?: boolean | null
          notes?: string | null
          schedule_date?: string
          shift_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedules_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "work_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          academic_title: string | null
          address: string | null
          bank_account: string | null
          bank_name: string | null
          birth_date: string | null
          birth_place: string | null
          blood_type: string | null
          bpjs_kesehatan: string | null
          bpjs_ketenagakerjaan: string | null
          created_at: string
          department_id: string | null
          education_level: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_number: string
          employment_type: string
          end_date: string | null
          full_name: string
          gender: string | null
          grade_id: string | null
          id: string
          join_date: string
          ktp_url: string | null
          last_education: string | null
          marital_status: string | null
          nationality: string | null
          nik: string | null
          notes: string | null
          npwp: string | null
          phone: string | null
          photo_url: string | null
          position: string
          position_id: string | null
          religion: string | null
          salary: number | null
          satusehat_practitioner_id: string | null
          sip_expiry_date: string | null
          sip_number: string | null
          sip_url: string | null
          specialization: string | null
          status: string
          str_expiry_date: string | null
          str_number: string | null
          str_url: string | null
          tax_status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          academic_title?: string | null
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          blood_type?: string | null
          bpjs_kesehatan?: string | null
          bpjs_ketenagakerjaan?: string | null
          created_at?: string
          department_id?: string | null
          education_level?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number: string
          employment_type?: string
          end_date?: string | null
          full_name: string
          gender?: string | null
          grade_id?: string | null
          id?: string
          join_date: string
          ktp_url?: string | null
          last_education?: string | null
          marital_status?: string | null
          nationality?: string | null
          nik?: string | null
          notes?: string | null
          npwp?: string | null
          phone?: string | null
          photo_url?: string | null
          position: string
          position_id?: string | null
          religion?: string | null
          salary?: number | null
          satusehat_practitioner_id?: string | null
          sip_expiry_date?: string | null
          sip_number?: string | null
          sip_url?: string | null
          specialization?: string | null
          status?: string
          str_expiry_date?: string | null
          str_number?: string | null
          str_url?: string | null
          tax_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          academic_title?: string | null
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          blood_type?: string | null
          bpjs_kesehatan?: string | null
          bpjs_ketenagakerjaan?: string | null
          created_at?: string
          department_id?: string | null
          education_level?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string
          employment_type?: string
          end_date?: string | null
          full_name?: string
          gender?: string | null
          grade_id?: string | null
          id?: string
          join_date?: string
          ktp_url?: string | null
          last_education?: string | null
          marital_status?: string | null
          nationality?: string | null
          nik?: string | null
          notes?: string | null
          npwp?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string
          position_id?: string | null
          religion?: string | null
          salary?: number | null
          satusehat_practitioner_id?: string | null
          sip_expiry_date?: string | null
          sip_number?: string | null
          sip_url?: string | null
          specialization?: string | null
          status?: string
          str_expiry_date?: string | null
          str_number?: string | null
          str_url?: string | null
          tax_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "employee_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_calibrations: {
        Row: {
          calibration_date: string
          calibration_number: string | null
          calibration_result: string | null
          calibrator_accreditation: string | null
          calibrator_institution: string | null
          calibrator_name: string | null
          certificate_expiry: string | null
          certificate_number: string | null
          certificate_url: string | null
          corrective_action: string | null
          cost: number | null
          created_at: string | null
          deviation_found: string | null
          equipment_id: string | null
          id: string
          next_calibration_date: string | null
          notes: string | null
          performed_by: string | null
          updated_at: string | null
        }
        Insert: {
          calibration_date: string
          calibration_number?: string | null
          calibration_result?: string | null
          calibrator_accreditation?: string | null
          calibrator_institution?: string | null
          calibrator_name?: string | null
          certificate_expiry?: string | null
          certificate_number?: string | null
          certificate_url?: string | null
          corrective_action?: string | null
          cost?: number | null
          created_at?: string | null
          deviation_found?: string | null
          equipment_id?: string | null
          id?: string
          next_calibration_date?: string | null
          notes?: string | null
          performed_by?: string | null
          updated_at?: string | null
        }
        Update: {
          calibration_date?: string
          calibration_number?: string | null
          calibration_result?: string | null
          calibrator_accreditation?: string | null
          calibrator_institution?: string | null
          calibrator_name?: string | null
          certificate_expiry?: string | null
          certificate_number?: string | null
          certificate_url?: string | null
          corrective_action?: string | null
          cost?: number | null
          created_at?: string | null
          deviation_found?: string | null
          equipment_id?: string | null
          id?: string
          next_calibration_date?: string | null
          notes?: string | null
          performed_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_calibrations_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "medical_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_calibrations_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_categories: {
        Row: {
          calibration_required: boolean | null
          category_code: string
          category_name: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          parent_id: string | null
          risk_class: string | null
        }
        Insert: {
          calibration_required?: boolean | null
          category_code: string
          category_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          risk_class?: string | null
        }
        Update: {
          calibration_required?: boolean | null
          category_code?: string
          category_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          risk_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance: {
        Row: {
          actions_taken: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          downtime_hours: number | null
          equipment_id: string | null
          findings: string | null
          id: string
          maintenance_date: string
          maintenance_number: string | null
          maintenance_type: string | null
          next_maintenance_date: string | null
          notes: string | null
          parts_replaced: Json | null
          performed_by: string | null
          status: string | null
          technician_institution: string | null
          technician_name: string | null
          updated_at: string | null
        }
        Insert: {
          actions_taken?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          downtime_hours?: number | null
          equipment_id?: string | null
          findings?: string | null
          id?: string
          maintenance_date: string
          maintenance_number?: string | null
          maintenance_type?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          parts_replaced?: Json | null
          performed_by?: string | null
          status?: string | null
          technician_institution?: string | null
          technician_name?: string | null
          updated_at?: string | null
        }
        Update: {
          actions_taken?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          downtime_hours?: number | null
          equipment_id?: string | null
          findings?: string | null
          id?: string
          maintenance_date?: string
          maintenance_number?: string | null
          maintenance_type?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          parts_replaced?: Json | null
          performed_by?: string | null
          status?: string | null
          technician_institution?: string | null
          technician_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "medical_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          end_date: string
          fiscal_year: number
          id: string
          is_closed: boolean | null
          period_name: string
          period_number: number
          start_date: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          end_date: string
          fiscal_year: number
          id?: string
          is_closed?: boolean | null
          period_name: string
          period_number: number
          start_date: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          end_date?: string
          fiscal_year?: number
          id?: string
          is_closed?: boolean | null
          period_name?: string
          period_number?: number
          start_date?: string
        }
        Relationships: []
      }
      food_allergies: {
        Row: {
          allergen: string
          created_at: string
          diagnosed_date: string | null
          id: string
          notes: string | null
          patient_id: string
          reaction_description: string | null
          severity: string | null
          updated_at: string
        }
        Insert: {
          allergen: string
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reaction_description?: string | null
          severity?: string | null
          updated_at?: string
        }
        Update: {
          allergen?: string
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reaction_description?: string | null
          severity?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      general_ledger: {
        Row: {
          account_id: string
          closing_balance: number | null
          fiscal_period_id: string | null
          id: string
          last_updated: string | null
          opening_balance: number | null
          period_month: number
          period_year: number
          total_credit: number | null
          total_debit: number | null
          transaction_count: number | null
        }
        Insert: {
          account_id: string
          closing_balance?: number | null
          fiscal_period_id?: string | null
          id?: string
          last_updated?: string | null
          opening_balance?: number | null
          period_month: number
          period_year: number
          total_credit?: number | null
          total_debit?: number | null
          transaction_count?: number | null
        }
        Update: {
          account_id?: string
          closing_balance?: number | null
          fiscal_period_id?: string | null
          id?: string
          last_updated?: string | null
          opening_balance?: number | null
          period_month?: number
          period_year?: number
          total_credit?: number | null
          total_debit?: number | null
          transaction_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "general_ledger_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_ledger_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      home_care_visits: {
        Row: {
          address: string
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          created_by: string | null
          doctor_id: string | null
          doctor_name: string | null
          id: string
          notes: string | null
          nurse_id: string | null
          nurse_name: string
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          service_type: string
          status: string
          updated_at: string
          visit_date: string
          visit_number: string
          visit_time: string
        }
        Insert: {
          address: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          doctor_name?: string | null
          id?: string
          notes?: string | null
          nurse_id?: string | null
          nurse_name: string
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          service_type: string
          status?: string
          updated_at?: string
          visit_date: string
          visit_number: string
          visit_time: string
        }
        Update: {
          address?: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          doctor_name?: string | null
          id?: string
          notes?: string | null
          nurse_id?: string | null
          nurse_name?: string
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          service_type?: string
          status?: string
          updated_at?: string
          visit_date?: string
          visit_number?: string
          visit_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_care_visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_care_visits_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_care_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_enabled_modules: {
        Row: {
          enabled_at: string | null
          enabled_by: string | null
          id: string
          is_enabled: boolean | null
          module_id: string | null
        }
        Insert: {
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          is_enabled?: boolean | null
          module_id?: string | null
        }
        Update: {
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          is_enabled?: boolean | null
          module_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospital_enabled_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: true
            referencedRelation: "module_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_profile: {
        Row: {
          accreditation_date: string | null
          accreditation_expiry: string | null
          accreditation_status: string | null
          address: string | null
          bed_count_class1: number | null
          bed_count_class2: number | null
          bed_count_class3: number | null
          bed_count_icu: number | null
          bed_count_nicu: number | null
          bed_count_picu: number | null
          bed_count_total: number | null
          bed_count_vip: number | null
          city: string | null
          created_at: string | null
          director_name: string | null
          director_nip: string | null
          email: string | null
          enabled_modules: Json | null
          facility_level:
            | Database["public"]["Enums"]["hospital_type_enum"]
            | null
          fax: string | null
          hospital_code: string
          hospital_name: string
          hospital_type: string | null
          id: string
          is_teaching_hospital: boolean | null
          operational_permit_date: string | null
          operational_permit_expiry: string | null
          operational_permit_number: string | null
          ownership: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          services_available: Json | null
          setup_completed: boolean | null
          setup_completed_at: string | null
          setup_completed_by: string | null
          teaching_affiliation: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          accreditation_date?: string | null
          accreditation_expiry?: string | null
          accreditation_status?: string | null
          address?: string | null
          bed_count_class1?: number | null
          bed_count_class2?: number | null
          bed_count_class3?: number | null
          bed_count_icu?: number | null
          bed_count_nicu?: number | null
          bed_count_picu?: number | null
          bed_count_total?: number | null
          bed_count_vip?: number | null
          city?: string | null
          created_at?: string | null
          director_name?: string | null
          director_nip?: string | null
          email?: string | null
          enabled_modules?: Json | null
          facility_level?:
            | Database["public"]["Enums"]["hospital_type_enum"]
            | null
          fax?: string | null
          hospital_code: string
          hospital_name: string
          hospital_type?: string | null
          id?: string
          is_teaching_hospital?: boolean | null
          operational_permit_date?: string | null
          operational_permit_expiry?: string | null
          operational_permit_number?: string | null
          ownership?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          services_available?: Json | null
          setup_completed?: boolean | null
          setup_completed_at?: string | null
          setup_completed_by?: string | null
          teaching_affiliation?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          accreditation_date?: string | null
          accreditation_expiry?: string | null
          accreditation_status?: string | null
          address?: string | null
          bed_count_class1?: number | null
          bed_count_class2?: number | null
          bed_count_class3?: number | null
          bed_count_icu?: number | null
          bed_count_nicu?: number | null
          bed_count_picu?: number | null
          bed_count_total?: number | null
          bed_count_vip?: number | null
          city?: string | null
          created_at?: string | null
          director_name?: string | null
          director_nip?: string | null
          email?: string | null
          enabled_modules?: Json | null
          facility_level?:
            | Database["public"]["Enums"]["hospital_type_enum"]
            | null
          fax?: string | null
          hospital_code?: string
          hospital_name?: string
          hospital_type?: string | null
          id?: string
          is_teaching_hospital?: boolean | null
          operational_permit_date?: string | null
          operational_permit_expiry?: string | null
          operational_permit_number?: string | null
          ownership?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          services_available?: Json | null
          setup_completed?: boolean | null
          setup_completed_at?: string | null
          setup_completed_by?: string | null
          teaching_affiliation?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      hospital_type_migrations: {
        Row: {
          created_at: string | null
          from_type: string
          id: string
          migrated_by: string | null
          migration_notes: string | null
          modules_added: string[] | null
          modules_removed: string[] | null
          to_type: string
        }
        Insert: {
          created_at?: string | null
          from_type: string
          id?: string
          migrated_by?: string | null
          migration_notes?: string | null
          modules_added?: string[] | null
          modules_removed?: string[] | null
          to_type: string
        }
        Update: {
          created_at?: string | null
          from_type?: string
          id?: string
          migrated_by?: string | null
          migration_notes?: string | null
          modules_added?: string[] | null
          modules_removed?: string[] | null
          to_type?: string
        }
        Relationships: []
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
      icu_admissions: {
        Row: {
          admission_date: string
          admission_diagnosis: string | null
          admission_number: string
          admission_reason: string
          apache_ii_score: number | null
          attending_doctor_id: string | null
          created_at: string
          discharge_date: string | null
          discharge_destination: string | null
          discharge_reason: string | null
          icu_bed_id: string | null
          icu_type: Database["public"]["Enums"]["icu_type"]
          id: string
          notes: string | null
          patient_id: string
          sofa_score: number | null
          status: Database["public"]["Enums"]["icu_admission_status"] | null
          total_icu_days: number | null
          updated_at: string
          visit_id: string
        }
        Insert: {
          admission_date?: string
          admission_diagnosis?: string | null
          admission_number: string
          admission_reason: string
          apache_ii_score?: number | null
          attending_doctor_id?: string | null
          created_at?: string
          discharge_date?: string | null
          discharge_destination?: string | null
          discharge_reason?: string | null
          icu_bed_id?: string | null
          icu_type: Database["public"]["Enums"]["icu_type"]
          id?: string
          notes?: string | null
          patient_id: string
          sofa_score?: number | null
          status?: Database["public"]["Enums"]["icu_admission_status"] | null
          total_icu_days?: number | null
          updated_at?: string
          visit_id: string
        }
        Update: {
          admission_date?: string
          admission_diagnosis?: string | null
          admission_number?: string
          admission_reason?: string
          apache_ii_score?: number | null
          attending_doctor_id?: string | null
          created_at?: string
          discharge_date?: string | null
          discharge_destination?: string | null
          discharge_reason?: string | null
          icu_bed_id?: string | null
          icu_type?: Database["public"]["Enums"]["icu_type"]
          id?: string
          notes?: string | null
          patient_id?: string
          sofa_score?: number | null
          status?: Database["public"]["Enums"]["icu_admission_status"] | null
          total_icu_days?: number | null
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "icu_admissions_attending_doctor_id_fkey"
            columns: ["attending_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icu_admissions_icu_bed_id_fkey"
            columns: ["icu_bed_id"]
            isOneToOne: false
            referencedRelation: "icu_beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icu_admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icu_admissions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      icu_beds: {
        Row: {
          bed_number: string
          created_at: string
          equipment_notes: string | null
          has_monitor: boolean | null
          has_ventilator: boolean | null
          icu_type: Database["public"]["Enums"]["icu_type"]
          id: string
          is_available: boolean | null
          updated_at: string
        }
        Insert: {
          bed_number: string
          created_at?: string
          equipment_notes?: string | null
          has_monitor?: boolean | null
          has_ventilator?: boolean | null
          icu_type: Database["public"]["Enums"]["icu_type"]
          id?: string
          is_available?: boolean | null
          updated_at?: string
        }
        Update: {
          bed_number?: string
          created_at?: string
          equipment_notes?: string | null
          has_monitor?: boolean | null
          has_ventilator?: boolean | null
          icu_type?: Database["public"]["Enums"]["icu_type"]
          id?: string
          is_available?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      icu_monitoring: {
        Row: {
          admission_id: string
          blood_glucose: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          cardiac_output: number | null
          created_at: string
          cvp: number | null
          etco2: number | null
          fluid_balance: number | null
          gcs_eye: number | null
          gcs_motor: number | null
          gcs_total: number | null
          gcs_verbal: number | null
          heart_rate: number | null
          id: string
          intake_total: number | null
          map: number | null
          notes: string | null
          output_total: number | null
          pain_score: number | null
          pupil_left: string | null
          pupil_right: string | null
          recorded_at: string
          recorded_by: string | null
          respiratory_rate: number | null
          sedation_score: number | null
          spo2: number | null
          temperature: number | null
          urine_output: number | null
        }
        Insert: {
          admission_id: string
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          cardiac_output?: number | null
          created_at?: string
          cvp?: number | null
          etco2?: number | null
          fluid_balance?: number | null
          gcs_eye?: number | null
          gcs_motor?: number | null
          gcs_total?: number | null
          gcs_verbal?: number | null
          heart_rate?: number | null
          id?: string
          intake_total?: number | null
          map?: number | null
          notes?: string | null
          output_total?: number | null
          pain_score?: number | null
          pupil_left?: string | null
          pupil_right?: string | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          sedation_score?: number | null
          spo2?: number | null
          temperature?: number | null
          urine_output?: number | null
        }
        Update: {
          admission_id?: string
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          cardiac_output?: number | null
          created_at?: string
          cvp?: number | null
          etco2?: number | null
          fluid_balance?: number | null
          gcs_eye?: number | null
          gcs_motor?: number | null
          gcs_total?: number | null
          gcs_verbal?: number | null
          heart_rate?: number | null
          id?: string
          intake_total?: number | null
          map?: number | null
          notes?: string | null
          output_total?: number | null
          pain_score?: number | null
          pupil_left?: string | null
          pupil_right?: string | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          sedation_score?: number | null
          spo2?: number | null
          temperature?: number | null
          urine_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "icu_monitoring_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "icu_admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      icu_nursing_charts: {
        Row: {
          admission_id: string
          assessment: string | null
          chart_date: string
          created_at: string
          handover_notes: string | null
          id: string
          interventions: Json | null
          lines_and_tubes: Json | null
          medications_given: Json | null
          nurse_id: string | null
          patient_response: string | null
          shift: string
          updated_at: string
          wounds_care: Json | null
        }
        Insert: {
          admission_id: string
          assessment?: string | null
          chart_date?: string
          created_at?: string
          handover_notes?: string | null
          id?: string
          interventions?: Json | null
          lines_and_tubes?: Json | null
          medications_given?: Json | null
          nurse_id?: string | null
          patient_response?: string | null
          shift: string
          updated_at?: string
          wounds_care?: Json | null
        }
        Update: {
          admission_id?: string
          assessment?: string | null
          chart_date?: string
          created_at?: string
          handover_notes?: string | null
          id?: string
          interventions?: Json | null
          lines_and_tubes?: Json | null
          medications_given?: Json | null
          nurse_id?: string | null
          patient_response?: string | null
          shift?: string
          updated_at?: string
          wounds_care?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "icu_nursing_charts_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "icu_admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      icu_scores: {
        Row: {
          admission_id: string
          calculated_by: string | null
          created_at: string
          id: string
          notes: string | null
          predicted_mortality: number | null
          score_components: Json | null
          score_date: string
          score_type: string
          total_score: number
        }
        Insert: {
          admission_id: string
          calculated_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          predicted_mortality?: number | null
          score_components?: Json | null
          score_date?: string
          score_type: string
          total_score: number
        }
        Update: {
          admission_id?: string
          calculated_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          predicted_mortality?: number | null
          score_components?: Json | null
          score_date?: string
          score_type?: string
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "icu_scores_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "icu_admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      inacbg_calculations: {
        Row: {
          adjustment_factor: number | null
          base_tariff: number | null
          billing_id: string | null
          calculated_at: string
          calculated_by: string | null
          created_at: string
          drg_code: string
          drg_description: string | null
          final_tariff: number | null
          grouper_version: string | null
          hospital_cost: number | null
          id: string
          los_actual: number | null
          los_grouper: number | null
          notes: string | null
          patient_id: string | null
          primary_diagnosis: string | null
          procedures: string[] | null
          secondary_diagnoses: string[] | null
          severity_level: number | null
          variance: number | null
          visit_id: string | null
        }
        Insert: {
          adjustment_factor?: number | null
          base_tariff?: number | null
          billing_id?: string | null
          calculated_at?: string
          calculated_by?: string | null
          created_at?: string
          drg_code: string
          drg_description?: string | null
          final_tariff?: number | null
          grouper_version?: string | null
          hospital_cost?: number | null
          id?: string
          los_actual?: number | null
          los_grouper?: number | null
          notes?: string | null
          patient_id?: string | null
          primary_diagnosis?: string | null
          procedures?: string[] | null
          secondary_diagnoses?: string[] | null
          severity_level?: number | null
          variance?: number | null
          visit_id?: string | null
        }
        Update: {
          adjustment_factor?: number | null
          base_tariff?: number | null
          billing_id?: string | null
          calculated_at?: string
          calculated_by?: string | null
          created_at?: string
          drg_code?: string
          drg_description?: string | null
          final_tariff?: number | null
          grouper_version?: string | null
          hospital_cost?: number | null
          id?: string
          los_actual?: number | null
          los_grouper?: number | null
          notes?: string | null
          patient_id?: string | null
          primary_diagnosis?: string | null
          procedures?: string[] | null
          secondary_diagnoses?: string[] | null
          severity_level?: number | null
          variance?: number | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inacbg_calculations_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inacbg_calculations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inacbg_calculations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      inacbg_tariffs: {
        Row: {
          created_at: string
          drg_id: string | null
          effective_date: string
          end_date: string | null
          hospital_class: string
          id: string
          is_active: boolean | null
          regional_code: string
          tariff_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          drg_id?: string | null
          effective_date?: string
          end_date?: string | null
          hospital_class: string
          id?: string
          is_active?: boolean | null
          regional_code?: string
          tariff_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          drg_id?: string | null
          effective_date?: string
          end_date?: string | null
          hospital_class?: string
          id?: string
          is_active?: boolean | null
          regional_code?: string
          tariff_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inacbg_tariffs_drg_id_fkey"
            columns: ["drg_id"]
            isOneToOne: false
            referencedRelation: "inadrg_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      inadrg_codes: {
        Row: {
          created_at: string
          drg_code: string
          drg_name: string
          effective_date: string | null
          hospital_class: string | null
          id: string
          is_active: boolean | null
          mdc_code: string | null
          mdc_name: string | null
          national_tariff: number | null
          regional_tariff: number | null
          severity_level: number | null
        }
        Insert: {
          created_at?: string
          drg_code: string
          drg_name: string
          effective_date?: string | null
          hospital_class?: string | null
          id?: string
          is_active?: boolean | null
          mdc_code?: string | null
          mdc_name?: string | null
          national_tariff?: number | null
          regional_tariff?: number | null
          severity_level?: number | null
        }
        Update: {
          created_at?: string
          drg_code?: string
          drg_name?: string
          effective_date?: string | null
          hospital_class?: string | null
          id?: string
          is_active?: boolean | null
          mdc_code?: string | null
          mdc_name?: string | null
          national_tariff?: number | null
          regional_tariff?: number | null
          severity_level?: number | null
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
      insurance_api_logs: {
        Row: {
          claim_id: string | null
          created_at: string
          error_message: string | null
          id: string
          provider_id: string | null
          request_payload: Json | null
          request_type: string
          response_payload: Json | null
          response_status: number | null
        }
        Insert: {
          claim_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          provider_id?: string | null
          request_payload?: Json | null
          request_type: string
          response_payload?: Json | null
          response_status?: number | null
        }
        Update: {
          claim_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          provider_id?: string | null
          request_payload?: Json | null
          request_type?: string
          response_payload?: Json | null
          response_status?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_api_logs_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "insurance_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_api_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
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
          api_endpoint: string | null
          api_key_setting: string | null
          claim_submission_method: string | null
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
          api_endpoint?: string | null
          api_key_setting?: string | null
          claim_submission_method?: string | null
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
          api_endpoint?: string | null
          api_key_setting?: string | null
          claim_submission_method?: string | null
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
      journal_entries: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string
          entry_date: string
          fiscal_period_id: string | null
          id: string
          journal_number: string
          posted_at: string | null
          posted_by: string | null
          reference_id: string | null
          reference_number: string | null
          reference_type: string | null
          status: string | null
          total_credit: number
          total_debit: number
          updated_at: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description: string
          entry_date: string
          fiscal_period_id?: string | null
          id?: string
          journal_number: string
          posted_at?: string | null
          posted_by?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          status?: string | null
          total_credit?: number
          total_debit?: number
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          entry_date?: string
          fiscal_period_id?: string | null
          id?: string
          journal_number?: string
          posted_at?: string | null
          posted_by?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          status?: string | null
          total_credit?: number
          total_debit?: number
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          department_id: string | null
          description: string | null
          id: string
          journal_entry_id: string
          line_number: number
        }
        Insert: {
          account_id: string
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          department_id?: string | null
          description?: string | null
          id?: string
          journal_entry_id: string
          line_number: number
        }
        Update: {
          account_id?: string
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          department_id?: string | null
          description?: string | null
          id?: string
          journal_entry_id?: string
          line_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "journal_entry_lines_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
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
          validated_at: string | null
          validated_by: string | null
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
          validated_at?: string | null
          validated_by?: string | null
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
          validated_at?: string | null
          validated_by?: string | null
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
      laundry_batches: {
        Row: {
          batch_number: string
          collected_by: string | null
          collection_date: string
          completion_date: string | null
          created_at: string
          id: string
          notes: string | null
          processed_by: string | null
          status: string | null
          total_items: number | null
          total_weight: number | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          collected_by?: string | null
          collection_date: string
          completion_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          processed_by?: string | null
          status?: string | null
          total_items?: number | null
          total_weight?: number | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          collected_by?: string | null
          collection_date?: string
          completion_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          processed_by?: string | null
          status?: string | null
          total_items?: number | null
          total_weight?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "laundry_batches_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laundry_batches_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      laundry_items: {
        Row: {
          batch_id: string | null
          condition_after: string | null
          condition_before: string | null
          created_at: string
          damage_notes: string | null
          id: string
          is_damaged: boolean | null
          linen_id: string | null
        }
        Insert: {
          batch_id?: string | null
          condition_after?: string | null
          condition_before?: string | null
          created_at?: string
          damage_notes?: string | null
          id?: string
          is_damaged?: boolean | null
          linen_id?: string | null
        }
        Update: {
          batch_id?: string | null
          condition_after?: string | null
          condition_before?: string | null
          created_at?: string
          damage_notes?: string | null
          id?: string
          is_damaged?: boolean | null
          linen_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laundry_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "laundry_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laundry_items_linen_id_fkey"
            columns: ["linen_id"]
            isOneToOne: false
            referencedRelation: "linen_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          carried_over: number | null
          created_at: string
          employee_id: string
          expired: number | null
          id: string
          initial_balance: number
          leave_type: string
          notes: string | null
          remaining: number
          updated_at: string
          used: number
          year: number
        }
        Insert: {
          carried_over?: number | null
          created_at?: string
          employee_id: string
          expired?: number | null
          id?: string
          initial_balance?: number
          leave_type: string
          notes?: string | null
          remaining?: number
          updated_at?: string
          used?: number
          year: number
        }
        Update: {
          carried_over?: number | null
          created_at?: string
          employee_id?: string
          expired?: number | null
          id?: string
          initial_balance?: number
          leave_type?: string
          notes?: string | null
          remaining?: number
          updated_at?: string
          used?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
      linen_inventory: {
        Row: {
          color: string | null
          created_at: string
          department_id: string | null
          id: string
          last_wash_date: string | null
          linen_code: string
          linen_type: string
          max_wash_cycles: number | null
          notes: string | null
          purchase_date: string | null
          size: string | null
          status: Database["public"]["Enums"]["linen_status"] | null
          updated_at: string
          wash_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          last_wash_date?: string | null
          linen_code: string
          linen_type: string
          max_wash_cycles?: number | null
          notes?: string | null
          purchase_date?: string | null
          size?: string | null
          status?: Database["public"]["Enums"]["linen_status"] | null
          updated_at?: string
          wash_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          last_wash_date?: string | null
          linen_code?: string
          linen_type?: string
          max_wash_cycles?: number | null
          notes?: string | null
          purchase_date?: string | null
          size?: string | null
          status?: Database["public"]["Enums"]["linen_status"] | null
          updated_at?: string
          wash_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "linen_inventory_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "linen_inventory_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_assets: {
        Row: {
          asset_code: string
          asset_name: string
          brand: string | null
          category: string
          created_at: string
          current_value: number | null
          department_id: string | null
          depreciation_rate: number | null
          id: string
          last_maintenance_date: string | null
          location: string | null
          maintenance_interval_days: number | null
          model: string | null
          next_maintenance_date: string | null
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"] | null
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_code: string
          asset_name: string
          brand?: string | null
          category: string
          created_at?: string
          current_value?: number | null
          department_id?: string | null
          depreciation_rate?: number | null
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_interval_days?: number | null
          model?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"] | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_code?: string
          asset_name?: string
          brand?: string | null
          category?: string
          created_at?: string
          current_value?: number | null
          department_id?: string | null
          depreciation_rate?: number | null
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_interval_days?: number | null
          model?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"] | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_assets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "maintenance_assets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          action_date: string
          action_type: string
          asset_id: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          labor_hours: number | null
          parts_used: Json | null
          performed_by: string | null
          request_id: string | null
        }
        Insert: {
          action_date?: string
          action_type: string
          asset_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          labor_hours?: number | null
          parts_used?: Json | null
          performed_by?: string | null
          request_id?: string | null
        }
        Update: {
          action_date?: string
          action_type?: string
          asset_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          labor_hours?: number | null
          parts_used?: Json | null
          performed_by?: string | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "maintenance_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          asset_id: string | null
          assigned_to: string | null
          completed_date: string | null
          cost: number | null
          created_at: string
          description: string
          id: string
          maintenance_type: string
          priority: string | null
          request_date: string
          request_number: string
          requested_by: string | null
          resolution_notes: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["maintenance_status"] | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          asset_id?: string | null
          assigned_to?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description: string
          id?: string
          maintenance_type: string
          priority?: string | null
          request_date?: string
          request_number: string
          requested_by?: string | null
          resolution_notes?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          asset_id?: string | null
          assigned_to?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          maintenance_type?: string
          priority?: string | null
          request_date?: string
          request_number?: string
          requested_by?: string | null
          resolution_notes?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "maintenance_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      mcu_package_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_mandatory: boolean | null
          item_code: string | null
          item_name: string
          item_type: string | null
          package_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          item_code?: string | null
          item_name: string
          item_type?: string | null
          package_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          item_code?: string | null
          item_name?: string
          item_type?: string | null
          package_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mcu_package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "mcu_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      mcu_packages: {
        Row: {
          base_price: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          package_code: string
          package_name: string
          target_age_max: number | null
          target_age_min: number | null
          target_gender: string | null
          updated_at: string
        }
        Insert: {
          base_price: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          package_code: string
          package_name: string
          target_age_max?: number | null
          target_age_min?: number | null
          target_gender?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          package_code?: string
          package_name?: string
          target_age_max?: number | null
          target_age_min?: number | null
          target_gender?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mcu_registrations: {
        Row: {
          corporate_client_id: string | null
          created_at: string
          discount: number | null
          examination_date: string | null
          final_price: number | null
          id: string
          notes: string | null
          package_id: string
          patient_id: string
          payment_type: string | null
          registered_by: string | null
          registration_date: string
          registration_number: string
          status: string | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          corporate_client_id?: string | null
          created_at?: string
          discount?: number | null
          examination_date?: string | null
          final_price?: number | null
          id?: string
          notes?: string | null
          package_id: string
          patient_id: string
          payment_type?: string | null
          registered_by?: string | null
          registration_date?: string
          registration_number: string
          status?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          corporate_client_id?: string | null
          created_at?: string
          discount?: number | null
          examination_date?: string | null
          final_price?: number | null
          id?: string
          notes?: string | null
          package_id?: string
          patient_id?: string
          payment_type?: string | null
          registered_by?: string | null
          registration_date?: string
          registration_number?: string
          status?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcu_registrations_corporate_client_id_fkey"
            columns: ["corporate_client_id"]
            isOneToOne: false
            referencedRelation: "corporate_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcu_registrations_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "mcu_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcu_registrations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      mcu_results: {
        Row: {
          created_at: string
          id: string
          interpretation: string | null
          item_name: string
          item_type: string | null
          normal_range: string | null
          notes: string | null
          performed_by: string | null
          performed_date: string | null
          registration_id: string
          result_unit: string | null
          result_value: string | null
          verified_by: string | null
          verified_date: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interpretation?: string | null
          item_name: string
          item_type?: string | null
          normal_range?: string | null
          notes?: string | null
          performed_by?: string | null
          performed_date?: string | null
          registration_id: string
          result_unit?: string | null
          result_value?: string | null
          verified_by?: string | null
          verified_date?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interpretation?: string | null
          item_name?: string
          item_type?: string | null
          normal_range?: string | null
          notes?: string | null
          performed_by?: string | null
          performed_date?: string | null
          registration_id?: string
          result_unit?: string | null
          result_value?: string | null
          verified_by?: string | null
          verified_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcu_results_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "mcu_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      mcu_summary_reports: {
        Row: {
          blood_pressure_status: string | null
          bmi: number | null
          cardiovascular_status: string | null
          created_at: string
          doctor_id: string | null
          doctor_name: string | null
          fitness_for_work: string | null
          follow_up_needed: boolean | null
          follow_up_notes: string | null
          id: string
          key_findings: string[] | null
          metabolic_status: string | null
          notes: string | null
          overall_health_status: string | null
          recommendations: string[] | null
          registration_id: string
          report_date: string
          updated_at: string
        }
        Insert: {
          blood_pressure_status?: string | null
          bmi?: number | null
          cardiovascular_status?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string | null
          fitness_for_work?: string | null
          follow_up_needed?: boolean | null
          follow_up_notes?: string | null
          id?: string
          key_findings?: string[] | null
          metabolic_status?: string | null
          notes?: string | null
          overall_health_status?: string | null
          recommendations?: string[] | null
          registration_id: string
          report_date?: string
          updated_at?: string
        }
        Update: {
          blood_pressure_status?: string | null
          bmi?: number | null
          cardiovascular_status?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string | null
          fitness_for_work?: string | null
          follow_up_needed?: boolean | null
          follow_up_notes?: string | null
          id?: string
          key_findings?: string[] | null
          metabolic_status?: string | null
          notes?: string | null
          overall_health_status?: string | null
          recommendations?: string[] | null
          registration_id?: string
          report_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcu_summary_reports_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcu_summary_reports_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "mcu_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          calories_planned: number | null
          carbs_planned: number | null
          created_at: string
          fat_planned: number | null
          id: string
          meal_date: string
          meal_type: string
          menu_items: Json | null
          notes: string | null
          patient_diet_id: string | null
          prepared_by: string | null
          protein_planned: number | null
        }
        Insert: {
          calories_planned?: number | null
          carbs_planned?: number | null
          created_at?: string
          fat_planned?: number | null
          id?: string
          meal_date: string
          meal_type: string
          menu_items?: Json | null
          notes?: string | null
          patient_diet_id?: string | null
          prepared_by?: string | null
          protein_planned?: number | null
        }
        Update: {
          calories_planned?: number | null
          carbs_planned?: number | null
          created_at?: string
          fat_planned?: number | null
          id?: string
          meal_date?: string
          meal_type?: string
          menu_items?: Json | null
          notes?: string | null
          patient_diet_id?: string | null
          prepared_by?: string | null
          protein_planned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_patient_diet_id_fkey"
            columns: ["patient_diet_id"]
            isOneToOne: false
            referencedRelation: "patient_diets"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_records: {
        Row: {
          appetite_level: string | null
          assistance_needed: boolean | null
          calories_consumed: number | null
          consumption_percentage: number | null
          created_at: string
          id: string
          items_consumed: Json | null
          meal_date: string
          meal_plan_id: string | null
          meal_type: string
          notes: string | null
          patient_id: string
          recorded_by: string | null
        }
        Insert: {
          appetite_level?: string | null
          assistance_needed?: boolean | null
          calories_consumed?: number | null
          consumption_percentage?: number | null
          created_at?: string
          id?: string
          items_consumed?: Json | null
          meal_date: string
          meal_plan_id?: string | null
          meal_type: string
          notes?: string | null
          patient_id: string
          recorded_by?: string | null
        }
        Update: {
          appetite_level?: string | null
          assistance_needed?: boolean | null
          calories_consumed?: number | null
          consumption_percentage?: number | null
          created_at?: string
          id?: string
          items_consumed?: Json | null
          meal_date?: string
          meal_plan_id?: string | null
          meal_type?: string
          notes?: string | null
          patient_id?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_records_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_equipment: {
        Row: {
          aspak_code: string | null
          aspak_last_sync: string | null
          aspak_sync_status: string | null
          brand: string | null
          calibration_interval_months: number | null
          calibration_required: boolean | null
          category: string | null
          condition: string | null
          created_at: string | null
          department_id: string | null
          equipment_code: string
          equipment_name: string
          expected_lifespan_years: number | null
          id: string
          last_calibration_date: string | null
          last_maintenance_date: string | null
          location: string | null
          maintenance_interval_months: number | null
          manual_document_url: string | null
          model: string | null
          next_calibration_date: string | null
          next_maintenance_date: string | null
          notes: string | null
          photo_url: string | null
          purchase_date: string | null
          purchase_price: number | null
          risk_class: string | null
          serial_number: string | null
          status: string | null
          subcategory: string | null
          updated_at: string | null
          vendor_id: string | null
          warranty_expiry: string | null
        }
        Insert: {
          aspak_code?: string | null
          aspak_last_sync?: string | null
          aspak_sync_status?: string | null
          brand?: string | null
          calibration_interval_months?: number | null
          calibration_required?: boolean | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          department_id?: string | null
          equipment_code: string
          equipment_name: string
          expected_lifespan_years?: number | null
          id?: string
          last_calibration_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_interval_months?: number | null
          manual_document_url?: string | null
          model?: string | null
          next_calibration_date?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          photo_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          risk_class?: string | null
          serial_number?: string | null
          status?: string | null
          subcategory?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          aspak_code?: string | null
          aspak_last_sync?: string | null
          aspak_sync_status?: string | null
          brand?: string | null
          calibration_interval_months?: number | null
          calibration_required?: boolean | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          department_id?: string | null
          equipment_code?: string
          equipment_name?: string
          expected_lifespan_years?: number | null
          id?: string
          last_calibration_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_interval_months?: number | null
          manual_document_url?: string | null
          model?: string | null
          next_calibration_date?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          photo_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          risk_class?: string | null
          serial_number?: string | null
          status?: string | null
          subcategory?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_equipment_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "medical_equipment_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_equipment_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
      medical_trainees: {
        Row: {
          created_at: string
          current_rotation_id: string | null
          email: string | null
          enrollment_date: string
          expected_graduation: string | null
          full_name: string
          id: string
          nik: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          program_id: string | null
          status: string | null
          supervisor_id: string | null
          trainee_code: string
          university: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_rotation_id?: string | null
          email?: string | null
          enrollment_date: string
          expected_graduation?: string | null
          full_name: string
          id?: string
          nik?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          program_id?: string | null
          status?: string | null
          supervisor_id?: string | null
          trainee_code: string
          university?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_rotation_id?: string | null
          email?: string | null
          enrollment_date?: string
          expected_graduation?: string | null
          full_name?: string
          id?: string
          nik?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          program_id?: string | null
          status?: string | null
          supervisor_id?: string | null
          trainee_code?: string
          university?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_trainees_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "education_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_trainees_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
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
      menu_access_templates: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          menu_path: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          menu_path: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          menu_path?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      module_configurations: {
        Row: {
          available_for_fktp: boolean | null
          available_for_type_a: boolean | null
          available_for_type_b: boolean | null
          available_for_type_c: boolean | null
          available_for_type_d: boolean | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_core_module: boolean | null
          module_category: string
          module_code: string
          module_icon: string | null
          module_name: string
          module_path: string
        }
        Insert: {
          available_for_fktp?: boolean | null
          available_for_type_a?: boolean | null
          available_for_type_b?: boolean | null
          available_for_type_c?: boolean | null
          available_for_type_d?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_core_module?: boolean | null
          module_category: string
          module_code: string
          module_icon?: string | null
          module_name: string
          module_path: string
        }
        Update: {
          available_for_fktp?: boolean | null
          available_for_type_a?: boolean | null
          available_for_type_b?: boolean | null
          available_for_type_c?: boolean | null
          available_for_type_d?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_core_module?: boolean | null
          module_category?: string
          module_code?: string
          module_icon?: string | null
          module_name?: string
          module_path?: string
        }
        Relationships: []
      }
      mortuary_cases: {
        Row: {
          admission_date: string
          age: number | null
          autopsy_required: boolean | null
          body_condition: string | null
          brought_by: string | null
          brought_from: string | null
          case_number: string
          case_type: Database["public"]["Enums"]["mortuary_case_type"] | null
          cause_of_death: string | null
          created_at: string
          date_of_birth: string | null
          date_of_death: string | null
          deceased_id: string | null
          deceased_name: string
          family_contact_name: string | null
          family_contact_phone: string | null
          family_notified: boolean | null
          gender: string | null
          id: string
          manner_of_death: string | null
          notes: string | null
          notification_time: string | null
          personal_belongings: Json | null
          place_of_death: string | null
          police_case: boolean | null
          police_report_number: string | null
          release_authorized: boolean | null
          release_date: string | null
          released_by: string | null
          released_to: string | null
          status: string | null
          storage_location: string | null
          time_of_death_estimated: boolean | null
          updated_at: string
        }
        Insert: {
          admission_date?: string
          age?: number | null
          autopsy_required?: boolean | null
          body_condition?: string | null
          brought_by?: string | null
          brought_from?: string | null
          case_number: string
          case_type?: Database["public"]["Enums"]["mortuary_case_type"] | null
          cause_of_death?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          deceased_id?: string | null
          deceased_name: string
          family_contact_name?: string | null
          family_contact_phone?: string | null
          family_notified?: boolean | null
          gender?: string | null
          id?: string
          manner_of_death?: string | null
          notes?: string | null
          notification_time?: string | null
          personal_belongings?: Json | null
          place_of_death?: string | null
          police_case?: boolean | null
          police_report_number?: string | null
          release_authorized?: boolean | null
          release_date?: string | null
          released_by?: string | null
          released_to?: string | null
          status?: string | null
          storage_location?: string | null
          time_of_death_estimated?: boolean | null
          updated_at?: string
        }
        Update: {
          admission_date?: string
          age?: number | null
          autopsy_required?: boolean | null
          body_condition?: string | null
          brought_by?: string | null
          brought_from?: string | null
          case_number?: string
          case_type?: Database["public"]["Enums"]["mortuary_case_type"] | null
          cause_of_death?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          deceased_id?: string | null
          deceased_name?: string
          family_contact_name?: string | null
          family_contact_phone?: string | null
          family_notified?: boolean | null
          gender?: string | null
          id?: string
          manner_of_death?: string | null
          notes?: string | null
          notification_time?: string | null
          personal_belongings?: Json | null
          place_of_death?: string | null
          police_case?: boolean | null
          police_report_number?: string | null
          release_authorized?: boolean | null
          release_date?: string | null
          released_by?: string | null
          released_to?: string | null
          status?: string | null
          storage_location?: string | null
          time_of_death_estimated?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mortuary_cases_deceased_id_fkey"
            columns: ["deceased_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
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
      operating_rooms: {
        Row: {
          created_at: string
          equipment: Json | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          name: string
          notes: string | null
          room_number: string
          room_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment?: Json | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          name: string
          notes?: string | null
          room_number: string
          room_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment?: Json | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          name?: string
          notes?: string | null
          room_number?: string
          room_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      overtime_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_time: string
          hourly_rate: number
          id: string
          notes: string | null
          overtime_date: string
          overtime_type: string
          start_time: string
          status: string
          total_amount: number
          total_hours: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_time: string
          hourly_rate: number
          id?: string
          notes?: string | null
          overtime_date: string
          overtime_type: string
          start_time: string
          status?: string
          total_amount: number
          total_hours: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_time?: string
          hourly_rate?: number
          id?: string
          notes?: string | null
          overtime_date?: string
          overtime_type?: string
          start_time?: string
          status?: string
          total_amount?: number
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_records_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "overtime_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_consents: {
        Row: {
          consent_date: string | null
          consent_given: boolean | null
          consent_number: string
          consent_type: string
          created_at: string
          digital_signature: string | null
          doctor_id: string | null
          explanation_date: string | null
          explanation_given_by: string | null
          id: string
          notes: string | null
          patient_id: string
          patient_questions: string | null
          patient_understands: boolean | null
          procedure_date: string | null
          procedure_name: string | null
          refusal_reason: string | null
          relationship_to_patient: string | null
          signature_image_url: string | null
          signed_by: string | null
          status: Database["public"]["Enums"]["consent_status"] | null
          template_id: string | null
          updated_at: string
          visit_id: string | null
          witness_name: string | null
          witness_signature_date: string | null
        }
        Insert: {
          consent_date?: string | null
          consent_given?: boolean | null
          consent_number: string
          consent_type: string
          created_at?: string
          digital_signature?: string | null
          doctor_id?: string | null
          explanation_date?: string | null
          explanation_given_by?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          patient_questions?: string | null
          patient_understands?: boolean | null
          procedure_date?: string | null
          procedure_name?: string | null
          refusal_reason?: string | null
          relationship_to_patient?: string | null
          signature_image_url?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["consent_status"] | null
          template_id?: string | null
          updated_at?: string
          visit_id?: string | null
          witness_name?: string | null
          witness_signature_date?: string | null
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean | null
          consent_number?: string
          consent_type?: string
          created_at?: string
          digital_signature?: string | null
          doctor_id?: string | null
          explanation_date?: string | null
          explanation_given_by?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          patient_questions?: string | null
          patient_understands?: boolean | null
          procedure_date?: string | null
          procedure_name?: string | null
          refusal_reason?: string | null
          relationship_to_patient?: string | null
          signature_image_url?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["consent_status"] | null
          template_id?: string | null
          updated_at?: string
          visit_id?: string | null
          witness_name?: string | null
          witness_signature_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_consents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consents_explanation_given_by_fkey"
            columns: ["explanation_given_by"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "consent_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consents_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_diets: {
        Row: {
          created_at: string
          diet_name: string
          diet_type_id: string | null
          end_date: string | null
          fluid_restriction: number | null
          id: string
          notes: string | null
          patient_id: string
          prescribed_by: string | null
          special_instructions: string | null
          start_date: string
          status: string | null
          texture_modification: string | null
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          diet_name: string
          diet_type_id?: string | null
          end_date?: string | null
          fluid_restriction?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          prescribed_by?: string | null
          special_instructions?: string | null
          start_date?: string
          status?: string | null
          texture_modification?: string | null
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          diet_name?: string
          diet_type_id?: string | null
          end_date?: string | null
          fluid_restriction?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string | null
          special_instructions?: string | null
          start_date?: string
          status?: string | null
          texture_modification?: string | null
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_diets_diet_type_id_fkey"
            columns: ["diet_type_id"]
            isOneToOne: false
            referencedRelation: "diet_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diets_visit_id_fkey"
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
          education_level: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          kabupaten: string | null
          kecamatan: string | null
          kelurahan: string | null
          marital_status: string | null
          medical_record_number: string
          mother_name: string | null
          nationality: string | null
          nik: string
          occupation: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          religion: string | null
          rt: string | null
          rw: string | null
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
          education_level?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          kabupaten?: string | null
          kecamatan?: string | null
          kelurahan?: string | null
          marital_status?: string | null
          medical_record_number: string
          mother_name?: string | null
          nationality?: string | null
          nik: string
          occupation?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          religion?: string | null
          rt?: string | null
          rw?: string | null
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
          education_level?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          kabupaten?: string | null
          kecamatan?: string | null
          kelurahan?: string | null
          marital_status?: string | null
          medical_record_number?: string
          mother_name?: string | null
          nationality?: string | null
          nik?: string
          occupation?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          religion?: string | null
          rt?: string | null
          rw?: string | null
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
      payroll_details: {
        Row: {
          amount: number
          component_id: string | null
          component_name: string
          component_type: string
          created_at: string
          id: string
          is_taxable: boolean | null
          notes: string | null
          payroll_id: string
        }
        Insert: {
          amount?: number
          component_id?: string | null
          component_name: string
          component_type: string
          created_at?: string
          id?: string
          is_taxable?: boolean | null
          notes?: string | null
          payroll_id: string
        }
        Update: {
          amount?: number
          component_id?: string | null
          component_name?: string
          component_type?: string
          created_at?: string
          id?: string
          is_taxable?: boolean | null
          notes?: string | null
          payroll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_details_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "salary_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_details_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          notes: string | null
          payment_date: string | null
          period_month: number
          period_name: string
          period_year: number
          start_date: string
          status: string
          total_deductions: number | null
          total_employees: number | null
          total_gross: number | null
          total_net: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          period_month: number
          period_name: string
          period_year: number
          start_date: string
          status?: string
          total_deductions?: number | null
          total_employees?: number | null
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          period_month?: number
          period_name?: string
          period_year?: number
          start_date?: string
          status?: string
          total_deductions?: number | null
          total_employees?: number | null
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payroll_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          acknowledged_at: string | null
          areas_for_improvement: string | null
          behavior_score: number | null
          competency_score: number | null
          created_at: string
          employee_comments: string | null
          employee_id: string
          goals_next_period: string | null
          id: string
          kpi_score: number | null
          overall_score: number | null
          rating: string | null
          review_date: string
          review_period: string
          review_year: number
          reviewer_comments: string | null
          reviewer_id: string | null
          status: string
          strengths: string | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          areas_for_improvement?: string | null
          behavior_score?: number | null
          competency_score?: number | null
          created_at?: string
          employee_comments?: string | null
          employee_id: string
          goals_next_period?: string | null
          id?: string
          kpi_score?: number | null
          overall_score?: number | null
          rating?: string | null
          review_date: string
          review_period: string
          review_year: number
          reviewer_comments?: string | null
          reviewer_id?: string | null
          status?: string
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          areas_for_improvement?: string | null
          behavior_score?: number | null
          competency_score?: number | null
          created_at?: string
          employee_comments?: string | null
          employee_id?: string
          goals_next_period?: string | null
          id?: string
          kpi_score?: number | null
          overall_score?: number | null
          rating?: string | null
          review_date?: string
          review_period?: string
          review_year?: number
          reviewer_comments?: string | null
          reviewer_id?: string | null
          status?: string
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          base_salary: number | null
          created_at: string
          department_id: string | null
          description: string | null
          grade_id: string | null
          id: string
          is_active: boolean | null
          is_structural: boolean | null
          position_allowance: number | null
          position_code: string
          position_name: string
          updated_at: string
        }
        Insert: {
          base_salary?: number | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          grade_id?: string | null
          id?: string
          is_active?: boolean | null
          is_structural?: boolean | null
          position_allowance?: number | null
          position_code: string
          position_name: string
          updated_at?: string
        }
        Update: {
          base_salary?: number | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          grade_id?: string | null
          id?: string
          is_active?: boolean | null
          is_structural?: boolean | null
          position_allowance?: number | null
          position_code?: string
          position_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "employee_grades"
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
      purchase_request_approvals: {
        Row: {
          approval_level: number
          approved_at: string | null
          approver_id: string | null
          approver_name: string | null
          created_at: string
          id: string
          pr_id: string
          rejection_reason: string | null
          role_name: string
          status: string
          updated_at: string
        }
        Insert: {
          approval_level: number
          approved_at?: string | null
          approver_id?: string | null
          approver_name?: string | null
          created_at?: string
          id?: string
          pr_id: string
          rejection_reason?: string | null
          role_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          approval_level?: number
          approved_at?: string | null
          approver_id?: string | null
          approver_name?: string | null
          created_at?: string
          id?: string
          pr_id?: string
          rejection_reason?: string | null
          role_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_request_approvals_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_request_items: {
        Row: {
          created_at: string
          estimated_price: number
          id: string
          item_name: string
          notes: string | null
          pr_id: string
          quantity: number
          unit: string
        }
        Insert: {
          created_at?: string
          estimated_price?: number
          id?: string
          item_name: string
          notes?: string | null
          pr_id: string
          quantity?: number
          unit?: string
        }
        Update: {
          created_at?: string
          estimated_price?: number
          id?: string
          item_name?: string
          notes?: string | null
          pr_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_request_items_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          created_at: string
          department: string
          id: string
          notes: string | null
          pr_number: string
          request_date: string
          requester_id: string | null
          requester_name: string
          status: string
          total_estimate: number
          updated_at: string
          urgency: string
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          notes?: string | null
          pr_number: string
          request_date?: string
          requester_id?: string | null
          requester_name: string
          status?: string
          total_estimate?: number
          updated_at?: string
          urgency?: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          notes?: string | null
          pr_number?: string
          request_date?: string
          requester_id?: string | null
          requester_name?: string
          status?: string
          total_estimate?: number
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      quality_improvement_actions: {
        Row: {
          action_plan: string | null
          action_type: string
          completed_date: string | null
          created_at: string
          description: string
          effectiveness_evaluation: string | null
          id: string
          indicator_id: string | null
          measurement_id: string | null
          responsible_person: string | null
          root_cause: string | null
          start_date: string | null
          status: string | null
          target_date: string | null
          updated_at: string
        }
        Insert: {
          action_plan?: string | null
          action_type: string
          completed_date?: string | null
          created_at?: string
          description: string
          effectiveness_evaluation?: string | null
          id?: string
          indicator_id?: string | null
          measurement_id?: string | null
          responsible_person?: string | null
          root_cause?: string | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          action_plan?: string | null
          action_type?: string
          completed_date?: string | null
          created_at?: string
          description?: string
          effectiveness_evaluation?: string | null
          id?: string
          indicator_id?: string | null
          measurement_id?: string | null
          responsible_person?: string | null
          root_cause?: string | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_improvement_actions_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "quality_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_improvement_actions_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "quality_measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_improvement_actions_responsible_person_fkey"
            columns: ["responsible_person"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_indicators: {
        Row: {
          category: string
          created_at: string
          data_source: string | null
          denominator_definition: string | null
          dimension: string | null
          frequency: string | null
          id: string
          indicator_code: string
          indicator_name: string
          is_active: boolean | null
          is_national_indicator: boolean | null
          numerator_definition: string | null
          responsible_department: string | null
          target_direction: string | null
          target_value: number | null
          unit_name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          data_source?: string | null
          denominator_definition?: string | null
          dimension?: string | null
          frequency?: string | null
          id?: string
          indicator_code: string
          indicator_name: string
          is_active?: boolean | null
          is_national_indicator?: boolean | null
          numerator_definition?: string | null
          responsible_department?: string | null
          target_direction?: string | null
          target_value?: number | null
          unit_name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          data_source?: string | null
          denominator_definition?: string | null
          dimension?: string | null
          frequency?: string | null
          id?: string
          indicator_code?: string
          indicator_name?: string
          is_active?: boolean | null
          is_national_indicator?: boolean | null
          numerator_definition?: string | null
          responsible_department?: string | null
          target_direction?: string | null
          target_value?: number | null
          unit_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_indicators_responsible_department_fkey"
            columns: ["responsible_department"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "quality_indicators_responsible_department_fkey"
            columns: ["responsible_department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_measurements: {
        Row: {
          collected_by: string | null
          created_at: string
          denominator: number | null
          department_id: string | null
          id: string
          indicator_id: string | null
          measurement_period: string
          notes: string | null
          numerator: number | null
          target_met: boolean | null
          validated_by: string | null
          validation_date: string | null
          value: number | null
        }
        Insert: {
          collected_by?: string | null
          created_at?: string
          denominator?: number | null
          department_id?: string | null
          id?: string
          indicator_id?: string | null
          measurement_period: string
          notes?: string | null
          numerator?: number | null
          target_met?: boolean | null
          validated_by?: string | null
          validation_date?: string | null
          value?: number | null
        }
        Update: {
          collected_by?: string | null
          created_at?: string
          denominator?: number | null
          department_id?: string | null
          id?: string
          indicator_id?: string | null
          measurement_period?: string
          notes?: string | null
          numerator?: number | null
          target_met?: boolean | null
          validated_by?: string | null
          validation_date?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_measurements_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_measurements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "quality_measurements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_measurements_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "quality_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_measurements_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
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
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
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
          validated_at: string | null
          validated_by: string | null
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
          validated_at?: string | null
          validated_by?: string | null
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
          validated_at?: string | null
          validated_by?: string | null
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
      rehabilitation_assessments: {
        Row: {
          adl_score: number | null
          assessment_date: string
          balance_assessment: string | null
          created_at: string
          diagnosis: string | null
          estimated_sessions: number | null
          functional_status: string | null
          goals: string[] | null
          id: string
          mobility_score: number | null
          notes: string | null
          pain_scale: number | null
          patient_id: string
          precautions: string | null
          range_of_motion: Json | null
          strength_assessment: Json | null
          therapist_id: string | null
          therapist_name: string | null
          treatment_plan: string | null
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          adl_score?: number | null
          assessment_date?: string
          balance_assessment?: string | null
          created_at?: string
          diagnosis?: string | null
          estimated_sessions?: number | null
          functional_status?: string | null
          goals?: string[] | null
          id?: string
          mobility_score?: number | null
          notes?: string | null
          pain_scale?: number | null
          patient_id: string
          precautions?: string | null
          range_of_motion?: Json | null
          strength_assessment?: Json | null
          therapist_id?: string | null
          therapist_name?: string | null
          treatment_plan?: string | null
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          adl_score?: number | null
          assessment_date?: string
          balance_assessment?: string | null
          created_at?: string
          diagnosis?: string | null
          estimated_sessions?: number | null
          functional_status?: string | null
          goals?: string[] | null
          id?: string
          mobility_score?: number | null
          notes?: string | null
          pain_scale?: number | null
          patient_id?: string
          precautions?: string | null
          range_of_motion?: Json | null
          strength_assessment?: Json | null
          therapist_id?: string | null
          therapist_name?: string | null
          treatment_plan?: string | null
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rehabilitation_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rehabilitation_assessments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rehabilitation_assessments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      rehabilitation_goals: {
        Row: {
          achievement_date: string | null
          assessment_id: string | null
          baseline_measurement: string | null
          created_at: string
          current_measurement: string | null
          goal_description: string
          goal_type: string | null
          id: string
          notes: string | null
          status: string | null
          target_date: string | null
          target_measurement: string | null
          updated_at: string
        }
        Insert: {
          achievement_date?: string | null
          assessment_id?: string | null
          baseline_measurement?: string | null
          created_at?: string
          current_measurement?: string | null
          goal_description: string
          goal_type?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          target_date?: string | null
          target_measurement?: string | null
          updated_at?: string
        }
        Update: {
          achievement_date?: string | null
          assessment_id?: string | null
          baseline_measurement?: string | null
          created_at?: string
          current_measurement?: string | null
          goal_description?: string
          goal_type?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          target_date?: string | null
          target_measurement?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rehabilitation_goals_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "rehabilitation_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      research_projects: {
        Row: {
          abstract: string | null
          budget: number | null
          co_investigators: string[] | null
          created_at: string
          department_id: string | null
          end_date: string | null
          ethics_approval_date: string | null
          ethics_approval_number: string | null
          funding_source: string | null
          id: string
          keywords: string[] | null
          principal_investigator_id: string | null
          project_code: string
          publication_status: string | null
          research_type: string | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          abstract?: string | null
          budget?: number | null
          co_investigators?: string[] | null
          created_at?: string
          department_id?: string | null
          end_date?: string | null
          ethics_approval_date?: string | null
          ethics_approval_number?: string | null
          funding_source?: string | null
          id?: string
          keywords?: string[] | null
          principal_investigator_id?: string | null
          project_code: string
          publication_status?: string | null
          research_type?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          abstract?: string | null
          budget?: number | null
          co_investigators?: string[] | null
          created_at?: string
          department_id?: string | null
          end_date?: string | null
          ethics_approval_date?: string | null
          ethics_approval_number?: string | null
          funding_source?: string | null
          id?: string
          keywords?: string[] | null
          principal_investigator_id?: string | null
          project_code?: string
          publication_status?: string | null
          research_type?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "research_projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_projects_principal_investigator_id_fkey"
            columns: ["principal_investigator_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      rl_report_submissions: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          rejection_reason: string | null
          report_data: Json | null
          report_period_month: number | null
          report_period_quarter: number | null
          report_period_year: number
          report_type: string
          status: string | null
          submission_date: string | null
          submitted_by: string | null
          updated_at: string | null
          verification_date: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          report_data?: Json | null
          report_period_month?: number | null
          report_period_quarter?: number | null
          report_period_year: number
          report_type: string
          status?: string | null
          submission_date?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          report_data?: Json | null
          report_period_month?: number | null
          report_period_quarter?: number | null
          report_period_year?: number
          report_type?: string
          status?: string | null
          submission_date?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      rl3_inpatient_stats: {
        Row: {
          admissions: number | null
          bed_count: number | null
          bor: number | null
          bto: number | null
          created_at: string | null
          deaths_less_48h: number | null
          deaths_more_48h: number | null
          discharges: number | null
          id: string
          los: number | null
          patient_days: number | null
          period_month: number
          period_year: number
          referrals_out: number | null
          toi: number | null
          updated_at: string | null
          ward_class: string | null
        }
        Insert: {
          admissions?: number | null
          bed_count?: number | null
          bor?: number | null
          bto?: number | null
          created_at?: string | null
          deaths_less_48h?: number | null
          deaths_more_48h?: number | null
          discharges?: number | null
          id?: string
          los?: number | null
          patient_days?: number | null
          period_month: number
          period_year: number
          referrals_out?: number | null
          toi?: number | null
          updated_at?: string | null
          ward_class?: string | null
        }
        Update: {
          admissions?: number | null
          bed_count?: number | null
          bor?: number | null
          bto?: number | null
          created_at?: string | null
          deaths_less_48h?: number | null
          deaths_more_48h?: number | null
          discharges?: number | null
          id?: string
          los?: number | null
          patient_days?: number | null
          period_month?: number
          period_year?: number
          referrals_out?: number | null
          toi?: number | null
          updated_at?: string | null
          ward_class?: string | null
        }
        Relationships: []
      }
      rl3_outpatient_stats: {
        Row: {
          bpjs_patients: number | null
          created_at: string | null
          department_id: string | null
          female_patients: number | null
          general_patients: number | null
          id: string
          insurance_patients: number | null
          male_patients: number | null
          new_patients: number | null
          period_month: number
          period_year: number
          returning_patients: number | null
          specialty_name: string | null
          total_visits: number | null
          updated_at: string | null
        }
        Insert: {
          bpjs_patients?: number | null
          created_at?: string | null
          department_id?: string | null
          female_patients?: number | null
          general_patients?: number | null
          id?: string
          insurance_patients?: number | null
          male_patients?: number | null
          new_patients?: number | null
          period_month: number
          period_year: number
          returning_patients?: number | null
          specialty_name?: string | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Update: {
          bpjs_patients?: number | null
          created_at?: string | null
          department_id?: string | null
          female_patients?: number | null
          general_patients?: number | null
          id?: string
          insurance_patients?: number | null
          male_patients?: number | null
          new_patients?: number | null
          period_month?: number
          period_year?: number
          returning_patients?: number | null
          specialty_name?: string | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rl3_outpatient_stats_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "rl3_outpatient_stats_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      rl4_morbidity_stats: {
        Row: {
          age_0_7d: number | null
          age_1_12m: number | null
          age_1_4y: number | null
          age_15_24y: number | null
          age_25_44y: number | null
          age_45_64y: number | null
          age_5_14y: number | null
          age_65_plus: number | null
          age_8_28d: number | null
          case_count: number | null
          created_at: string | null
          death_count: number | null
          disease_name: string | null
          female_count: number | null
          icd10_code: string | null
          id: string
          male_count: number | null
          patient_type: string | null
          period_month: number | null
          period_year: number
          ranking: number | null
          updated_at: string | null
        }
        Insert: {
          age_0_7d?: number | null
          age_1_12m?: number | null
          age_1_4y?: number | null
          age_15_24y?: number | null
          age_25_44y?: number | null
          age_45_64y?: number | null
          age_5_14y?: number | null
          age_65_plus?: number | null
          age_8_28d?: number | null
          case_count?: number | null
          created_at?: string | null
          death_count?: number | null
          disease_name?: string | null
          female_count?: number | null
          icd10_code?: string | null
          id?: string
          male_count?: number | null
          patient_type?: string | null
          period_month?: number | null
          period_year: number
          ranking?: number | null
          updated_at?: string | null
        }
        Update: {
          age_0_7d?: number | null
          age_1_12m?: number | null
          age_1_4y?: number | null
          age_15_24y?: number | null
          age_25_44y?: number | null
          age_45_64y?: number | null
          age_5_14y?: number | null
          age_65_plus?: number | null
          age_8_28d?: number | null
          case_count?: number | null
          created_at?: string | null
          death_count?: number | null
          disease_name?: string | null
          female_count?: number | null
          icd10_code?: string | null
          id?: string
          male_count?: number | null
          patient_type?: string | null
          period_month?: number | null
          period_year?: number
          ranking?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rl4_mortality_stats: {
        Row: {
          age_0_7d: number | null
          age_1_12m: number | null
          age_1_4y: number | null
          age_15_24y: number | null
          age_25_44y: number | null
          age_45_64y: number | null
          age_5_14y: number | null
          age_65_plus: number | null
          age_8_28d: number | null
          cause_of_death: string | null
          created_at: string | null
          death_count: number | null
          deaths_less_48h: number | null
          deaths_more_48h: number | null
          female_count: number | null
          icd10_code: string | null
          id: string
          male_count: number | null
          period_month: number | null
          period_year: number
          ranking: number | null
          updated_at: string | null
        }
        Insert: {
          age_0_7d?: number | null
          age_1_12m?: number | null
          age_1_4y?: number | null
          age_15_24y?: number | null
          age_25_44y?: number | null
          age_45_64y?: number | null
          age_5_14y?: number | null
          age_65_plus?: number | null
          age_8_28d?: number | null
          cause_of_death?: string | null
          created_at?: string | null
          death_count?: number | null
          deaths_less_48h?: number | null
          deaths_more_48h?: number | null
          female_count?: number | null
          icd10_code?: string | null
          id?: string
          male_count?: number | null
          period_month?: number | null
          period_year: number
          ranking?: number | null
          updated_at?: string | null
        }
        Update: {
          age_0_7d?: number | null
          age_1_12m?: number | null
          age_1_4y?: number | null
          age_15_24y?: number | null
          age_25_44y?: number | null
          age_45_64y?: number | null
          age_5_14y?: number | null
          age_65_plus?: number | null
          age_8_28d?: number | null
          cause_of_death?: string | null
          created_at?: string | null
          death_count?: number | null
          deaths_less_48h?: number | null
          deaths_more_48h?: number | null
          female_count?: number | null
          icd10_code?: string | null
          id?: string
          male_count?: number | null
          period_month?: number | null
          period_year?: number
          ranking?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rl5_visitor_stats: {
        Row: {
          created_at: string | null
          id: string
          origin_city: string | null
          origin_province: string | null
          patient_type: string | null
          period_month: number
          period_year: number
          updated_at: string | null
          visit_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          origin_city?: string | null
          origin_province?: string | null
          patient_type?: string | null
          period_month: number
          period_year: number
          updated_at?: string | null
          visit_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          origin_city?: string | null
          origin_province?: string | null
          patient_type?: string | null
          period_month?: number
          period_year?: number
          updated_at?: string | null
          visit_count?: number | null
        }
        Relationships: []
      }
      rl6_indicators: {
        Row: {
          alos: number | null
          bor: number | null
          bto: number | null
          calculated_at: string | null
          created_at: string | null
          gdr: number | null
          id: string
          ndr: number | null
          period_month: number
          period_year: number
          toi: number | null
          total_beds: number | null
          total_deliveries: number | null
          total_igd_visits: number | null
          total_inpatient_admissions: number | null
          total_lab_tests: number | null
          total_outpatient_visits: number | null
          total_radiology_exams: number | null
          total_revenue: number | null
          total_surgeries: number | null
          updated_at: string | null
        }
        Insert: {
          alos?: number | null
          bor?: number | null
          bto?: number | null
          calculated_at?: string | null
          created_at?: string | null
          gdr?: number | null
          id?: string
          ndr?: number | null
          period_month: number
          period_year: number
          toi?: number | null
          total_beds?: number | null
          total_deliveries?: number | null
          total_igd_visits?: number | null
          total_inpatient_admissions?: number | null
          total_lab_tests?: number | null
          total_outpatient_visits?: number | null
          total_radiology_exams?: number | null
          total_revenue?: number | null
          total_surgeries?: number | null
          updated_at?: string | null
        }
        Update: {
          alos?: number | null
          bor?: number | null
          bto?: number | null
          calculated_at?: string | null
          created_at?: string | null
          gdr?: number | null
          id?: string
          ndr?: number | null
          period_month?: number
          period_year?: number
          toi?: number | null
          total_beds?: number | null
          total_deliveries?: number | null
          total_igd_visits?: number | null
          total_inpatient_admissions?: number | null
          total_lab_tests?: number | null
          total_outpatient_visits?: number | null
          total_radiology_exams?: number | null
          total_revenue?: number | null
          total_surgeries?: number | null
          updated_at?: string | null
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
          satusehat_location_id: string | null
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
          satusehat_location_id?: string | null
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
          satusehat_location_id?: string | null
          total_beds?: number
        }
        Relationships: [
          {
            foreignKeyName: "rooms_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "rooms_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_incidents: {
        Row: {
          closed_by: string | null
          closed_date: string | null
          contributing_factors: string[] | null
          corrective_actions: Json | null
          created_at: string
          department_id: string | null
          description: string
          followup_date: string | null
          id: string
          immediate_action: string | null
          incident_date: string
          incident_number: string
          incident_type: string
          investigated_by: string | null
          investigation_date: string | null
          location: string | null
          patient_id: string | null
          patient_involved: boolean | null
          recommendations: string | null
          reported_date: string
          reporter_id: string | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: string | null
          updated_at: string
          witnesses: string[] | null
        }
        Insert: {
          closed_by?: string | null
          closed_date?: string | null
          contributing_factors?: string[] | null
          corrective_actions?: Json | null
          created_at?: string
          department_id?: string | null
          description: string
          followup_date?: string | null
          id?: string
          immediate_action?: string | null
          incident_date: string
          incident_number: string
          incident_type: string
          investigated_by?: string | null
          investigation_date?: string | null
          location?: string | null
          patient_id?: string | null
          patient_involved?: boolean | null
          recommendations?: string | null
          reported_date?: string
          reporter_id?: string | null
          root_cause?: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status?: string | null
          updated_at?: string
          witnesses?: string[] | null
        }
        Update: {
          closed_by?: string | null
          closed_date?: string | null
          contributing_factors?: string[] | null
          corrective_actions?: Json | null
          created_at?: string
          department_id?: string | null
          description?: string
          followup_date?: string | null
          id?: string
          immediate_action?: string | null
          incident_date?: string
          incident_number?: string
          incident_type?: string
          investigated_by?: string | null
          investigation_date?: string | null
          location?: string | null
          patient_id?: string | null
          patient_involved?: boolean | null
          recommendations?: string | null
          reported_date?: string
          reporter_id?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: string | null
          updated_at?: string
          witnesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_incidents_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "safety_incidents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_investigated_by_fkey"
            columns: ["investigated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_components: {
        Row: {
          base_amount: number | null
          calculation_type: string
          component_code: string
          component_name: string
          component_type: string
          created_at: string
          description: string | null
          formula: string | null
          id: string
          is_active: boolean | null
          is_taxable: boolean | null
          percentage: number | null
          updated_at: string
        }
        Insert: {
          base_amount?: number | null
          calculation_type: string
          component_code: string
          component_name: string
          component_type: string
          created_at?: string
          description?: string | null
          formula?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          percentage?: number | null
          updated_at?: string
        }
        Update: {
          base_amount?: number | null
          calculation_type?: string
          component_code?: string
          component_name?: string
          component_type?: string
          created_at?: string
          description?: string | null
          formula?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          percentage?: number | null
          updated_at?: string
        }
        Relationships: []
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
      satusehat_organization_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          part_of: string | null
          role_code: string
          role_display: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          part_of?: string | null
          role_code: string
          role_display?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          part_of?: string | null
          role_code?: string
          role_display?: string | null
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
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "service_tariffs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      sisrute_referrals: {
        Row: {
          arrival_time: string | null
          clinical_summary: string | null
          created_at: string
          departure_time: string | null
          destination_city: string | null
          destination_department: string | null
          destination_facility_code: string | null
          destination_facility_name: string | null
          destination_facility_type: string | null
          destination_province: string | null
          diagnosis_description: string | null
          id: string
          last_sync_at: string | null
          patient_id: string | null
          primary_diagnosis: string | null
          reason_for_referral: string | null
          referral_category: string | null
          referral_number: string
          referral_type: string
          referring_doctor_id: string | null
          referring_doctor_name: string | null
          referring_doctor_sip: string | null
          responded_at: string | null
          responded_by: string | null
          response_notes: string | null
          sisrute_id: string | null
          source_city: string | null
          source_facility_code: string | null
          source_facility_name: string | null
          source_facility_type: string | null
          source_province: string | null
          status: string | null
          sync_error: string | null
          sync_status: string | null
          transport_status: string | null
          transport_type: string | null
          treatment_given: string | null
          updated_at: string
          visit_id: string | null
          vital_signs: Json | null
        }
        Insert: {
          arrival_time?: string | null
          clinical_summary?: string | null
          created_at?: string
          departure_time?: string | null
          destination_city?: string | null
          destination_department?: string | null
          destination_facility_code?: string | null
          destination_facility_name?: string | null
          destination_facility_type?: string | null
          destination_province?: string | null
          diagnosis_description?: string | null
          id?: string
          last_sync_at?: string | null
          patient_id?: string | null
          primary_diagnosis?: string | null
          reason_for_referral?: string | null
          referral_category?: string | null
          referral_number: string
          referral_type: string
          referring_doctor_id?: string | null
          referring_doctor_name?: string | null
          referring_doctor_sip?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_notes?: string | null
          sisrute_id?: string | null
          source_city?: string | null
          source_facility_code?: string | null
          source_facility_name?: string | null
          source_facility_type?: string | null
          source_province?: string | null
          status?: string | null
          sync_error?: string | null
          sync_status?: string | null
          transport_status?: string | null
          transport_type?: string | null
          treatment_given?: string | null
          updated_at?: string
          visit_id?: string | null
          vital_signs?: Json | null
        }
        Update: {
          arrival_time?: string | null
          clinical_summary?: string | null
          created_at?: string
          departure_time?: string | null
          destination_city?: string | null
          destination_department?: string | null
          destination_facility_code?: string | null
          destination_facility_name?: string | null
          destination_facility_type?: string | null
          destination_province?: string | null
          diagnosis_description?: string | null
          id?: string
          last_sync_at?: string | null
          patient_id?: string | null
          primary_diagnosis?: string | null
          reason_for_referral?: string | null
          referral_category?: string | null
          referral_number?: string
          referral_type?: string
          referring_doctor_id?: string | null
          referring_doctor_name?: string | null
          referring_doctor_sip?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_notes?: string | null
          sisrute_id?: string | null
          source_city?: string | null
          source_facility_code?: string | null
          source_facility_name?: string | null
          source_facility_type?: string | null
          source_province?: string | null
          status?: string | null
          sync_error?: string | null
          sync_status?: string | null
          transport_status?: string | null
          transport_type?: string | null
          treatment_given?: string | null
          updated_at?: string
          visit_id?: string | null
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sisrute_referrals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sisrute_referrals_referring_doctor_id_fkey"
            columns: ["referring_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sisrute_referrals_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_display_config: {
        Row: {
          auto_refresh: boolean | null
          auto_refresh_interval: number | null
          created_at: string | null
          created_by: string | null
          custom_config: Json | null
          display_type: string
          id: string
          running_text: string | null
          running_text_enabled: boolean | null
          slideshow_enabled: boolean | null
          slideshow_interval: number | null
          updated_at: string | null
          updated_by: string | null
          video_auto_play: boolean | null
          video_enabled: boolean | null
        }
        Insert: {
          auto_refresh?: boolean | null
          auto_refresh_interval?: number | null
          created_at?: string | null
          created_by?: string | null
          custom_config?: Json | null
          display_type?: string
          id?: string
          running_text?: string | null
          running_text_enabled?: boolean | null
          slideshow_enabled?: boolean | null
          slideshow_interval?: number | null
          updated_at?: string | null
          updated_by?: string | null
          video_auto_play?: boolean | null
          video_enabled?: boolean | null
        }
        Update: {
          auto_refresh?: boolean | null
          auto_refresh_interval?: number | null
          created_at?: string | null
          created_by?: string | null
          custom_config?: Json | null
          display_type?: string
          id?: string
          running_text?: string | null
          running_text_enabled?: boolean | null
          slideshow_enabled?: boolean | null
          slideshow_interval?: number | null
          updated_at?: string | null
          updated_by?: string | null
          video_auto_play?: boolean | null
          video_enabled?: boolean | null
        }
        Relationships: []
      }
      smart_display_configs: {
        Row: {
          auto_refresh_seconds: number
          created_at: string
          created_by: string | null
          display_name: string
          display_type: string
          id: string
          is_active: boolean
          location: string | null
          settings: Json
          updated_at: string
        }
        Insert: {
          auto_refresh_seconds?: number
          created_at?: string
          created_by?: string | null
          display_name: string
          display_type?: string
          id?: string
          is_active?: boolean
          location?: string | null
          settings?: Json
          updated_at?: string
        }
        Update: {
          auto_refresh_seconds?: number
          created_at?: string
          created_by?: string | null
          display_name?: string
          display_type?: string
          id?: string
          is_active?: boolean
          location?: string | null
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      smart_display_devices: {
        Row: {
          auto_rotate: boolean
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          device_code: string
          device_name: string
          display_type: string
          enabled_modules: string[]
          id: string
          is_active: boolean
          location: string
          rotate_interval: number
          updated_at: string
        }
        Insert: {
          auto_rotate?: boolean
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          device_code: string
          device_name: string
          display_type?: string
          enabled_modules?: string[]
          id?: string
          is_active?: boolean
          location: string
          rotate_interval?: number
          updated_at?: string
        }
        Update: {
          auto_rotate?: boolean
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          device_code?: string
          device_name?: string
          display_type?: string
          enabled_modules?: string[]
          id?: string
          is_active?: boolean
          location?: string
          rotate_interval?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_display_devices_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "smart_display_devices_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_display_media: {
        Row: {
          created_at: string
          created_by: string | null
          device_id: string | null
          display_order: number | null
          display_type: string
          file_name: string
          file_url: string
          id: string
          media_type: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          device_id?: string | null
          display_order?: number | null
          display_type: string
          file_name: string
          file_url: string
          id?: string
          media_type: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          device_id?: string | null
          display_order?: number | null
          display_type?: string
          file_name?: string
          file_url?: string
          id?: string
          media_type?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_display_media_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "smart_display_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      sterilization_batches: {
        Row: {
          batch_number: string
          biological_indicator_result: string | null
          chemical_indicator_result: string | null
          created_at: string
          end_time: string | null
          exposure_time: number | null
          id: string
          notes: string | null
          operator_id: string | null
          pressure: number | null
          start_time: string
          status: Database["public"]["Enums"]["sterilization_status"] | null
          sterilization_method: string
          sterilizer_id: string | null
          temperature: number | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          biological_indicator_result?: string | null
          chemical_indicator_result?: string | null
          created_at?: string
          end_time?: string | null
          exposure_time?: number | null
          id?: string
          notes?: string | null
          operator_id?: string | null
          pressure?: number | null
          start_time: string
          status?: Database["public"]["Enums"]["sterilization_status"] | null
          sterilization_method: string
          sterilizer_id?: string | null
          temperature?: number | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          biological_indicator_result?: string | null
          chemical_indicator_result?: string | null
          created_at?: string
          end_time?: string | null
          exposure_time?: number | null
          id?: string
          notes?: string | null
          operator_id?: string | null
          pressure?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["sterilization_status"] | null
          sterilization_method?: string
          sterilizer_id?: string | null
          temperature?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sterilization_batches_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      sterilization_items: {
        Row: {
          category: string
          created_at: string
          current_cycles: number | null
          cycle_life: number | null
          id: string
          is_active: boolean | null
          item_code: string
          item_name: string
          sterilization_method: string
          storage_location: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          current_cycles?: number | null
          cycle_life?: number | null
          id?: string
          is_active?: boolean | null
          item_code: string
          item_name: string
          sterilization_method: string
          storage_location?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_cycles?: number | null
          cycle_life?: number | null
          id?: string
          is_active?: boolean | null
          item_code?: string
          item_name?: string
          sterilization_method?: string
          storage_location?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sterilization_records: {
        Row: {
          batch_id: string | null
          created_at: string
          expiry_date: string | null
          id: string
          issued_date: string | null
          issued_to_department: string | null
          item_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["sterilization_status"] | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          issued_to_department?: string | null
          item_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["sterilization_status"] | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          issued_to_department?: string | null
          item_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["sterilization_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "sterilization_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "sterilization_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sterilization_records_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "sterilization_items"
            referencedColumns: ["id"]
          },
        ]
      }
      subspecialties: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          specialty_code: string | null
          specialty_name: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          specialty_code?: string | null
          specialty_name?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          specialty_code?: string | null
          specialty_name?: string | null
        }
        Relationships: []
      }
      surgeries: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          anesthesia_type: Database["public"]["Enums"]["anesthesia_type"] | null
          asa_classification:
            | Database["public"]["Enums"]["asa_classification"]
            | null
          blood_loss_ml: number | null
          cancellation_reason: string | null
          complications: string | null
          consent_signed: boolean | null
          consent_signed_at: string | null
          consent_signed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          operating_room_id: string | null
          operative_notes: string | null
          patient_id: string
          postoperative_diagnosis: string | null
          postoperative_notes: string | null
          preoperative_diagnosis: string
          preoperative_notes: string | null
          procedure_code: string | null
          procedure_name: string
          procedure_type: string | null
          scheduled_date: string
          scheduled_end_time: string | null
          scheduled_start_time: string
          status: Database["public"]["Enums"]["surgery_status"] | null
          surgery_number: string
          updated_at: string
          visit_id: string | null
          wound_class: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          anesthesia_type?:
            | Database["public"]["Enums"]["anesthesia_type"]
            | null
          asa_classification?:
            | Database["public"]["Enums"]["asa_classification"]
            | null
          blood_loss_ml?: number | null
          cancellation_reason?: string | null
          complications?: string | null
          consent_signed?: boolean | null
          consent_signed_at?: string | null
          consent_signed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          operating_room_id?: string | null
          operative_notes?: string | null
          patient_id: string
          postoperative_diagnosis?: string | null
          postoperative_notes?: string | null
          preoperative_diagnosis: string
          preoperative_notes?: string | null
          procedure_code?: string | null
          procedure_name: string
          procedure_type?: string | null
          scheduled_date: string
          scheduled_end_time?: string | null
          scheduled_start_time: string
          status?: Database["public"]["Enums"]["surgery_status"] | null
          surgery_number: string
          updated_at?: string
          visit_id?: string | null
          wound_class?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          anesthesia_type?:
            | Database["public"]["Enums"]["anesthesia_type"]
            | null
          asa_classification?:
            | Database["public"]["Enums"]["asa_classification"]
            | null
          blood_loss_ml?: number | null
          cancellation_reason?: string | null
          complications?: string | null
          consent_signed?: boolean | null
          consent_signed_at?: string | null
          consent_signed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          operating_room_id?: string | null
          operative_notes?: string | null
          patient_id?: string
          postoperative_diagnosis?: string | null
          postoperative_notes?: string | null
          preoperative_diagnosis?: string
          preoperative_notes?: string | null
          procedure_code?: string | null
          procedure_name?: string
          procedure_type?: string | null
          scheduled_date?: string
          scheduled_end_time?: string | null
          scheduled_start_time?: string
          status?: Database["public"]["Enums"]["surgery_status"] | null
          surgery_number?: string
          updated_at?: string
          visit_id?: string | null
          wound_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surgeries_operating_room_id_fkey"
            columns: ["operating_room_id"]
            isOneToOne: false
            referencedRelation: "operating_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      surgery_instruments: {
        Row: {
          count_after: number | null
          count_before: number | null
          created_at: string
          id: string
          instrument_name: string
          is_verified: boolean | null
          notes: string | null
          quantity: number | null
          surgery_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          count_after?: number | null
          count_before?: number | null
          created_at?: string
          id?: string
          instrument_name: string
          is_verified?: boolean | null
          notes?: string | null
          quantity?: number | null
          surgery_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          count_after?: number | null
          count_before?: number | null
          created_at?: string
          id?: string
          instrument_name?: string
          is_verified?: boolean | null
          notes?: string | null
          quantity?: number | null
          surgery_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surgery_instruments_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      surgery_teams: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          notes: string | null
          role: string
          staff_id: string | null
          staff_name: string
          surgery_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          role: string
          staff_id?: string | null
          staff_name: string
          surgery_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          role?: string
          staff_id?: string | null
          staff_name?: string
          surgery_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "surgery_teams_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      surgical_safety_checklists: {
        Row: {
          allergies_known: boolean | null
          anesthesia_check_completed: boolean | null
          antibiotic_prophylaxis_given: boolean | null
          anticipated_critical_events_discussed: boolean | null
          aspiration_risk: boolean | null
          blood_loss_risk: boolean | null
          consent_confirmed: boolean | null
          created_at: string
          difficult_airway_risk: boolean | null
          equipment_problems_addressed: boolean | null
          essential_imaging_displayed: boolean | null
          id: string
          instrument_count_correct: boolean | null
          notes: string | null
          patient_identity_confirmed: boolean | null
          patient_name_procedure_site_confirmed: boolean | null
          procedure_recorded: boolean | null
          pulse_oximeter_functioning: boolean | null
          recovery_concerns_reviewed: boolean | null
          sign_in_by: string | null
          sign_in_completed: boolean | null
          sign_in_time: string | null
          sign_out_by: string | null
          sign_out_completed: boolean | null
          sign_out_time: string | null
          site_marked: boolean | null
          specimens_labeled: boolean | null
          sponge_count_correct: boolean | null
          surgery_id: string
          team_members_introduced: boolean | null
          time_out_by: string | null
          time_out_completed: boolean | null
          time_out_time: string | null
          updated_at: string
        }
        Insert: {
          allergies_known?: boolean | null
          anesthesia_check_completed?: boolean | null
          antibiotic_prophylaxis_given?: boolean | null
          anticipated_critical_events_discussed?: boolean | null
          aspiration_risk?: boolean | null
          blood_loss_risk?: boolean | null
          consent_confirmed?: boolean | null
          created_at?: string
          difficult_airway_risk?: boolean | null
          equipment_problems_addressed?: boolean | null
          essential_imaging_displayed?: boolean | null
          id?: string
          instrument_count_correct?: boolean | null
          notes?: string | null
          patient_identity_confirmed?: boolean | null
          patient_name_procedure_site_confirmed?: boolean | null
          procedure_recorded?: boolean | null
          pulse_oximeter_functioning?: boolean | null
          recovery_concerns_reviewed?: boolean | null
          sign_in_by?: string | null
          sign_in_completed?: boolean | null
          sign_in_time?: string | null
          sign_out_by?: string | null
          sign_out_completed?: boolean | null
          sign_out_time?: string | null
          site_marked?: boolean | null
          specimens_labeled?: boolean | null
          sponge_count_correct?: boolean | null
          surgery_id: string
          team_members_introduced?: boolean | null
          time_out_by?: string | null
          time_out_completed?: boolean | null
          time_out_time?: string | null
          updated_at?: string
        }
        Update: {
          allergies_known?: boolean | null
          anesthesia_check_completed?: boolean | null
          antibiotic_prophylaxis_given?: boolean | null
          anticipated_critical_events_discussed?: boolean | null
          aspiration_risk?: boolean | null
          blood_loss_risk?: boolean | null
          consent_confirmed?: boolean | null
          created_at?: string
          difficult_airway_risk?: boolean | null
          equipment_problems_addressed?: boolean | null
          essential_imaging_displayed?: boolean | null
          id?: string
          instrument_count_correct?: boolean | null
          notes?: string | null
          patient_identity_confirmed?: boolean | null
          patient_name_procedure_site_confirmed?: boolean | null
          procedure_recorded?: boolean | null
          pulse_oximeter_functioning?: boolean | null
          recovery_concerns_reviewed?: boolean | null
          sign_in_by?: string | null
          sign_in_completed?: boolean | null
          sign_in_time?: string | null
          sign_out_by?: string | null
          sign_out_completed?: boolean | null
          sign_out_time?: string | null
          site_marked?: boolean | null
          specimens_labeled?: boolean | null
          sponge_count_correct?: boolean | null
          surgery_id?: string
          team_members_introduced?: boolean | null
          time_out_by?: string | null
          time_out_completed?: boolean | null
          time_out_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surgical_safety_checklists_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_answers: {
        Row: {
          created_at: string
          id: string
          question_id: string
          rating_value: number | null
          response_id: string
          selected_options: Json | null
          text_value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          rating_value?: number | null
          response_id: string
          selected_options?: Json | null
          text_value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          rating_value?: number | null
          response_id?: string
          selected_options?: Json | null
          text_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_required: boolean
          max_rating: number | null
          options: Json | null
          question_code: string
          question_text: string
          question_type: string
          template_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_required?: boolean
          max_rating?: number | null
          options?: Json | null
          question_code: string
          question_text: string
          question_type?: string
          template_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_required?: boolean
          max_rating?: number | null
          options?: Json | null
          question_code?: string
          question_text?: string
          question_type?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          created_at: string
          department_id: string | null
          doctor_id: string | null
          feedback_notes: string | null
          id: string
          nps_score: number | null
          overall_score: number | null
          patient_id: string | null
          response_date: string
          status: string
          template_id: string
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          doctor_id?: string | null
          feedback_notes?: string | null
          id?: string
          nps_score?: number | null
          overall_score?: number | null
          patient_id?: string | null
          response_date?: string
          status?: string
          template_id: string
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          doctor_id?: string | null
          feedback_notes?: string | null
          id?: string
          nps_score?: number | null
          overall_score?: number | null
          patient_id?: string | null
          response_date?: string
          status?: string
          template_id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "survey_responses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          survey_type: string
          template_code: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          survey_type?: string
          template_code: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          survey_type?: string
          template_code?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
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
      therapy_sessions: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          assessment_id: string | null
          billing_status: string | null
          created_at: string
          duration_minutes: number | null
          home_exercise_program: string | null
          id: string
          next_session_plan: string | null
          notes: string | null
          pain_after: number | null
          pain_before: number | null
          patient_id: string
          patient_response: string | null
          progress_notes: string | null
          scheduled_date: string
          scheduled_time: string | null
          session_number: string
          status: string | null
          therapist_id: string | null
          therapist_name: string | null
          therapy_name: string
          therapy_type_id: string | null
          treatment_given: string | null
          updated_at: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          assessment_id?: string | null
          billing_status?: string | null
          created_at?: string
          duration_minutes?: number | null
          home_exercise_program?: string | null
          id?: string
          next_session_plan?: string | null
          notes?: string | null
          pain_after?: number | null
          pain_before?: number | null
          patient_id: string
          patient_response?: string | null
          progress_notes?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          session_number: string
          status?: string | null
          therapist_id?: string | null
          therapist_name?: string | null
          therapy_name: string
          therapy_type_id?: string | null
          treatment_given?: string | null
          updated_at?: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          assessment_id?: string | null
          billing_status?: string | null
          created_at?: string
          duration_minutes?: number | null
          home_exercise_program?: string | null
          id?: string
          next_session_plan?: string | null
          notes?: string | null
          pain_after?: number | null
          pain_before?: number | null
          patient_id?: string
          patient_response?: string | null
          progress_notes?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          session_number?: string
          status?: string | null
          therapist_id?: string | null
          therapist_name?: string | null
          therapy_name?: string
          therapy_type_id?: string | null
          treatment_given?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapy_sessions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "rehabilitation_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapy_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapy_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapy_sessions_therapy_type_id_fkey"
            columns: ["therapy_type_id"]
            isOneToOne: false
            referencedRelation: "therapy_types"
            referencedColumns: ["id"]
          },
        ]
      }
      therapy_types: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          type: Database["public"]["Enums"]["therapy_type"]
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          type: Database["public"]["Enums"]["therapy_type"]
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["therapy_type"]
          unit_price?: number | null
        }
        Relationships: []
      }
      training_records: {
        Row: {
          certificate_expiry: string | null
          certificate_number: string | null
          cost: number | null
          created_at: string
          duration_hours: number | null
          employee_id: string
          end_date: string | null
          id: string
          location: string | null
          notes: string | null
          provider: string | null
          score: number | null
          start_date: string
          status: string
          training_name: string
          training_type: string
          updated_at: string
        }
        Insert: {
          certificate_expiry?: string | null
          certificate_number?: string | null
          cost?: number | null
          created_at?: string
          duration_hours?: number | null
          employee_id: string
          end_date?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          provider?: string | null
          score?: number | null
          start_date: string
          status?: string
          training_name: string
          training_type: string
          updated_at?: string
        }
        Update: {
          certificate_expiry?: string | null
          certificate_number?: string | null
          cost?: number | null
          created_at?: string
          duration_hours?: number | null
          employee_id?: string
          end_date?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          provider?: string | null
          score?: number | null
          start_date?: string
          status?: string
          training_name?: string
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      transfusion_reactions: {
        Row: {
          blood_bag_id: string
          blood_bank_notified: boolean | null
          created_at: string
          id: string
          interventions: Json | null
          investigation_findings: string | null
          investigation_status: string | null
          medications_given: Json | null
          notes: string | null
          outcome: string | null
          patient_id: string
          reaction_time: string
          reaction_type: string
          reported_by: string | null
          severity: Database["public"]["Enums"]["transfusion_reaction_severity"]
          symptoms: Json | null
          transfusion_id: string
          transfusion_stopped: boolean | null
          updated_at: string
          vital_signs_at_reaction: Json | null
        }
        Insert: {
          blood_bag_id: string
          blood_bank_notified?: boolean | null
          created_at?: string
          id?: string
          interventions?: Json | null
          investigation_findings?: string | null
          investigation_status?: string | null
          medications_given?: Json | null
          notes?: string | null
          outcome?: string | null
          patient_id: string
          reaction_time?: string
          reaction_type: string
          reported_by?: string | null
          severity: Database["public"]["Enums"]["transfusion_reaction_severity"]
          symptoms?: Json | null
          transfusion_id: string
          transfusion_stopped?: boolean | null
          updated_at?: string
          vital_signs_at_reaction?: Json | null
        }
        Update: {
          blood_bag_id?: string
          blood_bank_notified?: boolean | null
          created_at?: string
          id?: string
          interventions?: Json | null
          investigation_findings?: string | null
          investigation_status?: string | null
          medications_given?: Json | null
          notes?: string | null
          outcome?: string | null
          patient_id?: string
          reaction_time?: string
          reaction_type?: string
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["transfusion_reaction_severity"]
          symptoms?: Json | null
          transfusion_id?: string
          transfusion_stopped?: boolean | null
          updated_at?: string
          vital_signs_at_reaction?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "transfusion_reactions_blood_bag_id_fkey"
            columns: ["blood_bag_id"]
            isOneToOne: false
            referencedRelation: "blood_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusion_reactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusion_reactions_transfusion_id_fkey"
            columns: ["transfusion_id"]
            isOneToOne: false
            referencedRelation: "transfusion_records"
            referencedColumns: ["id"]
          },
        ]
      }
      transfusion_records: {
        Row: {
          administered_by: string | null
          blood_bag_id: string
          blood_verified_by: Json | null
          created_at: string
          crossmatch_id: string | null
          end_time: string | null
          flow_rate: string | null
          had_reaction: boolean | null
          id: string
          notes: string | null
          patient_condition: string | null
          patient_consent: boolean | null
          patient_id: string
          post_vital_signs: Json | null
          pre_vital_signs: Json | null
          reaction_id: string | null
          request_id: string | null
          start_time: string | null
          supervised_by: string | null
          total_volume_transfused: number | null
          transfusion_date: string
          updated_at: string
        }
        Insert: {
          administered_by?: string | null
          blood_bag_id: string
          blood_verified_by?: Json | null
          created_at?: string
          crossmatch_id?: string | null
          end_time?: string | null
          flow_rate?: string | null
          had_reaction?: boolean | null
          id?: string
          notes?: string | null
          patient_condition?: string | null
          patient_consent?: boolean | null
          patient_id: string
          post_vital_signs?: Json | null
          pre_vital_signs?: Json | null
          reaction_id?: string | null
          request_id?: string | null
          start_time?: string | null
          supervised_by?: string | null
          total_volume_transfused?: number | null
          transfusion_date?: string
          updated_at?: string
        }
        Update: {
          administered_by?: string | null
          blood_bag_id?: string
          blood_verified_by?: Json | null
          created_at?: string
          crossmatch_id?: string | null
          end_time?: string | null
          flow_rate?: string | null
          had_reaction?: boolean | null
          id?: string
          notes?: string | null
          patient_condition?: string | null
          patient_consent?: boolean | null
          patient_id?: string
          post_vital_signs?: Json | null
          pre_vital_signs?: Json | null
          reaction_id?: string | null
          request_id?: string | null
          start_time?: string | null
          supervised_by?: string | null
          total_volume_transfused?: number | null
          transfusion_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfusion_records_blood_bag_id_fkey"
            columns: ["blood_bag_id"]
            isOneToOne: false
            referencedRelation: "blood_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusion_records_crossmatch_id_fkey"
            columns: ["crossmatch_id"]
            isOneToOne: false
            referencedRelation: "crossmatch_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusion_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusion_records_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "transfusion_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      transfusion_requests: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          created_at: string
          department: string | null
          id: string
          indication: string
          notes: string | null
          patient_blood_type: Database["public"]["Enums"]["blood_type"] | null
          patient_hemoglobin: number | null
          patient_id: string
          patient_platelet_count: number | null
          product_type: Database["public"]["Enums"]["blood_product_type"]
          request_date: string
          request_number: string
          requesting_doctor_id: string | null
          status: string | null
          units_requested: number
          updated_at: string
          urgency: string | null
          visit_id: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          department?: string | null
          id?: string
          indication: string
          notes?: string | null
          patient_blood_type?: Database["public"]["Enums"]["blood_type"] | null
          patient_hemoglobin?: number | null
          patient_id: string
          patient_platelet_count?: number | null
          product_type: Database["public"]["Enums"]["blood_product_type"]
          request_date?: string
          request_number: string
          requesting_doctor_id?: string | null
          status?: string | null
          units_requested: number
          updated_at?: string
          urgency?: string | null
          visit_id?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          department?: string | null
          id?: string
          indication?: string
          notes?: string | null
          patient_blood_type?: Database["public"]["Enums"]["blood_type"] | null
          patient_hemoglobin?: number | null
          patient_id?: string
          patient_platelet_count?: number | null
          product_type?: Database["public"]["Enums"]["blood_product_type"]
          request_date?: string
          request_number?: string
          requesting_doctor_id?: string | null
          status?: string | null
          units_requested?: number
          updated_at?: string
          urgency?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfusion_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusion_requests_requesting_doctor_id_fkey"
            columns: ["requesting_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusion_requests_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
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
      vascular_access: {
        Row: {
          access_type: Database["public"]["Enums"]["vascular_access_type"]
          assessment_notes: string | null
          complications: Json | null
          created_at: string
          creation_date: string | null
          id: string
          is_active: boolean | null
          last_assessment_date: string | null
          location: string | null
          maturation_date: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          access_type: Database["public"]["Enums"]["vascular_access_type"]
          assessment_notes?: string | null
          complications?: Json | null
          created_at?: string
          creation_date?: string | null
          id?: string
          is_active?: boolean | null
          last_assessment_date?: string | null
          location?: string | null
          maturation_date?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          access_type?: Database["public"]["Enums"]["vascular_access_type"]
          assessment_notes?: string | null
          complications?: Json | null
          created_at?: string
          creation_date?: string | null
          id?: string
          is_active?: boolean | null
          last_assessment_date?: string | null
          location?: string | null
          maturation_date?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vascular_access_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contracts: {
        Row: {
          attachments: Json | null
          contract_number: string
          contract_type: string
          created_at: string
          end_date: string
          id: string
          start_date: string
          status: string | null
          terms: string | null
          updated_at: string
          value: number | null
          vendor_id: string | null
        }
        Insert: {
          attachments?: Json | null
          contract_number: string
          contract_type: string
          created_at?: string
          end_date: string
          id?: string
          start_date: string
          status?: string | null
          terms?: string | null
          updated_at?: string
          value?: number | null
          vendor_id?: string | null
        }
        Update: {
          attachments?: Json | null
          contract_number?: string
          contract_type?: string
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          status?: string | null
          terms?: string | null
          updated_at?: string
          value?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_evaluations: {
        Row: {
          comments: string | null
          created_at: string
          delivery_score: number | null
          evaluation_date: string
          evaluator_id: string | null
          id: string
          overall_score: number | null
          period_end: string | null
          period_start: string | null
          price_score: number | null
          quality_score: number | null
          recommendations: string | null
          service_score: number | null
          vendor_id: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          delivery_score?: number | null
          evaluation_date: string
          evaluator_id?: string | null
          id?: string
          overall_score?: number | null
          period_end?: string | null
          period_start?: string | null
          price_score?: number | null
          quality_score?: number | null
          recommendations?: string | null
          service_score?: number | null
          vendor_id?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          delivery_score?: number | null
          evaluation_date?: string
          evaluator_id?: string | null
          id?: string
          overall_score?: number | null
          period_end?: string | null
          period_start?: string | null
          price_score?: number | null
          quality_score?: number | null
          recommendations?: string | null
          service_score?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_evaluations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_name: string | null
          blacklist_reason: string | null
          blacklisted: boolean | null
          category: string[] | null
          city: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          credit_limit: number | null
          email: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          npwp: string | null
          payment_terms: number | null
          phone: string | null
          rating: number | null
          updated_at: string
          vendor_code: string
          vendor_name: string
          vendor_type: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          category?: string[] | null
          city?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          npwp?: string | null
          payment_terms?: number | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
          vendor_code: string
          vendor_name: string
          vendor_type: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          category?: string[] | null
          city?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          npwp?: string | null
          payment_terms?: number | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
          vendor_code?: string
          vendor_name?: string
          vendor_type?: string
          website?: string | null
        }
        Relationships: []
      }
      ventilator_settings: {
        Row: {
          admission_id: string
          base_excess: number | null
          created_at: string
          fio2: number | null
          hco3: number | null
          i_e_ratio: string | null
          id: string
          minute_volume: number | null
          notes: string | null
          p_f_ratio: number | null
          paco2: number | null
          pao2: number | null
          peep: number | null
          ph: number | null
          pip: number | null
          plateau_pressure: number | null
          pressure_support: number | null
          recorded_at: string
          recorded_by: string | null
          respiratory_rate_actual: number | null
          respiratory_rate_set: number | null
          tidal_volume: number | null
          trigger_sensitivity: number | null
          ventilator_mode: Database["public"]["Enums"]["ventilator_mode"] | null
        }
        Insert: {
          admission_id: string
          base_excess?: number | null
          created_at?: string
          fio2?: number | null
          hco3?: number | null
          i_e_ratio?: string | null
          id?: string
          minute_volume?: number | null
          notes?: string | null
          p_f_ratio?: number | null
          paco2?: number | null
          pao2?: number | null
          peep?: number | null
          ph?: number | null
          pip?: number | null
          plateau_pressure?: number | null
          pressure_support?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate_actual?: number | null
          respiratory_rate_set?: number | null
          tidal_volume?: number | null
          trigger_sensitivity?: number | null
          ventilator_mode?:
            | Database["public"]["Enums"]["ventilator_mode"]
            | null
        }
        Update: {
          admission_id?: string
          base_excess?: number | null
          created_at?: string
          fio2?: number | null
          hco3?: number | null
          i_e_ratio?: string | null
          id?: string
          minute_volume?: number | null
          notes?: string | null
          p_f_ratio?: number | null
          paco2?: number | null
          pao2?: number | null
          peep?: number | null
          ph?: number | null
          pip?: number | null
          plateau_pressure?: number | null
          pressure_support?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate_actual?: number | null
          respiratory_rate_set?: number | null
          tidal_volume?: number | null
          trigger_sensitivity?: number | null
          ventilator_mode?:
            | Database["public"]["Enums"]["ventilator_mode"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "ventilator_settings_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "icu_admissions"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
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
      visum_reports: {
        Row: {
          age_of_injury: string | null
          case_id: string | null
          cause_of_injury: string | null
          created_at: string
          examination_date: string | null
          examiner_id: string | null
          examiner_name: string
          finalized_date: string | null
          id: string
          injury_description: Json | null
          kesimpulan: string | null
          notes: string | null
          patient_id: string | null
          pemberitaan: string | null
          pendahuluan: string | null
          pro_justitia: string | null
          request_date: string | null
          request_number: string | null
          requesting_authority: string | null
          status: string | null
          submitted_date: string | null
          submitted_to: string | null
          updated_at: string
          victim_identity: Json | null
          visum_number: string
          visum_type: string
          weapon_type: string | null
        }
        Insert: {
          age_of_injury?: string | null
          case_id?: string | null
          cause_of_injury?: string | null
          created_at?: string
          examination_date?: string | null
          examiner_id?: string | null
          examiner_name: string
          finalized_date?: string | null
          id?: string
          injury_description?: Json | null
          kesimpulan?: string | null
          notes?: string | null
          patient_id?: string | null
          pemberitaan?: string | null
          pendahuluan?: string | null
          pro_justitia?: string | null
          request_date?: string | null
          request_number?: string | null
          requesting_authority?: string | null
          status?: string | null
          submitted_date?: string | null
          submitted_to?: string | null
          updated_at?: string
          victim_identity?: Json | null
          visum_number: string
          visum_type: string
          weapon_type?: string | null
        }
        Update: {
          age_of_injury?: string | null
          case_id?: string | null
          cause_of_injury?: string | null
          created_at?: string
          examination_date?: string | null
          examiner_id?: string | null
          examiner_name?: string
          finalized_date?: string | null
          id?: string
          injury_description?: Json | null
          kesimpulan?: string | null
          notes?: string | null
          patient_id?: string | null
          pemberitaan?: string | null
          pendahuluan?: string | null
          pro_justitia?: string | null
          request_date?: string | null
          request_number?: string | null
          requesting_authority?: string | null
          status?: string | null
          submitted_date?: string | null
          submitted_to?: string | null
          updated_at?: string
          victim_identity?: Json | null
          visum_number?: string
          visum_type?: string
          weapon_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visum_reports_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "mortuary_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visum_reports_examiner_id_fkey"
            columns: ["examiner_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visum_reports_patient_id_fkey"
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
      waste_categories: {
        Row: {
          code: string
          color_code: string | null
          created_at: string
          disposal_method: string | null
          handling_instructions: string | null
          id: string
          is_active: boolean | null
          name: string
          waste_type: string
        }
        Insert: {
          code: string
          color_code?: string | null
          created_at?: string
          disposal_method?: string | null
          handling_instructions?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          waste_type: string
        }
        Update: {
          code?: string
          color_code?: string | null
          created_at?: string
          disposal_method?: string | null
          handling_instructions?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          waste_type?: string
        }
        Relationships: []
      }
      waste_collections: {
        Row: {
          category_id: string | null
          collected_by: string | null
          collection_date: string
          collection_number: string
          container_count: number | null
          created_at: string
          department_id: string | null
          id: string
          notes: string | null
          quantity: number | null
          unit: string | null
        }
        Insert: {
          category_id?: string | null
          collected_by?: string | null
          collection_date: string
          collection_number: string
          container_count?: number | null
          created_at?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Update: {
          category_id?: string | null
          collected_by?: string | null
          collection_date?: string
          collection_number?: string
          container_count?: number | null
          created_at?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waste_collections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "waste_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_collections_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_collections_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department_satisfaction_summary"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "waste_collections_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_disposals: {
        Row: {
          category_id: string | null
          cost: number | null
          created_at: string
          destination: string | null
          disposal_date: string
          disposal_method: string | null
          disposal_number: string
          id: string
          manifest_number: string | null
          notes: string | null
          total_weight: number | null
          transported_by: string | null
          vendor_name: string | null
          verified_by: string | null
        }
        Insert: {
          category_id?: string | null
          cost?: number | null
          created_at?: string
          destination?: string | null
          disposal_date: string
          disposal_method?: string | null
          disposal_number: string
          id?: string
          manifest_number?: string | null
          notes?: string | null
          total_weight?: number | null
          transported_by?: string | null
          vendor_name?: string | null
          verified_by?: string | null
        }
        Update: {
          category_id?: string | null
          cost?: number | null
          created_at?: string
          destination?: string | null
          disposal_date?: string
          disposal_method?: string | null
          disposal_number?: string
          id?: string
          manifest_number?: string | null
          notes?: string | null
          total_weight?: number | null
          transported_by?: string | null
          vendor_name?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waste_disposals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "waste_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_disposals_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      webrtc_signals: {
        Row: {
          created_at: string
          id: string
          sender_id: string
          session_id: string
          signal_data: Json
          signal_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          sender_id: string
          session_id: string
          signal_data: Json
          signal_type: string
        }
        Update: {
          created_at?: string
          id?: string
          sender_id?: string
          session_id?: string
          signal_data?: Json
          signal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "webrtc_signals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "telemedicine_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      work_shifts: {
        Row: {
          allowance_amount: number | null
          break_duration: number | null
          created_at: string
          end_time: string
          id: string
          is_active: boolean | null
          is_night_shift: boolean | null
          shift_code: string
          shift_name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          allowance_amount?: number | null
          break_duration?: number | null
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean | null
          is_night_shift?: boolean | null
          shift_code: string
          shift_name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          allowance_amount?: number | null
          break_duration?: number | null
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          is_night_shift?: boolean | null
          shift_code?: string
          shift_name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      department_satisfaction_summary: {
        Row: {
          avg_satisfaction: number | null
          department_id: string | null
          department_name: string | null
          detractors: number | null
          nps_score: number | null
          passives: number | null
          promoters: number | null
          total_responses: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_role_menu_access: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      calculate_rl6_indicators: {
        Args: { p_month: number; p_year: number }
        Returns: undefined
      }
      calculate_satisfaction_score: {
        Args: {
          p_department_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          avg_score: number
          detractors: number
          nps_score: number
          passives: number
          promoters: number
          total_responses: number
        }[]
      }
      cleanup_old_webrtc_signals: { Args: never; Returns: undefined }
      generate_claim_number: { Args: never; Returns: string }
      generate_consent_number: { Args: never; Returns: string }
      generate_dialysis_session_number: { Args: never; Returns: string }
      generate_dispatch_number: { Args: never; Returns: string }
      generate_employee_number: { Args: never; Returns: string }
      generate_home_care_visit_number: { Args: never; Returns: string }
      generate_icu_admission_number: { Args: never; Returns: string }
      generate_incident_number: { Args: never; Returns: string }
      generate_insurance_claim_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_journal_number: { Args: never; Returns: string }
      generate_lab_number: { Args: never; Returns: string }
      generate_maintenance_request_number: { Args: never; Returns: string }
      generate_mcu_registration_number: { Args: never; Returns: string }
      generate_medical_record_number: { Args: never; Returns: string }
      generate_mortuary_case_number: { Args: never; Returns: string }
      generate_po_number: { Args: never; Returns: string }
      generate_pr_number: { Args: never; Returns: string }
      generate_queue_number: {
        Args: { p_service_type: string }
        Returns: string
      }
      generate_surgery_number: { Args: never; Returns: string }
      generate_therapy_session_number: { Args: never; Returns: string }
      generate_transfusion_request_number: { Args: never; Returns: string }
      generate_visit_number: { Args: never; Returns: string }
      generate_visum_number: { Args: never; Returns: string }
      get_available_modules: {
        Args: { p_hospital_type: string }
        Returns: {
          display_order: number
          is_core_module: boolean
          module_category: string
          module_code: string
          module_icon: string
          module_name: string
          module_path: string
        }[]
      }
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
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_module_enabled: { Args: { p_module_code: string }; Returns: boolean }
      is_setup_completed: { Args: never; Returns: boolean }
      migrate_hospital_type: {
        Args: { p_new_type: string; p_notes?: string }
        Returns: Json
      }
      preview_hospital_type_migration: {
        Args: { p_new_type: string }
        Returns: Json
      }
      reset_system_to_initial: { Args: never; Returns: boolean }
      toggle_module: {
        Args: { p_enabled: boolean; p_module_code: string }
        Returns: boolean
      }
      update_enabled_modules: {
        Args: { p_module_codes: string[] }
        Returns: boolean
      }
    }
    Enums: {
      anesthesia_type:
        | "general"
        | "regional"
        | "local"
        | "sedation"
        | "combined"
      app_role:
        | "admin"
        | "dokter"
        | "perawat"
        | "kasir"
        | "farmasi"
        | "laboratorium"
        | "radiologi"
        | "pendaftaran"
        | "keuangan"
        | "gizi"
        | "icu"
        | "bedah"
        | "rehabilitasi"
        | "mcu"
        | "forensik"
        | "cssd"
        | "manajemen"
        | "bank_darah"
        | "hemodialisa"
        | "hrd"
        | "procurement"
      asa_classification:
        | "ASA_I"
        | "ASA_II"
        | "ASA_III"
        | "ASA_IV"
        | "ASA_V"
        | "ASA_VI"
      asset_status: "active" | "inactive" | "maintenance" | "disposed" | "lost"
      bed_status: "tersedia" | "terisi" | "maintenance" | "reserved"
      billing_status: "pending" | "lunas" | "batal"
      blood_product_type:
        | "whole_blood"
        | "prc"
        | "ffp"
        | "tc"
        | "cryoprecipitate"
        | "platelets"
      blood_status:
        | "available"
        | "reserved"
        | "crossmatched"
        | "issued"
        | "transfused"
        | "expired"
        | "discarded"
      blood_type: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      claim_status: "draft" | "submitted" | "approved" | "rejected" | "paid"
      consent_status: "pending" | "signed" | "refused" | "revoked" | "expired"
      crossmatch_result: "compatible" | "incompatible" | "pending"
      dialysis_type: "hemodialysis" | "peritoneal" | "crrt" | "sled"
      diet_category:
        | "regular"
        | "diabetes"
        | "renal"
        | "cardiac"
        | "low_sodium"
        | "high_protein"
        | "soft"
        | "liquid"
        | "enteral"
        | "parenteral"
        | "other"
      gender_type: "L" | "P"
      hospital_type_enum: "A" | "B" | "C" | "D" | "FKTP"
      icu_admission_status: "active" | "transferred" | "discharged" | "deceased"
      icu_type: "icu" | "nicu" | "picu" | "iccu" | "hcu"
      incident_severity:
        | "near_miss"
        | "minor"
        | "moderate"
        | "major"
        | "sentinel"
      insurance_claim_status:
        | "draft"
        | "submitted"
        | "verified"
        | "approved"
        | "partial"
        | "rejected"
        | "paid"
      insurance_type: "bpjs" | "jasa_raharja" | "private" | "corporate"
      linen_status: "clean" | "dirty" | "in_laundry" | "damaged" | "disposed"
      maintenance_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "overdue"
      mortuary_case_type:
        | "natural"
        | "accident"
        | "suicide"
        | "homicide"
        | "undetermined"
        | "pending"
      patient_status: "aktif" | "non_aktif" | "meninggal"
      payment_type: "bpjs" | "umum" | "asuransi"
      prescription_status:
        | "menunggu"
        | "diproses"
        | "siap"
        | "diserahkan"
        | "batal"
      session_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "missed"
      sterilization_status:
        | "pending"
        | "in_progress"
        | "sterilized"
        | "failed"
        | "expired"
      surgery_status:
        | "scheduled"
        | "preparation"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "postponed"
      therapy_type:
        | "physiotherapy"
        | "occupational_therapy"
        | "speech_therapy"
        | "hydrotherapy"
        | "other"
      transfusion_reaction_severity: "mild" | "moderate" | "severe" | "fatal"
      triage_level: "merah" | "kuning" | "hijau" | "hitam"
      vascular_access_type:
        | "av_fistula"
        | "av_graft"
        | "tunneled_catheter"
        | "non_tunneled_catheter"
        | "peritoneal_catheter"
      ventilator_mode:
        | "CMV"
        | "SIMV"
        | "PSV"
        | "CPAP"
        | "BiPAP"
        | "APRV"
        | "HFOV"
      visit_status: "menunggu" | "dipanggil" | "dilayani" | "selesai" | "batal"
      visit_type: "rawat_jalan" | "rawat_inap" | "igd"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalPostgres">

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
      anesthesia_type: ["general", "regional", "local", "sedation", "combined"],
      app_role: [
        "admin",
        "dokter",
        "perawat",
        "kasir",
        "farmasi",
        "laboratorium",
        "radiologi",
        "pendaftaran",
        "keuangan",
        "gizi",
        "icu",
        "bedah",
        "rehabilitasi",
        "mcu",
        "forensik",
        "cssd",
        "manajemen",
        "bank_darah",
        "hemodialisa",
        "hrd",
        "procurement",
      ],
      asa_classification: [
        "ASA_I",
        "ASA_II",
        "ASA_III",
        "ASA_IV",
        "ASA_V",
        "ASA_VI",
      ],
      asset_status: ["active", "inactive", "maintenance", "disposed", "lost"],
      bed_status: ["tersedia", "terisi", "maintenance", "reserved"],
      billing_status: ["pending", "lunas", "batal"],
      blood_product_type: [
        "whole_blood",
        "prc",
        "ffp",
        "tc",
        "cryoprecipitate",
        "platelets",
      ],
      blood_status: [
        "available",
        "reserved",
        "crossmatched",
        "issued",
        "transfused",
        "expired",
        "discarded",
      ],
      blood_type: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      claim_status: ["draft", "submitted", "approved", "rejected", "paid"],
      consent_status: ["pending", "signed", "refused", "revoked", "expired"],
      crossmatch_result: ["compatible", "incompatible", "pending"],
      dialysis_type: ["hemodialysis", "peritoneal", "crrt", "sled"],
      diet_category: [
        "regular",
        "diabetes",
        "renal",
        "cardiac",
        "low_sodium",
        "high_protein",
        "soft",
        "liquid",
        "enteral",
        "parenteral",
        "other",
      ],
      gender_type: ["L", "P"],
      hospital_type_enum: ["A", "B", "C", "D", "FKTP"],
      icu_admission_status: ["active", "transferred", "discharged", "deceased"],
      icu_type: ["icu", "nicu", "picu", "iccu", "hcu"],
      incident_severity: [
        "near_miss",
        "minor",
        "moderate",
        "major",
        "sentinel",
      ],
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
      linen_status: ["clean", "dirty", "in_laundry", "damaged", "disposed"],
      maintenance_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "overdue",
      ],
      mortuary_case_type: [
        "natural",
        "accident",
        "suicide",
        "homicide",
        "undetermined",
        "pending",
      ],
      patient_status: ["aktif", "non_aktif", "meninggal"],
      payment_type: ["bpjs", "umum", "asuransi"],
      prescription_status: [
        "menunggu",
        "diproses",
        "siap",
        "diserahkan",
        "batal",
      ],
      session_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "missed",
      ],
      sterilization_status: [
        "pending",
        "in_progress",
        "sterilized",
        "failed",
        "expired",
      ],
      surgery_status: [
        "scheduled",
        "preparation",
        "in_progress",
        "completed",
        "cancelled",
        "postponed",
      ],
      therapy_type: [
        "physiotherapy",
        "occupational_therapy",
        "speech_therapy",
        "hydrotherapy",
        "other",
      ],
      transfusion_reaction_severity: ["mild", "moderate", "severe", "fatal"],
      triage_level: ["merah", "kuning", "hijau", "hitam"],
      vascular_access_type: [
        "av_fistula",
        "av_graft",
        "tunneled_catheter",
        "non_tunneled_catheter",
        "peritoneal_catheter",
      ],
      ventilator_mode: ["CMV", "SIMV", "PSV", "CPAP", "BiPAP", "APRV", "HFOV"],
      visit_status: ["menunggu", "dipanggil", "dilayani", "selesai", "batal"],
      visit_type: ["rawat_jalan", "rawat_inap", "igd"],
    },
  },
} as const
