// Coinbase WebSocket Stream — Real-time prices and order book from Coinbase Advanced Trade
import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import { PriceUpdate, KlineUpdate, OrderUpdate } from './websocket';

export class CoinbaseStream extends EventEmitter {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private subscriptions: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: any = null;
  private isTestnet: boolean;

  constructor(isTestnet: boolean = false) {
    super();
    this.isTestnet = isTestnet;
    // Coinbase Advanced Trade WebSocket
    this.wsUrl = isTestnet
      ? 'wss://advanced-trade-ws-sandbox.coinbase.com'
      : 'wss://advanced-trade-ws.coinbase.com';
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    console.log(`🔌 Connecting to Coinbase WebSocket (${this.isTestnet ? 'sandbox' : 'live'})...`);
    this.ws = new WebSocket(this.wsUrl);

    this.ws.on('open', () => {
      console.log('✅ Coinbase WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', { exchange: 'coinbase' });
      // Resubscribe to all streams
      for (const sub of this.subscriptions) {
        this.sendSubscription(sub);
      }
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString());
        this.handleMessage(msg);
      } catch (e) {
        console.error('Coinbase WS parse error:', e);
      }
    });

    this.ws.on('close', () => {
      console.log('⚠️ Coinbase WebSocket disconnected');
      this.emit('disconnected', { exchange: 'coinbase' });
      this.attemptReconnect();
    });

    this.ws.on('error', (err) => {
      console.error('❌ Coinbase WebSocket error:', err.message);
      this.emit('error', { exchange: 'coinbase', error: err.message });
      this.attemptReconnect();
    });
  }

  // ============ SUBSCRIPTIONS ============

  // Subscribe to real-time ticker updates
  subscribeTicker(productIds: string[]): void {
    const sub = JSON.stringify({ type: 'ticker', product_ids: productIds });
    this.subscriptions.add(sub);
    this.sendSubscription(sub);
  }

  // Subscribe to level 2 order book updates
  subscribeLevel2(productIds: string[]): void {
    const sub = JSON.stringify({ type: 'level2_batched', product_ids: productIds });
    this.subscriptions.add(sub);
    this.sendSubscription(sub);
  }

  // Subscribe to candle/market updates
  subscribeCandles(productIds: string[], interval: string = '1m'): void {
    // Coinbase doesn't have a direct kline WS channel — use ticker batch
    const sub = JSON.stringify({ type: 'market_batched', product_ids: productIds });
    this.subscriptions.add(sub);
    this.sendSubscription(sub);
  }

  // Subscribe to user order updates (requires JWT auth)
  subscribeUserOrders(jwtToken: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'subscribe',
      channel: 'user',
      jwt: jwtToken,
    }));
  }

  unsubscribe(productIds: string[], channel: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'unsubscribe',
      channel,
      product_ids: productIds,
    }));
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.subscriptions.clear();
    if (this.ws) { this.ws.close(); this.ws = null; }
  }

  // ============ INTERNAL ============

  private sendSubscription(subStr: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      const sub = JSON.parse(subStr);
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel: sub.type,
        product_ids: sub.product_ids,
      }));
    } catch {}
  }

  private handleMessage(msg: any): void {
    // Coinbase Advanced Trade WS message format:
    // { channel: 'ticker', events: [{ type: 'update', tickers: [{...}] }] }

    if (msg.channel === 'ticker') {
      for (const event of (msg.events || [])) {
        const tickers = event.tickers || [];
        for (const t of tickers) {
          const update: PriceUpdate = {
            symbol: t.product_id,
            exchange: 'coinbase',
            price: parseFloat(t.price),
            bid: parseFloat(t.best_bid || t.price * 0.999),
            ask: parseFloat(t.best_ask || t.price * 1.001),
            volume: parseFloat(t.volume_24h || '0'),
            changePct: 0, // Coinbase ticker doesn't include 24h change directly
            timestamp: Date.now(),
          };
          this.emit('price', update);
        }
      }
    }

    if (msg.channel === 'level2_batched') {
      for (const event of (msg.events || [])) {
        // Emit order book updates
        this.emit('orderbook', {
          exchange: 'coinbase',
          symbol: event.product_id,
          bids: (event.updates || []).filter((u: any) => u.side === 'bid').map((u: any) => [parseFloat(u.price_level), parseFloat(u.new_quantity]) as [number, number]),
          asks: (event.updates || []).filter((u: any) => u.side === 'offer').map((u: any) => [parseFloat(u.price_level), parseFloat(u.new_quantity]) as [number, number]),
          timestamp: Date.now(),
        });
      }
    }

    if (msg.channel === 'user') {
      for (const event of (msg.events || [])) {
        if (event.type === 'order') {
          const o = event.order;
          const update: OrderUpdate = {
            exchange: 'coinbase',
            orderId: o.order_id,
            status: o.status,
            symbol: o.product_id,
            side: o.side?.toUpperCase() || 'BUY',
            type: o.order_type || 'MARKET',
            quantity: parseFloat(o.size || '0'),
            filledQuantity: parseFloat(o.completed_size || '0'),
            avgPrice: parseFloat(o.average_price || '0'),
            timestamp: Date.now(),
          };
          this.emit('order', update);
        }
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Coinbase WS: Max reconnection attempts reached`);
      this.emit('error', { exchange: 'coinbase', error: 'Max reconnection attempts reached' });
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`🔄 Coinbase WS: Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})...`);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}

export { CoinbaseStream };
