import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Clinical Integration Hook
 * Integrates workflows across clinical modules
 */

// ==================== IGD INTEGRATION ====================

export function useIGDToAdmission() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      emergencyVisitId,
      visitId,
      patientId,
      disposition,
      roomId,
      bedId,
      doctorId,
    }: {
      emergencyVisitId: string;
      visitId: string;
      patientId: string;
      disposition: "rawat_inap" | "rawat_jalan" | "rujuk" | "pulang" | "meninggal";
      roomId?: string;
      bedId?: string;
      doctorId?: string;
    }) => {
      // Update emergency visit disposition
      await supabase
        .from("emergency_visits")
        .update({
          disposition,
          disposition_time: new Date().toISOString(),
        })
        .eq("id", emergencyVisitId);

      // If rawat inap, create inpatient admission
      if (disposition === "rawat_inap" && roomId) {
        await supabase.from("inpatient_admissions").insert({
          patient_id: patientId,
          visit_id: visitId,
          room_id: roomId,
          bed_id: bedId || null,
          attending_doctor_id: doctorId || null,
          status: "active",
        });

        if (bedId) {
          await supabase.from("beds").update({ status: "terisi", current_patient_id: patientId }).eq("id", bedId);
        }
      }

      // Update visit status
      await supabase.from("visits").update({ status: "selesai" }).eq("id", visitId);

      return { disposition };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-visits"] });
      queryClient.invalidateQueries({ queryKey: ["inpatient-admissions"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({ title: "Disposisi berhasil" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Gagal", description: error.message });
    },
  });
}

// ==================== RAWAT INAP INTEGRATION ====================

export function useInpatientWorkflow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const transferBed = useMutation({
    mutationFn: async ({
      admissionId,
      currentBedId,
      newRoomId,
      newBedId,
    }: {
      admissionId: string;
      currentBedId: string | null;
      newRoomId: string;
      newBedId: string;
    }) => {
      if (currentBedId) {
        await supabase.from("beds").update({ status: "tersedia", current_patient_id: null }).eq("id", currentBedId);
      }

      const { data: admission } = await supabase.from("inpatient_admissions").select("patient_id").eq("id", admissionId).single();
      
      await supabase.from("beds").update({ status: "terisi", current_patient_id: admission?.patient_id }).eq("id", newBedId);
      await supabase.from("inpatient_admissions").update({ room_id: newRoomId, bed_id: newBedId }).eq("id", admissionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inpatient-admissions"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({ title: "Transfer berhasil" });
    },
  });

  const createDischargeBilling = useMutation({
    mutationFn: async ({
      visitId,
      patientId,
      paymentType,
      amount,
    }: {
      visitId: string;
      patientId: string;
      paymentType: "umum" | "bpjs" | "asuransi";
      amount: number;
    }) => {
      const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number");

      const { data: billing, error } = await supabase
        .from("billings")
        .insert({
          invoice_number: invoiceNumber,
          visit_id: visitId,
          patient_id: patientId,
          payment_type: paymentType,
          subtotal: amount,
          tax: 0,
          total: amount,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return billing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billings"] });
      toast({ title: "Tagihan rawat inap dibuat" });
    },
  });

  return { transferBed, createDischargeBilling };
}

// ==================== LAB INTEGRATION ====================

export function useLabIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLabOrderFromVisit = useMutation({
    mutationFn: async ({
      visitId,
      patientId,
      doctorId,
      templateIds,
      notes,
    }: {
      visitId: string;
      patientId: string;
      doctorId: string;
      templateIds: string[];
      notes?: string;
    }) => {
      const results = await Promise.all(
        templateIds.map(async (templateId) => {
          const labNumber = `LAB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

          const { data, error } = await supabase
            .from("lab_results")
            .insert({
              lab_number: labNumber,
              patient_id: patientId,
              template_id: templateId,
              visit_id: visitId,
              requested_by: doctorId,
              notes: notes || null,
              status: "pending",
              results: {},
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        })
      );

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-results"] });
      toast({ title: "Permintaan lab berhasil dibuat" });
    },
  });

  const completeLabResult = useMutation({
    mutationFn: async ({
      labResultId,
      results,
      notes,
    }: {
      labResultId: string;
      results: Record<string, string>;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("lab_results")
        .update({
          results,
          notes: notes || null,
          status: "completed",
          result_date: new Date().toISOString(),
        })
        .eq("id", labResultId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-results"] });
      toast({ title: "Hasil lab berhasil disimpan" });
    },
  });

  return { createLabOrderFromVisit, completeLabResult };
}

// ==================== SURGERY INTEGRATION ====================

export function useSurgeryIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeSurgery = useMutation({
    mutationFn: async ({
      surgeryId,
      operatingRoomId,
      postoperativeDiagnosis,
      operativeNotes,
    }: {
      surgeryId: string;
      operatingRoomId: string;
      postoperativeDiagnosis?: string;
      operativeNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from("surgeries")
        .update({
          status: "completed",
          actual_end_time: new Date().toISOString(),
          postoperative_diagnosis: postoperativeDiagnosis || null,
          operative_notes: operativeNotes || null,
        })
        .eq("id", surgeryId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("operating_rooms").update({ is_available: true }).eq("id", operatingRoomId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["operating-rooms"] });
      toast({ title: "Operasi selesai" });
    },
  });

  const createSurgeryBilling = useMutation({
    mutationFn: async ({
      visitId,
      patientId,
      paymentType,
      surgeonFee,
      anesthesiaFee,
      roomFee,
    }: {
      visitId: string;
      patientId: string;
      paymentType: "umum" | "bpjs" | "asuransi";
      surgeonFee: number;
      anesthesiaFee: number;
      roomFee: number;
    }) => {
      const total = surgeonFee + anesthesiaFee + roomFee;
      const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number");

      const { data: billing, error } = await supabase
        .from("billings")
        .insert({
          invoice_number: invoiceNumber,
          visit_id: visitId,
          patient_id: patientId,
          payment_type: paymentType,
          subtotal: total,
          tax: 0,
          total: total,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("billing_items").insert([
        { billing_id: billing.id, item_type: "surgery", item_name: "Jasa Dokter Bedah", quantity: 1, unit_price: surgeonFee, total_price: surgeonFee },
        { billing_id: billing.id, item_type: "anesthesia", item_name: "Jasa Anestesi", quantity: 1, unit_price: anesthesiaFee, total_price: anesthesiaFee },
        { billing_id: billing.id, item_type: "room", item_name: "Penggunaan Ruang OK", quantity: 1, unit_price: roomFee, total_price: roomFee },
      ]);

      return billing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billings"] });
      toast({ title: "Tagihan operasi dibuat" });
    },
  });

  return { completeSurgery, createSurgeryBilling };
}

// ==================== ICU INTEGRATION ====================

export function useICUIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const admitToICU = useMutation({
    mutationFn: async ({
      visitId,
      patientId,
      icuBedId,
      icuType,
      admissionReason,
      doctorId,
    }: {
      visitId: string;
      patientId: string;
      icuBedId: string;
      icuType: "icu" | "iccu" | "nicu" | "picu" | "hcu";
      admissionReason: string;
      doctorId?: string;
    }) => {
      const admissionNumber = `ICU-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from("icu_admissions")
        .insert({
          admission_number: admissionNumber,
          patient_id: patientId,
          visit_id: visitId,
          icu_bed_id: icuBedId,
          icu_type: icuType,
          admission_reason: admissionReason,
          attending_doctor_id: doctorId || null,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("icu_beds").update({ is_available: false }).eq("id", icuBedId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icu-admissions"] });
      queryClient.invalidateQueries({ queryKey: ["icu-beds"] });
      toast({ title: "Pasien masuk ICU" });
    },
  });

  const dischargeFromICU = useMutation({
    mutationFn: async ({
      admissionId,
      icuBedId,
      dischargeReason,
      totalDays,
    }: {
      admissionId: string;
      icuBedId: string;
      dischargeReason: string;
      totalDays: number;
    }) => {
      const { data, error } = await supabase
        .from("icu_admissions")
        .update({
          status: "discharged",
          discharge_date: new Date().toISOString(),
          discharge_reason: dischargeReason,
          total_icu_days: totalDays,
        })
        .eq("id", admissionId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("icu_beds").update({ is_available: true }).eq("id", icuBedId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icu-admissions"] });
      queryClient.invalidateQueries({ queryKey: ["icu-beds"] });
      toast({ title: "Pasien keluar ICU" });
    },
  });

  return { admitToICU, dischargeFromICU };
}

// ==================== DIALYSIS INTEGRATION ====================

export function useDialysisIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeDialysisSession = useMutation({
    mutationFn: async ({
      sessionId,
      machineId,
      postWeight,
      actualUf,
      ktV,
    }: {
      sessionId: string;
      machineId: string;
      postWeight?: number;
      actualUf?: number;
      ktV?: number;
    }) => {
      const { data, error } = await supabase
        .from("dialysis_sessions")
        .update({
          status: "completed",
          actual_end_time: new Date().toISOString(),
          post_weight: postWeight || null,
          actual_uf: actualUf || null,
          kt_v: ktV || null,
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("dialysis_machines").update({ is_available: true }).eq("id", machineId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dialysis-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dialysis-machines"] });
      toast({ title: "Sesi hemodialisa selesai" });
    },
  });

  return { completeDialysisSession };
}

// ==================== BLOOD BANK INTEGRATION ====================

export function useBloodBankIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const performCrossmatch = useMutation({
    mutationFn: async ({
      requestId,
      patientId,
      bloodBagId,
      majorResult,
      isCompatible,
    }: {
      requestId: string;
      patientId: string;
      bloodBagId: string;
      majorResult: "compatible" | "incompatible" | "pending";
      isCompatible: boolean;
    }) => {
      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + 72);

      const { data, error } = await supabase
        .from("crossmatch_tests")
        .insert({
          request_id: requestId,
          patient_id: patientId,
          blood_bag_id: bloodBagId,
          major_crossmatch: majorResult,
          is_compatible: isCompatible,
          valid_until: validUntil.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      if (isCompatible) {
        await supabase.from("blood_inventory").update({ status: "reserved", reserved_for_patient_id: patientId }).eq("id", bloodBagId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crossmatch-tests"] });
      queryClient.invalidateQueries({ queryKey: ["blood-inventory"] });
      toast({ title: "Hasil crossmatch dicatat" });
    },
  });

  return { performCrossmatch };
}

// ==================== COMBINED QUERIES ====================

export function useClinicalDashboardStats() {
  return useQuery({
    queryKey: ["clinical-dashboard-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const [
        { count: igdActive },
        { count: inpatientActive },
        { count: icuActive },
        { count: surgeriesToday },
        { count: dialysisToday },
        { count: labPending },
        { count: transfusionPending },
      ] = await Promise.all([
        supabase.from("emergency_visits").select("*", { count: "exact", head: true }).is("disposition_time", null),
        supabase.from("inpatient_admissions").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("icu_admissions").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("surgeries").select("*", { count: "exact", head: true }).eq("scheduled_date", today),
        supabase.from("dialysis_sessions").select("*", { count: "exact", head: true }).eq("session_date", today),
        supabase.from("lab_results").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("transfusion_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      return {
        igdActive: igdActive || 0,
        inpatientActive: inpatientActive || 0,
        icuActive: icuActive || 0,
        surgeriesToday: surgeriesToday || 0,
        dialysisToday: dialysisToday || 0,
        labPending: labPending || 0,
        transfusionPending: transfusionPending || 0,
      };
    },
  });
}
