import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

// ==================== TYPES ====================

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

export interface PatientFullProfile {
  patient: PatientWithVisits;
  visits: Visit[];
  medicalRecords: MedicalRecordSummary[];
  prescriptions: PrescriptionSummary[];
  billings: BillingSummary[];
}

// Hook to get patient with all related data
export function usePatientFullProfile(patientId: string | null) {
  return useQuery({
    queryKey: ["patient-full-profile", patientId],
    queryFn: () => apiFetch<PatientFullProfile>(`/patients/${patientId}/profile`),
    enabled: !!patientId,
  });
}
