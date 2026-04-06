import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

// ==================== TYPES ====================

export interface RL1Data {
  hospital_name: string;
  hospital_code: string;
  hospital_address: string;
  hospital_phone: string;
  hospital_email: string;
  director_name: string;
  hospital_type: string;
  accreditation_status: string;
  bed_count_total: number;
  is_teaching_hospital: boolean;
  total_doctors: number;
  total_nurses: number;
  total_rooms: number;
}

export interface RL2Data {
  by_specialization: { specialization: string; count: number }[];
  by_job_title: { job_title: string; count: number }[];
  total_doctors: number;
  total_employees: number;
}

export interface RL3Data {
  total_outpatient: number;
  total_inpatient: number;
  total_emergency: number;
  total_surgeries: number;
  total_lab_orders: number;
  total_radiology: number;
  by_department: { department_id: string; department_name: string; total_visits: number }[];
}

export interface RL4Data {
  top_diagnoses: { icd11_code: string; icd10_code: string; diagnosis: string; case_count: number }[];
  total_mortality: number;
}

export interface RL5Data {
  by_payment_type: { payment_type: string; count: number }[];
  new_patients: number;
  total_visits: number;
}

export interface RL6Data {
  period: { year: number; month: number; days_in_month: number };
  total_beds: number;
  admissions: number;
  discharges: number;
  total_los: number;
  bor: number;
  alos: number;
  bto: number;
  toi: number;
  ndr: number;
  gdr: number;
}

export interface RLSubmission {
  id: string;
  report_type: string;
  report_period_month: number;
  report_period_year: number;
  status: string;
  submitted_at?: string;
  submitted_by?: string;
}

// ==================== HOOKS ====================

export function useHospitalProfile() {
  return useQuery({
    queryKey: ["hospital-profile-rl"],
    queryFn: () => apiFetch<RL1Data>('/reports/rl1'),
  });
}

export function useRL1Data(month?: number, year?: number) {
  return useQuery({
    queryKey: ["rl1", month, year],
    queryFn: () => {
      const p = new URLSearchParams();
      if (month) p.set('month', String(month));
      if (year)  p.set('year',  String(year));
      return apiFetch<RL1Data>(`/reports/rl1?${p}`);
    },
  });
}

export function useRL2Data(month?: number, year?: number) {
  return useQuery({
    queryKey: ["rl2", month, year],
    queryFn: () => {
      const p = new URLSearchParams();
      if (month) p.set('month', String(month));
      if (year)  p.set('year',  String(year));
      return apiFetch<RL2Data>(`/reports/rl2?${p}`);
    },
  });
}

export function useRL3OutpatientStats(month?: number, year?: number) {
  return useQuery({
    queryKey: ["rl3-outpatient-stats", month, year],
    queryFn: () => {
      const p = new URLSearchParams();
      if (month) p.set('month', String(month));
      if (year)  p.set('year',  String(year));
      return apiFetch<RL3Data>(`/reports/rl3?${p}`);
    },
  });
}

export function useRL3InpatientStats(month?: number, year?: number) {
  return useRL3OutpatientStats(month, year);
}

export function useRL4MorbidityStats(year?: number, patientType?: string) {
  return useQuery({
    queryKey: ["rl4-morbidity-stats", year, patientType],
    queryFn: () => {
      const p = new URLSearchParams();
      if (year) p.set('year', String(year));
      return apiFetch<RL4Data>(`/reports/rl4?${p}`);
    },
  });
}

export function useRL4MortalityStats(year?: number) {
  return useRL4MorbidityStats(year);
}

export function useRL5VisitorStats(month?: number, year?: number) {
  return useQuery({
    queryKey: ["rl5-visitor-stats", month, year],
    queryFn: () => {
      const p = new URLSearchParams();
      if (month) p.set('month', String(month));
      if (year)  p.set('year',  String(year));
      return apiFetch<RL5Data>(`/reports/rl5?${p}`);
    },
  });
}

export function useRL6Indicators(year?: number) {
  return useQuery({
    queryKey: ["rl6-indicators", year],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (year) p.set('year', String(year));
      const data = await apiFetch<RL6Data>(`/reports/rl6?${p}`);
      return [data];
    },
  });
}

export function useRLReportSubmissions(year?: number) {
  return useQuery({
    queryKey: ["rl-report-submissions", year],
    queryFn: () => {
      const p = year ? `?year=${year}` : '';
      return apiFetch<RLSubmission[]>(`/reports/submissions${p}`);
    },
  });
}

export function useCalculateRL6() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      apiFetch<RL6Data>(`/reports/rl6?month=${month}&year=${year}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rl6-indicators"] });
      toast({ title: "Berhasil", description: "Indikator RL6 berhasil dihitung dari data real" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useSubmitRLReport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<RLSubmission>) =>
      apiPost<RLSubmission>('/reports/submissions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rl-report-submissions"] });
      toast({ title: "Laporan berhasil dikirim" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mengirim laporan", description: error.message, variant: "destructive" });
    },
  });
}

/**
 * Submit semua laporan RL1–RL6 sekaligus untuk bulan/tahun tertentu.
 * Fetch data tiap RL dari backend lalu catat submission satu per satu.
 */
export function useSubmitAllRL() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const p = new URLSearchParams({ month: String(month), year: String(year) });

      // Fetch all RL data in parallel to validate they exist
      const [rl1, rl2, rl3, rl4, rl5, rl6] = await Promise.all([
        apiFetch<RL1Data>(`/reports/rl1?${p}`),
        apiFetch<RL2Data>(`/reports/rl2?${p}`),
        apiFetch<RL3Data>(`/reports/rl3?${p}`),
        apiFetch<RL4Data>(`/reports/rl4?${p}`),
        apiFetch<RL5Data>(`/reports/rl5?${p}`),
        apiFetch<RL6Data>(`/reports/rl6?${p}`),
      ]);

      // Submit each RL as a submission record
      const results = await Promise.all(
        ['RL1', 'RL2', 'RL3', 'RL4', 'RL5', 'RL6'].map(report_type =>
          apiPost<RLSubmission>('/reports/submissions', {
            report_type,
            report_period_month: month,
            report_period_year:  year,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            // Snapshot a small summary per type
            summary: JSON.stringify(
              report_type === 'RL1' ? { beds: rl1.bed_count_total, doctors: rl1.total_doctors } :
              report_type === 'RL2' ? { total_employees: rl2.total_employees } :
              report_type === 'RL3' ? { outpatient: rl3.total_outpatient, inpatient: rl3.total_inpatient } :
              report_type === 'RL4' ? { mortality: rl4.total_mortality } :
              report_type === 'RL5' ? { visits: rl5.total_visits } :
              { bor: rl6.bor, alos: rl6.alos }
            ),
          })
        )
      );

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["rl-report-submissions"] });
      toast({
        title: `${results.length} laporan RL berhasil disubmit`,
        description: "RL1 s/d RL6 tercatat dalam sistem",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal submit laporan", description: error.message, variant: "destructive" });
    },
  });
}
