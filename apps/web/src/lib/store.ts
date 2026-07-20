// TradeOS Zustand Store — Global state management
import { create } from 'zustand';

// Idle timeout must match the backend (30 minutes)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

interface AppState {
  // Auth
  user: any | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Trading
  testnet: boolean;
  selectedPortfolio: string | null;

  // Markets
  tickers: Record<string, any>;
  selectedSymbol: string;
  selectedExchange: string;
  candleInterval: string;

  // UI
  sidebarOpen: boolean;
  notificationsOpen: boolean;
  unreadCount: number;

  // Actions
  setUser: (user: any) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setAuth: (user: any, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  restoreSession: () => void;
  setTestnet: (testnet: boolean) => void;
  setSelectedPortfolio: (id: string) => void;
  setTicker: (symbol: string, data: any) => void;
  setSelectedSymbol: (symbol: string) => void;
  setSelectedExchange: (exchange: string) => void;
  setCandleInterval: (interval: string) => void;
  toggleSidebar: () => void;
  toggleNotifications: () => void;
  setUnreadCount: (count: number) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,

  testnet: true,
  selectedPortfolio: null,

  tickers: {},
  selectedSymbol: 'BTC',
  selectedExchange: 'binance',
  candleInterval: '1m',

  sidebarOpen: true,
  notificationsOpen: false,
  unreadCount: 0,

  setUser: (user) => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem('tradeos_user', JSON.stringify(user));
    }
    set({ user, isAuthenticated: !!user });
  },

  setToken: (token) => {
    if (token && typeof window !== 'undefined') localStorage.setItem('tradeos_token', token);
    else if (typeof window !== 'undefined') localStorage.removeItem('tradeos_token');
    set({ token });
  },

  setRefreshToken: (token) => {
    if (token && typeof window !== 'undefined') localStorage.setItem('tradeos_refresh_token', token);
    else if (typeof window !== 'undefined') localStorage.removeItem('tradeos_refresh_token');
    set({ refreshToken: token });
  },

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tradeos_token', accessToken);
      localStorage.setItem('tradeos_refresh_token', refreshToken);
      localStorage.setItem('tradeos_user', JSON.stringify(user));
      localStorage.setItem('tradeos_last_activity', Date.now().toString());
    }
    set({ user, token: accessToken, refreshToken, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tradeos_token');
      localStorage.removeItem('tradeos_refresh_token');
      localStorage.removeItem('tradeos_user');
      localStorage.removeItem('tradeos_last_activity');
    }
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },

  // Restore session from localStorage on page load
  // Checks idle timeout — if user has been away for >30 min, force re-login
  restoreSession: () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('tradeos_token');
    const refreshToken = localStorage.getItem('tradeos_refresh_token');
    const userStr = localStorage.getItem('tradeos_user');
    const lastActivity = localStorage.getItem('tradeos_last_activity');

    if (!token || !userStr) return;

    // Check idle timeout — if user was inactive for >30 min, clear session
    if (lastActivity) {
      const idleMs = Date.now() - parseInt(lastActivity, 10);
      if (idleMs > IDLE_TIMEOUT_MS) {
        // Session expired — clear everything
        localStorage.removeItem('tradeos_token');
        localStorage.removeItem('tradeos_refresh_token');
        localStorage.removeItem('tradeos_user');
        localStorage.removeItem('tradeos_last_activity');
        // Redirect to login with session_expired reason
        window.location.href = '/?reason=session_expired';
        return;
      }
    }

    try {
      const user = JSON.parse(userStr);
      set({ user, token, refreshToken, isAuthenticated: true });
      // Update activity timestamp on restore
      localStorage.setItem('tradeos_last_activity', Date.now().toString());
    } catch {
      localStorage.removeItem('tradeos_user');
    }
  },

  setTestnet: (testnet) => set({ testnet }),
  setSelectedPortfolio: (id) => set({ selectedPortfolio: id }),
  setTicker: (symbol, data) => set((state) => ({ tickers: { ...state.tickers, [symbol]: data } })),
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setSelectedExchange: (exchange) => set({ selectedExchange: exchange }),
  setCandleInterval: (interval) => set({ candleInterval: interval }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen })),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));

// Compat aliases
export const useAuthStore = useStore;
