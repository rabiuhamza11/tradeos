// TradeOS Exchange Adapters — Unified interface for multiple exchanges

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string; // Coinbase Pro uses this
}

export interface Ticker {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  changePct24h: number;
  timestamp: number;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'DAY';
  clientOrderId?: string;
}

export interface OrderResponse {
  exchangeOrderId: string;
  status: 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED';
  filledQuantity: number;
  avgFillPrice: number;
  fees: number;
  createdAt: number;
  raw?: any;
}

export interface AccountBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
  usdValue?: number;
}

export interface PositionInfo {
  symbol: string;
  quantity: number;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
}

// ============ ABSTRACT EXCHANGE ADAPTER ============

export abstract class ExchangeAdapter {
  abstract readonly exchange: string;
  abstract readonly displayName: string;
  protected credentials: ExchangeCredentials;
  protected isTestnet: boolean;

  constructor(credentials: ExchangeCredentials, isTestnet: boolean = false) {
    this.credentials = credentials;
    this.isTestnet = isTestnet;
  }

  // Market Data (public — no auth needed for most exchanges)
  abstract getTicker(symbol: string): Promise<Ticker>;
  abstract getTickers(symbols?: string[]): Promise<Ticker[]>;
  abstract getCandles(symbol: string, interval: string, limit?: number): Promise<Candle[]>;
  abstract getOrderBook(symbol: string, depth?: number): Promise<{ bids: [number, number][]; asks: [number, number][] }>;

  // Trading (requires auth)
  abstract placeOrder(order: OrderRequest): Promise<OrderResponse>;
  abstract cancelOrder(orderId: string, symbol: string): Promise<boolean>;
  abstract getOrderStatus(orderId: string, symbol: string): Promise<OrderResponse>;
  abstract getOpenOrders(symbol?: string): Promise<OrderResponse[]>;
  abstract getOrderHistory(symbol?: string, limit?: number): Promise<OrderResponse[]>;

  // Account (requires auth)
  abstract getBalances(): Promise<AccountBalance[]>;
  abstract getPositions(): Promise<PositionInfo[]>;

  // Utility
  protected log(msg: string): string { return `[${this.exchange}] ${msg}`; }
  abstract testConnection(): Promise<boolean>;
}
