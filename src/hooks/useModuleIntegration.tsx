import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Shared types for module integration
export interface PatientWithVisits {
  id: string;
  medical_record_number: string;
  nik: string;
  full_name: string;
  gender: "L" | "P";
  birth_date: string;
  phone: string | null;
  bpjs_number: string | null;
  visits?: Visit[];
}

export interface Visit {
  id: string;
  visit_number: string;
  visit_date: string;
  visit_type: string;
  status: string;
  payment_type: string;
  queue_number: number | null;
  chief_complaint: string | null;
  department?: { id: string; name: string };
  doctor?: { id: string; full_name: string };
}

export interface MedicalRecordSummary {
  id: string;
  visit_id: string;
  patient_id: string;
  record_date: string;
  subjective: string | null;
  assessment: string | null;
  diagnoses?: { code: string; name: string }[];
}

export interface PrescriptionSummary {
  id: string;
  prescription_number: string;
  visit_id: string;
  patient_id: string;
  status: string;
  item_count: number;
}

export interface BillingSummary {
  id: string;
  invoice_number: string;
  visit_id: string;
  patient_id: string;
  total: number;
  status: string;
}

// Hook to get patient with all related data
export function usePatientFullProfile(patientId: string | null) {
  return useQuery({
    queryKey: ["patient-full-profile", patientId],
    queryFn: async () => {
      if (!patientId) return null;

      // Get patient basic info
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (patientError) throw patientError;

      // Get visits
      const { data: visits } = await supabase
        .from("visits")
        .select(`
          id,
          visit_number,
          visit_date,
          visit_type,
          status,
          payment_type,
          queue_number,
          chief_complaint,
          departments(id, name),
          doctors(id, full_name)
        `)
        .eq("patient_id", patientId)
        .order("visit_date", { ascending: false })
        .limit(20);

      // Get medical records
      const { data: medicalRecords } = await supabase
        .from("medical_records")
        .select(`
          id,
          visit_id,
          record_date,
          subjective,
          assessment
        `)
        .eq("patient_id", patientId)
        .order("record_date", { ascending: false })
        .limit(10);

      // Get prescriptions
      const { data: prescriptions } = await supabase
        .from("prescriptions")
        .select(`
          id,
          prescription_number,
          visit_id,
          status,
          prescription_items(id)
        `)
        .eq("patient_id", patientId)
        .order("prescription_date", { ascending: false })
        .limit(10);

      // Get billings
      const { data: billings } = await supabase
        .from("billings")
        .select(`
          id,
          invoice_number,
          visit_id,
          total,
          status
        `)
        .eq("patient_id", patientId)
        .order("billing_date", { ascending: false })
        .limit(10);

      return {
        patient,
        visits: visits || [],
        medicalRecords: medicalRecords || [],
        prescriptions: (prescriptions || []).map((p: any) => ({
          ...p,
          item_count: p.prescription_items?.length || 0,
        })),
        billings: billings || [],
      };
    },
    enabled: !!patientId,
  });
}

// Hook to get visit with all related data
export function useVisitFullDetails(visitId: string | null) {
  return useQuery({
    queryKey: ["visit-full-details", visitId],
    queryFn: async () => {
      if (!visitId) return null;

      // Get visit with patient and doctor
      const { data: visit, error: visitError } = await supabase
        .from("visits")
        .select(`
          *,
          patients(id, full_name, medical_record_number, nik, gender, birth_date, phone, bpjs_number),
          departments(id, name, code),
          doctors(id, full_name, specialization)
        `)
        .eq("id", visitId)
        .single();

      if (visitError) throw visitError;

      // Get medical record for this visit
      const { data: medicalRecord } = await supabase
        .from("medical_records")
        .select(`
          *,
          diagnoses:diagnosis_records(
            id,
            icd_codes(code, description_id, description_en)
          )
        `)
        .eq("visit_id", visitId)
        .maybeSingle();

      // Get prescriptions for this visit
      const { data: prescriptions } = await supabase
        .from("prescriptions")
        .select(`
          id,
          prescription_number,
          status,
          prescription_items(
            id,
            quantity,
            dosage,
            frequency,
            instructions,
            medicines(id, name, unit)
          )
        `)
        .eq("visit_id", visitId);

      // Get billing for this visit
      const { data: billing } = await supabase
        .from("billings")
        .select(`
          *,
          billing_items(*)
        `)
        .eq("visit_id", visitId)
        .maybeSingle();

      return {
        visit,
        medicalRecord,
        prescriptions: prescriptions || [],
        billing,
      };
    },
    enabled: !!visitId,
  });
}

