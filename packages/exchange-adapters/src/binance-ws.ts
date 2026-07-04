// TradeOS — Binance WebSocket Stream
// Real-time price, candlestick, and order book data from Binance

import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface Ticker {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: number;
}

export interface OrderBook {
  symbol: string;
  bids: [number, number][]; // [price, quantity]
  asks: [number, number][];
  timestamp: number;
}

export class BinanceWS extends EventEmitter {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private streams: string[] = [];
  private reconnectAttempts = 0;
  private maxReconnects = 10;
  private isTestnet: boolean;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(isTestnet = true) {
    super();
    this.isTestnet = isTestnet;
    this.baseUrl = isTestnet
      ? 'wss://stream.testnet.binance.vision/stream'
      : 'wss://stream.binance.com:9443/stream';
  }

  // ============ STREAM MANAGEMENT ============

  connect(symbols: string[], streamTypes: string[] = ['ticker', 'kline_1m']): void {
    this.streams = [];
    for (const symbol of symbols) {
      for (const type of streamTypes) {
        if (type === 'ticker') this.streams.push(`${symbol.toLowerCase()}@ticker`);
        if (type === 'kline_1m') this.streams.push(`${symbol.toLowerCase()}@kline_1m`);
        if (type === 'kline_5m') this.streams.push(`${symbol.toLowerCase()}@kline_5m`);
        if (type === 'kline_15m') this.streams.push(`${symbol.toLowerCase()}@kline_15m`);
        if (type === 'kline_1h') this.streams.push(`${symbol.toLowerCase()}@kline_1h`);
        if (type === 'depth') this.streams.push(`${symbol.toLowerCase()}@depth20@100ms`);
        if (type === 'trade') this.streams.push(`${symbol.toLowerCase()}@trade`);
      }
    }

    const url = `${this.baseUrl}?streams=${this.streams.join('/')}`;
    this.createConnection(url);
  }

  private createConnection(url: string): void {
    console.log(`🔌 Connecting to Binance WebSocket (${this.isTestnet ? 'testnet' : 'mainnet'})...`);

    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log(`✅ Binance WS connected — ${this.streams.length} streams active`);
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Keepalive ping
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.ping();
        }
      }, 30000);
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString());
        this.handleMessage(msg);
      } catch (e) {
        console.error('Parse error:', e);
      }
    });

    this.ws.on('error', (err: Error) => {
      console.error('❌ Binance WS error:', err.message);
      this.emit('error', err);
    });

    this.ws.on('close', () => {
      console.log('⚠️ Binance WS disconnected');
      this.cleanup();
      this.attemptReconnect();
    });
  }

  private handleMessage(msg: any): void {
    if (!msg.stream || !msg.data) return;

    const stream = msg.stream as string;
    const data = msg.data;

    // Ticker data
    if (stream.includes('@ticker')) {
      const ticker: Ticker = {
        symbol: data.s,
        price: parseFloat(data.c),
        priceChange: parseFloat(data.p),
        priceChangePercent: parseFloat(data.P),
        volume: parseFloat(data.v),
        high: parseFloat(data.h),
        low: parseFloat(data.l),
        timestamp: data.E,
      };
      this.emit('ticker', ticker);
    }

    // Candlestick data
    if (stream.includes('@kline')) {
      const kline = data.k;
      const candle: Candle = {
        openTime: kline.t,
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c),
        volume: parseFloat(kline.v),
        closeTime: kline.T,
      };
      this.emit('candle', { symbol: data.s, candle, isClosed: kline.x });
    }

    // Order book depth
    if (stream.includes('@depth')) {
      const orderBook: OrderBook = {
        symbol: data.s || stream.split('@')[0].toUpperCase(),
        bids: (data.bids || data.b || []).map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])] as [number, number]),
        asks: (data.asks || data.a || []).map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])] as [number, number]),
        timestamp: Date.now(),
      };
      this.emit('orderbook', orderBook);
    }

    // Trade data
    if (stream.includes('@trade')) {
      this.emit('trade', {
        symbol: data.s,
        price: parseFloat(data.p),
        quantity: parseFloat(data.q),
        timestamp: data.T,
        isBuyerMaker: data.m,
      });
    }
  }

  // ============ RECONNECTION ============

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnects) {
      console.error(`❌ Max reconnection attempts (${this.maxReconnects}) reached. Giving up.`);
      this.emit('maxReconnectsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff
    console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnects})...`);

    setTimeout(() => {
      const url = `${this.baseUrl}?streams=${this.streams.join('/')}`;
      this.createConnection(url);
    }, delay);
  }

  // ============ SUBSCRIPTION MANAGEMENT ============

  subscribe(symbols: string[], streamTypes: string[]): void {
    const newStreams = [];
    for (const symbol of symbols) {
      for (const type of streamTypes) {
        const streamName = `${symbol.toLowerCase()}@${type}`;
        if (!this.streams.includes(streamName)) {
          newStreams.push(streamName);
          this.streams.push(streamName);
        }
      }
    }

    if (this.ws?.readyState === WebSocket.OPEN && newStreams.length > 0) {
      this.ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: newStreams,
        id: Date.now(),
      }));
      console.log(`📡 Subscribed to ${newStreams.length} new streams`);
    }
  }

  unsubscribe(symbols: string[], streamTypes: string[]): void {
    const removeStreams = [];
    for (const symbol of symbols) {
      for (const type of streamTypes) {
        const streamName = `${symbol.toLowerCase()}@${type}`;
        if (this.streams.includes(streamName)) {
          removeStreams.push(streamName);
        }
      }
    }

    if (this.ws?.readyState === WebSocket.OPEN && removeStreams.length > 0) {
      this.ws.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: removeStreams,
        id: Date.now(),
      }));
      this.streams = this.streams.filter((s) => !removeStreams.includes(s));
      console.log(`📡 Unsubscribed from ${removeStreams.length} streams`);
    }
  }

  // ============ CLEANUP ============

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log('🔌 Binance WS disconnected');
  }

  getStreamCount(): number {
    return this.streams.length;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
