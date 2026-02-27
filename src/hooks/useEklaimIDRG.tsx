import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

// ============================================
// E-Klaim IDRG Hook
// Full bridging for all 31 E-Klaim IDRG API endpoints
// ============================================

async function callEklaimIDRG(action: string, data: Record<string, any> = {}) {
  const { data: result, error } = await db.functions.invoke("eklaim-idrg", {
    body: { action, data },
  });
  if (error) throw error;
  return result;
}

// ============================================
// Types
// ============================================

export interface NewClaimParams {
  nomor_kartu: string;
  nomor_sep: string;
  nomor_rm: string;
  nama_pasien: string;
  tgl_lahir: string; // yyyy-MM-dd
  gender: 1 | 2;     // 1=L, 2=P
}

export interface SetClaimDataParams {
  nomor_sep: string;
  nomor_kartu: string;
  tgl_masuk: string;
  tgl_pulang: string;
  cara_masuk: string;
  jenis_rawat: 1 | 2;     // 1=RI, 2=RJ
  kelas_rawat: 1 | 2 | 3;
  adl_sub_acute?: number;
  adl_chronic?: number;
  icu_indikator?: 0 | 1;
  icu_los?: number;
  ventilator_hour?: number;
  upgrade_class_ind?: 0 | 1;
  upgrade_class_class?: string;
  upgrade_class_los?: number;
  add_payment_pct?: number;
  birth_weight?: number;
  discharge_status: number;
  diagnosa_awal?: string;
  sistole?: number;
  diastole?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  nama_dokter?: string;
  kode_tarif?: string;
  payor_id?: number;
  payor_cd?: string;
  coder_nik?: string;
}

export interface DiagnosaSetParams {
  nomor_sep: string;
  diagnosa: string; // ICD-10 codes separated by #
}

export interface ProcedureSetParams {
  nomor_sep: string;
  procedure: string; // ICD-9-CM codes separated by #
}

export interface GrouperStage2Params {
  nomor_sep: string;
  special_subacute?: number;
  special_chronic?: number;
  special_top_up?: string[];
  special_procedure?: string[];
}

export interface UpdatePatientParams {
  nomor_sep: string;
  nomor_kartu: string;
  nomor_rm: string;
  nama_pasien: string;
  tgl_lahir: string;
  gender: 1 | 2;
}

export interface EncounterRMEParams {
  nomor_sep: string;
  nomor_kartu: string;
  tgl_masuk: string;
  tgl_pulang: string;
  jenis_rawat: 1 | 2;
  kelas_rawat: 1 | 2 | 3;
  nama_dokter: string;
  diagnosa: string;
  procedure: string;
  discharge_status: number;
}

// ============================================
// Mutation Hooks
// ============================================

function useEklaimMutation(action: string, successMsg: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, any>) => callEklaimIDRG(action, data),
    onSuccess: (result) => {
      const code = result?.metadata?.code || result?.metaData?.code;
      if (code === 200 || code === "200" || code === 1) {
        toast({ title: "Sukses", description: successMsg });
        queryClient.invalidateQueries({ queryKey: ["eklaim-idrg"] });
      } else {
        toast({
          title: "Peringatan",
          description: result?.metadata?.message || result?.metaData?.message || JSON.stringify(result),
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error E-Klaim", description: error.message, variant: "destructive" });
    },
  });
}

// #00 NEW CLAIM
export function useNewClaim() {
  return useEklaimMutation("new_claim", "Klaim baru berhasil dibuat");
}

// #01 SET CLAIM DATA
export function useSetClaimData() {
  return useEklaimMutation("set_claim_data", "Data klaim berhasil disimpan");
}

// #02 IDRG DIAGNOSA SET
export function useSetDiagnosaIDRG() {
  return useEklaimMutation("set_diagnosa_idrg", "Diagnosa IDRG berhasil disimpan");
}

