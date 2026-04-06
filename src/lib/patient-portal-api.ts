/**
 * Patient Portal API — typed wrappers around the real backend
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("zen_access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/patient-portal${path}`, {
    ...init,
    credentials: "include",
    headers: { ...getAuthHeaders(), ...(init.headers || {}) },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request gagal");
  return json.data as T;
}

// ── Profile ───────────────────────────────────────────────────────────────────
export const getProfile = () => apiFetch<PatientProfile>("/profile");
export const updateProfile = (data: Partial<PatientProfile>) =>
  apiFetch<PatientProfile>("/profile", { method: "PUT", body: JSON.stringify(data) });

// ── Lab Results ───────────────────────────────────────────────────────────────
export const getLabResults = (cursor?: string) =>
  fetch(`${API_BASE}/patient-portal/lab-results${cursor ? `?cursor=${cursor}` : ""}`, {
    credentials: "include", headers: getAuthHeaders(),
  }).then(r => r.json());

export const getLabResultDetail = (orderId: string) =>
  apiFetch<LabOrder>(`/lab-results/${orderId}`);

// ── Medical Records ───────────────────────────────────────────────────────────
export const getMedicalRecords = (cursor?: string) =>
  fetch(`${API_BASE}/patient-portal/medical-records${cursor ? `?cursor=${cursor}` : ""}`, {
    credentials: "include", headers: getAuthHeaders(),
  }).then(r => r.json());

// ── Prescriptions ─────────────────────────────────────────────────────────────
export const getPrescriptions = (cursor?: string) =>
  fetch(`${API_BASE}/patient-portal/prescriptions${cursor ? `?cursor=${cursor}` : ""}`, {
    credentials: "include", headers: getAuthHeaders(),
  }).then(r => r.json());

// ── Appointments ──────────────────────────────────────────────────────────────
export const getAppointments = (status?: string, cursor?: string) => {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  return fetch(`${API_BASE}/patient-portal/appointments${qs ? `?${qs}` : ""}`, {
    credentials: "include", headers: getAuthHeaders(),
  }).then(r => r.json());
};

export const createAppointment = (data: CreateAppointmentInput) =>
  apiFetch<Appointment>("/appointments", { method: "POST", body: JSON.stringify(data) });

export const cancelAppointment = (id: string) =>
  apiFetch<void>(`/appointments/${id}`, { method: "DELETE" });

// ── Doctors ───────────────────────────────────────────────────────────────────
export const getDoctors = (departmentId?: string) =>
  apiFetch<Doctor[]>(`/doctors${departmentId ? `?department_id=${departmentId}` : ""}`);

// ── Insurances ────────────────────────────────────────────────────────────────
export const getInsurances = () => apiFetch<Insurance[]>("/insurances");

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PatientProfile {
  id: string;
  full_name: string;
  medical_record_number: string;
  nik: string | null;
  birth_date: string | null;
  gender: string | null;
  blood_type: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  emergency_contact: string | null;
  emergency_contact_phone: string | null;
  allergy_notes: string | null;
}

export interface LabResultItem {
  id: string;
  test_name: string;
  result_value: string | null;
  unit: string | null;
  reference_range: string | null;
  flag: string | null;
  verified_at: string | null;
}

export interface LabOrder {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  notes: string | null;
  lab_results: LabResultItem[];
  doctors?: { full_name: string; specialization: string | null } | null;
}

export interface MedicalRecord {
  id: string;
  record_date: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  oxygen_saturation: number | null;
  weight: number | null;
  height: number | null;
  additional_notes: string | null;
  visits: {
    visit_number: string;
    visit_type: string;
    chief_complaint: string | null;
    doctors: { full_name: string; specialization: string | null } | null;
  } | null;
}

export interface PrescriptionItem {
  id: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  quantity: number;
  instructions: string | null;
  medicines: { name: string; unit: string } | null;
}

export interface Prescription {
  id: string;
  prescription_number: string;
  prescription_date: string;
  status: string;
  notes: string | null;
  qr_token: string | null;
  pickup_code: string | null;
  doctors: { full_name: string; specialization: string | null } | null;
  prescription_items: PrescriptionItem[];
}

export interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  chief_complaint: string | null;
  notes: string | null;
  doctors: { full_name: string; specialization: string | null } | null;
  departments: { name: string } | null;
}

export interface CreateAppointmentInput {
  doctor_id: string;
  department_id?: string;
  appointment_date: string;
  appointment_time: string;
  chief_complaint?: string;
  notes?: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
  department_id: string | null;
  departments: { id: string; name: string } | null;
}

export interface Insurance {
  id: string;
  insurance_type: string;
  insurance_number: string;
  insurance_name: string | null;
  valid_until: string | null;
  is_active: boolean;
}
