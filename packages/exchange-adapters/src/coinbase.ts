// Coinbase Advanced Trade Adapter — Crypto trading
import axios from 'axios';
import { createHmac } from 'crypto';
import { ExchangeAdapter, ExchangeCredentials, Ticker, Candle, OrderRequest, OrderResponse, AccountBalance, PositionInfo } from './types';

export class CoinbaseAdapter extends ExchangeAdapter {
  readonly exchange = 'coinbase';
  readonly displayName = 'Coinbase Advanced';

  private get baseUrl(): string {
    return this.isTestnet ? 'https://api-sandbox.coinbase.com' : 'https://api.coinbase.com';
  }

  private buildJWT(): string {
    // Coinbase Advanced Trade uses JWT for auth
    // In production: use jsonwebtoken library with ES256
    // Simplified here — you'd need the jwt library installed
    const header = { alg: 'ES256', typ: 'JWT', kid: this.credentials.apiKey };
    const payload = {
      sub: this.credentials.apiKey,
      iss: 'cdp',
      aud: ['retail_rest_api', 'retail_rest_api_prd'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
    };
    // Note: In production, sign with the EC private key using jsonwebtoken
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    // This would need proper ES256 signing — placeholder for structure
    return `${headerB64}.${payloadB64}.signature_placeholder`;
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}/api/v3/brokerage${path}`;
    const response = await axios({
      method,
      url,
      headers: {
        'Authorization': `Bearer ${this.buildJWT()}`,
        'Content-Type': 'application/json',
      },
      data: body,
    });
    return response.data;
  }

  async getTicker(symbol: string): Promise<Ticker> {
    // Coinbase uses product IDs like "BTC-USD"
    const productId = this.toProductId(symbol);
    const data = await axios.get(`${this.baseUrl}/api/v3/brokerage/market/products/${productId}`);
    const p = data.data;
    return {
      symbol,
      price: parseFloat(p.price),
      bid: parseFloat(p.price) * 0.999,
      ask: parseFloat(p.price) * 1.001,
      high24h: parseFloat(p.high_24h || p.price),
      low24h: parseFloat(p.low_24h || p.price),
      volume24h: parseFloat(p.volume_24h || '0'),
      changePct24h: 0,
      timestamp: Date.now(),
    };
  }

  async getTickers(symbols?: string[]): Promise<Ticker[]> {
    const tickers: Ticker[] = [];
    const syms = symbols || ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
    for (const s of syms) {
      try { tickers.push(await this.getTicker(s)); } catch {}
    }
    return tickers;
  }

  async getCandles(symbol: string, interval: string, limit: number = 100): Promise<Candle[]> {
    const productId = this.toProductId(symbol);
    const granularity = this.mapGranularity(interval);
    const data = await axios.get(`${this.baseUrl}/api/v3/brokerage/market/products/${productId}/candles`, {
      params: { granularity, limit },
    });
    return data.data.candles.map((c: any) => ({
      timestamp: parseInt(c.start), open: parseFloat(c.open), high: parseFloat(c.high),
      low: parseFloat(c.low), close: parseFloat(c.close), volume: parseFloat(c.volume),
    }));
  }

  async getOrderBook(symbol: string, depth: number = 20): Promise<{ bids: [number, number][]; asks: [number, number][] }> {
    const productId = this.toProductId(symbol);
    const data = await axios.get(`${this.baseUrl}/api/v3/brokerage/market/product_book`, {
      params: { product_id: productId, limit: depth },
    });
    const book = data.data;
    return {
      bids: (book.bids || []).map((b: any) => [parseFloat(b.price), parseFloat(b.size)] as [number, number]),
      asks: (book.asks || []).map((a: any) => [parseFloat(a.price), parseFloat(a.size)] as [number, number]),
    };
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    const productId = this.toProductId(order.symbol);
    const data = await this.request('POST', '/orders', {
      client_order_id: order.clientOrderId || `tradeos_${Date.now()}`,
      product_id: productId,
      side: order.side.toLowerCase(),
      order_configuration: this.buildOrderConfig(order),
    });
    return {
      exchangeOrderId: data.order_id || data.success_response?.order_id || '',
      status: 'PENDING',
      filledQuantity: 0,
      avgFillPrice: 0,
      fees: 0,
      createdAt: Date.now(),
      raw: data,
    };
  }

  async cancelOrder(orderId: string, _symbol: string): Promise<boolean> {
    try {
      await this.request('POST', '/orders/cancel', { order_id: orderId });
      return true;
    } catch { return false; }
  }

  async getOrderStatus(orderId: string, _symbol: string): Promise<OrderResponse> {
    const data = await this.request('GET', `/orders/historical/${orderId}`);
    const o = data.order;
    return {
      exchangeOrderId: o.order_id,
      status: this.mapStatus(o.status),
      filledQuantity: parseFloat(o.filled_size || '0'),
      avgFillPrice: parseFloat(o.average_price || '0'),
      fees: parseFloat(o.total_fees || '0'),
      createdAt: new Date(o.created_time).getTime(),
      raw: o,
    };
  }

  async getOpenOrders(_symbol?: string): Promise<OrderResponse[]> {
    const data = await this.request('GET', '/orders', { order_status: 'OPEN' });
    return (data.orders || []).map((o: any) => ({
      exchangeOrderId: o.order_id, status: 'PENDING',
      filledQuantity: 0, avgFillPrice: 0, fees: 0,
      createdAt: new Date(o.created_time).getTime(), raw: o,
    }));
  }

  async getOrderHistory(_symbol?: string, limit: number = 50): Promise<OrderResponse[]> {
    const data = await this.request('GET', '/orders/historical', { limit });
    return (data.orders || []).map((o: any) => ({
      exchangeOrderId: o.order_id, status: this.mapStatus(o.status),
      filledQuantity: parseFloat(o.filled_size || '0'),
      avgFillPrice: parseFloat(o.average_price || '0'),
      fees: parseFloat(o.total_fees || '0'),
      createdAt: new Date(o.created_time).getTime(), raw: o,
    }));
  }

  async getBalances(): Promise<AccountBalance[]> {
    const data = await this.request('GET', '/accounts');
    return (data.accounts || [])
      .filter((a: any) => parseFloat(a.available?.value || '0') > 0)
      .map((a: any) => ({
        asset: a.currency,
        free: parseFloat(a.available?.value || '0'),
        locked: parseFloat(a.hold?.value || '0'),
        total: parseFloat(a.available?.value || '0') + parseFloat(a.hold?.value || '0'),
        usdValue: parseFloat(a.available?.value || '0') * 1, // Would need price conversion
      }));
  }

  async getPositions(): Promise<PositionInfo[]> {
    const balances = await this.getBalances();
    return balances.map(b => ({
      symbol: b.asset, quantity: b.total, side: 'LONG' as const,
      entryPrice: 0, currentPrice: 0, marketValue: b.usdValue || 0, unrealizedPnL: 0,
    }));
  }

  async testConnection(): Promise<boolean> {
    try {
      const data = await this.request('GET', '/accounts');
      return !!data.accounts;
    } catch { return false; }
  }

  private toProductId(symbol: string): string {
    // BTC -> BTC-USD, ETH -> ETH-USD
    const quoteMap: Record<string, string> = { USDT: 'USDT', USD: 'USD' };
    if (symbol.includes('-')) return symbol;
    if (symbol.length === 3 && symbol !== 'BTC') return `${symbol}-USD`;
    return `${symbol}-USD`;
  }

  private mapGranularity(interval: string): string {
    const map: Record<string, string> = {
      '1m': 'ONE_MINUTE', '5m': 'FIVE_MINUTE', '15m': 'FIFTEEN_MINUTE',
      '1h': 'ONE_HOUR', '6h': 'SIX_HOUR', '1d': 'ONE_DAY',
    };
    return map[interval] || 'ONE_HOUR';
  }

  private buildOrderConfig(order: OrderRequest): any {
    if (order.type === 'MARKET') {
      return { market_market: { quote_size: (order.quantity * (order.price || 100)).toFixed(8) } };
    }
    if (order.type === 'LIMIT') {
      return { limit_limit: { base_size: order.quantity.toString(), limit_price: (order.price || 0).toString(), post_only: false } };
    }
    if (order.type === 'STOP') {
      return { stop_limit_stop_limit: { base_size: order.quantity.toString(), limit_price: (order.price || 0).toString(), stop_price: (order.stopPrice || 0).toString(), stop_direction: order.side === 'BUY' ? 'STOP_DIRECTION_STOP_UP' : 'STOP_DIRECTION_STOP_DOWN' } };
    }
    return { market_market: { quote_size: order.quantity.toString() } };
  }

  private mapStatus(status: string): 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED' {
    const map: Record<string, string> = {
      'OPEN': 'PENDING', 'PENDING': 'PENDING', 'ACTIVE': 'PENDING',
      'FILLED': 'FILLED', 'DONE': 'FILLED',
      'PARTIALLY_FILLED': 'PARTIALLY_FILLED',
      'CANCELLED': 'CANCELLED', 'CANCELED': 'CANCELLED', 'EXPIRED': 'CANCELLED',
      'REJECTED': 'REJECTED', 'FAILED': 'REJECTED',
    };
    return (map[status?.toUpperCase()] || 'PENDING') as any;
  }
}