// #03 IDRG DIAGNOSA GET
export function useGetDiagnosaIDRG(nomor_sep: string, enabled = false) {
  return useQuery({
    queryKey: ["eklaim-idrg", "diagnosa-idrg", nomor_sep],
    queryFn: () => callEklaimIDRG("get_diagnosa_idrg", { nomor_sep }),
    enabled: enabled && !!nomor_sep,
  });
}

// #04 IDRG PROCEDURE SET
export function useSetProcedureIDRG() {
  return useEklaimMutation("set_procedure_idrg", "Prosedur IDRG berhasil disimpan");
}

// #05 IDRG PROCEDURE GET
export function useGetProcedureIDRG(nomor_sep: string, enabled = false) {
  return useQuery({
    queryKey: ["eklaim-idrg", "procedure-idrg", nomor_sep],
    queryFn: () => callEklaimIDRG("get_procedure_idrg", { nomor_sep }),
    enabled: enabled && !!nomor_sep,
  });
}

// #06 GROUPING IDRG
export function useGrouperIDRG() {
  return useEklaimMutation("grouper_idrg", "Grouping IDRG berhasil");
}

// #07 FINAL IDRG
export function useFinalIDRG() {
  return useEklaimMutation("final_idrg", "Finalisasi IDRG berhasil");
}

// #08 RE-EDIT IDRG
export function useReEditIDRG() {
  return useEklaimMutation("reedit_idrg", "Re-edit IDRG berhasil");
}

// #09 IDRG TO INACBG IMPORT
export function useIDRGToINACBG() {
  return useEklaimMutation("idrg_to_inacbg", "Import IDRG ke INACBG berhasil");
}

// #10 INACBG DIAGNOSA SET
export function useSetDiagnosaINACBG() {
  return useEklaimMutation("set_diagnosa", "Diagnosa INACBG berhasil disimpan");
}

// #11 INACBG DIAGNOSA GET
export function useGetDiagnosaINACBG(nomor_sep: string, enabled = false) {
  return useQuery({
    queryKey: ["eklaim-idrg", "diagnosa-inacbg", nomor_sep],
    queryFn: () => callEklaimIDRG("get_diagnosa", { nomor_sep }),
    enabled: enabled && !!nomor_sep,
  });
}

// #12 INACBG PROCEDURE SET
export function useSetProcedureINACBG() {
  return useEklaimMutation("set_procedure", "Prosedur INACBG berhasil disimpan");
}

// #13 INACBG PROCEDURE GET
export function useGetProcedureINACBG(nomor_sep: string, enabled = false) {
  return useQuery({
    queryKey: ["eklaim-idrg", "procedure-inacbg", nomor_sep],
    queryFn: () => callEklaimIDRG("get_procedure", { nomor_sep }),
    enabled: enabled && !!nomor_sep,
  });
}

// #14 GROUPING INACBG STAGE 1
export function useGrouperINACBG() {
  return useEklaimMutation("grouper", "Grouping INACBG Stage 1 berhasil");
}

// #15 GROUPING INACBG STAGE 2
export function useGrouperINACBGStage2() {
  return useEklaimMutation("grouper_stage2", "Grouping INACBG Stage 2 berhasil");
}

// #16 FINAL INACBG
export function useFinalINACBG() {
  return useEklaimMutation("final_inacbg", "Finalisasi INACBG berhasil");
}

// #17 RE-EDIT INACBG
export function useReEditINACBG() {
  return useEklaimMutation("reedit_inacbg", "Re-edit INACBG berhasil");
}

// #18 CLAIM FINAL
export function useClaimFinal() {
  return useEklaimMutation("claim_final", "Klaim berhasil di-finalisasi");
}

// #19 CLAIM RE-EDIT
export function useClaimReEdit() {
  return useEklaimMutation("claim_reedit", "Re-edit klaim berhasil");
}

// #20 CLAIM SEND
export function useClaimSend() {
  return useEklaimMutation("claim_send", "Klaim berhasil dikirim ke BPJS");
}

// #21 GET CLAIM DATA
export function useGetClaimData(nomor_sep: string, enabled = false) {
  return useQuery({
    queryKey: ["eklaim-idrg", "claim-data", nomor_sep],
    queryFn: () => callEklaimIDRG("get_claim_data", { nomor_sep }),
    enabled: enabled && !!nomor_sep,
  });
}

