// TradeOS API Client — Frontend to backend communication
import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001/stream';

// ============ SESSION CONFIG ============
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const REFRESH_BUFFER_MS = 60 * 1000; // Refresh 1 min before token expiry

// ============ AXIOS INSTANCE ============

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Auth interceptor — attach access token
client.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tradeos_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Track refresh state to prevent concurrent refresh calls
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Refresh the access token using stored refresh token
async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  if (isRefreshing && refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem('tradeos_refresh_token');
  if (!refreshToken) return null;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      if (res.data?.accessToken) {
        localStorage.setItem('tradeos_token', res.data.accessToken);
        if (res.data?.refreshToken) {
          localStorage.setItem('tradeos_refresh_token', res.data.refreshToken);
        }
        // Schedule next proactive refresh
        scheduleTokenRefresh(res.data.expiresIn || 900);
        return res.data.accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
    }
  })();

  return refreshPromise;
}

// Clear all auth data and redirect to login
function forceLogout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('tradeos_token');
  localStorage.removeItem('tradeos_refresh_token');
  localStorage.removeItem('tradeos_user');
  localStorage.removeItem('tradeos_last_activity');
  window.location.href = '/?reason=session_expired';
}

// ============ PROACTIVE TOKEN REFRESH ============
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleTokenRefresh(expiresInSeconds: number) {
  if (typeof window === 'undefined') return;
  if (refreshTimer) clearTimeout(refreshTimer);
  // Refresh 1 minute before the token expires
  const refreshInMs = Math.max((expiresInSeconds * 1000) - REFRESH_BUFFER_MS, 10000);
  refreshTimer = setTimeout(async () => {
    const newToken = await refreshAccessToken();
    if (!newToken) forceLogout();
  }, refreshInMs);
}

// ============ IDLE TIMEOUT TRACKING ============
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function resetIdleTimer() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tradeos_last_activity', Date.now().toString());
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    // User has been idle for 30 minutes — force logout
    forceLogout();
  }, IDLE_TIMEOUT_MS);
}

function startSessionTracking() {
  if (typeof window === 'undefined') return;

  // Track user activity
  const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
  let lastActivityUpdate = 0;

  activityEvents.forEach((event) => {
    window.addEventListener(event, () => {
      // Throttle — only update once per 10 seconds
      const now = Date.now();
      if (now - lastActivityUpdate > 10000) {
        lastActivityUpdate = now;
        resetIdleTimer();
      }
    }, { passive: true });
  });

  // Start the idle timer
  resetIdleTimer();

  // Send heartbeat every 5 minutes to keep server-side session alive
  heartbeatTimer = setInterval(async () => {
    try {
      await client.post('/auth/heartbeat');
    } catch {
      // Heartbeat failed — session might be expired
      // The response interceptor will handle 401s
    }
  }, HEARTBEAT_INTERVAL_MS);
}

function stopSessionTracking() {
  if (idleTimer) clearTimeout(idleTimer);
  if (refreshTimer) clearTimeout(refreshTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  idleTimer = null;
  refreshTimer = null;
  heartbeatTimer = null;
}

// Response interceptor — auto-refresh on 401, only logout if refresh fails
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried, attempt token refresh
    if (error.response?.status === 401 && typeof window !== 'undefined' && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest); // Retry the original request
      }

      // Refresh failed — clear everything and redirect
      forceLogout();
    }

    return Promise.reject(error);
  }
);

// ============ AUTH API ============

