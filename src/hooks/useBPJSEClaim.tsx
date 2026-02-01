import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ============================================
// BPJS eClaim Medical Record Types
// ============================================

export interface PatientData {
  id: string;
  nomorKartu: string;
  nik: string;
  nama: string;
  jenisKelamin: "L" | "P";
  tanggalLahir: string;
  alamat?: string;
}

// Helper function to map database gender to BPJS format
function mapGenderToBPJS(gender: string | null | undefined): "L" | "P" {
  if (!gender) return "L";
  const lowerGender = gender.toLowerCase();
  if (lowerGender === "laki-laki" || lowerGender === "l" || lowerGender === "male") {
    return "L";
  }
  return "P";
}

export interface EncounterData {
  id: string;
  noSep: string;
  tanggalMasuk: string;
  tanggalKeluar?: string;
  jenisRawat: "Rawat Inap" | "Rawat Jalan";
  diagnosaUtama?: string;
  diagnosaSekunder?: string[];
}

export interface PractitionerData {
  id: string;
  sipNumber: string;
  nama: string;
  spesialisasi?: string;
}

export interface OrganizationData {
  id: string;
  kodeRS: string;
  namaRS: string;
  tipeRS?: string;
}

export interface ConditionData {
  id: string;
  icd10Code: string;
  description: string;
  type: "primary" | "secondary";
  onsetDate?: string;
}

export interface DiagnosticReportData {
  id: string;
  labCode: string;
  labName: string;
  tanggal: string;
  hasil: any;
}

export interface ProcedureData {
  id: string;
  icd9Code: string;
  description: string;
  tanggal: string;
}

export interface MedicationData {
  id: string;
  kodeObat: string;
  namaObat: string;
  dosis: string;
  frekuensi: string;
  durasi: string;
}

export interface DeviceData {
  id: string;
  kode: string;
  nama: string;
  status: string;
}

export interface MedicalRecordBundleParams {
  noSep: string;
  jnsPelayanan: "1" | "2"; // 1=Rawat Inap, 2=Rawat Jalan
  bulan: string;
  tahun: string;
  patient: PatientData;
  encounter: EncounterData;
  practitioner: PractitionerData;
  organization: OrganizationData;
  conditions?: ConditionData[];
  diagnosticReports?: DiagnosticReportData[];
  procedures?: ProcedureData[];
  medications?: MedicationData[];
  devices?: DeviceData[];
}

// Helper function to call BPJS Antrean edge function
async function callBPJSAntrean(action: string, params: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke("bpjs-antrean", {
    body: { action, ...params },
  });

  if (error) throw error;
  return data;
}

// ============================================
// eClaim Medical Record Hooks
// ============================================

/**
 * Hook to insert Medical Record to BPJS eClaim
 * Uses GZIP compression + AES-256-CBC encryption
 */
