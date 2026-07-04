import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const api = axios.create({ baseURL: API });
api.interceptors.request.use((c) => { const t = typeof window !== 'undefined' ? localStorage.getItem('tradeos_token') : null; if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
export default api;

export const authApi = {
  register: (email: string, password: string, name?: string) => api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string, twoFactorCode?: string) => api.post('/auth/login', { email, password, twoFactorCode }),
  logout: (rt: string) => api.post('/auth/logout', { refreshToken: rt }),
};

export const tradingApi = {
  placeOrder: (dto: any) => api.post('/trading/order', dto),
  cancelOrder: (id: string) => api.delete(`/trading/order/${id}`),
  orders: (p = 1) => api.get(`/trading/orders?page=${p}`),
  trades: (p = 1) => api.get(`/trading/trades?page=${p}`),
  exchangeStatus: () => api.get('/trading/exchanges/status'),
  exchangeBalances: (exchange?: string) => api.get(`/trading/exchanges/balances${exchange ? `?exchange=${exchange}` : ''}`),
  exchangePositions: (exchange?: string) => api.get(`/trading/exchanges/positions${exchange ? `?exchange=${exchange}` : ''}`),
};

export const portfolioApi = {
  list: () => api.get('/portfolios'),
  get: (id: string) => api.get(`/portfolios/${id}`),
  create: (dto: any) => api.post('/portfolios', dto),
  positions: (id: string) => api.get(`/portfolios/${id}/positions`),
  performance: (id: string) => api.get(`/portfolios/${id}/performance`),
};

export const marketApi = {
  quotes: () => api.get('/markets'),
  movers: () => api.get('/markets/movers'),
  quote: (s: string) => api.get(`/markets/${s}`),
  candles: (s: string, i = '1h') => api.get(`/markets/${s}/candles?interval=${i}`),
  search: (q: string) => api.get(`/markets/search?q=${q}`),
};

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  trades: () => api.get('/analytics/trades'),
  risk: () => api.get('/analytics/risk'),
};

export const userApi = {
  profile: () => api.get('/users/profile'),
  updateProfile: (dto: any) => api.put('/users/profile', dto),
  getApiKeys: () => api.get('/users/api-keys'),
  addApiKey: (dto: any) => api.post('/users/api-keys', dto),
  removeApiKey: (exchange: string) => api.delete(`/users/api-keys/${exchange}`),
  testExchanges: () => api.post('/users/api-keys/test'),
  exchangeBalances: () => api.get('/users/exchange/balances'),
  exchangePositions: () => api.get('/users/exchange/positions'),
};
