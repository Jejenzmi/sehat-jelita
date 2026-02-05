/**
 * SIMRS ZEN - Frontend API Client
 * Replace Supabase client with REST API calls
 * 
 * Usage in React:
 * import { api } from '@/lib/api-client';
 * 
 * const patients = await api.get('/patients');
 * await api.post('/patients', { data });
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.accessToken = null;
    this.refreshToken = null;
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  setTokens({ accessToken, refreshToken }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // ============================================
  // HTTP METHODS
  // ============================================

  async request(method, endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config = {
      method,
      headers,
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle token refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          return this.request(method, endpoint, options);
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.error || 'Request failed', response.status, data.code);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.message, 0, 'NETWORK_ERROR');
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request('GET', url);
  }

  async post(endpoint, body) {
    return this.request('POST', endpoint, { body });
  }

  async put(endpoint, body) {
    return this.request('PUT', endpoint, { body });
  }

  async patch(endpoint, body) {
    return this.request('PATCH', endpoint, { body });
  }

  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  // ============================================
  // AUTH METHODS
  // ============================================

  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.success) {
      this.setTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken
      });
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout', {});
    } finally {
      this.clearTokens();
    }
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.setTokens({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken
      });
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  // ============================================
  // RESOURCE METHODS
  // ============================================

  // Patients
  patients = {
    list: (params) => this.get('/patients', params),
    get: (id) => this.get(`/patients/${id}`),
    create: (data) => this.post('/patients', data),
    update: (id, data) => this.put(`/patients/${id}`, data),
    delete: (id) => this.delete(`/patients/${id}`),
    search: (query) => this.get('/patients/search', { q: query })
  };

  // Visits
  visits = {
    list: (params) => this.get('/visits', params),
    get: (id) => this.get(`/visits/${id}`),
    create: (data) => this.post('/visits', data),
    update: (id, data) => this.put(`/visits/${id}`, data),
    checkin: (id) => this.put(`/visits/${id}/checkin`),
    checkout: (id) => this.put(`/visits/${id}/checkout`)
  };

  // Billing
  billing = {
    list: (params) => this.get('/billing', params),
    get: (id) => this.get(`/billing/${id}`),
    create: (data) => this.post('/billing', data),
    addItem: (id, item) => this.post(`/billing/${id}/items`, item),
    processPayment: (id, payment) => this.post(`/billing/${id}/payment`, payment)
  };

  // Pharmacy
  pharmacy = {
    prescriptions: (params) => this.get('/pharmacy/prescriptions', params),
    getPrescription: (id) => this.get(`/pharmacy/prescriptions/${id}`),
    dispense: (id, data) => this.put(`/pharmacy/prescriptions/${id}/dispense`, data),
    stock: (params) => this.get('/pharmacy/stock', params)
  };

  // Lab
  lab = {
    orders: (params) => this.get('/lab/orders', params),
    getOrder: (id) => this.get(`/lab/orders/${id}`),
    createOrder: (data) => this.post('/lab/orders', data),
    addResult: (id, results) => this.post(`/lab/orders/${id}/results`, results),
    verifyResults: (id) => this.put(`/lab/orders/${id}/verify`)
  };

  // BPJS
  bpjs = {
    checkPeserta: (noBpjs) => this.get(`/bpjs/peserta/${noBpjs}`),
    createSEP: (data) => this.post('/bpjs/sep', data),
    getRujukan: (noRujukan) => this.get(`/bpjs/rujukan/${noRujukan}`)
  };

  // Reports
  reports = {
    dashboard: (params) => this.get('/reports/dashboard', params),
    revenue: (params) => this.get('/reports/revenue', params),
    visits: (params) => this.get('/reports/visits', params)
  };
}

// Custom Error Class
class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Singleton instance
export const api = new ApiClient();
api.loadTokens();

export { ApiError };
export default api;
