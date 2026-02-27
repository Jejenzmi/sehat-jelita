import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { toast } from "sonner";

// ============================================
// Generic PACS action caller
// ============================================

async function callPACS(action: string, data: Record<string, any> = {}) {
  const { data: result, error } = await db.functions.invoke("pacs-bridge", {
    body: { action, data },
  });

  if (error) throw new Error(error.message);
  if (result?.error) throw new Error(result.error);
  return result;
}

// ============================================
// Connection & System
// ============================================

export function useTestPACSConnection() {
  return useMutation({
    mutationFn: () => callPACS("test_connection"),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Terhubung ke ${data.server || "PACS"}`);
      } else {
        toast.error(`Gagal: ${data.error}`);
      }
    },
    onError: (err: Error) => toast.error(`Koneksi gagal: ${err.message}`),
  });
}

export function usePACSSystemInfo() {
  return useQuery({
    queryKey: ["pacs", "system-info"],
    queryFn: () => callPACS("system_info"),
    enabled: false,
    retry: false,
  });
}

export function usePACSStatistics() {
  return useQuery({
    queryKey: ["pacs", "statistics"],
    queryFn: () => callPACS("statistics"),
    enabled: false,
    retry: false,
  });
}

// ============================================
// Modalities
// ============================================

export function usePACSModalities() {
  return useQuery({
    queryKey: ["pacs", "modalities"],
    queryFn: () => callPACS("list_modalities"),
    enabled: false,
    retry: false,
  });
}

export function useModalityEcho() {
  return useMutation({
    mutationFn: (modality: string) => callPACS("modality_echo", { modality }),
    onSuccess: (data) => toast.success(`C-ECHO berhasil: ${data.modality}`),
    onError: (err: Error) => toast.error(`C-ECHO gagal: ${err.message}`),
  });
}

export function useAddModality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; ae_title: string; host: string; port: number }) =>
      callPACS("add_modality", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pacs", "modalities"] });
      toast.success("Modality berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRemoveModality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => callPACS("remove_modality", { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pacs", "modalities"] });
      toast.success("Modality berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ============================================
// Studies (QIDO-RS / Orthanc)
// ============================================

export function usePACSStudies(params?: { limit?: number; study_date?: string }) {
  return useQuery({
    queryKey: ["pacs", "studies", params],
    queryFn: () => callPACS("list_studies", params || {}),
    enabled: false,
    retry: false,
  });
}

export function useQueryStudies() {
  return useMutation({
    mutationFn: (data: {
      patient_name?: string;
      patient_id?: string;
      study_date?: string;
      modality?: string;
      accession_number?: string;
      limit?: number;
    }) => callPACS("query_studies", data),
  });
}

export function useGetStudy() {
  return useMutation({
    mutationFn: (study_id: string) => callPACS("get_study", { study_id }),
  });
}

export function useGetSeries() {
  return useMutation({
    mutationFn: (study_id: string) => callPACS("get_series", { study_id }),
  });
}

export function useGetInstances() {
  return useMutation({
    mutationFn: (data: { study_id: string; series_id: string }) =>
      callPACS("get_instances", data),
  });
}

// ============================================
// Patients (Orthanc-specific)
// ============================================

export function usePACSPatients(limit?: number) {
  return useQuery({
    queryKey: ["pacs", "patients", limit],
    queryFn: () => callPACS("list_patients", { limit: limit || 50 }),
    enabled: false,
    retry: false,
  });
}

export function useGetPatient() {
  return useMutation({
    mutationFn: (patient_id: string) => callPACS("get_patient", { patient_id }),
  });
}

export function useGetPatientStudies() {
  return useMutation({
    mutationFn: (patient_id: string) => callPACS("get_patient_studies", { patient_id }),
  });
}

// ============================================
// Remote Operations (C-FIND / C-MOVE)
// ============================================

export function useQueryRemote() {
  return useMutation({
    mutationFn: (data: { modality: string; level?: string; query?: Record<string, string> }) =>
      callPACS("query_remote", data),
    onSuccess: () => toast.success("Query remote berhasil"),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRetrieveRemote() {
  return useMutation({
    mutationFn: (data: { query_id: string; index?: number }) =>
      callPACS("retrieve_remote", data),
    onSuccess: () => toast.success("Retrieve berhasil"),
    onError: (err: Error) => toast.error(err.message),
  });
}

// ============================================
// Transfer (C-STORE / Peer Send)
// ============================================

export function useSendToModality() {
  return useMutation({
    mutationFn: (data: { resource_id: string; resource_type: string; modality: string }) =>
      callPACS("send_to_modality", data),
    onSuccess: () => toast.success("C-STORE berhasil dikirim"),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSendToPeer() {
  return useMutation({
    mutationFn: (data: { resource_id: string; peer: string }) =>
      callPACS("send_to_peer", data),
    onSuccess: () => toast.success("Berhasil dikirim ke peer"),
    onError: (err: Error) => toast.error(err.message),
  });
}

// ============================================
// Delete / Tags / Viewer
// ============================================

export function useDeleteStudy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (study_id: string) => callPACS("delete_study", { study_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pacs"] });
      toast.success("Study berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGetTags() {
  return useMutation({
    mutationFn: (instance_id: string) => callPACS("get_tags", { instance_id }),
  });
}

export function useGetViewerUrl() {
  return useMutation({
    mutationFn: (study_id: string) => callPACS("get_viewer_url", { study_id }),
  });
}

export function useGetRendered() {
  return useMutation({
    mutationFn: (data: { study_id: string; series_id: string; instance_id: string }) =>
      callPACS("get_rendered", data),
  });
}

// ============================================
// Changes Log
// ============================================

export function usePACSChanges(since?: number) {
  return useQuery({
    queryKey: ["pacs", "changes", since],
    queryFn: () => callPACS("get_changes", { since: since || 0, limit: 100 }),
    enabled: false,
    retry: false,
  });
}

// ============================================
// Auto-Discovery Modalities
// ============================================

export function useDiscoverModalities() {
  return useMutation({
    mutationFn: () => callPACS("discover_modalities"),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Ditemukan ${data.total} modalitas (${data.online} online, ${data.offline} offline)`);
      }
    },
    onError: (err: Error) => toast.error(`Discovery gagal: ${err.message}`),
  });
}
