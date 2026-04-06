/**
 * Forensic data hook — uses real backend API via fetch with credentials:include
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function authFetch(url: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  }).then(async (res) => {
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Request gagal");
    return json.data;
  });
}

// ── Query keys ─────────────────────────────────────────────────────────────────
const QK = {
  cases:        ["forensic-cases"],
  activeCases:  ["forensic-active-cases"],
  autopsies:    ["autopsy-records"],
  visums:       ["visum-reports"],
  certificates: ["death-certificates"],
};

export function useForensicData() {
  const queryClient = useQueryClient();

  // ── Mortuary Cases ───────────────────────────────────────────────────────────
  const { data: mortuaryCases, isLoading: loadingCases } = useQuery({
    queryKey: QK.cases,
    queryFn: () => authFetch(`${API_BASE}/forensic/cases`),
    staleTime: 30_000,
  });

  const { data: activeCases, isLoading: loadingActiveCases } = useQuery({
    queryKey: QK.activeCases,
    queryFn: () => authFetch(`${API_BASE}/forensic/cases?status=active`),
    staleTime: 30_000,
  });

  // ── Autopsy Records ──────────────────────────────────────────────────────────
  const { data: autopsyRecords, isLoading: loadingAutopsies } = useQuery({
    queryKey: QK.autopsies,
    queryFn: () => authFetch(`${API_BASE}/forensic/autopsies`),
    staleTime: 60_000,
  });

  // ── Visum Reports ────────────────────────────────────────────────────────────
  const { data: visumReports, isLoading: loadingVisums } = useQuery({
    queryKey: QK.visums,
    queryFn: () => authFetch(`${API_BASE}/forensic/visums`),
    staleTime: 60_000,
  });

  // ── Death Certificates ───────────────────────────────────────────────────────
  const { data: deathCertificates, isLoading: loadingCertificates } = useQuery({
    queryKey: QK.certificates,
    queryFn: () => authFetch(`${API_BASE}/forensic/death-certificates`),
    staleTime: 60_000,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const createMortuaryCase = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      authFetch(`${API_BASE}/forensic/cases`, {
        method: "POST", body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.cases });
      queryClient.invalidateQueries({ queryKey: QK.activeCases });
      toast.success("Kasus kamar jenazah berhasil dicatat");
    },
    onError: (err: Error) => toast.error("Gagal mencatat kasus: " + err.message),
  });

  const updateMortuaryCase = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) =>
      authFetch(`${API_BASE}/forensic/cases/${id}`, {
        method: "PUT", body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.cases });
      queryClient.invalidateQueries({ queryKey: QK.activeCases });
      toast.success("Kasus berhasil diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal memperbarui kasus: " + err.message),
  });

  const createAutopsyRecord = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      authFetch(`${API_BASE}/forensic/autopsies`, {
        method: "POST", body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.autopsies });
      toast.success("Catatan otopsi berhasil dibuat");
    },
    onError: (err: Error) => toast.error("Gagal membuat catatan otopsi: " + err.message),
  });

  const createVisumReport = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      authFetch(`${API_BASE}/forensic/visums`, {
        method: "POST", body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.visums });
      toast.success("Visum et Repertum berhasil dibuat");
    },
    onError: (err: Error) => toast.error("Gagal membuat visum: " + err.message),
  });

  const createDeathCertificate = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      authFetch(`${API_BASE}/forensic/death-certificates`, {
        method: "POST", body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.certificates });
      toast.success("Sertifikat kematian berhasil dibuat");
    },
    onError: (err: Error) => toast.error("Gagal membuat sertifikat: " + err.message),
  });

  const releaseBody = useMutation({
    mutationFn: ({ id, releasedTo, releasedBy }: { id: string; releasedTo: string; releasedBy: string }) =>
      authFetch(`${API_BASE}/forensic/cases/${id}/release`, {
        method: "POST",
        body: JSON.stringify({ released_to: releasedTo, released_by: releasedBy }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.cases });
      queryClient.invalidateQueries({ queryKey: QK.activeCases });
      toast.success("Jenazah berhasil diserahkan");
    },
    onError: (err: Error) => toast.error("Gagal menyerahkan jenazah: " + err.message),
  });

  return {
    mortuaryCases,
    activeCases,
    autopsyRecords,
    visumReports,
    deathCertificates,
    loadingCases,
    loadingActiveCases,
    loadingAutopsies,
    loadingVisums,
    loadingCertificates,
    createMortuaryCase,
    updateMortuaryCase,
    createAutopsyRecord,
    createVisumReport,
    createDeathCertificate,
    releaseBody,
  };
}