export function useInsertMedicalRecord() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MedicalRecordBundleParams) => {
      // Transform to FHIR-like bundle format
      const dataMR = {
        identifier: params.noSep,
        entry: [
          // Composition
          {
            resourceType: "Composition",
            id: params.noSep,
            status: "final",
            date: new Date().toISOString(),
            title: "Medical Record Bundle",
          },
          // Patient
          {
            resourceType: "Patient",
            id: params.patient.id,
            identifier: [
              { system: "BPJS", value: params.patient.nomorKartu },
              { system: "NIK", value: params.patient.nik },
            ],
            name: params.patient.nama,
            gender: params.patient.jenisKelamin === "L" ? "male" : "female",
            birthDate: params.patient.tanggalLahir,
            address: params.patient.alamat,
          },
          // Encounter
          {
            resourceType: "Encounter",
            id: params.encounter.id,
            status: "finished",
            class: params.encounter.jenisRawat === "Rawat Inap" ? "inpatient" : "outpatient",
            period: {
              start: params.encounter.tanggalMasuk,
              end: params.encounter.tanggalKeluar,
            },
          },
          // Practitioner
          {
            resourceType: "Practitioner",
            id: params.practitioner.id,
            identifier: [{ system: "SIP", value: params.practitioner.sipNumber }],
            name: params.practitioner.nama,
            qualification: params.practitioner.spesialisasi,
          },
          // Organization
          {
            resourceType: "Organization",
            id: params.organization.id,
            identifier: [{ system: "BPJS", value: params.organization.kodeRS }],
            name: params.organization.namaRS,
            type: params.organization.tipeRS,
          },
          // Conditions (diagnoses)
          ...(params.conditions || []).map((c) => ({
            resourceType: "Condition",
            id: c.id,
            code: {
              coding: [{ system: "ICD-10", code: c.icd10Code, display: c.description }],
            },
            clinicalStatus: "active",
            verificationStatus: "confirmed",
            category: c.type,
            onsetDateTime: c.onsetDate,
          })),
          // Diagnostic Reports
          ...(params.diagnosticReports || []).map((r) => ({
            resourceType: "DiagnosticReport",
            id: r.id,
            status: "final",
            code: {
              coding: [{ system: "LOCAL", code: r.labCode, display: r.labName }],
            },
            effectiveDateTime: r.tanggal,
            result: r.hasil,
          })),
          // Procedures
          ...(params.procedures || []).map((p) => ({
            resourceType: "Procedure",
            id: p.id,
            status: "completed",
            code: {
              coding: [{ system: "ICD-9-CM", code: p.icd9Code, display: p.description }],
            },
            performedDateTime: p.tanggal,
          })),
          // Medication Requests
          ...(params.medications || []).map((m) => ({
            resourceType: "MedicationRequest",
            id: m.id,
            status: "active",
            medicationCodeableConcept: {
              coding: [{ system: "LOCAL", code: m.kodeObat, display: m.namaObat }],
            },
            dosageInstruction: [
              {
                text: `${m.dosis} - ${m.frekuensi} - ${m.durasi}`,
              },
            ],
          })),
          // Devices
          ...(params.devices || []).map((d) => ({
            resourceType: "Device",
            id: d.id,
            type: {
              coding: [{ system: "LOCAL", code: d.kode, display: d.nama }],
            },
            status: d.status,
          })),
        ],
      };

      return callBPJSAntrean("eclaim_insert_mr", {
        noSep: params.noSep,
        jnsPelayanan: params.jnsPelayanan,
        bulan: params.bulan,
        tahun: params.tahun,
        dataMR,
      });
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200" || data?.metadata?.code === 200) {
        toast({
          title: "Sukses",
          description: "Rekam medis berhasil dikirim ke BPJS eClaim",
        });
        queryClient.invalidateQueries({ queryKey: ["bpjs-eclaim"] });
      } else {
        toast({
          title: "Peringatan",
          description: data?.metaData?.message || data?.metadata?.message || "Response tidak dikenali",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for building medical record from local data and sending to BPJS
 * Fetches data from local database and constructs the bundle
 */
export function useBuildAndSendMedicalRecord() {
  const { toast } = useToast();
  const insertMR = useInsertMedicalRecord();

  return useMutation({
    mutationFn: async (params: {
      visitId: string;
      noSep: string;
      jnsPelayanan: "1" | "2";
    }) => {
      // Fetch visit data with related records
      const { data: visit, error: visitError } = await supabase
        .from("visits")
        .select(`
          *,
          patients (*),
          doctors (*)
        `)
        .eq("id", params.visitId)
        .single();

      if (visitError) throw visitError;
      if (!visit) throw new Error("Visit not found");

      // Build the medical record bundle with available data
      const today = new Date();
      const bundleParams: MedicalRecordBundleParams = {
        noSep: params.noSep,
        jnsPelayanan: params.jnsPelayanan,
        bulan: (today.getMonth() + 1).toString(),
        tahun: today.getFullYear().toString(),
        patient: {
          id: visit.patients?.id || "",
          nomorKartu: visit.patients?.bpjs_number || "",
          nik: visit.patients?.nik || "",
          nama: visit.patients?.full_name || "",
          jenisKelamin: mapGenderToBPJS(visit.patients?.gender),
          tanggalLahir: visit.patients?.birth_date || "",
          alamat: visit.patients?.address,
        },
        encounter: {
          id: visit.id,
          noSep: params.noSep,
          tanggalMasuk: visit.visit_date,
          tanggalKeluar: visit.visit_date,
          jenisRawat: params.jnsPelayanan === "1" ? "Rawat Inap" : "Rawat Jalan",
        },
        practitioner: {
          id: visit.doctors?.id || "",
          sipNumber: visit.doctors?.sip_number || "",
          nama: visit.doctors?.full_name || "",
          spesialisasi: visit.doctors?.specialization,
        },
        organization: {
          id: "org-1",
          kodeRS: "0000",
          namaRS: "SIMRS",
        },
      };

      return insertMR.mutateAsync(bundleParams);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
