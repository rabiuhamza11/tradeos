// TradeOS — Alpaca Markets Adapter (US Stocks, ETFs)
// REST API + WebSocket for paper and live trading

import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import WebSocket from 'ws';

export interface AlpacaOrder {
  id: string;
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  time_in_force: 'day' | 'gtc' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
  status: string;
  filled_qty: number;
  filled_avg_price?: number;
  created_at: string;
  updated_at: string;
}

export interface AlpacaPosition {
  symbol: string;
  qty: number;
  side: 'long' | 'short';
  market_value: number;
  cost_basis: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  current_price: number;
  avg_entry_price: number;
}

export interface AlpacaAccount {
  id: string;
  cash: number;
  portfolio_value: number;
  equity: number;
  buying_power: number;
  status: string;
  market_open: boolean;
}

export class AlpacaAdapter extends EventEmitter {
  private client: AxiosInstance;
  private ws: WebSocket | null = null;
  private isPaper: boolean;
  private baseUrl: string;
  private wsUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string, isPaper = true) {
    super();
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.isPaper = isPaper;
    this.baseUrl = isPaper
      ? 'https://paper-api.alpaca.markets/v2'
      : 'https://api.alpaca.markets/v2';
    this.wsUrl = isPaper
      ? 'wss://paper-api.alpaca.markets/stream'
      : 'wss://api.alpaca.markets/stream';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        'Content-Type': 'application/json',
      },
    });
  }

  // ============ ACCOUNT ============

  async getAccount(): Promise<AlpacaAccount> {
    const { data } = await this.client.get('/account');
    return data;
  }

  // ============ ORDERS ============

  async placeOrder(order: {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    time_in_force?: 'day' | 'gtc' | 'ioc' | 'fok';
    limit_price?: number;
    stop_price?: number;
  }): Promise<AlpacaOrder> {
    const { data } = await this.client.post('/orders', {
      ...order,
      time_in_force: order.time_in_force || 'day',
    });
    this.emit('orderPlaced', data);
    return data;
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.client.delete(`/orders/${orderId}`);
    this.emit('orderCancelled', orderId);
  }

  async getOrder(orderId: string): Promise<AlpacaOrder> {
    const { data } = await this.client.get(`/orders/${orderId}`);
    return data;
  }

  async listOrders(status?: 'open' | 'closed' | 'all'): Promise<AlpacaOrder[]> {
    const { data } = await this.client.get('/orders', { params: { status: status || 'all', limit: 100 } });
    return data;
  }

  // ============ POSITIONS ============

  async getPositions(): Promise<AlpacaPosition[]> {
    const { data } = await this.client.get('/positions');
    return data;
  }

  async getPosition(symbol: string): Promise<AlpacaPosition> {
    const { data } = await this.client.get(`/positions/${symbol}`);
    return data;
  }

  async closePosition(symbol: string): Promise<void> {
    await this.client.delete(`/positions/${symbol}`);
    this.emit('positionClosed', symbol);
  }

  async closeAllPositions(): Promise<void> {
    await this.client.delete('/positions');
    this.emit('allPositionsClosed');
  }

  // ============ MARKET DATA ============

  async getBars(symbol: string, timeframe: string, limit = 100): Promise<any[]> {
    // timeframe: 1Min, 5Min, 15Min, 1Hour, 1Day
    const { data } = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/bars`, {
      params: { timeframe, limit },
      headers: {
        'APCA-API-KEY-ID': this.apiKey,
        'APCA-API-SECRET-KEY': this.apiSecret,
      },
    });
    return data.bars || [];
  }

  async getLatestQuote(symbol: string): Promise<{ bid: number; ask: number; timestamp: string }> {
    const { data } = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`, {
      headers: {
        'APCA-API-KEY-ID': this.apiKey,
        'APCA-API-SECRET-KEY': this.apiSecret,
      },
    });
    return {
      bid: parseFloat(data.quote.bp),
      ask: parseFloat(data.quote.ap),
      timestamp: data.quote.t,
    };
  }

  // ============ WATCHLIST ============

  async createWatchlist(name: string, symbols: string[]): Promise<any> {
    const { data } = await this.client.post('/watchlists', { name, symbols });
    return data;
  }

  async getWatchlists(): Promise<any[]> {
    const { data } = await this.client.get('/watchlists');
    return data;
  }

  // ============ WEBSOCKET ============

  connectWebSocket(): void {
    console.log(`🔌 Connecting to Alpaca WebSocket (${this.isPaper ? 'paper' : 'live'})...`);

    this.ws = new WebSocket(this.wsUrl);

    this.ws.on('open', () => {
      console.log('✅ Alpaca WS connected');
      this.emit('connected');

      // Authenticate
      this.ws?.send(JSON.stringify({
        action: 'authenticate',
        data: {
          key_id: this.apiKey,
          secret_key: this.apiSecret,
        },
      }));
    });

    this.ws.on('message', (raw: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.stream === 'authorization') {
          if (msg.data?.status === 'authorized') {
            console.log('🔐 Alpaca WS authorized');
            // Subscribe to account updates and trade updates
            this.ws?.send(JSON.stringify({
              action: 'listen',
              data: { streams: ['trade_updates', 'account_updates'] },
            }));
          }
        }

        if (msg.stream === 'trade_updates') {
          this.emit('tradeUpdate', msg.data);
        }

        if (msg.stream === 'account_updates') {
          this.emit('accountUpdate', msg.data);
        }
      } catch (e) {
        console.error('Alpaca WS parse error:', e);
      }
    });

    this.ws.on('error', (err: Error) => {
      console.error('❌ Alpaca WS error:', err.message);
      this.emit('error', err);
    });

    this.ws.on('close', () => {
      console.log('⚠️ Alpaca WS disconnected');
      this.emit('disconnected');
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
