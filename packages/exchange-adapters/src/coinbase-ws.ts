// TradeOS — Coinbase Advanced WebSocket Stream
// Real-time price, candlestick, and ticker data from Coinbase

import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface CoinbaseTicker {
  product_id: string;
  price: number;
  volume_24h: number;
  low_24h: number;
  high_24h: number;
  open_24h: number;
  best_bid: number;
  best_ask: number;
  timestamp: string;
}

export interface CoinbaseCandle {
  product_id: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  start: number;
  timestamp: number;
}

export class CoinbaseWS extends EventEmitter {
  private ws: WebSocket | null = null;
  private url = 'wss://ws-feed.exchange.coinbase.com';
  private productIds: string[] = [];
  private channels: string[] = ['ticker', 'matches', 'heartbeat'];
  private reconnectAttempts = 0;
  private maxReconnects = 10;
  private isTestnet: boolean;

  constructor(isTestnet = true) {
    super();
    this.isTestnet = isTestnet;
    if (isTestnet) {
      this.url = 'wss://ws-feed-public.sandbox.exchange.coinbase.com';
    }
  }

  // ============ CONNECTION ============

  connect(productIds: string[], channels: string[] = this.channels): void {
    this.productIds = productIds;
    this.channels = channels;

    console.log(`🔌 Connecting to Coinbase WebSocket (${this.isTestnet ? 'sandbox' : 'production'})...`);

    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.log(`✅ Coinbase WS connected — watching ${productIds.length} products`);
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Subscribe to channels
      this.ws?.send(JSON.stringify({
        type: 'subscribe',
        product_ids: productIds,
        channels: channels,
      }));
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString());
        this.handleMessage(msg);
      } catch (e) {
        console.error('Coinbase parse error:', e);
      }
    });

    this.ws.on('error', (err: Error) => {
      console.error('❌ Coinbase WS error:', err.message);
      this.emit('error', err);
    });

    this.ws.on('close', () => {
      console.log('⚠️ Coinbase WS disconnected');
      this.attemptReconnect();
    });
  }

  private handleMessage(msg: any): void {
    switch (msg.type) {
      case 'ticker':
        this.emit('ticker', {
          product_id: msg.product_id,
          price: parseFloat(msg.price),
          volume_24h: parseFloat(msg.volume_24h),
          low_24h: parseFloat(msg.low_24h),
          high_24h: parseFloat(msg.high_24h),
          open_24h: parseFloat(msg.open_24h),
          best_bid: parseFloat(msg.best_bid),
          best_ask: parseFloat(msg.best_ask),
          timestamp: msg.time,
        } as CoinbaseTicker);
        break;

      case 'match':
      case 'last_match':
        this.emit('trade', {
          product_id: msg.product_id,
          price: parseFloat(msg.price),
          size: parseFloat(msg.size),
          side: msg.side,
          timestamp: msg.time,
          trade_id: msg.trade_id,
        });
        break;

      case 'heartbeat':
        // Keepalive
        break;

      case 'subscriptions':
        console.log(`📡 Coinbase subscriptions confirmed: ${msg.channels?.length || 0} channels`);
        break;

      case 'error':
        console.error('Coinbase error:', msg.message);
        this.emit('error', new Error(msg.message));
        break;
    }
  }

  // ============ RECONNECTION ============

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnects) {
      console.error(`❌ Coinbase max reconnections reached`);
      this.emit('maxReconnectsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    setTimeout(() => {
      this.connect(this.productIds, this.channels);
    }, delay);
  }

  // ============ MANAGEMENT ============

  subscribe(productIds: string[], channels: string[]): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        product_ids: productIds,
        channels: channels,
      }));
      this.productIds = [...new Set([...this.productIds, ...productIds])];
    }
  }

  unsubscribe(productIds: string[], channels: string[]): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        product_ids: productIds,
        channels: channels,
      }));
      this.productIds = this.productIds.filter((p) => !productIds.includes(p));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        product_ids: this.productIds,
        channels: this.channels,
      }));
      this.ws.close();
      this.ws = null;
    }
    console.log('🔌 Coinbase WS disconnected');
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