// Hook to create prescription from visit
export function useCreatePrescription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      visitId,
      patientId,
      doctorId,
      items,
    }: {
      visitId: string;
      patientId: string;
      doctorId: string;
      items: Array<{
        medicine_id: string;
        quantity: number;
        dosage: string;
        frequency: string;
        instructions?: string;
      }>;
    }) => {
      // Generate prescription number
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      const prescriptionNumber = `RX-${timestamp}-${random}`;

      // Create prescription
      const { data: prescription, error: prescError } = await supabase
        .from("prescriptions")
        .insert({
          prescription_number: prescriptionNumber,
          visit_id: visitId,
          patient_id: patientId,
          doctor_id: doctorId,
          status: "menunggu",
        })
        .select()
        .single();

      if (prescError) throw prescError;

      // Create prescription items
      const prescriptionItems = items.map((item) => ({
        prescription_id: prescription.id,
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        dosage: item.dosage,
        frequency: item.frequency,
        instructions: item.instructions || null,
      }));

      const { error: itemsError } = await supabase
        .from("prescription_items")
        .insert(prescriptionItems);

      if (itemsError) throw itemsError;

      return prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["visit-full-details"] });
      toast({
        title: "Berhasil",
        description: "Resep berhasil dibuat",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message,
      });
    },
  });
}

// Hook to create billing from visit
export function useCreateBilling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      visitId,
      patientId,
      paymentType,
      items,
    }: {
      visitId: string;
      patientId: string;
      paymentType: "umum" | "bpjs" | "asuransi";
      items: Array<{
        item_type: string;
        item_name: string;
        quantity: number;
        unit_price: number;
      }>;
    }) => {
      // Generate invoice number
      const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number");

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const tax = 0; // No tax for healthcare in Indonesia
      const total = subtotal + tax;

      // Create billing
      const { data: billing, error: billingError } = await supabase
        .from("billings")
        .insert({
          invoice_number: invoiceNumber,
          visit_id: visitId,
          patient_id: patientId,
          payment_type: paymentType,
          subtotal,
          tax,
          total,
          status: "pending",
        })
        .select()
        .single();

      if (billingError) throw billingError;

      // Create billing items
      const billingItems = items.map((item) => ({
        billing_id: billing.id,
        item_type: item.item_type,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from("billing_items")
        .insert(billingItems);

      if (itemsError) throw itemsError;

      return billing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billings"] });
      queryClient.invalidateQueries({ queryKey: ["visit-full-details"] });
      toast({
        title: "Berhasil",
        description: "Tagihan berhasil dibuat",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message,
      });
    },
  });
}

// Hook to complete visit workflow (finish examination -> create billing)
export function useCompleteVisitWorkflow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      visitId,
      patientId,
      paymentType,
      consultationFee = 100000,
    }: {
      visitId: string;
      patientId: string;
      paymentType: "umum" | "bpjs" | "asuransi";
      consultationFee?: number;
    }) => {
      // Update visit status to selesai
      const { error: visitError } = await supabase
        .from("visits")
        .update({ status: "selesai" })
        .eq("id", visitId);

      if (visitError) throw visitError;

      // Only create billing for non-BPJS (BPJS handled separately via claims)
      if (paymentType === "umum" || paymentType === "asuransi") {
        const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number");

        const { data: billing, error: billingError } = await supabase
          .from("billings")
          .insert({
            invoice_number: invoiceNumber,
            visit_id: visitId,
            patient_id: patientId,
            payment_type: paymentType,
            subtotal: consultationFee,
            tax: 0,
            total: consultationFee,
            status: "pending",
          })
          .select()
          .single();

        if (billingError) throw billingError;

        // Add consultation item
        await supabase.from("billing_items").insert({
          billing_id: billing.id,
          item_type: "consultation",
          item_name: "Konsultasi Dokter",
          quantity: 1,
          unit_price: consultationFee,
          total_price: consultationFee,
        });

        return { visitId, billingId: billing.id };
      }

      return { visitId, billingId: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({ queryKey: ["billings"] });
      toast({
        title: "Berhasil",
        description: "Kunjungan selesai, tagihan sudah dibuat",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message,
      });
    },
  });
}
