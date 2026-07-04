// Binance Adapter — Crypto spot trading
import axios from 'axios';
import * as crypto from 'crypto';
import { ExchangeAdapter, ExchangeCredentials, Ticker, Candle, OrderRequest, OrderResponse, AccountBalance, PositionInfo } from './types';

export class BinanceAdapter extends ExchangeAdapter {
  readonly exchange = 'binance';
  readonly displayName = 'Binance';

  private get baseUrl(): string {
    return this.isTestnet ? 'https://testnet.binance.vision' : 'https://api.binance.com';
  }

  private get futuresUrl(): string {
    return this.isTestnet ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com';
  }

  private sign(query: string): string {
    return crypto.createHmac('sha256', this.credentials.apiSecret).update(query).digest('hex');
  }

  private async signedRequest(method: string, path: string, params: Record<string, any> = {}, useFutures: boolean = false): Promise<any> {
    const base = useFutures ? this.futuresUrl : this.baseUrl;
    const timestamp = Date.now();
    const query = new URLSearchParams({ ...params, timestamp: timestamp.toString(), recvWindow: '5000' }).toString();
    const signature = this.sign(query);
    const url = `${base}${path}?${query}&signature=${signature}`;

    const response = await axios({
      method,
      url,
      headers: { 'X-MBX-APIKEY': this.credentials.apiKey },
    });
    return response.data;
  }

