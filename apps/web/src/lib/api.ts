// TradeOS API Client — Frontend to backend communication
import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001/stream';

// ============ AXIOS INSTANCE ============

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Auth interceptor
client.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tradeos_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('tradeos_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH API ============

export const authApi = {
  login: (email: string, password: string) => client.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    client.post('/auth/register', data),
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

// ============ NOTIFICATIONS API ============

export const notificationsApi = {
  list: (limit?: number) => client.get('/notifications', { params: { limit } }),
  getUnreadCount: () => client.get('/notifications/unread-count'),
  markAsRead: (id: string) => client.put(`/notifications/${id}/read`),
  markAllAsRead: () => client.put('/notifications/read-all'),
  delete: (id: string) => client.delete(`/notifications/${id}`),
  registerWebhook: (url: string) => client.post('/notifications/webhook', { url }),
};

// ============ SETTINGS API ============

export const settingsApi = {
  getApiKeys: () => client.get('/settings/api-keys'),
  addApiKey: (data: { exchange: string; apiKey: string; apiSecret: string; passphrase?: string; accountId?: string }) =>
    client.post('/settings/api-keys', data),
  removeApiKey: (id: string) => client.delete(`/settings/api-keys/${id}`),
  testApiKey: (id: string) => client.post(`/settings/api-keys/${id}/test`),
  getSecurityAudit: () => client.get('/settings/security/audit'),
  runSecurityAudit: () => client.post('/settings/security/audit'),
  getSessions: () => client.get('/settings/sessions'),
  destroySession: (sessionId: string) => client.delete(`/settings/sessions/${sessionId}`),
  getIpWhitelist: () => client.get('/settings/security/ip-whitelist'),
  addToWhitelist: (ip: string) => client.post('/settings/security/ip-whitelist', { ip }),
  removeFromWhitelist: (ip: string) => client.delete(`/settings/security/ip-whitelist`, { data: { ip } }),
  updateProfile: (data: any) => client.put('/settings/profile', data),
  setTradingEnvironment: (testnet: boolean) => client.put('/settings/trading-env', { testnet }),
};

// ============ WEBSOCKET CLIENT ============

export class StreamClient {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    this.socket = new WebSocket(WS_URL);

    this.socket.onopen = () => {
      console.log('✅ StreamClient connected');
      this.emit('connected', null);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.event || 'message', data);
      } catch (e) {
        console.error('StreamClient parse error:', e);
      }
    };

    this.socket.onclose = () => {
      console.log('⚠️ StreamClient disconnected');
      this.emit('disconnected', null);
      // Auto-reconnect after 3s
      setTimeout(() => this.connect(), 3000);
    };

    this.socket.onerror = (err) => {
      console.error('StreamClient error:', err);
    };
  }

  subscribe(channel: string, symbols?: string[]) {
    this.socket?.send(JSON.stringify({ event: 'subscribe', data: { channel, symbols } }));
  }

  unsubscribe(channel: string, symbols?: string[]) {
    this.socket?.send(JSON.stringify({ event: 'unsubscribe', data: { channel, symbols } }));
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }
}

export const streamClient = new StreamClient();

// ============ EXPORTS ============

export default {
  auth: authApi,
  markets: marketsApi,
  trading: tradingApi,
  portfolios: portfoliosApi,
  analytics: analyticsApi,
  agents: agentsApi,
  watchlist: watchlistApi,
  automation: automationApi,
  notifications: notificationsApi,
  settings: settingsApi,
  stream: streamClient,
};

// Compat aliases — marketApi fetches live data from TradeOS AI backend
const TRADEOS_AI = 'https://superagent-2286fb2f.base44.app/functions/tradeosAI';

export const marketApi = {
  movers: async () => {
    const res = await fetch(TRADEOS_AI);
    const json = await res.json();
    const markets: any[] = json.markets || [];
    const sorted = [...markets].sort((a, b) => b.change24h - a.change24h);
    return {
      data: {
        gainers: sorted.filter(m => m.change24h > 0).slice(0, 5).map(m => ({
          symbol: m.symbol, changePct: m.change24h / 100, price: m.price
        })),
        losers: sorted.filter(m => m.change24h < 0).slice(0, 5).map(m => ({
          symbol: m.symbol, changePct: m.change24h / 100, price: m.price
        })),
      }
    };
  },
};
