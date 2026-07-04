// TradeOS WebSocket Manager — Real-time price streaming from multiple exchanges
import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import { BinanceStream } from './binance-ws';
import { CoinbaseStream } from './coinbase-ws';

export interface PriceUpdate {
  symbol: string;
  exchange: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  changePct: number;
  timestamp: number;
}

export interface KlineUpdate {
  symbol: string;
  exchange: string;
  interval: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
  timestamp: number;
}

export interface OrderBookUpdate {
  exchange: string;
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
}

export interface OrderUpdate {
  exchange: string;
  orderId: string;
  status: string;
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  filledQuantity: number;
  avgPrice: number;
  timestamp: number;
}

export interface AccountUpdate {
  exchange: string;
  balances: { asset: string; free: number; locked: number }[];
  reason: string;
  timestamp: number;
}

export type StreamEvent = 'price' | 'kline' | 'orderbook' | 'order' | 'account' | 'connected' | 'disconnected' | 'error';

// ============ UNIFIED STREAM MANAGER ============

export class StreamManager extends EventEmitter {
  private binance: BinanceStream | null = null;
  private coinbase: CoinbaseStream | null = null;
  private priceCache: Map<string, PriceUpdate> = new Map();
  private orderBookCache: Map<string, OrderBookUpdate> = new Map();
  private isTestnet: boolean;
  private active = false;

  constructor(isTestnet: boolean = false) {
    super();
    this.isTestnet = isTestnet;
  }

  start(): void {
    if (this.active) return;
    this.active = true;

    // Start Binance stream
    this.binance = new BinanceStream(this.isTestnet);
    this.setupStreamHandlers('binance', this.binance);
    this.binance.connect();

    // Start Coinbase stream
    this.coinbase = new CoinbaseStream(this.isTestnet);
    this.setupStreamHandlers('coinbase', this.coinbase);
    this.coinbase.connect();

    console.log('📡 TradeOS Stream Manager started (Binance + Coinbase)');
  }

  private setupStreamHandlers(exchange: string, stream: any): void {
    stream.on('price', (update: PriceUpdate) => {
      this.priceCache.set(update.symbol, update);
      this.emit('price', update);
    });

    stream.on('kline', (update: KlineUpdate) => {
      this.emit('kline', update);
    });

    stream.on('orderbook', (update: OrderBookUpdate) => {
      this.orderBookCache.set(update.symbol, update);
      this.emit('orderbook', update);
    });

    stream.on('order', (update: OrderUpdate) => {
      this.emit('order', update);
    });

    stream.on('account', (update: AccountUpdate) => {
      this.emit('account', update);
    });

    stream.on('connected', (info: any) => this.emit('connected', info));
    stream.on('disconnected', (info: any) => this.emit('disconnected', info));
    stream.on('error', (err: any) => this.emit('error', err));
  }

  // ============ SUBSCRIPTION API ============

  subscribePrices(symbols: string[], exchange: string = 'binance'): void {
    if (exchange === 'binance' && this.binance) {
      this.binance.subscribeTickers(symbols);
    } else if (exchange === 'coinbase' && this.coinbase) {
      // Convert to Coinbase product IDs (BTC -> BTC-USD)
      const productIds = symbols.map(s => this.toProductId(s));
      this.coinbase.subscribeTicker(productIds);
    }
  }

  subscribeAllPrices(symbols: string[]): void {
    // Subscribe on both exchanges for redundancy
    if (this.binance) this.binance.subscribeTickers(symbols);
    if (this.coinbase) {
      const productIds = symbols.map(s => this.toProductId(s));
      this.coinbase.subscribeTicker(productIds);
    }
  }

  subscribeCandles(symbol: string, interval: string = '1m', exchange: string = 'binance'): void {
    if (exchange === 'binance' && this.binance) {
      this.binance.subscribeKline(symbol, interval);
    }
  }

  subscribeOrderBook(symbol: string, exchange: string = 'binance'): void {
    if (exchange === 'binance' && this.binance) {
      this.binance.subscribeDepth(symbol);
    } else if (exchange === 'coinbase' && this.coinbase) {
      const productId = this.toProductId(symbol);
      this.coinbase.subscribeLevel2([productId]);
    }
  }

  subscribeUserData(listenKey: string, exchange: string = 'binance'): void {
    if (exchange === 'binance' && this.binance) {
      this.binance.subscribeUserData(listenKey);
    }
  }

  // ============ CACHE API ============

  getCachedPrice(symbol: string): PriceUpdate | null {
    return this.priceCache.get(symbol) || null;
  }

  getAllCachedPrices(): PriceUpdate[] {
    return Array.from(this.priceCache.values());
  }

  getCachedOrderBook(symbol: string): OrderBookUpdate | null {
    return this.orderBookCache.get(symbol) || null;
  }

  // ============ STATUS ============

  getStatus(): Record<string, boolean> {
    return {
      binance: this.binance?.isConnected() || false,
      coinbase: this.coinbase?.isConnected() || false,
    };
  }

  getActiveExchanges(): string[] {
    const active: string[] = [];
    if (this.binance?.isConnected()) active.push('binance');
    if (this.coinbase?.isConnected()) active.push('coinbase');
    return active;
  }

  // ============ LIFECYCLE ============

  stop(): void {
    this.active = false;
    if (this.binance) { this.binance.disconnect(); this.binance = null; }
    if (this.coinbase) { this.coinbase.disconnect(); this.coinbase = null; }
    this.priceCache.clear();
    this.orderBookCache.clear();
    this.removeAllListeners();
    console.log('📡 TradeOS Stream Manager stopped');
  }

  private toProductId(symbol: string): string {
    // BTC -> BTC-USD, ETH -> ETH-USD
    if (symbol.includes('-')) return symbol;
    if (symbol.endsWith('USDT')) return symbol.replace('USDT', '-USDT');
    return `${symbol}-USD`;
  }
}

export { BinanceStream, CoinbaseStream, StreamManager };
