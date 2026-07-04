// TradeOS — Shared Utilities
// Common types, helpers, formatters, and constants used across the platform

// ============ FORMATTERS ============

export const formatters = {
  currency: (value: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  },

  crypto: (value: number, symbol = 'BTC'): string => {
    return `${value.toFixed(8)} ${symbol}`;
  },

  percentage: (value: number, decimals = 2): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
  },

  number: (value: number, decimals = 0): string => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  },

  compact: (value: number): string => {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  },

  date: (timestamp: number | string | Date): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  datetime: (timestamp: number | string | Date): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  timeAgo: (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  },

  duration: (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  },
};

// ============ VALIDATORS ============

export const validators = {
  email: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

  symbol: (symbol: string): boolean => /^[A-Z]{1,10}$/.test(symbol),

  apiKey: (key: string): boolean => key.length >= 16 && /^[a-zA-Z0-9_-]+$/.test(key),

  walletAddress: (addr: string): boolean => /^0x[a-fA-F0-9]{40}$/.test(addr),

  quantity: (qty: number): boolean => qty > 0 && qty < 1000000,

  price: (price: number): boolean => price > 0 && price < 100000000,
};

// ============ CONSTANTS ============

export const CONSTANTS = {
  EXCHANGES: {
    BINANCE: { name: 'Binance', fee: 0.001, minOrder: 10, assetType: 'Crypto' },
    BINANCE_FUTURES: { name: 'Binance Futures', fee: 0.0004, minOrder: 10, assetType: 'Crypto Futures' },
    COINBASE: { name: 'Coinbase', fee: 0.006, minOrder: 1, assetType: 'Crypto' },
    ALPACA: { name: 'Alpaca', fee: 0.0, minOrder: 1, assetType: 'US Stocks' },
    OANDA: { name: 'OANDA', fee: 0.0001, minOrder: 1, assetType: 'Forex/CFD' },
  },
  TIMEFRAMES: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'],
  ORDER_TYPES: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'TRAILING_STOP'],
  ORDER_SIDES: ['BUY', 'SELL'],
  TIME_IN_FORCE: ['GTC', 'IOC', 'FOK', 'GTD'],
  RISK_LEVELS: ['LOW', 'MEDIUM', 'HIGH'],
  DEFAULT_RISK: {
    MAX_POSITION_SIZE: 50000,
    MAX_PORTFOLIO_EXPOSURE: 0.80,
    MAX_SINGLE_TRADE_RISK: 0.02,
    MAX_DAILY_LOSS: 5000,
    MAX_OPEN_POSITIONS: 20,
  },
};

// ============ UTILITIES ============

export const utils = {
  // Unique ID generator
  generateId: (prefix = ''): string => `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,

  // Sleep/delay
  sleep: (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms)),

  // Retry with exponential backoff
  retry: async <T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (i === maxRetries - 1) throw error;
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Retry failed');
  },

  // Rate limiter
  rateLimiter: (maxRequests: number, windowMs: number) => {
    const requests: number[] = [];
    return {
      canMakeRequest: (): boolean => {
        const now = Date.now();
        while (requests.length > 0 && requests[0] < now - windowMs) requests.shift();
        if (requests.length < maxRequests) { requests.push(now); return true; }
        return false;
      },
      getRemaining: (): number => Math.max(0, maxRequests - requests.length),
    };
  },

  // Calculate position size based on risk
  calculatePositionSize: (accountSize: number, riskPercent: number, entryPrice: number, stopLoss: number): number => {
    const riskAmount = accountSize * (riskPercent / 100);
    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    if (riskPerUnit === 0) return 0;
    return riskAmount / riskPerUnit;
  },

  // Calculate P&L
  calculatePnL: (entry: number, exit: number, qty: number, side: 'LONG' | 'SHORT' | 'BUY' | 'SELL'): number => {
    const isLong = side === 'LONG' || side === 'BUY';
    return isLong ? (exit - entry) * qty : (entry - exit) * qty;
  },

  // Calculate percentage change
  calculatePercentChange: (oldValue: number, newValue: number): number => {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  },

  // Clamp value
  clamp: (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value)),

  // Deep clone
  deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),

  // Debounce
  debounce: <T extends (...args: any[]) => void>(fn: T, delay: number): ((...args: Parameters<T>) => void) => {
    let timer: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // Throttle
  throttle: <T extends (...args: any[]) => void>(fn: T, limit: number): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
      if (!inThrottle) { fn(...args); inThrottle = true; setTimeout(() => (inThrottle = false), limit); }
    };
  },
};

// ============ ERROR TYPES ============

export class TradingError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'TradingError';
  }
}

export class ExchangeError extends Error {
  constructor(message: string, public exchange: string, public code: string) {
    super(message);
    this.name = 'ExchangeError';
  }
}

export class RiskError extends Error {
  constructor(message: string, public violations: string[]) {
    super(message);
    this.name = 'RiskError';
  }
}
