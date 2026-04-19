/**
 * SIMRS ZEN - Unified API Client
 * Supports both Lovable Cloud (Supabase) and Node.js/Express backend
 * 
 * Configuration via environment variable:
 * VITE_API_MODE = 'supabase' | 'nodejs'
 * VITE_API_URL = 'http://localhost:3000/api' (for nodejs mode)
 */

import { supabase } from '@/integrations/supabase/client';

// API Mode Configuration
type ApiMode = 'supabase' | 'nodejs';

const API_MODE: ApiMode = (import.meta.env.VITE_API_MODE as ApiMode) || 'supabase';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============================================
// CUSTOM ERROR CLASS
// ============================================

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number = 500, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// ============================================
// TOKEN MANAGEMENT (for Node.js mode)
// ============================================

class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(tokens: { accessToken: string; refreshToken: string }) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    localStorage.setItem('zen_access_token', tokens.accessToken);
    localStorage.setItem('zen_refresh_token', tokens.refreshToken);
  }

  loadTokens() {
    this.accessToken = localStorage.getItem('zen_access_token');
    this.refreshToken = localStorage.getItem('zen_refresh_token');
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('zen_access_token');
    localStorage.removeItem('zen_refresh_token');
  }

  getAccessToken() {
    return this.accessToken;
  }

  getRefreshToken() {
    return this.refreshToken;
  }
}

const tokenManager = new TokenManager();
tokenManager.loadTokens();

// ============================================
// NODE.JS REST API CLIENT
// ============================================

