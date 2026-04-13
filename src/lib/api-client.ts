/**
 * SIMRS ZEN - API Client
 *
 * Auth strategy: httpOnly cookies (primary) + Authorization header fallback.
 * Cookies are set by the server on login/refresh and sent automatically
 * via credentials:'include'. localStorage tokens are read during transition
 * for existing sessions but NO LONGER WRITTEN — new logins use cookies only.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
// LEGACY TOKEN MANAGER
// Used read-only to support existing sessions still in localStorage.
// No new tokens are written here — cookies handle that now.
// ============================================

class LegacyTokenManager {
  /** Read token written by an older session (before cookie migration). */
  getLegacyAccessToken(): string | null {
    return localStorage.getItem('zen_access_token');
  }

  /** Clear stale localStorage tokens (called on logout or after cookie refresh). */
  clearLegacy() {
    localStorage.removeItem('zen_access_token');
    localStorage.removeItem('zen_refresh_token');
  }
}

const legacyTokens = new LegacyTokenManager();

// ============================================
// CORE REQUEST
// ============================================

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

async function nodeRequest<T>(
  method: string,
  endpoint: string,
  options: { body?: unknown; params?: Record<string, string | undefined> } = {}
): Promise<T> {
  let url = `${API_BASE_URL}${endpoint}`;

  if (options.params) {
    const filtered = Object.fromEntries(
      Object.entries(options.params).filter(([, v]) => v !== undefined && v !== '')
    ) as Record<string, string>;
    const qs = new URLSearchParams(filtered).toString();
    if (qs) url += `?${qs}`;
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json' };

  // Fallback: send legacy localStorage token during transition period.
  // The backend checks cookie first, so this only activates when no cookie exists.
  const legacyToken = legacyTokens.getLegacyAccessToken();
  if (legacyToken) {
    headers['Authorization'] = `Bearer ${legacyToken}`;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include', // Always send/receive httpOnly cookies
  };

  if (options.body && method !== 'GET') {
    config.body = JSON.stringify(options.body);
  }

  try {
    let response = await fetch(url, config);

    // 401 → attempt silent refresh via cookie
    if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
      const refreshed = await silentRefresh();
      if (refreshed) {
        // After refresh, cookie is updated; clear stale localStorage token
        legacyTokens.clearLegacy();
        delete (headers as Record<string, string>)['Authorization'];
        response = await fetch(url, { ...config, headers });
      } else {
        // Refresh failed — clear legacy tokens and let caller handle 401
        legacyTokens.clearLegacy();
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

/**
 * Silent token refresh using the httpOnly refreshToken cookie.
 * Deduplicates concurrent refresh attempts.
 */
async function silentRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise(resolve => {
      refreshQueue.push(() => resolve(true));
    });
  }

  isRefreshing = true;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // refreshToken cookie is sent automatically
    });

    if (!response.ok) return false;

    // Server sets new httpOnly access + refresh cookies in response
    refreshQueue.forEach(cb => cb());
    return true;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
    refreshQueue = [];
  }
}

// ============================================
// UNIFIED API CLIENT
// ============================================

