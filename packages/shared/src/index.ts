// TradeOS Shared — Common types, utilities, constants
export const TRADEOS_VERSION = '1.0.0';
export const SUPPORTED_EXCHANGES = ['binance', 'coinbase', 'kraken', 'alpaca', 'interactive_brokers', 'oanda'];
export const SUPPORTED_ASSETS = ['STOCK', 'CRYPTO', 'FOREX', 'COMMODITY', 'ETF', 'BOND', 'OPTION', 'FUTURE'];

export interface PaginatedResponse<T> { data: T[]; pagination: { page: number; limit: number; total: number; pages: number; }; }
export interface ApiResponse<T> { success: boolean; data?: T; error?: string; message?: string; }

export function paginate<T>(items: T[], page: number, limit: number): PaginatedResponse<T> {
  const start = (page - 1) * limit;
  return { data: items.slice(start, start + limit), pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) } };
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatPct(value: number): string {
  return `${value > 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
}

export function uuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
}

export class Logger {
  static info(msg: string) { console.log(`[INFO] ${msg}`); }
  static warn(msg: string) { console.warn(`[WARN] ${msg}`); }
  static error(msg: string) { console.error(`[ERROR] ${msg}`); }
  static debug(msg: string) { if (process.env.DEBUG) console.log(`[DEBUG] ${msg}`); }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