async function nodeRequest<T>(
  method: string,
  endpoint: string,
  options: { body?: unknown; params?: Record<string, string> } = {}
): Promise<T> {
  let url = `${API_BASE_URL}${endpoint}`;

  if (options.params) {
    const queryString = new URLSearchParams(options.params).toString();
    if (queryString) url += `?${queryString}`;
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const accessToken = tokenManager.getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (options.body && method !== 'GET') {
    config.body = JSON.stringify(options.body);
  }

  try {
    let response = await fetch(url, config);

    // Handle token refresh
    if (response.status === 401 && tokenManager.getRefreshToken()) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${tokenManager.getAccessToken()}`;
        response = await fetch(url, { ...config, headers });
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || 'Request failed',
        response.status,
        data.code || 'REQUEST_FAILED'
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError((error as Error).message, 0, 'NETWORK_ERROR');
  }
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokenManager.getRefreshToken() }),
    });

    if (!response.ok) {
      tokenManager.clearTokens();
      return false;
    }

    const data = await response.json();
    tokenManager.setTokens({
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    });
    return true;
  } catch {
    tokenManager.clearTokens();
    return false;
  }
}

// ============================================
// UNIFIED API CLIENT
// ============================================

export const api = {
  // Get current API mode
  getMode: () => API_MODE,

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  auth: {
    async login(email: string, password: string) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw new ApiError(error.message, 401, 'AUTH_ERROR');
        return { success: true, data };
      } else {
        const response = await nodeRequest<{
          success: boolean;
          data: { user: unknown; accessToken: string; refreshToken: string };
        }>('POST', '/auth/login', { body: { email, password } });
        if (response.success) {
          tokenManager.setTokens({
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          });
        }
        return response;
      }
    },

    async logout() {
      if (API_MODE === 'supabase') {
        await supabase.auth.signOut();
      } else {
        try {
          await nodeRequest('POST', '/auth/logout');
        } finally {
          tokenManager.clearTokens();
        }
      }
    },

    async register(email: string, password: string, fullName: string) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw new ApiError(error.message, 400, 'REGISTER_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('POST', '/auth/register', {
          body: { email, password, fullName },
        });
      }
    },

    async getCurrentUser() {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw new ApiError(error.message, 401, 'AUTH_ERROR');
        return { success: true, data: data.user };
      } else {
        return nodeRequest('GET', '/auth/me');
      }
    },

    async changePassword(currentPassword: string, newPassword: string) {
      if (API_MODE === 'supabase') {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw new ApiError(error.message, 400, 'PASSWORD_ERROR');
        return { success: true };
      } else {
        return nodeRequest('POST', '/auth/change-password', {
          body: { currentPassword, newPassword },
        });
      }
    },
  },

  // ==========================================
  // PATIENTS
  // ==========================================

  patients: {
    async list(params?: Record<string, string>) {
      if (API_MODE === 'supabase') {
        let query = supabase.from('patients').select('*');
        if (params?.search) {
          query = query.or(`full_name.ilike.%${params.search}%,medical_record_number.ilike.%${params.search}%`);
        }
        if (params?.limit) {
          query = query.limit(parseInt(params.limit));
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new ApiError(error.message, 400, 'QUERY_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('GET', '/patients', { params });
      }
    },

    async get(id: string) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw new ApiError(error.message, 404, 'NOT_FOUND');
        return { success: true, data };
      } else {
        return nodeRequest('GET', `/patients/${id}`);
      }
    },

    async create(patientData: Record<string, unknown>) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('patients')
          .insert(patientData as never)
          .select()
          .single();
        if (error) throw new ApiError(error.message, 400, 'CREATE_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('POST', '/patients', { body: patientData });
      }
    },

    async update(id: string, patientData: Record<string, unknown>) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('patients')
          .update(patientData as never)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new ApiError(error.message, 400, 'UPDATE_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('PUT', `/patients/${id}`, { body: patientData });
      }
    },

    async delete(id: string) {
      if (API_MODE === 'supabase') {
        const { error } = await supabase.from('patients').delete().eq('id', id);
        if (error) throw new ApiError(error.message, 400, 'DELETE_ERROR');
        return { success: true };
      } else {
        return nodeRequest('DELETE', `/patients/${id}`);
      }
    },
  },

  // ==========================================
  // VISITS
  // ==========================================

  visits: {
    async list(params?: Record<string, string>) {
      if (API_MODE === 'supabase') {
        let query = supabase.from('visits').select('*, patients(*)');
        if (params?.patient_id) {
          query = query.eq('patient_id', params.patient_id);
        }
        if (params?.status) {
          query = query.eq('status', params.status as 'menunggu' | 'dipanggil' | 'dilayani' | 'selesai' | 'batal');
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new ApiError(error.message, 400, 'QUERY_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('GET', '/visits', { params });
      }
    },

    async get(id: string) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('visits')
          .select('*, patients(*)')
          .eq('id', id)
          .single();
        if (error) throw new ApiError(error.message, 404, 'NOT_FOUND');
        return { success: true, data };
      } else {
        return nodeRequest('GET', `/visits/${id}`);
      }
    },

    async create(visitData: Record<string, unknown>) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('visits')
          .insert(visitData as never)
          .select()
          .single();
        if (error) throw new ApiError(error.message, 400, 'CREATE_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('POST', '/visits', { body: visitData });
      }
    },

    async update(id: string, visitData: Record<string, unknown>) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('visits')
          .update(visitData as never)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new ApiError(error.message, 400, 'UPDATE_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('PUT', `/visits/${id}`, { body: visitData });
      }
    },
  },

  // ==========================================
  // BILLING
  // ==========================================

  billing: {
    async list(params?: Record<string, string>) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('billings')
          .select('*, patients(*), visits(*)')
          .order('created_at', { ascending: false });
        if (error) throw new ApiError(error.message, 400, 'QUERY_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('GET', '/billing', { params });
      }
    },

    async get(id: string) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('billings')
          .select('*, patients(*), visits(*), billing_items(*)')
          .eq('id', id)
          .single();
        if (error) throw new ApiError(error.message, 404, 'NOT_FOUND');
        return { success: true, data };
      } else {
        return nodeRequest('GET', `/billing/${id}`);
      }
    },

    async create(billingData: Record<string, unknown>) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('billings')
          .insert(billingData as never)
          .select()
          .single();
        if (error) throw new ApiError(error.message, 400, 'CREATE_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('POST', '/billing', { body: billingData });
      }
    },

    async processPayment(id: string, paymentData: Record<string, unknown>) {
      if (API_MODE === 'supabase') {
        const updateData = {
          status: 'lunas' as const,
          payment_date: new Date().toISOString(),
          ...paymentData,
        };
        const { data, error } = await supabase
          .from('billings')
          .update(updateData as never)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new ApiError(error.message, 400, 'PAYMENT_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('POST', `/billing/${id}/payment`, { body: paymentData });
      }
    },
  },

  // ==========================================
  // PHARMACY
  // ==========================================

  pharmacy: {
    async prescriptions(params?: Record<string, string>) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*, patients(*), doctors(*)')
          .order('created_at', { ascending: false });
        if (error) throw new ApiError(error.message, 400, 'QUERY_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('GET', '/pharmacy/prescriptions', { params });
      }
    },

    async dispense(id: string, dispenseData: Record<string, unknown>) {
      if (API_MODE === 'supabase') {
        const updateData = {
          status: 'diserahkan' as const,
          updated_at: new Date().toISOString(),
          ...dispenseData,
        };
        const { data, error } = await supabase
          .from('prescriptions')
          .update(updateData as never)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new ApiError(error.message, 400, 'DISPENSE_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('PUT', `/pharmacy/prescriptions/${id}/dispense`, {
          body: dispenseData,
        });
      }
    },

    async stock(params?: Record<string, string>) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('medicines')
          .select('*')
          .order('name');
        if (error) throw new ApiError(error.message, 400, 'QUERY_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('GET', '/pharmacy/stock', { params });
      }
    },
  },

  // ==========================================
  // LABORATORY (Placeholder - uses nodeRequest for now)
  // ==========================================

  lab: {
    async orders(params?: Record<string, string>) {
      if (API_MODE === 'supabase') {
        // Lab orders table may not exist yet in schema, return empty for now
        return { success: true, data: [] };
      } else {
        return nodeRequest('GET', '/lab/orders', { params });
      }
    },

    async createOrder(orderData: Record<string, unknown>) {
      if (API_MODE === 'supabase') {
        // Lab orders table may not exist yet
        console.warn('Lab orders not available in Supabase mode yet');
        return { success: false, error: 'Not implemented' };
      } else {
        return nodeRequest('POST', '/lab/orders', { body: orderData });
      }
    },

    async addResult(orderId: string, results: Record<string, unknown>) {
      if (API_MODE === 'supabase') {
        // Lab results table may not exist yet
        console.warn('Lab results not available in Supabase mode yet');
        return { success: false, error: 'Not implemented' };
      } else {
        return nodeRequest('POST', `/lab/orders/${orderId}/results`, { body: results });
      }
    },
  },

  // ==========================================
  // BPJS INTEGRATION
  // ==========================================

  bpjs: {
    async checkPeserta(noBpjs: string) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase.functions.invoke('bpjs-vclaim', {
          body: { action: 'getPeserta', noBpjs },
        });
        if (error) throw new ApiError(error.message, 400, 'BPJS_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('GET', `/bpjs/peserta/${noBpjs}`);
      }
    },

    async createSEP(sepData: unknown) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase.functions.invoke('bpjs-vclaim', {
          body: { action: 'createSEP', ...sepData as Record<string, unknown> },
        });
        if (error) throw new ApiError(error.message, 400, 'BPJS_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('POST', '/bpjs/sep', { body: sepData });
      }
    },

    async getRujukan(noRujukan: string) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase.functions.invoke('bpjs-vclaim', {
          body: { action: 'getRujukan', noRujukan },
        });
        if (error) throw new ApiError(error.message, 400, 'BPJS_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('GET', `/bpjs/rujukan/${noRujukan}`);
      }
    },
  },

  // ==========================================
  // SATU SEHAT INTEGRATION
  // ==========================================

  satusehat: {
    async syncPatient(patientId: string) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase.functions.invoke('satusehat', {
          body: { action: 'syncPatient', patientId },
        });
        if (error) throw new ApiError(error.message, 400, 'SATUSEHAT_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('POST', '/satusehat/sync/patient', { body: { patientId } });
      }
    },

    async syncEncounter(visitId: string) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase.functions.invoke('satusehat', {
          body: { action: 'syncEncounter', visitId },
        });
        if (error) throw new ApiError(error.message, 400, 'SATUSEHAT_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('POST', '/satusehat/sync/encounter', { body: { visitId } });
      }
    },

    async getIHSPatient(nik: string) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase.functions.invoke('satusehat', {
          body: { action: 'getPatientByNIK', nik },
        });
        if (error) throw new ApiError(error.message, 400, 'SATUSEHAT_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('GET', `/satusehat/patient/${nik}`);
      }
    },
  },

  // ==========================================
  // REPORTS & DASHBOARD
  // ==========================================

  reports: {
    async dashboard(params?: Record<string, string>) {
      if (API_MODE === 'supabase') {
        // Aggregate dashboard data from multiple tables
        const [patientsResult, visitsResult, billingsResult] = await Promise.all([
          supabase.from('patients').select('id', { count: 'exact', head: true }),
          supabase.from('visits').select('id', { count: 'exact', head: true }).eq('visit_date', new Date().toISOString().split('T')[0]),
          supabase.from('billings').select('total').eq('status', 'pending' as const),
        ]);

        return {
          success: true,
          data: {
            totalPatients: patientsResult.count || 0,
            todayVisits: visitsResult.count || 0,
            pendingBillings: billingsResult.data?.length || 0,
            pendingAmount: billingsResult.data?.reduce((sum, b) => sum + (b.total || 0), 0) || 0,
          },
        };
      } else {
        return nodeRequest('GET', '/reports/dashboard', { params });
      }
    },

    async revenue(params?: Record<string, string>) {
      if (API_MODE === 'supabase') {
        const { data, error } = await supabase
          .from('billings')
          .select('total, payment_date, payment_type')
          .eq('status', 'lunas' as const)
          .order('payment_date', { ascending: false });
        if (error) throw new ApiError(error.message, 400, 'QUERY_ERROR');
        return { success: true, data };
      } else {
        return nodeRequest('GET', '/reports/revenue', { params });
      }
    },
  },
};

// Export utilities
export const isNodeMode = () => API_MODE === 'nodejs';
export const isSupabaseMode = () => API_MODE === 'supabase';
export const getApiBaseUrl = () => API_MODE === 'nodejs' ? API_BASE_URL : null;

export default api;