  private async publicRequest(path: string, params: Record<string, any> = {}): Promise<any> {
    const query = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${path}?${query}`;
    const response = await axios.get(url);
    return response.data;
  }

  // ============ MARKET DATA ============

  async getTicker(symbol: string): Promise<Ticker> {
    const data = await this.publicRequest('/api/v3/ticker/24hr', { symbol });
    return {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      bid: parseFloat(data.bidPrice),
      ask: parseFloat(data.askPrice),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
      changePct24h: parseFloat(data.priceChangePercent) / 100,
      timestamp: Date.now(),
    };
  }

  async getTickers(symbols?: string[]): Promise<Ticker[]> {
    if (symbols && symbols.length > 0) {
      const data = await this.publicRequest('/api/v3/ticker/24hr', { symbols: JSON.stringify(symbols) });
      return data.map((d: any) => ({
        symbol: d.symbol, price: parseFloat(d.lastPrice), bid: parseFloat(d.bidPrice),
        ask: parseFloat(d.askPrice), high24h: parseFloat(d.highPrice), low24h: parseFloat(d.lowPrice),
        volume24h: parseFloat(d.volume), changePct24h: parseFloat(d.priceChangePercent) / 100, timestamp: Date.now(),
      }));
    }
    const data = await this.publicRequest('/api/v3/ticker/24hr');
    return data.slice(0, 50).map((d: any) => ({
      symbol: d.symbol, price: parseFloat(d.lastPrice), bid: parseFloat(d.bidPrice),
      ask: parseFloat(d.askPrice), high24h: parseFloat(d.highPrice), low24h: parseFloat(d.lowPrice),
      volume24h: parseFloat(d.volume), changePct24h: parseFloat(d.priceChangePercent) / 100, timestamp: Date.now(),
    }));
  }

  async getCandles(symbol: string, interval: string, limit: number = 100): Promise<Candle[]> {
    const data = await this.publicRequest('/api/v3/klines', { symbol, interval, limit: limit.toString() });
    return data.map((k: any[]) => ({
      timestamp: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]),
      low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]),
    }));
  }

  async getOrderBook(symbol: string, depth: number = 20): Promise<{ bids: [number, number][]; asks: [number, number][] }> {
    const data = await this.publicRequest('/api/v3/depth', { symbol, limit: depth.toString() });
    return {
      bids: data.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])] as [number, number]),
      asks: data.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])] as [number, number]),
    };
  }

  // ============ TRADING ============

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    const params: Record<string, any> = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity.toString(),
    };

    if (order.price && (order.type === 'LIMIT' || order.type === 'STOP_LIMIT')) {
      params.price = order.price.toString();
      params.timeInForce = order.timeInForce || 'GTC';
    }
    if (order.stopPrice && (order.type === 'STOP' || order.type === 'STOP_LIMIT')) {
      params.stopPrice = order.stopPrice.toString();
    }
    if (order.clientOrderId) {
      params.newClientOrderId = order.clientOrderId;
    }

    const data = await this.signedRequest('POST', '/api/v3/order', params);

    return {
      exchangeOrderId: data.orderId.toString(),
      status: this.mapStatus(data.status),
      filledQuantity: parseFloat(data.executedQty),
      avgFillPrice: parseFloat(data.avgPrice) || 0,
      fees: 0, // Binance returns fills separately
      createdAt: data.transactTime || Date.now(),
      raw: data,
    };
  }

  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    try {
      await this.signedRequest('DELETE', '/api/v3/order', { orderId, symbol });
      return true;
    } catch { return false; }
  }

  async getOrderStatus(orderId: string, symbol: string): Promise<OrderResponse> {
    const data = await this.signedRequest('GET', '/api/v3/order', { orderId, symbol });
    return {
      exchangeOrderId: data.orderId.toString(),
      status: this.mapStatus(data.status),
      filledQuantity: parseFloat(data.executedQty),
      avgFillPrice: parseFloat(data.avgPrice) || 0,
      fees: 0,
      createdAt: data.time || Date.now(),
      raw: data,
    };
  }

  async getOpenOrders(symbol?: string): Promise<OrderResponse[]> {
    const params: Record<string, any> = {};
    if (symbol) params.symbol = symbol;
    const data = await this.signedRequest('GET', '/api/v3/openOrders', params);
    return data.map((o: any) => ({
      exchangeOrderId: o.orderId.toString(), status: this.mapStatus(o.status),
      filledQuantity: parseFloat(o.executedQty), avgFillPrice: parseFloat(o.avgPrice) || 0,
      fees: 0, createdAt: o.time, raw: o,
    }));
  }

  async getOrderHistory(symbol?: string, limit: number = 50): Promise<OrderResponse[]> {
    const params: Record<string, any> = { limit: limit.toString() };
    if (symbol) params.symbol = symbol;
    const data = await this.signedRequest('GET', '/api/v3/allOrders', params);
    return data.map((o: any) => ({
      exchangeOrderId: o.orderId.toString(), status: this.mapStatus(o.status),
      filledQuantity: parseFloat(o.executedQty), avgFillPrice: parseFloat(o.avgPrice) || 0,
      fees: 0, createdAt: o.time, raw: o,
    }));
  }

  // ============ ACCOUNT ============

  async getBalances(): Promise<AccountBalance[]> {
    const data = await this.signedRequest('GET', '/api/v3/account');
    return data.balances
      .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map((b: any) => ({
        asset: b.asset,
        free: parseFloat(b.free),
        locked: parseFloat(b.locked),
        total: parseFloat(b.free) + parseFloat(b.locked),
      }));
  }

  async getPositions(): Promise<PositionInfo[]> {
    // Spot trading doesn't have "positions" in the futures sense
    // Return balances as USD-valued positions
    const balances = await this.getBalances();
    return balances.map(b => ({
      symbol: b.asset,
      quantity: b.total,
      side: 'LONG' as const,
      entryPrice: 0,
      currentPrice: 0,
      marketValue: b.usdValue || 0,
      unrealizedPnL: 0,
    }));
  }

  async testConnection(): Promise<boolean> {
    try {
      const data = await this.signedRequest('GET', '/api/v3/account');
      return data.accountType !== undefined;
    } catch { return false; }
  }

  private mapStatus(status: string): 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED' {
    const map: Record<string, string> = {
      'NEW': 'PENDING', 'PENDING_NEW': 'PENDING',
      'FILLED': 'FILLED', 'PARTIALLY_FILLED': 'PARTIALLY_FILLED',
      'CANCELED': 'CANCELLED', 'CANCELLED': 'CANCELLED',
      'REJECTED': 'REJECTED', 'EXPIRED': 'CANCELLED',
    };
    return (map[status] || 'PENDING') as any;
  }
}
