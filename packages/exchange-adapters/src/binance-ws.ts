// Binance WebSocket Stream — Real-time prices, klines, order book, and user data
import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import { PriceUpdate, KlineUpdate, OrderUpdate, AccountUpdate } from './websocket';

export class BinanceStream extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions: Set<string> = new Set();
  private isTestnet: boolean;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: any = null;

  constructor(isTestnet: boolean = false) {
    super();
    this.isTestnet = isTestnet;
    this.url = isTestnet
      ? 'wss://stream.binancefuture.com/ws'
      : 'wss://stream.binance.com:9443/ws';
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect(): void {
    if (this.isConnected()) return;
    console.log(`🔌 Connecting to Binance WebSocket (${this.isTestnet ? 'testnet' : 'live'})...`);
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.log('✅ Binance WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', { exchange: 'binance' });
      for (const sub of this.subscriptions) { this.sendSubscription(sub); }
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString());
        this.handleMessage(msg);
      } catch (e) { console.error('Binance WS parse error:', e); }
    });

    this.ws.on('close', () => {
      console.log('⚠️ Binance WebSocket disconnected');
      this.emit('disconnected', { exchange: 'binance' });
      this.attemptReconnect();
    });

    this.ws.on('error', (err) => {
      console.error('❌ Binance WebSocket error:', err.message);
      this.emit('error', { exchange: 'binance', error: err.message });
      this.attemptReconnect();
    });
  }

  // ============ SUBSCRIPTIONS ============

  subscribeTicker(symbol: string): void {
    const stream = `${symbol.toLowerCase()}@ticker`;
    this.subscriptions.add(stream);
    this.sendSubscription(stream);
  }

  subscribeTickers(symbols: string[]): void {
    for (const s of symbols) this.subscribeTicker(s);
  }

  subscribeKline(symbol: string, interval: string = '1m'): void {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    this.subscriptions.add(stream);
    this.sendSubscription(stream);
  }

  subscribeDepth(symbol: string, level: string = '20'): void {
    const stream = `${symbol.toLowerCase()}@depth${level}@100ms`;
    this.subscriptions.add(stream);
    this.sendSubscription(stream);
  }

  subscribeUserData(listenKey: string): void {
    this.subscriptions.add(listenKey);
    this.sendSubscription(listenKey);
  }

  unsubscribe(stream: string): void {
    this.subscriptions.delete(stream);
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({ method: 'UNSUBSCRIBE', params: [stream], id: Date.now() }));
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.subscriptions.clear();
    if (this.ws) { this.ws.close(); this.ws = null; }
  }

  // ============ LISTEN KEY ============

  async getListenKey(apiKey: string): Promise<string> {
    const axios = require('axios').default;
    const url = this.isTestnet
      ? 'https://testnet.binancefuture.com/fapi/v1/listenKey'
      : 'https://fapi.binance.com/fapi/v1/listenKey';
    const response = await axios.post(url, null, { headers: { 'X-MBX-APIKEY': apiKey } });
    return response.data.listenKey;
  }

  // ============ INTERNAL ============

  private sendSubscription(stream: string): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({ method: 'SUBSCRIBE', params: [stream], id: Date.now() }));
    }
  }

  private handleMessage(msg: any): void {
    // 24hr Ticker
    if (msg.e === '24hrTicker') {
      this.emit('price', {
        symbol: msg.s, exchange: 'binance',
        price: parseFloat(msg.c), bid: parseFloat(msg.b), ask: parseFloat(msg.a),
        volume: parseFloat(msg.v), changePct: parseFloat(msg.P) / 100, timestamp: msg.E,
      } as PriceUpdate);
    }

    // Kline
    if (msg.e === 'kline') {
      const k = msg.k;
      this.emit('kline', {
        symbol: msg.s, exchange: 'binance', interval: k.i,
        open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l),
        close: parseFloat(k.c), volume: parseFloat(k.v), isClosed: k.x, timestamp: k.t,
      } as KlineUpdate);
    }

    // Order update (user data stream)
    if (msg.e === 'ORDER_TRADE_UPDATE') {
      const o = msg.o;
      this.emit('order', {
        exchange: 'binance', orderId: o.i.toString(), status: o.X,
        symbol: o.s, side: o.S, type: o.o,
        quantity: parseFloat(o.q), filledQuantity: parseFloat(o.z),
        avgPrice: parseFloat(o.ap), timestamp: o.T,
      } as OrderUpdate);
    }

    // Account update (user data stream)
    if (msg.e === 'ACCOUNT_UPDATE') {
      const a = msg.a;
      this.emit('account', {
        exchange: 'binance',
        balances: (a.B || []).map((b: any) => ({ asset: b.a, free: parseFloat(b.f), locked: parseFloat(b.l) })),
        reason: a.m || 'ACCOUNT_UPDATE', timestamp: msg.E,
      } as AccountUpdate);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Binance WS: Max reconnection attempts reached`);
      this.emit('error', { exchange: 'binance', error: 'Max reconnection attempts reached' });
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`🔄 Binance WS: Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})...`);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}

export { BinanceStream };
