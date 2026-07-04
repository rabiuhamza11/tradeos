// Alpaca Adapter — US Stock trading (stocks, ETFs, options)
import axios from 'axios';
import { ExchangeAdapter, ExchangeCredentials, Ticker, Candle, OrderRequest, OrderResponse, AccountBalance, PositionInfo } from './types';

export class AlpacaAdapter extends ExchangeAdapter {
  readonly exchange = 'alpaca';
  readonly displayName = 'Alpaca Markets';

  private get tradingUrl(): string {
    return this.isTestnet ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets';
  }

  private get dataUrl(): string {
    return this.isTestnet ? 'https://data.paper-api.alpaca.markets' : 'https://data.alpaca.markets';
  }

  private get headers(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.credentials.apiKey,
      'APCA-API-SECRET-KEY': this.credentials.apiSecret,
      'Content-Type': 'application/json',
    };
  }

  private async tradingRequest(method: string, path: string, body?: any): Promise<any> {
    const response = await axios({
      method,
      url: `${this.tradingUrl}/v2${path}`,
      headers: this.headers,
      data: body,
    });
    return response.data;
  }

  private async dataRequest(path: string, params: Record<string, any> = {}): Promise<any> {
    const query = new URLSearchParams(params).toString();
    const response = await axios({
      url: `${this.dataUrl}/v2${path}?${query}`,
      headers: this.headers,
    });
    return response.data;
  }

  // ============ MARKET DATA ============

  async getTicker(symbol: string): Promise<Ticker> {
    const quote = await this.dataRequest(`/stocks/${symbol}/quotes/latest`);
    const q = quote.quote;
    return {
      symbol,
      price: parseFloat(q.ap || q.last_bid_price || '0'),
      bid: parseFloat(q.bp || q.last_bid_price || '0'),
      ask: parseFloat(q.ap || q.last_ask_price || '0'),
      high24h: 0, low24h: 0, volume24h: 0,
      changePct24h: 0,
      timestamp: parseInt(q.t || Date.now().toString()),
    };
  }

  async getTickers(symbols: string[]): Promise<Ticker[]> {
    const tickers: Ticker[] = [];
    // Alpaca supports batch quotes
    try {
      const data = await this.dataRequest('/stocks/quotes/latest', { symbols: symbols.join(',') });
      for (const sym of symbols) {
        const q = data.quotes?.[sym];
        if (q) {
          tickers.push({
            symbol: sym,
            price: parseFloat(q.ap || q.last_ask_price || '0'),
            bid: parseFloat(q.bp || q.last_bid_price || '0'),
            ask: parseFloat(q.ap || q.last_ask_price || '0'),
            high24h: 0, low24h: 0, volume24h: 0, changePct24h: 0,
            timestamp: parseInt(q.t || Date.now().toString()),
          });
        }
      }
    } catch {
      // Fallback: fetch one by one
      for (const s of symbols) { try { tickers.push(await this.getTicker(s)); } catch {} }
    }
    return tickers;
  }

  async getCandles(symbol: string, interval: string, limit: number = 100): Promise<Candle[]> {
    const timeframe = this.mapTimeframe(interval);
    const end = new Date();
    const start = new Date(end.getTime() - limit * this.intervalMs(interval));
    const data = await this.dataRequest(`/stocks/${symbol}/bars`, {
      timeframe,
      start: start.toISOString(),
      end: end.toISOString(),
      limit: limit.toString(),
      adjustment: 'raw',
    });
    return (data.bars || []).map((b: any) => ({
      timestamp: new Date(b.t).getTime(),
      open: b.o, high: b.h, low: b.l, close: b.c, volume: b.v,
    }));
  }

  async getOrderBook(_symbol: string, _depth: number = 20): Promise<{ bids: [number, number][]; asks: [number, number][] }> {
    // Alpaca doesn't provide a traditional order book for stocks
    // Use latest bid/ask as single-level book
    const ticker = await this.getTicker(_symbol);
    return {
      bids: [[ticker.bid, 100]],
      asks: [[ticker.ask, 100]],
    };
  }

  // ============ TRADING ============

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    const body: any = {
      symbol: order.symbol,
      qty: order.quantity.toString(),
      side: order.side.toLowerCase(),
      type: order.type.toLowerCase().replace('_', '_'),
      time_in_force: (order.timeInForce || 'GTC').toLowerCase(),
    };

    if (order.price && (order.type === 'LIMIT' || order.type === 'STOP_LIMIT')) {
      body.limit_price = order.price.toString();
    }
    if (order.stopPrice && (order.type === 'STOP' || order.type === 'STOP_LIMIT')) {
      body.stop_price = order.stopPrice.toString();
    }
    if (order.clientOrderId) {
      body.client_order_id = order.clientOrderId;
    }

    const data = await this.tradingRequest('POST', '/orders', body);
    return {
      exchangeOrderId: data.id,
      status: this.mapStatus(data.status),
      filledQuantity: parseFloat(data.filled_qty || '0'),
      avgFillPrice: parseFloat(data.filled_avg_price || '0'),
      fees: 0,
      createdAt: new Date(data.created_at).getTime(),
      raw: data,
    };
  }

  async cancelOrder(orderId: string, _symbol: string): Promise<boolean> {
    try {
      await this.tradingRequest('DELETE', `/orders/${orderId}`);
      return true;
    } catch { return false; }
  }

  async getOrderStatus(orderId: string, _symbol: string): Promise<OrderResponse> {
    const data = await this.tradingRequest('GET', `/orders/${orderId}`);
    return {
      exchangeOrderId: data.id,
      status: this.mapStatus(data.status),
      filledQuantity: parseFloat(data.filled_qty || '0'),
      avgFillPrice: parseFloat(data.filled_avg_price || '0'),
      fees: 0,
      createdAt: new Date(data.created_at).getTime(),
      raw: data,
    };
  }

  async getOpenOrders(_symbol?: string): Promise<OrderResponse[]> {
    const data = await this.tradingRequest('GET', '/orders', { status: 'open' });
    return (data || []).map((o: any) => ({
      exchangeOrderId: o.id, status: this.mapStatus(o.status),
      filledQuantity: parseFloat(o.filled_qty || '0'),
      avgFillPrice: parseFloat(o.filled_avg_price || '0'),
      fees: 0, createdAt: new Date(o.created_at).getTime(), raw: o,
    }));
  }

  async getOrderHistory(_symbol?: string, limit: number = 50): Promise<OrderResponse[]> {
    const data = await this.tradingRequest('GET', '/orders', { status: 'all', limit: limit.toString(), direction: 'desc' });
    return (data || []).map((o: any) => ({
      exchangeOrderId: o.id, status: this.mapStatus(o.status),
      filledQuantity: parseFloat(o.filled_qty || '0'),
      avgFillPrice: parseFloat(o.filled_avg_price || '0'),
      fees: 0, createdAt: new Date(o.created_at).getTime(), raw: o,
    }));
  }

  // ============ ACCOUNT ============

  async getBalances(): Promise<AccountBalance[]> {
    const account = await this.tradingRequest('GET', '/account');
    return [
      {
        asset: 'USD',
        free: parseFloat(account.cash || '0'),
        locked: parseFloat(account.cash_withdrawal_hold || '0'),
        total: parseFloat(account.cash || '0') + parseFloat(account.non_marginable_buying_power || '0'),
        usdValue: parseFloat(account.portfolio_value || '0'),
      },
    ];
  }

  async getPositions(): Promise<PositionInfo[]> {
    const data = await this.tradingRequest('GET', '/positions');
    return (data || []).map((p: any) => ({
      symbol: p.symbol,
      quantity: parseFloat(p.qty),
      side: p.side === 'long' ? 'LONG' as const : 'SHORT' as const,
      entryPrice: parseFloat(p.avg_entry_price),
      currentPrice: parseFloat(p.current_price),
      marketValue: parseFloat(p.market_value),
      unrealizedPnL: parseFloat(p.unrealized_pl),
    }));
  }

  async testConnection(): Promise<boolean> {
    try {
      const account = await this.tradingRequest('GET', '/account');
      return account.status === 'ACTIVE';
    } catch { return false; }
  }

  private mapTimeframe(interval: string): string {
    const map: Record<string, string> = {
      '1m': '1Min', '5m': '5Min', '15m': '15Min',
      '1h': '1Hour', '1d': '1Day',
    };
    return map[interval] || '1Hour';
  }

  private intervalMs(interval: string): number {
    const map: Record<string, number> = {
      '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '1d': 86400000,
    };
    return map[interval] || 3600000;
  }

  private mapStatus(status: string): 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED' {
    const map: Record<string, string> = {
      'new': 'PENDING', 'pending_new': 'PENDING', 'accepted': 'PENDING',
      'pending_cancel': 'PENDING', 'pending_replace': 'PENDING',
      'filled': 'FILLED',
      'partially_filled': 'PARTIALLY_FILLED',
      'canceled': 'CANCELLED', 'cancelled': 'CANCELLED', 'expired': 'CANCELLED',
      'rejected': 'REJECTED', 'replaced': 'PENDING',
    };
    return (map[status?.toLowerCase()] || 'PENDING') as any;
  }
}