export const api = {
  getMode: () => 'nodejs' as const,

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  auth: {
    async login(email: string, password: string) {
      const response = await nodeRequest<{
        success: boolean;
        data: { user: unknown; accessToken?: string; refreshToken?: string };
      }>('POST', '/auth/login', { body: { email, password } });

      // Cookies are set by server. Clean up any stale localStorage tokens.
      legacyTokens.clearLegacy();

      return response;
    },

    async logout() {
      try {
        await nodeRequest('POST', '/auth/logout');
      } finally {
        legacyTokens.clearLegacy();
      }
    },

    async register(email: string, password: string, fullName: string) {
      return nodeRequest('POST', '/auth/register', {
        body: { email, password, fullName },
      });
    },

    async getCurrentUser() {
      return nodeRequest('GET', '/auth/me');
    },

    async changePassword(currentPassword: string, newPassword: string) {
      return nodeRequest('POST', '/auth/change-password', {
        body: { currentPassword, newPassword },
      });
    },

    async refreshToken() {
      return silentRefresh();
    },
  },

  // ==========================================
  // PATIENTS
  // ==========================================

  patients: {
    async list(params?: Record<string, string>) {
      return nodeRequest('GET', '/patients', { params });
    },
    async get(id: string) {
      return nodeRequest('GET', `/patients/${id}`);
    },
    async create(data: Record<string, unknown>) {
      return nodeRequest('POST', '/patients', { body: data });
    },
    async update(id: string, data: Record<string, unknown>) {
      return nodeRequest('PUT', `/patients/${id}`, { body: data });
    },
    async delete(id: string) {
      return nodeRequest('DELETE', `/patients/${id}`);
    },
    async search(q: string, params?: Record<string, string>) {
      return nodeRequest('GET', '/patients/search', { params: { q, ...params } });
    },
  },

  // ==========================================
  // VISITS
  // ==========================================

  visits: {
    async list(params?: Record<string, string>) {
      return nodeRequest('GET', '/visits', { params });
    },
    async get(id: string) {
      return nodeRequest('GET', `/visits/${id}`);
    },
    async create(data: Record<string, unknown>) {
      return nodeRequest('POST', '/visits', { body: data });
    },
    async update(id: string, data: Record<string, unknown>) {
      return nodeRequest('PUT', `/visits/${id}`, { body: data });
    },
  },

  // ==========================================
  // BILLING
  // ==========================================

  billing: {
    async list(params?: Record<string, string>) {
      return nodeRequest('GET', '/billing', { params });
    },
    async get(id: string) {
      return nodeRequest('GET', `/billing/${id}`);
    },
    async create(data: Record<string, unknown>) {
      return nodeRequest('POST', '/billing', { body: data });
    },
    async processPayment(id: string, data: Record<string, unknown>) {
      return nodeRequest('POST', `/billing/${id}/pay`, { body: data });
    },
    async export(params?: Record<string, string>) {
      const qs = params ? new URLSearchParams(params).toString() : '';
      const res = await fetch(`${API_BASE_URL}/export/billing${qs ? `?${qs}` : ''}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new ApiError('Export gagal', res.status);
      return res.blob();
    },
  },

  // ==========================================
  // PHARMACY
  // ==========================================

  pharmacy: {
    async prescriptions(params?: Record<string, string>) {
      return nodeRequest('GET', '/pharmacy/prescriptions', { params });
    },
    async getPrescription(id: string) {
      return nodeRequest('GET', `/pharmacy/prescriptions/${id}`);
    },
    async createPrescription(data: Record<string, unknown>) {
      return nodeRequest('POST', '/pharmacy/prescriptions', { body: data });
    },
    async verify(id: string, data: Record<string, unknown>) {
      return nodeRequest('POST', `/pharmacy/prescriptions/${id}/verify`, { body: data });
    },
    async dispense(id: string, data: Record<string, unknown>) {
      return nodeRequest('POST', `/pharmacy/prescriptions/${id}/dispense`, { body: data });
    },
    async stock(params?: Record<string, string>) {
      return nodeRequest('GET', '/pharmacy/stock', { params });
    },
    async checkInteractions(data: Record<string, unknown>) {
      return nodeRequest('POST', '/cds/check-prescription', { body: data });
    },
    async checkSingleDrug(data: Record<string, unknown>) {
      return nodeRequest('POST', '/cds/check-drug', { body: data });
    },
  },

  // ==========================================
  // LABORATORY
  // ==========================================

  lab: {
    async orders(params?: Record<string, string>) {
      return nodeRequest('GET', '/lab/orders', { params });
    },
    async getOrder(id: string) {
      return nodeRequest('GET', `/lab/orders/${id}`);
    },
    async createOrder(data: Record<string, unknown>) {
      return nodeRequest('POST', '/lab/orders', { body: data });
    },
    async addResult(orderId: string, results: Record<string, unknown>) {
      return nodeRequest('POST', `/lab/orders/${orderId}/results`, { body: results });
    },
    async exportResult(orderId: string) {
      const res = await fetch(`${API_BASE_URL}/export/lab-results/${orderId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new ApiError('Export gagal', res.status);
      return res.blob();
    },
  },

  // ==========================================
  // HR / SDM
  // ==========================================

  hr: {
    async employees(params?: Record<string, string>) {
      return nodeRequest('GET', '/hr/employees', { params });
    },
    async getEmployee(id: string) {
      return nodeRequest('GET', `/hr/employees/${id}`);
    },
    async createEmployee(data: Record<string, unknown>) {
      return nodeRequest('POST', '/hr/employees', { body: data });
    },
    async attendance(params?: Record<string, string>) {
      return nodeRequest('GET', '/hr/attendance', { params });
    },
    async leaveRequests(params?: Record<string, string>) {
      return nodeRequest('GET', '/hr/leave-requests', { params });
    },
    async payroll(params?: Record<string, string>) {
      return nodeRequest('GET', '/hr/payroll', { params });
    },
  },

  // ==========================================
  // INVENTORY
  // ==========================================

  inventory: {
    async stock(params?: Record<string, string>) {
      return nodeRequest('GET', '/inventory/stock', { params });
    },
    async purchaseOrders(params?: Record<string, string>) {
      return nodeRequest('GET', '/inventory/purchase-orders', { params });
    },
    async createPurchaseOrder(data: Record<string, unknown>) {
      return nodeRequest('POST', '/inventory/purchase-orders', { body: data });
    },
  },

  // ==========================================
  // ACCOUNTING
  // ==========================================

  accounting: {
    async accounts(params?: Record<string, string>) {
      return nodeRequest('GET', '/accounting/accounts', { params });
    },
    async journals(params?: Record<string, string>) {
      return nodeRequest('GET', '/accounting/journals', { params });
    },
    async createJournal(data: Record<string, unknown>) {
      return nodeRequest('POST', '/accounting/journals', { body: data });
    },
    async exportJournal(params?: Record<string, string>) {
      const qs = params ? new URLSearchParams(params).toString() : '';
      const res = await fetch(`${API_BASE_URL}/export/accounting/journal${qs ? `?${qs}` : ''}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new ApiError('Export gagal', res.status);
      return res.blob();
    },
  },

  // ==========================================
  // BPJS INTEGRATION
  // ==========================================

  bpjs: {
    async checkPeserta(noBpjs: string) {
      return nodeRequest('GET', `/bpjs/peserta/noka/${noBpjs}`);
    },
    async createSEP(data: unknown) {
      return nodeRequest('POST', '/bpjs/sep', { body: data });
    },
    async getRujukan(noRujukan: string) {
      return nodeRequest('GET', `/bpjs/rujukan/${noRujukan}`);
    },
  },

  // ==========================================
  // SATU SEHAT
  // ==========================================

  satusehat: {
    async syncPatient(patientId: string) {
      return nodeRequest('POST', '/satusehat/sync/patient', { body: { patientId } });
    },
    async syncEncounter(visitId: string) {
      return nodeRequest('POST', '/satusehat/sync/encounter', { body: { visitId } });
    },
    async getIHSPatient(nik: string) {
      return nodeRequest('GET', `/satusehat/patient/${nik}`);
    },
  },

  // ==========================================
  // REPORTS & ANALYTICS
  // ==========================================

  reports: {
    async dashboard(params?: Record<string, string>) {
      return nodeRequest('GET', '/reports/dashboard', { params });
    },
    async revenue(params?: Record<string, string>) {
      return nodeRequest('GET', '/reports/revenue', { params });
    },
    async visits(params?: Record<string, string>) {
      return nodeRequest('GET', '/reports/visits', { params });
    },
    async exportKemenkes(reportType: string, params?: Record<string, string>) {
      const qs = params ? new URLSearchParams(params).toString() : '';
      const res = await fetch(`${API_BASE_URL}/export/kemenkes/${reportType}${qs ? `?${qs}` : ''}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new ApiError('Export gagal', res.status);
      return res.blob();
    },
  },

  // ==========================================
  // ADMIN
  // ==========================================

  admin: {
    async auditLogs(params?: Record<string, string>) {
      return nodeRequest('GET', '/admin/audit-logs', { params });
    },
    async systemSettings() {
      return nodeRequest('GET', '/admin/system-settings');
    },
    async updateSetting(key: string, value: unknown) {
      return nodeRequest('PUT', `/admin/system-settings/${key}`, { body: { value } });
    },
    async circuitBreakers() {
      return nodeRequest('GET', '/admin/circuit-breakers');
    },
    async resetBreaker(name: string) {
      return nodeRequest('POST', `/admin/circuit-breakers/${name}/reset`);
    },
    async triggerBackup() {
      return nodeRequest('POST', '/admin/jobs/backup');
    },
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  notifications: {
    async send(data: { phone: string; template_type: string; data?: unknown }) {
      return nodeRequest('POST', '/notifications/send', { body: data });
    },
    async logs(params?: Record<string, string>) {
      return nodeRequest('GET', '/notifications/logs', { params });
    },
    async stats() {
      return nodeRequest('GET', '/notifications/stats');
    },
  },

  // ==========================================
  // CLINICAL DECISION SUPPORT
  // ==========================================

  cds: {
    async checkPrescription(data: { patient_id: string; items: unknown[]; diagnosis_codes?: string[] }) {
      return nodeRequest('POST', '/cds/check-prescription', { body: data });
    },
    async checkDrug(data: { patient_id: string; medicine_id: string; dosage?: string; existing_medicine_ids?: string[] }) {
      return nodeRequest('POST', '/cds/check-drug', { body: data });
    },
  },

  // ==========================================
  // GENERIC
  // ==========================================

  request: nodeRequest,
};

// Export utilities
export const isNodeMode = () => true;
export const getApiBaseUrl = () => API_BASE_URL;

export default api;
