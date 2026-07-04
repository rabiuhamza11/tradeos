// OANDA Adapter — Forex and CFD trading
import axios from 'axios';
import { ExchangeAdapter, ExchangeCredentials, Ticker, Candle, OrderRequest, OrderResponse, AccountBalance, PositionInfo } from './types';

export class OANDAAdapter extends ExchangeAdapter {
  readonly exchange = 'oanda';
  readonly displayName = 'OANDA';

  private get baseUrl(): string {
    return this.isTestnet ? 'https://api-fxpractice.oanda.com' : 'https://api-fxtrade.oanda.com';
  }

  private get accountId(): string {
    return this.credentials.passphrase || ''; // OANDA account ID stored in passphrase field
  }

  private get headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
      'Content-Type': 'application/json',
      'Accept-Datetime-Format': 'RFC3339',
    };
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const response = await axios({
      method,
      url: `${this.baseUrl}${path}`,
      headers: this.headers,
      data: body,
    });
    return response.data;
  }

  // ============ MARKET DATA ============

  async getTicker(symbol: string): Promise<Ticker> {
    const instrument = this.toInstrument(symbol);
    const data = await axios.get(`${this.baseUrl}/v3/instruments/${instrument}/pricing`, {
      headers: this.headers,
      params: { includeHomeConversions: 'false' },
    });
    const p = data.data.prices[0];
    const bid = parseFloat(p.bids[0].price);
    const ask = parseFloat(p.asks[0].price);
    return {
      symbol,
      price: (bid + ask) / 2,
      bid, ask,
      high24h: 0, low24h: 0, volume24h: 0, changePct24h: 0,
      timestamp: Date.now(),
    };
  }

  async getTickers(symbols: string[]): Promise<Ticker[]> {
    const tickers: Ticker[] = [];
    for (const s of symbols) { try { tickers.push(await this.getTicker(s)); } catch {} }
    return tickers;
  }

  async getCandles(symbol: string, interval: string, limit: number = 100): Promise<Candle[]> {
    const instrument = this.toInstrument(symbol);
    const granularity = this.mapGranularity(interval);
    const data = await axios.get(`${this.baseUrl}/v3/instruments/${instrument}/candles`, {
      headers: this.headers,
      params: { granularity, count: limit.toString(), price: 'M' },
    });
    return (data.data.candles || []).map((c: any) => ({
      timestamp: new Date(c.time).getTime(),
      open: parseFloat(c.mid.o), high: parseFloat(c.mid.h),
      low: parseFloat(c.mid.l), close: parseFloat(c.mid.c),
      volume: parseInt(c.volume || '0'),
    }));
  }

  async getOrderBook(_symbol: string, _depth: number = 20): Promise<{ bids: [number, number][]; asks: [number, number][] }> {
    const ticker = await this.getTicker(_symbol);
    return { bids: [[ticker.bid, 100000]], asks: [[ticker.ask, 100000]] };
  }

  // ============ TRADING ============

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    const instrument = this.toInstrument(order.symbol);
    const body = {
      order: {
        type: this.mapOrderType(order.type),
        instrument,
        units: (order.side === 'BUY' ? order.quantity : -order.quantity).toString(),
        timeInForce: (order.timeInForce || 'GTC'),
        ...(order.type === 'LIMIT' && order.price ? { price: order.price.toString() } : {}),
        ...(order.type === 'STOP' && order.stopPrice ? { priceBound: order.stopPrice.toString() } : {}),
      },
    };
    const data = await this.request('POST', `/v3/accounts/${this.accountId}/orders`, body);
    const o = data.orderCreateTransaction || data.orderCancelTransaction || {};
    return {
      exchangeOrderId: o.id || data.orderCreateTransaction?.id || '',
      status: data.orderFillTransaction ? 'FILLED' : 'PENDING',
      filledQuantity: parseFloat(data.orderFillTransaction?.units || '0'),
      avgFillPrice: parseFloat(data.orderFillTransaction?.price || '0'),
      fees: 0,
      createdAt: new Date(o.time || Date.now()).getTime(),
      raw: data,
    };
  }

  async cancelOrder(orderId: string, _symbol: string): Promise<boolean> {
    try {
      await this.request('PUT', `/v3/accounts/${this.accountId}/orders/${orderId}/cancel`);
      return true;
    } catch { return false; }
  }

  async getOrderStatus(orderId: string, _symbol: string): Promise<OrderResponse> {
    const data = await this.request('GET', `/v3/accounts/${this.accountId}/orders/${orderId}`);
    const o = data.order;
    return {
      exchangeOrderId: o.id,
      status: this.mapStatus(o.state),
      filledQuantity: parseFloat(o.fillingTransactionID ? o.units : '0'),
      avgFillPrice: parseFloat(o.price || '0'),
      fees: 0,
      createdAt: new Date(o.createTime).getTime(),
      raw: o,
    };
  }

  async getOpenOrders(_symbol?: string): Promise<OrderResponse[]> {
    const data = await this.request('GET', `/v3/accounts/${this.accountId}/orders`, { state: 'PENDING' });
    return (data.orders || []).map((o: any) => ({
      exchangeOrderId: o.id, status: 'PENDING',
      filledQuantity: 0, avgFillPrice: 0, fees: 0,
      createdAt: new Date(o.createTime).getTime(), raw: o,
    }));
  }

  async getOrderHistory(_symbol?: string, limit: number = 50): Promise<OrderResponse[]> {
    const data = await this.request('GET', `/v3/accounts/${this.accountId}/orders`, { state: 'ALL', count: limit.toString() });
    return (data.orders || []).map((o: any) => ({
      exchangeOrderId: o.id, status: this.mapStatus(o.state),
      filledQuantity: 0, avgFillPrice: 0, fees: 0,
      createdAt: new Date(o.createTime).getTime(), raw: o,
    }));
  }

  // ============ ACCOUNT ============

  async getBalances(): Promise<AccountBalance[]> {
    const data = await this.request('GET', `/v3/accounts/${this.accountId}/summary`);
    const a = data.account;
    return [{
      asset: a.currency || 'USD',
      free: parseFloat(a.balance || '0'),
      locked: 0,
      total: parseFloat(a.balance || '0'),
      usdValue: parseFloat(a.NAV || a.balance || '0'),
    }];
  }

  async getPositions(): Promise<PositionInfo[]> {
    const data = await this.request('GET', `/v3/accounts/${this.accountId}/openPositions`);
    return (data.positions || []).map((p: any) => ({
      symbol: this.fromInstrument(p.instrument),
      quantity: Math.abs(parseFloat(p.units)),
      side: parseFloat(p.units) > 0 ? 'LONG' as const : 'SHORT' as const,
      entryPrice: parseFloat(p.price || '0'),
      currentPrice: 0,
      marketValue: parseFloat(p.unrealizedPL || '0'),
      unrealizedPnL: parseFloat(p.unrealizedPL || '0'),
    }));
  }

  async testConnection(): Promise<boolean> {
    try {
      const data = await this.request('GET', `/v3/accounts/${this.accountId}/summary`);
      return !!data.account;
    } catch { return false; }
  }

  // ============ HELPERS ============

  private toInstrument(symbol: string): string {
    // EURUSD -> EUR_USD
    if (symbol.length === 6) return `${symbol.slice(0, 3)}_${symbol.slice(3)}`;
    return symbol;
  }

  private fromInstrument(instrument: string): string {
    // EUR_USD -> EURUSD
    return instrument.replace('_', '');
  }

  private mapGranularity(interval: string): string {
    const map: Record<string, string> = {
      '5s': 'S5', '10s': 'S10', '15s': 'S15', '30s': 'S30',
      '1m': 'M1', '5m': 'M5', '15m': 'M15', '30m': 'M30',
      '1h': 'H1', '4h': 'H4', '1d': 'D', '1w': 'W', '1M': 'M',
    };
    return map[interval] || 'H1';
  }

  private mapOrderType(type: string): string {
    const map: Record<string, string> = {
      'MARKET': 'MARKET', 'LIMIT': 'LIMIT', 'STOP': 'STOP',
      'STOP_LIMIT': 'STOP_LIMIT', 'TRAILING_STOP': 'TRAILING_STOP',
    };
    return map[type] || 'MARKET';
  }

  private mapStatus(state: string): 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED' {
    const map: Record<string, string> = {
      'PENDING': 'PENDING', 'TRACKING': 'PENDING',
      'FILLED': 'FILLED',
      'CANCELLED': 'CANCELLED', 'TRIGGERED': 'FILLED',
      'REJECTED': 'REJECTED',
    };
    return (map[state?.toUpperCase()] || 'PENDING') as any;
  }
}