// #22 IDRG SEARCH DIAGNOSA
export function useSearchDiagnosaIDRG() {
  return useEklaimMutation("search_diagnosa_idrg", "Pencarian diagnosa IDRG berhasil");
}

// #23 IDRG SEARCH PROCEDURES
export function useSearchProcedureIDRG() {
  return useEklaimMutation("search_procedure_idrg", "Pencarian prosedur IDRG berhasil");
}

// #24 INACBG SEARCH DIAGNOSA
export function useSearchDiagnosaINACBG() {
  return useEklaimMutation("search_diagnosa", "Pencarian diagnosa INACBG berhasil");
}

// #25 INACBG SEARCH PROCEDURES
export function useSearchProcedureINACBG() {
  return useEklaimMutation("search_procedure", "Pencarian prosedur INACBG berhasil");
}

// #26 CETAK KLAIM
export function useCetakKlaim() {
  return useEklaimMutation("cetak_klaim", "Cetak klaim berhasil");
}

// UTILS: UPDATE PATIENT
export function useUpdatePatientEklaim() {
  return useEklaimMutation("update_patient", "Data pasien berhasil diperbarui");
}

// UTILS: DELETE PATIENT
export function useDeletePatientEklaim() {
  return useEklaimMutation("delete_patient", "Pasien berhasil dihapus dari E-Klaim");
}

// UTILS: DELETE CLAIM DATA
export function useDeleteClaimData() {
  return useEklaimMutation("delete_claim_data", "Data klaim berhasil dihapus");
}

// SET ENCOUNTER RME
export function useSetEncounterRME() {
  return useEklaimMutation("set_encounter_rme", "Encounter RME berhasil dikirim");
}

// ============================================
// Composite: Full Claim Workflow
// ============================================

/**
 * Complete IDRG claim workflow:
 * 1. new_claim → 2. set_claim_data → 3. set_diagnosa_idrg →
 * 4. set_procedure_idrg → 5. grouper_idrg → 6. final_idrg
 */
export function useFullIDRGWorkflow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      claim: NewClaimParams;
      claimData: SetClaimDataParams;
      diagnosa: string;
      procedure: string;
      coder_nik?: string;
    }) => {
      const steps = [
        { action: "new_claim", data: params.claim, label: "Membuat klaim baru" },
        { action: "set_claim_data", data: params.claimData, label: "Menyimpan data klaim" },
        { action: "set_diagnosa_idrg", data: { nomor_sep: params.claim.nomor_sep, diagnosa: params.diagnosa }, label: "Menyimpan diagnosa IDRG" },
        { action: "set_procedure_idrg", data: { nomor_sep: params.claim.nomor_sep, procedure: params.procedure }, label: "Menyimpan prosedur IDRG" },
        { action: "grouper_idrg", data: { nomor_sep: params.claim.nomor_sep }, label: "Grouping IDRG" },
        { action: "final_idrg", data: { nomor_sep: params.claim.nomor_sep, coder_nik: params.coder_nik || "" }, label: "Finalisasi IDRG" },
      ];

      const results: any[] = [];
      for (const step of steps) {
        console.log(`[E-Klaim IDRG] ${step.label}...`);
        const result = await callEklaimIDRG(step.action, step.data);
        results.push({ step: step.action, result });

        const code = result?.metadata?.code || result?.metaData?.code;
        if (code !== 200 && code !== "200" && code !== 1) {
          throw new Error(`Gagal di tahap "${step.label}": ${result?.metadata?.message || result?.metaData?.message || "Unknown error"}`);
        }
      }

      return results;
    },
    onSuccess: () => {
      toast({ title: "Sukses", description: "Alur klaim IDRG selesai (New → Final)" });
      queryClient.invalidateQueries({ queryKey: ["eklaim-idrg"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error Workflow IDRG", description: error.message, variant: "destructive" });
    },
  });
}
