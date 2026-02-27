import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
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
  patientRef?: string;
}

export interface ObservationData {
  id: string;
  status: string;
  text?: string;
  issued?: string;
  effectiveDateTime?: string;
  code: string;
  display: string;
  performerRef?: string;
  performerName?: string;
  conclusion?: string;
}

export interface DiagnosticReportData {
  id: string;
  patientRef?: string;
  patientName?: string;
  noSep?: string;
  category: "RAD" | "LAB" | "OTH";
  categoryDisplay: string;
  status: string;
  performerRef?: string;
  performerName?: string;
  observations: ObservationData[];
}

export interface ProcedureData {
  id: string;
  code: string;
  display: string;
  patientRef?: string;
  patientName?: string;
  encounterRef?: string;
  encounterDisplay?: string;
  performedStart: string;
  performedEnd: string;
  performerRef?: string;
  performerName?: string;
  performerRoleCode?: string;
  performerRoleDisplay?: string;
  reasonCode?: string;
  bodySiteCode?: string;
  bodySiteDisplay?: string;
  deviceAction?: string;
  deviceRef?: string;
  note?: string;
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
  code: string;
  display: string;
  lotNumber?: string;
  manufacturer?: string;
  manufactureDate?: string;
  expirationDate?: string;
  model?: string;
  patientRef?: string;
  contactPhone?: string;
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
  const { data, error } = await db.functions.invoke("bpjs-antrean", {
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
      // Build FHIR-compliant Condition resources
      const conditionEntries = (params.conditions || []).map((c) => ({
        resourceType: "Condition",
        id: c.id,
        clinicalStatus: "active",
        verificationStatus: "confirmed",
        category: [{
          coding: [{
            system: "http://hl7.org/fhir/condition-category",
            code: "encounter-diagnosis",
            display: "Encounter Diagnosis"
          }]
        }],
        code: {
          coding: [{
            system: "http://hl7.org/fhir/sid/icd-10",
            code: c.icd10Code,
            display: c.description
          }],
          text: c.description
        },
        subject: {
          reference: c.patientRef || `Patient/${params.patient.id}`
        },
        onsetDateTime: c.onsetDate,
      }));

      // Build FHIR-compliant DiagnosticReport resources
      const diagnosticEntries = (params.diagnosticReports || []).map((r) => ({
        resourceType: "DiagnosticReport",
        id: r.id,
        subject: {
          reference: r.patientRef || `Patient/${params.patient.id}`,
          display: r.patientName || params.patient.nama,
          noSep: r.noSep || params.noSep
        },
        category: {
          coding: {
            system: "http://hl7.org/fhir/v2/0074",
            code: r.category,
            display: r.categoryDisplay
          }
        },
        status: r.status,
        performer: [{
          reference: r.performerRef || `Organization/${params.organization.id}`,
          display: r.performerName || params.organization.namaRS
        }],
        result: r.observations.map((obs) => ({
          resourceType: "Observation",
          id: obs.id,
          status: obs.status,
          text: obs.text ? {
            status: "generated",
            div: `<div>${obs.text}</div>`
          } : undefined,
          issued: obs.issued,
          effectiveDateTime: obs.effectiveDateTime,
          code: {
            coding: {
              system: "http://snomed.info/sct",
              code: obs.code,
              display: obs.display
            },
            text: obs.display
          },
          performer: obs.performerRef ? {
            reference: obs.performerRef,
            display: obs.performerName
          } : undefined,
          image: [{
            comment: "",
            link: { reference: "", display: "" }
          }],
          conclusion: obs.conclusion
        }))
      }));

      // Build FHIR-compliant Procedure resources
      const procedureEntries = (params.procedures || []).map((p) => ({
        resourceType: "Procedure",
        id: p.id,
        text: {
          status: "generated",
          div: "Generated Narrative with Details"
        },
        status: "completed",
        code: {
          coding: [{
            system: "http://snomed.info/sct",
            code: p.code,
            display: p.display
          }]
        },
        subject: {
          reference: p.patientRef || `Patient/${params.patient.id}`,
          display: p.patientName || params.patient.nama
        },
        context: p.encounterRef ? {
          reference: p.encounterRef,
          display: p.encounterDisplay
        } : undefined,
        performedPeriod: {
          start: p.performedStart,
          end: p.performedEnd
        },
        performer: [{
          role: p.performerRoleCode ? {
            coding: [{
              system: "http://snomed.info/sct",
              code: p.performerRoleCode,
              display: p.performerRoleDisplay || ""
            }]
          } : undefined,
          actor: {
            reference: p.performerRef || `Practitioner/${params.practitioner.id}`,
            display: p.performerName || params.practitioner.nama
          }
        }],
        reasonCode: p.reasonCode ? [{ text: p.reasonCode }] : undefined,
        bodySite: p.bodySiteCode ? [{
          coding: [{
            system: "http://snomed.info/sct",
            code: p.bodySiteCode,
            display: p.bodySiteDisplay || ""
          }]
        }] : undefined,
        focalDevice: p.deviceRef ? [{
          action: {
            coding: [{
              system: "http://hl7.org/fhir/device-action",
              code: p.deviceAction || "implanted"
            }]
          },
          manipulated: {
            reference: p.deviceRef
          }
        }] : undefined,
        note: p.note ? [{ text: p.note }] : undefined
      }));

      // Build FHIR-compliant Device resources
      const deviceEntries = (params.devices || []).map((d) => ({
        resourceType: "Device",
        id: d.id,
        text: {
          status: "generated",
          div: `<div>Generated Narrative with Details\nid: ${d.id}\nidentifier: ${d.code}\ntype: ${d.display}</div>`
        },
        identifier: [{
          system: "http://acme.com/devices/pacemakers/octane/serial",
          value: d.code
        }],
        type: {
          coding: [{
            system: "http://acme.com/devices",
            code: d.code,
            display: d.display
          }]
        },
        lotNumber: d.lotNumber || "",
        manufacturer: d.manufacturer || "",
        manufactureDate: d.manufactureDate || "",
        expirationDate: d.expirationDate || "",
        model: d.model || "",
        patient: {
          reference: d.patientRef || `Patient/${params.patient.id}`
        },
        contact: d.contactPhone ? [{
          system: "phone",
          value: d.contactPhone,
          use: "work"
        }] : []
      }));

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
          // FHIR-compliant resources
          ...conditionEntries,
          ...diagnosticEntries,
          ...procedureEntries,
          // Medication Requests (legacy format)
          ...(params.medications || []).map((m) => ({
            resourceType: "MedicationRequest",
            id: m.id,
            status: "active",
            medicationCodeableConcept: {
              coding: [{ system: "LOCAL", code: m.kodeObat, display: m.namaObat }],
            },
            dosageInstruction: [{
              text: `${m.dosis} - ${m.frekuensi} - ${m.durasi}`,
            }],
          })),
          ...deviceEntries,
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
      const { data: visit, error: visitError } = await db
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
