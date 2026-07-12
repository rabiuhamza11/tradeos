// TradeOS Zustand Store — Global state management
import { create } from 'zustand';

interface AppState {
  // Auth
  user: any | null;
  token: string | null;
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
  logout: () => void;
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
  token: typeof window !== 'undefined' ? localStorage.getItem('tradeos_token') : null,
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

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token && typeof window !== 'undefined') localStorage.setItem('tradeos_token', token);
    else if (typeof window !== 'undefined') localStorage.removeItem('tradeos_token');
    set({ token });
  },
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('tradeos_token');
    set({ user: null, token: null, isAuthenticated: false });
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
