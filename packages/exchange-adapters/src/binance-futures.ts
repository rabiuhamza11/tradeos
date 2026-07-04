// Binance Futures Adapter — Crypto futures/perpetuals trading with leverage
import axios from 'axios';
import * as crypto from 'crypto';
import { ExchangeAdapter, ExchangeCredentials, Ticker, Candle, OrderRequest, OrderResponse, AccountBalance, PositionInfo } from './types';

export class BinanceFuturesAdapter extends ExchangeAdapter {
  readonly exchange = 'binance_futures';
  readonly displayName = 'Binance Futures';

  private get baseUrl(): string {
    return this.isTestnet ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com';
  }

  private sign(query: string): string {
    return crypto.createHmac('sha256', this.credentials.apiSecret).update(query).digest('hex');
  }

  private async signedRequest(method: string, path: string, params: Record<string, any> = {}): Promise<any> {
    const timestamp = Date.now();
    const query = new URLSearchParams({ ...params, timestamp: timestamp.toString(), recvWindow: '5000' }).toString();
    const signature = this.sign(query);
    const url = `${this.baseUrl}${path}?${query}&signature=${signature}`;
    const response = await axios({ method, url, headers: { 'X-MBX-APIKEY': this.credentials.apiKey } });
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
    const data = await this.publicRequest('/fapi/v1/ticker/24hr', { symbol });
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
      const data = await this.publicRequest('/fapi/v1/ticker/24hr', { symbols: JSON.stringify(symbols) });
      return data.map((d: any) => ({
        symbol: d.symbol, price: parseFloat(d.lastPrice), bid: parseFloat(d.bidPrice),
        ask: parseFloat(d.askPrice), high24h: parseFloat(d.highPrice), low24h: parseFloat(d.lowPrice),
        volume24h: parseFloat(d.volume), changePct24h: parseFloat(d.priceChangePercent) / 100, timestamp: Date.now(),
      }));
    }
    const data = await this.publicRequest('/fapi/v1/ticker/24hr');
    return data.slice(0, 50).map((d: any) => ({
      symbol: d.symbol, price: parseFloat(d.lastPrice), bid: parseFloat(d.bidPrice),
      ask: parseFloat(d.askPrice), high24h: parseFloat(d.highPrice), low24h: parseFloat(d.lowPrice),
      volume24h: parseFloat(d.volume), changePct24h: parseFloat(d.priceChangePercent) / 100, timestamp: Date.now(),
    }));
  }

  async getCandles(symbol: string, interval: string, limit: number = 100): Promise<Candle[]> {
    const data = await this.publicRequest('/fapi/v1/klines', { symbol, interval, limit: limit.toString() });
    return data.map((k: any[]) => ({
      timestamp: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]),
      low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]),
    }));
  }

  async getOrderBook(symbol: string, depth: number = 20): Promise<{ bids: [number, number][]; asks: [number, number][] }> {
    const data = await this.publicRequest('/fapi/v1/depth', { symbol, limit: depth.toString() });
    return {
      bids: data.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])] as [number, number]),
      asks: data.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])] as [number, number]),
    };
  }

  // ============ FUTURES-SPECIFIC ============

  async getFundingRate(symbol: string): Promise<{ symbol: string; fundingRate: number; nextFundingTime: number }> {
    const data = await this.publicRequest('/fapi/v1/premiumIndex', { symbol });
    return {
      symbol: data.symbol,
      fundingRate: parseFloat(data.lastFundingRate),
      nextFundingTime: parseInt(data.nextFundingTime),
    };
  }

  async getOpenInterest(symbol: string): Promise<{ openInterest: number; openInterestValue: number }> {
    const data = await this.publicRequest('/fapi/v1/openInterest', { symbol });
    return { openInterest: parseFloat(data.openInterest), openInterestValue: 0 };
  }

  async setLeverage(symbol: string, leverage: number): Promise<any> {
    return this.signedRequest('POST', '/fapi/v1/leverage', { symbol, leverage: leverage.toString() });
  }

  async setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<any> {
    return this.signedRequest('POST', '/fapi/v1/marginType', { symbol, marginType });
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

    const data = await this.signedRequest('POST', '/fapi/v1/order', params);

    return {
      exchangeOrderId: data.orderId.toString(),
      status: this.mapStatus(data.status),
      filledQuantity: parseFloat(data.executedQty),
      avgFillPrice: parseFloat(data.avgPrice) || 0,
      fees: 0,
      createdAt: data.updateTime || Date.now(),
      raw: data,
    };
  }

  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    try {
      await this.signedRequest('DELETE', '/fapi/v1/order', { orderId, symbol });
      return true;
    } catch { return false; }
  }

  async getOrderStatus(orderId: string, symbol: string): Promise<OrderResponse> {
    const data = await this.signedRequest('GET', '/fapi/v1/order', { orderId, symbol });
    return {
      exchangeOrderId: data.orderId.toString(),
      status: this.mapStatus(data.status),
      filledQuantity: parseFloat(data.executedQty),
      avgFillPrice: parseFloat(data.avgPrice) || 0,
      fees: 0,
      createdAt: data.updateTime || Date.now(),
      raw: data,
    };
  }

  async getOpenOrders(symbol?: string): Promise<OrderResponse[]> {
    const params: Record<string, any> = {};
    if (symbol) params.symbol = symbol;
    const data = await this.signedRequest('GET', '/fapi/v1/openOrders', params);
    return data.map((o: any) => ({
      exchangeOrderId: o.orderId.toString(), status: this.mapStatus(o.status),
      filledQuantity: parseFloat(o.executedQty), avgFillPrice: parseFloat(o.avgPrice) || 0,
      fees: 0, createdAt: o.updateTime, raw: o,
    }));
  }

  async getOrderHistory(symbol?: string, limit: number = 50): Promise<OrderResponse[]> {
    const params: Record<string, any> = { limit: limit.toString() };
    if (symbol) params.symbol = symbol;
    const data = await this.signedRequest('GET', '/fapi/v1/allOrders', params);
    return data.map((o: any) => ({
      exchangeOrderId: o.orderId.toString(), status: this.mapStatus(o.status),
      filledQuantity: parseFloat(o.executedQty), avgFillPrice: parseFloat(o.avgPrice) || 0,
      fees: 0, createdAt: o.updateTime, raw: o,
    }));
  }

  // ============ ACCOUNT ============

  async getBalances(): Promise<AccountBalance[]> {
    const data = await this.signedRequest('GET', '/fapi/v2/balance');
    return data
      .filter((b: any) => parseFloat(b.balance) > 0)
      .map((b: any) => ({
        asset: b.asset,
        free: parseFloat(b.availableBalance),
        locked: parseFloat(b.balance) - parseFloat(b.availableBalance),
        total: parseFloat(b.balance),
        usdValue: parseFloat(b.crossWalletBalance) || parseFloat(b.balance),
      }));
  }

  async getPositions(): Promise<PositionInfo[]> {
    const data = await this.signedRequest('GET', '/fapi/v2/positionRisk');
    return data
      .filter((p: any) => parseFloat(p.positionAmt) !== 0)
      .map((p: any) => {
        const qty = parseFloat(p.positionAmt);
        return {
          symbol: p.symbol,
          quantity: Math.abs(qty),
          side: qty > 0 ? 'LONG' as const : 'SHORT' as const,
          entryPrice: parseFloat(p.entryPrice),
          currentPrice: parseFloat(p.markPrice),
          marketValue: Math.abs(qty) * parseFloat(p.markPrice),
          unrealizedPnL: parseFloat(p.unRealizedProfit),
        };
      });
  }

  async testConnection(): Promise<boolean> {
    try {
      const data = await this.signedRequest('GET', '/fapi/v2/balance');
      return Array.isArray(data);
    } catch { return false; }
  }

  private mapStatus(status: string): 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED' {
    const map: Record<string, string> = {
      'NEW': 'PENDING', 'PENDING_NEW': 'PENDING', 'WORKING': 'PENDING',
      'FILLED': 'FILLED', 'PARTIALLY_FILLED': 'PARTIALLY_FILLED',
      'CANCELED': 'CANCELLED', 'CANCELLED': 'CANCELLED',
      'REJECTED': 'REJECTED', 'EXPIRED': 'CANCELLED',
    };
    return (map[status] || 'PENDING') as any;
  }
}
