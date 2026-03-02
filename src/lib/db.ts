/**
 * Database client — routes all calls to the Node.js/Express backend.
 * Import the db client like this:
 *   import { db } from "@/lib/db";
 */

import { api } from '@/lib/api-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Table → backend endpoint mapping
const TABLE_ENDPOINTS: Record<string, string> = {
  patients: '/patients',
  visits: '/visits',
  billings: '/billing',
  prescriptions: '/pharmacy/prescriptions',
  medicines: '/pharmacy/medicines',
  inpatient_admissions: '/inpatient/admissions',
  beds: '/inpatient/beds',
  rooms: '/inpatient/rooms',
  emergency_visits: '/emergency/visits',
  lab_results: '/lab/results',
  lab_orders: '/lab/orders',
  surgeries: '/surgery',
  surgery_teams: '/surgery/teams',
  operating_rooms: '/surgery/operating-rooms',
  surgical_safety_checklists: '/surgery/safety-checklists',
  icu_admissions: '/icu/admissions',
  icu_beds: '/icu/beds',
  icu_monitoring: '/icu/monitoring',
  employees: '/hr/employees',
  doctor_schedules: '/hr/schedules',
  work_shifts: '/hr/shifts',
  attendance: '/hr/attendance',
  leave_requests: '/hr/leave-requests',
  payroll: '/hr/payroll',
  purchase_orders: '/inventory/purchase-orders',
  purchase_requests: '/inventory/purchase-requests',
  vendors: '/inventory/vendors',
  chart_of_accounts: '/accounting/accounts',
  journal_entries: '/accounting/journals',
  bpjs_claims: '/bpjs/claims',
  radiology_orders: '/radiology/orders',
  mcu_registrations: '/mcu/registrations',
  mcu_packages: '/mcu/packages',
  blood_inventory: '/bloodbank/inventory',
  transfusion_requests: '/bloodbank/transfusions',
  dialysis_sessions: '/dialysis/sessions',
  autopsy_records: '/forensic/autopsy',
  mortuary_cases: '/forensic/mortuary',
  meal_plans: '/nutrition/meal-plans',
  therapy_sessions: '/rehabilitation/sessions',
  departments: '/admin/departments',
  doctors: '/admin/doctors',
  audit_logs: '/admin/audit-logs',
  system_settings: '/admin/system-settings',
  notifications: '/admin/notifications',
  user_roles: '/admin/user-roles',
  profiles: '/admin/profiles',
  ambulance_fleet: '/ambulance/fleet',
  ambulance_dispatches: '/ambulance/dispatches',
  home_care_visits: '/home-care/visits',
};

