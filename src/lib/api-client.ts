/**
 * SIMRS ZEN - API Client (Node.js/Express backend)
 *
 * VITE_API_URL = '/api'  (proxied via nginx/vite-dev-server to the backend)
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
  getMode: () => 'nodejs' as const,

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  auth: {
    async login(email: string, password: string) {
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
    },

    async logout() {
      try {
        await nodeRequest('POST', '/auth/logout');
      } finally {
        tokenManager.clearTokens();
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

    async create(patientData: Record<string, unknown>) {
      return nodeRequest('POST', '/patients', { body: patientData });
    },

    async update(id: string, patientData: Record<string, unknown>) {
      return nodeRequest('PUT', `/patients/${id}`, { body: patientData });
    },

    async delete(id: string) {
      return nodeRequest('DELETE', `/patients/${id}`);
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

    async create(visitData: Record<string, unknown>) {
      return nodeRequest('POST', '/visits', { body: visitData });
    },

    async update(id: string, visitData: Record<string, unknown>) {
      return nodeRequest('PUT', `/visits/${id}`, { body: visitData });
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

    async create(billingData: Record<string, unknown>) {
      return nodeRequest('POST', '/billing', { body: billingData });
    },

    async processPayment(id: string, paymentData: Record<string, unknown>) {
      return nodeRequest('POST', `/billing/${id}/pay`, { body: paymentData });
    },
  },

  // ==========================================
  // PHARMACY
  // ==========================================

  pharmacy: {
    async prescriptions(params?: Record<string, string>) {
      return nodeRequest('GET', '/pharmacy/prescriptions', { params });
    },

    async dispense(id: string, dispenseData: Record<string, unknown>) {
      return nodeRequest('PUT', `/pharmacy/prescriptions/${id}/dispense`, {
        body: dispenseData,
      });
    },

    async stock(params?: Record<string, string>) {
      return nodeRequest('GET', '/pharmacy/stock', { params });
    },
  },

  // ==========================================
  // LABORATORY (Placeholder - uses nodeRequest for now)
  // ==========================================

  lab: {
    async orders(params?: Record<string, string>) {
      return nodeRequest('GET', '/lab/orders', { params });
    },

    async createOrder(orderData: Record<string, unknown>) {
      return nodeRequest('POST', '/lab/orders', { body: orderData });
    },

    async addResult(orderId: string, results: Record<string, unknown>) {
      return nodeRequest('POST', `/lab/orders/${orderId}/results`, { body: results });
    },
  },

  // ==========================================
  // BPJS INTEGRATION
  // ==========================================

  bpjs: {
    async checkPeserta(noBpjs: string) {
      return nodeRequest('GET', `/bpjs/peserta/noka/${noBpjs}`);
    },

    async createSEP(sepData: unknown) {
      return nodeRequest('POST', '/bpjs/sep', { body: sepData });
    },

    async getRujukan(noRujukan: string) {
      return nodeRequest('GET', `/bpjs/rujukan/${noRujukan}`);
    },
  },

  // ==========================================
  // SATU SEHAT INTEGRATION
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
  // REPORTS & DASHBOARD
  // ==========================================

  reports: {
    async dashboard(params?: Record<string, string>) {
      return nodeRequest('GET', '/reports/dashboard', { params });
    },

    async revenue(params?: Record<string, string>) {
      return nodeRequest('GET', '/reports/revenue', { params });
    },
  },
};

// Export utilities
export const isNodeMode = () => true;
export const getApiBaseUrl = () => API_BASE_URL;

export default api;