export const authApi = {
  login: async (email: string, password: string, twoFactorCode?: string) => {
    const res = await client.post('/auth/login', { email, password, twoFactorCode });
    if (res.data?.accessToken) {
      localStorage.setItem('tradeos_token', res.data.accessToken);
    }
    if (res.data?.refreshToken) {
      localStorage.setItem('tradeos_refresh_token', res.data.refreshToken);
    }
    if (res.data?.user) {
      localStorage.setItem('tradeos_user', JSON.stringify(res.data.user));
    }
    // Start session tracking
    startSessionTracking();
    // Schedule proactive token refresh
    if (res.data?.expiresIn) {
      scheduleTokenRefresh(res.data.expiresIn);
    } else {
      scheduleTokenRefresh(900); // Default 15 min
    }
    return res;
  },

  register: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const res = await client.post('/auth/register', data);
    if (res.data?.accessToken) {
      localStorage.setItem('tradeos_token', res.data.accessToken);
    }
    if (res.data?.refreshToken) {
      localStorage.setItem('tradeos_refresh_token', res.data.refreshToken);
    }
    if (res.data?.user) {
      localStorage.setItem('tradeos_user', JSON.stringify(res.data.user));
    }
    startSessionTracking();
    scheduleTokenRefresh(900);
    return res;
  },

  logout: async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('tradeos_refresh_token') : null;
    try {
      if (refreshToken) await client.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore logout errors — clear locally anyway
    }
    // Stop all session tracking
    stopSessionTracking();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tradeos_token');
      localStorage.removeItem('tradeos_refresh_token');
      localStorage.removeItem('tradeos_user');
      localStorage.removeItem('tradeos_last_activity');
    }
  },

  // Restore session on page reload — check if token is still valid
  restoreSession: () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('tradeos_token');
    const refreshToken = localStorage.getItem('tradeos_refresh_token');
    const lastActivity = localStorage.getItem('tradeos_last_activity');

    if (!token || !refreshToken) return false;

    // Check idle timeout
    if (lastActivity) {
      const idleMs = Date.now() - parseInt(lastActivity, 10);
      if (idleMs > IDLE_TIMEOUT_MS) {
        // Session expired due to inactivity
        forceLogout();
        return false;
      }
    }

    // Resume session tracking
    startSessionTracking();
    scheduleTokenRefresh(900); // Will refresh before expiry
    return true;
  },

  me: () => client.get('/auth/me'),
  refreshToken: () => client.post('/auth/refresh'),
  updatePassword: (oldPassword: string, newPassword: string) =>
    client.put('/auth/password', { oldPassword, newPassword }),
  enable2FA: () => client.post('/auth/2fa/enable'),
  verify2FA: (code: string) => client.post('/auth/2fa/verify', { code }),
  disable2FA: (code: string) => client.post('/auth/2fa/disable', { code }),
};

// ============ MARKETS API ============

export const marketsApi = {
  getTickers: (exchange?: string) => client.get('/markets/tickers', { params: { exchange } }),
  getCandles: (symbol: string, exchange: string, interval: string, limit?: number) =>
    client.get(`/markets/candles/${symbol}`, { params: { exchange, interval, limit } }),
  getOrderBook: (symbol: string, exchange: string) =>
    client.get(`/markets/orderbook/${symbol}`, { params: { exchange } }),
  getLatestPrice: (symbol: string, exchange: string) =>
    client.get(`/markets/price/${symbol}`, { params: { exchange } }),
  searchSymbols: (query: string, exchange?: string) =>
    client.get('/markets/search', { params: { q: query, exchange } }),
  getSupportedExchanges: () => client.get('/markets/exchanges'),
};

// ============ TRADING API ============

export const tradingApi = {
  placeOrder: (order: {
    symbol: string; exchange: string; side: 'BUY' | 'SELL';
    type: string; quantity: number; price?: number; stopPrice?: number;
    timeInForce?: string; portfolioId: string;
  }) => client.post('/trading/orders', order),

  cancelOrder: (orderId: string) => client.delete(`/trading/orders/${orderId}`),
  getOrders: (status?: string, limit?: number) =>
    client.get('/trading/orders', { params: { status, limit } }),
  getOrder: (orderId: string) => client.get(`/trading/orders/${orderId}`),
  getTradeHistory: (limit?: number) => client.get('/trading/history', { params: { limit } }),
  closePosition: (symbol: string, exchange: string) =>
    client.post('/trading/positions/close', { symbol, exchange }),
  closeAllPositions: () => client.post('/trading/positions/close-all'),
  getRiskConfig: () => client.get('/trading/risk'),
  updateRiskConfig: (config: any) => client.put('/trading/risk', config),
};

// ============ PORTFOLIOS API ============