// Edge function → backend endpoint mapping
const FUNCTION_ENDPOINTS: Record<string, string> = {
  'bpjs-vclaim': '/bpjs/vclaim',
  'satusehat': '/satusehat/invoke',
  'bpjs-eclaim': '/bpjs/eclaim',
  'eklaim-idrg': '/eklaim/invoke',
  'bpjs-icare': '/bpjs/icare',
  'bpjs-antrean': '/bpjs/antrean',
  'pacs-bridge': '/radiology/pacs',
};

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('zen_access_token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ---- Query Builder ----

type FilterEntry = { type: string; col: string; val: unknown };

class QueryBuilder implements PromiseLike<any> {
  private _table: string;
  private _endpoint: string | null;
  private _method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET';
  private _body: unknown = undefined;
  private _filters: FilterEntry[] = [];
  private _selectCols = '*';
  private _orderCol: string | null = null;
  private _orderAsc = true;
  private _limitVal: number | null = null;
  private _rangeFrom: number | null = null;
  private _rangeTo: number | null = null;
  private _isSingle = false;
  private _isMaybeSingle = false;
  private _isCountHead = false;
  private _idFromEq: string | null = null;

  constructor(table: string) {
    this._table = table;
    this._endpoint = TABLE_ENDPOINTS[table] ?? null;
  }

  // ---- filter methods ----
  select(cols?: string, opts?: { count?: string; head?: boolean }): this {
    this._selectCols = cols || '*';
    if (opts?.head) this._isCountHead = true;
    return this;
  }
  eq(col: string, val: unknown): this {
    this._filters.push({ type: 'eq', col, val });
    if (col === 'id') this._idFromEq = String(val);
    // Fallback: when no 'id' eq filter is set, use the first eq filter value as the
    // path ID for PUT/DELETE requests (e.g. eq("setting_key", key) → PUT /endpoint/{key}).
    else if (this._idFromEq === null) this._idFromEq = String(val);
    return this;
  }
  neq(col: string, val: unknown): this { this._filters.push({ type: 'neq', col, val }); return this; }
  gte(col: string, val: unknown): this { this._filters.push({ type: 'gte', col, val }); return this; }
  lte(col: string, val: unknown): this { this._filters.push({ type: 'lte', col, val }); return this; }
  gt(col: string, val: unknown): this  { this._filters.push({ type: 'gt', col, val }); return this; }
  lt(col: string, val: unknown): this  { this._filters.push({ type: 'lt', col, val }); return this; }
  in(col: string, vals: unknown[]): this { this._filters.push({ type: 'in', col, val: vals }); return this; }
  or(filter: string): this  { this._filters.push({ type: 'or', col: '', val: filter }); return this; }
  like(col: string, pattern: string): this  { this._filters.push({ type: 'like', col, val: pattern }); return this; }
  ilike(col: string, pattern: string): this { this._filters.push({ type: 'ilike', col, val: pattern }); return this; }
  is(col: string, val: unknown): this   { this._filters.push({ type: 'is', col, val }); return this; }
  not(col: string, op: string, val: unknown): this { this._filters.push({ type: 'not', col, val: { op, val } }); return this; }
  order(col: string, opts?: { ascending?: boolean }): this {
    this._orderCol = col;
    this._orderAsc = opts?.ascending ?? true;
    return this;
  }
  limit(n: number): this { this._limitVal = n; return this; }
  range(from: number, to: number): this { this._rangeFrom = from; this._rangeTo = to; return this; }
  single(): this { this._isSingle = true; return this; }
  maybeSingle(): this { this._isMaybeSingle = true; return this; }

  insert(data: unknown): this {
    this._method = 'POST';
    this._body = data;
    return this;
  }
  update(data: unknown): this {
    this._method = 'PUT';
    this._body = data;
    return this;
  }
  delete(): this {
    this._method = 'DELETE';
    return this;
  }
  upsert(data: unknown): this {
    this._method = 'POST';
    this._body = data;
    return this;
  }

  // Build URL with query params for GET requests
  private _buildUrl(): string {
    if (!this._endpoint) return '';
    let path = this._endpoint;

    // For PUT/DELETE with an id filter, append id to path
    if ((this._method === 'PUT' || this._method === 'DELETE') && this._idFromEq) {
      path = `${path}/${this._idFromEq}`;
    }

    if (this._method !== 'GET') return `${API_BASE_URL}${path}`;

    const params = new URLSearchParams();
    for (const f of this._filters) {
      if (f.type === 'eq') params.set(f.col, String(f.val));
      else if (f.type === 'gte') params.set(`${f.col}_gte`, String(f.val));
      else if (f.type === 'lte') params.set(`${f.col}_lte`, String(f.val));
      else if (f.type === 'gt')  params.set(`${f.col}_gt`,  String(f.val));
      else if (f.type === 'lt')  params.set(`${f.col}_lt`,  String(f.val));
      else if (f.type === 'like') params.set(`${f.col}_like`, String(f.val));
      else if (f.type === 'ilike') params.set(`${f.col}_ilike`, String(f.val));
      else if (f.type === 'in') params.set(`${f.col}_in`, (f.val as unknown[]).join(','));
      else if (f.type === 'or') params.set('or', String(f.val));
      else if (f.type === 'is') params.set(`${f.col}_is`, String(f.val));
    }
    if (this._orderCol) {
      params.set('order', this._orderCol);
      params.set('dir', this._orderAsc ? 'asc' : 'desc');
    }
    if (this._limitVal !== null) params.set('limit', String(this._limitVal));
    if (this._rangeFrom !== null) params.set('offset', String(this._rangeFrom));
    if (this._selectCols && this._selectCols !== '*') params.set('select', this._selectCols);

    const qs = params.toString();
    return `${API_BASE_URL}${path}${qs ? '?' + qs : ''}`;
  }

  private async _execute(): Promise<any> {
    const isSingle = this._isSingle || this._isMaybeSingle;

    // No endpoint mapped → return empty gracefully
    if (!this._endpoint) {
      return isSingle ? { data: null, error: null } : { data: [], error: null };
    }

    // Count/head queries
    if (this._isCountHead) {
      return { data: null, count: 0, error: null };
    }

    const url = this._buildUrl();
    const headers = getAuthHeaders();

    try {
      const init: RequestInit = { method: this._method, headers };
      if (this._body && this._method !== 'GET') {
        init.body = JSON.stringify(this._body);
      }

      const res = await fetch(url, init);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        return { data: isSingle ? null : [], error: { message: errBody.error || res.statusText, status: res.status } };
      }

      if (this._method === 'DELETE') return { data: null, error: null };

      const json = await res.json();
      // Backend may wrap response in { success, data } or return array directly
      const payload = json?.data !== undefined ? json.data : json;

      if (isSingle) {
        const item = Array.isArray(payload) ? (payload[0] ?? null) : payload;
        return { data: item, error: null };
      }
      return { data: Array.isArray(payload) ? payload : (payload ?? []), error: null };
    } catch (err) {
      return { data: isSingle ? null : [], error: { message: (err as Error).message } };
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this._execute().then(onfulfilled, onrejected);
  }
}

// ---- Auth shim ----
const authShim = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const result = await api.auth.login(email, password);
      return { data: result, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
  async signOut() {
    try {
      await api.auth.logout();
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: Record<string, unknown> }) {
    try {
      const fullName = (options?.data as any)?.full_name ?? '';
      const result = await api.auth.register(email, password, fullName);
      return { data: result, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
  async getSession() {
    return { data: { session: null }, error: null };
  },
  async getUser() {
    try {
      const result = await api.auth.getCurrentUser();
      return { data: { user: result }, error: null };
    } catch (err) {
      return { data: { user: null }, error: err };
    }
  },
  onAuthStateChange(callback: (event: string, session: null) => void) {
    // No real-time session in Node.js mode; fire immediately with null session
    setTimeout(() => callback('INITIAL_SESSION', null), 0);
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
  async updateUser({ password }: { password?: string }) {
    try {
      if (password) await api.auth.changePassword('', password);
      return { data: {}, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
};

// ---- Functions shim ----
const functionsShim = {
  async invoke(name: string, options?: { body?: unknown }) {
    const endpoint = FUNCTION_ENDPOINTS[name];
    if (!endpoint) return { data: null, error: { message: `Unknown function: ${name}` } };
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(options?.body ?? {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { data: null, error: { message: json.error || res.statusText } };
      return { data: json?.data ?? json, error: null };
    } catch (err) {
      return { data: null, error: { message: (err as Error).message } };
    }
  },
};

// ---- Realtime channel stub (no-op — use WebSocket/backend events instead) ----
export type RealtimeChannel = {
  on: (...args: unknown[]) => RealtimeChannel;
  subscribe: (cb?: (status: string) => void) => RealtimeChannel;
  unsubscribe: () => void;
};

function noopChannel(): RealtimeChannel {
  const ch: RealtimeChannel = {
    on: () => ch,
    subscribe: (cb?: (status: string) => void) => { cb?.('CLOSED'); return ch; },
    unsubscribe: () => {},
  };
  return ch;
}

// ---- RPC function → backend endpoint mapping ----
const RPC_ENDPOINTS: Record<string, { path: string; method: 'GET' | 'POST' }> = {
  is_setup_completed:              { path: '/admin/setup-status',              method: 'GET'  },
  get_available_modules:           { path: '/admin/modules',                   method: 'GET'  },
  reset_system_to_initial:         { path: '/admin/reset-system',              method: 'POST' },
  get_user_menu_access:            { path: '/admin/menu-access',               method: 'GET'  },
  generate_invoice_number:         { path: '/billing/next-invoice-number',     method: 'GET'  },
  generate_journal_number:         { path: '/accounting/next-journal-number',  method: 'GET'  },
  generate_po_number:              { path: '/inventory/next-po-number',        method: 'GET'  },
  generate_pr_number:              { path: '/inventory/next-pr-number',        method: 'GET'  },
  generate_dispatch_number:        { path: '/ambulance/next-dispatch-number',  method: 'GET'  },
  generate_home_care_visit_number: { path: '/home-care/next-visit-number',     method: 'GET'  },
  calculate_rl6_indicators:        { path: '/reports/rl6-indicators',          method: 'POST' },
  preview_hospital_type_migration: { path: '/admin/hospital-migration/preview',method: 'POST' },
  migrate_hospital_type:           { path: '/admin/hospital-migration/execute',method: 'POST' },
};

// ---- Main export ----
export const db = {
  from(table: string): QueryBuilder {
    return new QueryBuilder(table);
  },
  /** Call a server-side RPC function mapped to a backend endpoint. */
  async rpc(funcName: string, params?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }> {
    const config = RPC_ENDPOINTS[funcName];
    if (!config) {
      console.warn(`[db.rpc] Unknown function: ${funcName}`);
      return { data: null, error: null };
    }
    const hasParams = params && Object.keys(params).length > 0;
    const method = config.method;
    let url = `${API_BASE_URL}${config.path}`;
    if (method === 'GET' && hasParams) {
      const qs = new URLSearchParams();
      Object.entries(params as Record<string, unknown>).forEach(([k, v]) => qs.append(k, String(v)));
      const qsStr = qs.toString();
      if (qsStr) url += `?${qsStr}`;
    }
    try {
      const init: RequestInit = { method, headers: getAuthHeaders() };
      if (method === 'POST' && hasParams) init.body = JSON.stringify(params);
      const res = await fetch(url, init);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { data: null, error: { message: json.error || res.statusText } };
      const data = json?.data !== undefined ? json.data : json;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: (err as Error).message } };
    }
  },
  auth: authShim,
  functions: functionsShim,
  /** Realtime channels are not supported in Node.js mode — returns a no-op channel. */
  channel(_name: string): RealtimeChannel {
    return noopChannel();
  },
  removeChannel(_channel: RealtimeChannel): void {
    // no-op
  },
};
