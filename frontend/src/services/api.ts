// frontend/src/services/api.ts
// CHANGED: analytics.dashboard() now accepts optional { year, month } params
//          so the Dashboard page can pass the filter values.

// @ts-ignore
const BASE_URL: string = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

export const getToken = () => localStorage.getItem('access_token');
export const setToken = (t: string) => localStorage.setItem('access_token', t);
export const clearToken = () => localStorage.removeItem('access_token');
export const getFamilyId = () => localStorage.getItem('family_id');
export const setFamilyId = (id: string) => localStorage.setItem('family_id', id);

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

function fid() {
  const id = getFamilyId();
  if (!id) throw new Error('No family found. Please create a family first.');
  return id;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; token_type: string }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: { email: string; password: string; full_name: string }) =>
      request<any>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<{ id: string; email: string; full_name: string; role: string; phone?: string }>('/api/v1/auth/me'),
    updateProfile: (data: { full_name?: string; phone?: string }) =>
      request<any>('/api/v1/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
    changePassword: (current_password: string, new_password: string) =>
      request<any>('/api/v1/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) }),
  },

  families: {
    create: (name: string) =>
      request<Family>('/api/v1/families/', { method: 'POST', body: JSON.stringify({ name }) }),
    get: (id: string) =>
      request<Family>(`/api/v1/families/${id}`),
    update: (id: string, data: { name: string }) =>
      request<Family>(`/api/v1/families/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  transactions: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ items: Transaction[]; total: number; page: number; pages: number }>(
        `/api/v1/families/${fid()}/transactions/${q}`
      );
    },
    create: (data: Partial<Transaction>) =>
      request<Transaction>(`/api/v1/families/${fid()}/transactions/`, {
        method: 'POST', body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Transaction>) =>
      request<Transaction>(`/api/v1/families/${fid()}/transactions/${id}`, {
        method: 'PATCH', body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/v1/families/${fid()}/transactions/${id}`, { method: 'DELETE' }),
  },

  analytics: {
    // ── CHANGED ──────────────────────────────────────────────────────────────
    // Added optional `year` and `month` parameters. The backend route at
    // GET /api/v1/families/{id}/analytics/dashboard already accepts these as
    // query params (year: int, month: int). Defaults fall back to "now" so
    // existing call-sites that omit the argument remain unaffected.
    dashboard: (year?: number, month?: number) => {
      const now = new Date();
      const y = year ?? now.getFullYear();
      const m = month ?? now.getMonth() + 1;
      return request<DashboardData>(
        `/api/v1/families/${fid()}/analytics/dashboard?year=${y}&month=${m}`
      );
    },
    // ─────────────────────────────────────────────────────────────────────────
    healthScore: () =>
      request<any>(`/api/v1/families/${fid()}/analytics/health-score`),
    forecast: () =>
      request<any>(`/api/v1/families/${fid()}/analytics/forecast`),
    anomalies: () =>
      request<any>(`/api/v1/families/${fid()}/analytics/anomalies`),
  },

  savings: {
    list: () => request<SavingsGoal[]>(`/api/v1/families/${fid()}/savings/`),
    create: (data: Partial<SavingsGoal>) =>
      request<SavingsGoal>(`/api/v1/families/${fid()}/savings/`, {
        method: 'POST', body: JSON.stringify(data),
      }),
    contribute: (id: string, amount: number) =>
      request<any>(`/api/v1/families/${fid()}/savings/${id}/contribute`, {
        method: 'POST', body: JSON.stringify({ amount }),
      }),
    update: (id: string, data: Partial<SavingsGoal>) =>
      request<SavingsGoal>(`/api/v1/families/${fid()}/savings/${id}`, {
        method: 'PATCH', body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/v1/families/${fid()}/savings/${id}`, { method: 'DELETE' }),
  },

  budgets: {
    list: (year?: number, month?: number) =>
      request<Budget[]>(`/api/v1/families/${fid()}/budgets/${year && month ? '?year=' + year + '&month=' + month : ''}`),
    create: (data: any) =>
      request<Budget>(`/api/v1/families/${fid()}/budgets/`, {
        method: 'PUT', body: JSON.stringify(data),
      }),
  },

  categories: {
    list: () => request<Category[]>('/api/v1/categories/'),
  },

  notifications: {
    list: () => request<any[]>('/api/v1/notifications/'),
  },

  ai: {
    chat: (message: string, history: { role: string; content: string }[]) =>
      request<{ reply: string }>(`/api/v1/families/${fid()}/ai/chat`, {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      }),
    summary: () =>
      request<any>(`/api/v1/families/${fid()}/ai/monthly-summary`, { method: 'POST', body: JSON.stringify({}) }),
  },
};

export interface Family {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string | null;
  category?: { name: string };
  transaction_date: string;
  date?: string; // legacy alias
  notes?: string;
  currency: string;
  merchant_name?: string | null;
}

export interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  priority: string;
}

export interface Budget {
  id: string;
  category_id: string;
  category?: { name: string };
  monthly_limit: number;
  spent: number;
  month: number;
  year: number;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  color?: string;
  icon?: string;
}

export interface DashboardData {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  monthly_data: { month: string; income: number; expenses: number }[];
  recent_transactions: Transaction[];
  top_categories: { name: string; amount: number; percentage: number }[];
  budget_utilization: { name: string; limit: number; spent: number; percentage: number }[];
}