export const portfoliosApi = {
  list: () => client.get('/portfolios'),
  get: (id: string) => client.get(`/portfolios/${id}`),
  create: (data: { name: string; description: string; initialCapital: number }) =>
    client.post('/portfolios', data),
  update: (id: string, data: any) => client.put(`/portfolios/${id}`, data),
  delete: (id: string) => client.delete(`/portfolios/${id}`),
  positions: (id: string) => client.get(`/portfolios/${id}/positions`),
  balances: (id: string) => client.get(`/portfolios/${id}/balances`),
  performance: (id: string, period?: string) =>
    client.get(`/portfolios/${id}/performance`, { params: { period } }),
  rebalance: (id: string, targetAllocation: any) =>
    client.post(`/portfolios/${id}/rebalance`, { targetAllocation }),
};

// ============ ANALYTICS API ============

export const analyticsApi = {
  getStats: (period?: string) => client.get('/analytics/stats', { params: { period } }),
  getTradeHistory: (limit?: number) => client.get('/analytics/trades', { params: { limit } }),
  getMonthlyPnL: (year?: number) => client.get('/analytics/monthly-pnl', { params: { year } }),
  getPerformanceMetrics: () => client.get('/analytics/metrics'),
  getWinLossRatio: () => client.get('/analytics/win-loss'),
  getDrawdown: () => client.get('/analytics/drawdown'),
  exportReport: (format: 'pdf' | 'csv' | 'json') =>
    client.get('/analytics/export', { params: { format }, responseType: 'blob' }),
};

// ============ AI AGENTS API ============

export const agentsApi = {
  list: () => client.get('/agents'),
  get: (id: string) => client.get(`/agents/${id}`),
  toggle: (id: string, active: boolean) => client.put(`/agents/${id}/toggle`, { active }),
  updateConfig: (id: string, config: any) => client.put(`/agents/${id}/config`, { config }),
  run: (id: string, symbols: string[]) => client.post(`/agents/${id}/run`, { symbols }),
  runAll: (symbols: string[]) => client.post('/agents/run-all', { symbols }),
  getExecutions: (id: string, limit?: number) =>
    client.get(`/agents/${id}/executions`, { params: { limit } }),
  getSignals: (active?: boolean) => client.get('/agents/signals', { params: { active } }),
  getRiskAssessment: () => client.get('/agents/risk-assessment'),
};

// ============ WATCHLIST API ============

export const watchlistApi = {
  list: () => client.get('/watchlists'),
  create: (name: string) => client.post('/watchlists', { name }),
  delete: (id: string) => client.delete(`/watchlists/${id}`),
  addItem: (watchlistId: string, data: { symbol: string; exchange: string }) =>
    client.post(`/watchlists/${watchlistId}/items`, data),
  removeItem: (watchlistId: string, itemId: string) =>
    client.delete(`/watchlists/${watchlistId}/items/${itemId}`),
  setAlert: (itemId: string, alertAbove?: number, alertBelow?: number) =>
    client.put(`/watchlists/items/${itemId}/alert`, { alertAbove, alertBelow }),
};

// ============ AUTOMATION API ============

export const automationApi = {
  list: () => client.get('/automations'),
  create: (rule: any) => client.post('/automations', rule),
  update: (id: string, updates: any) => client.put(`/automations/${id}`, updates),
  delete: (id: string) => client.delete(`/automations/${id}`),
  pause: (id: string) => client.post(`/automations/${id}/pause`),
  resume: (id: string) => client.post(`/automations/${id}/resume`),
  getStats: () => client.get('/automations/stats'),
  createDCA: (params: any) => client.post('/automations/dca', params),
  createGrid: (params: any) => client.post('/automations/grid', params),
};

// ============ AI CHAT API ============

export const aiChatApi = {
  sendMessage: (message: string, context?: any) =>
    client.post('/ai/chat', { message, context }),
  getHistory: (limit?: number) => client.get('/ai/chat/history', { params: { limit } }),
  clearHistory: () => client.delete('/ai/chat/history'),
};

// Export session utilities
export { startSessionTracking, stopSessionTracking, forceLogout };
export default client;
