// TradeOS — OANDA Adapter (Forex, CFDs, Commodities)
// REST API + Streaming for v20 trading

import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

export interface OandaOrder {
  id: string;
  instrument: string;
  units: number; // Positive = buy, Negative = sell
  price: number;
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'MARKET_IF_TOUCHED' | 'TAKE_PROFIT' | 'STOP_LOSS';
  state: 'PENDING' | 'FILLED' | 'CANCELLED' | 'TRIGGERED';
  fillPrice?: number;
  filledUnits?: number;
  createTime: string;
}

export interface OandaPosition {
  instrument: string;
  long: { units: number; averagePrice: number; pl: number; unrealizedPL: number };
  short: { units: number; averagePrice: number; pl: number; unrealizedPL: number };
  pl: number;
  unrealizedPL: number;
  marginUsed: number;
}

export interface OandaAccount {
  id: string;
  currency: string;
  balance: number;
  NAV: number;
  unrealizedPL: number;
  marginUsed: number;
  marginAvailable: number;
  openTradeCount: number;
  openPositionCount: number;
}

export interface OandaCandle {
  time: string;
  volume: number;
  mid: { o: number; h: number; l: number; c: number };
  complete: boolean;
}

export class OandaAdapter extends EventEmitter {
  private client: AxiosInstance;
  private apiKey: string;
  private accountId: string;
  private isPractice: boolean;
  private baseUrl: string;
  private streamUrl: string;

  constructor(apiKey: string, accountId: string, isPractice = true) {
    super();
    this.apiKey = apiKey;
    this.accountId = accountId;
    this.isPractice = isPractice;
    this.baseUrl = isPractice
      ? 'https://api-fxpractice.oanda.com/v3'
      : 'https://api-fxtrade.oanda.com/v3';
    this.streamUrl = isPractice
      ? 'https://stream-fxpractice.oanda.com/v3'
      : 'https://stream-fxtrade.oanda.com/v3';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept-Datetime-Format': 'RFC3339',
      },
    });
  }

  // ============ ACCOUNT ============

  async getAccount(): Promise<OandaAccount> {
    const { data } = await this.client.get(`/accounts/${this.accountId}/summary`);
    const acc = data.account;
    return {
      id: acc.id,
      currency: acc.currency,
      balance: parseFloat(acc.balance),
      NAV: parseFloat(acc.NAV),
      unrealizedPL: parseFloat(acc.unrealizedPL),
      marginUsed: parseFloat(acc.marginUsed),
      marginAvailable: parseFloat(acc.marginAvailable),
      openTradeCount: acc.openTradeCount,
      openPositionCount: acc.openPositionCount,
    };
  }

  async getAccounts(): Promise<any[]> {
    const { data } = await this.client.get('/accounts');
    return data.accounts;
  }

  // ============ ORDERS ============

  async placeOrder(order: {
    instrument: string;
    units: number; // Positive for buy, negative for sell
    type: 'MARKET' | 'LIMIT' | 'STOP' | 'MARKET_IF_TOUCHED';
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
    trailingStopLoss?: { distance: number };
  }): Promise<OandaOrder> {
    const orderData: any = {
      order: {
        type: order.type,
        instrument: order.instrument,
        units: String(order.units),
        timeInForce: order.type === 'MARKET' ? 'FOK' : 'GTC',
        positionFill: 'DEFAULT',
      },
    };

    if (order.price) orderData.order.price = String(order.price);
    if (order.stopLoss) orderData.order.stopLossOnFill = { price: String(order.stopLoss) };
    if (order.takeProfit) orderData.order.takeProfitOnFill = { price: String(order.takeProfit) };
    if (order.trailingStopLoss) orderData.order.trailingStopLossOnFill = { distance: String(order.trailingStopLoss.distance) };

    const { data } = await this.client.post(`/accounts/${this.accountId}/orders`, orderData);
    this.emit('orderPlaced', data);
    return data.orderFillTransaction || data.orderCreateTransaction;
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.client.put(`/accounts/${this.accountId}/orders/${orderId}/cancel`);
    this.emit('orderCancelled', orderId);
  }

  async listOrders(state?: 'PENDING' | 'FILLED' | 'CANCELLED'): Promise<OandaOrder[]> {
    const { data } = await this.client.get(`/accounts/${this.accountId}/orders`, {
      params: state ? { state } : {},
    });
    return data.orders || [];
  }

  // ============ POSITIONS ============

  async getPositions(): Promise<OandaPosition[]> {
    const { data } = await this.client.get(`/accounts/${this.accountId}/openPositions`);
    return (data.positions || []).map((p: any) => ({
      instrument: p.instrument,
      long: {
        units: parseInt(p.long?.units || '0'),
        averagePrice: parseFloat(p.long?.averagePrice || '0'),
        pl: parseFloat(p.long?.pl || '0'),
        unrealizedPL: parseFloat(p.long?.unrealizedPL || '0'),
      },
      short: {
        units: parseInt(p.short?.units || '0'),
        averagePrice: parseFloat(p.short?.averagePrice || '0'),
        pl: parseFloat(p.short?.pl || '0'),
        unrealizedPL: parseFloat(p.short?.unrealizedPL || '0'),
      },
      pl: parseFloat(p.pl || '0'),
      unrealizedPL: parseFloat(p.unrealizedPL || '0'),
      marginUsed: parseFloat(p.marginUsed || '0'),
    }));
  }

  async closePosition(instrument: string, side?: 'long' | 'short'): Promise<void> {
    if (side) {
      await this.client.put(`/accounts/${this.accountId}/positions/${instrument}/close`, { longUnits: 'ALL' });
    } else {
      await this.client.put(`/accounts/${this.accountId}/positions/${instrument}/close`);
    }
    this.emit('positionClosed', instrument);
  }

  // ============ MARKET DATA ============

  async getCandles(instrument: string, granularity = 'H1', count = 100): Promise<OandaCandle[]> {
    // Granularity: S5, S10, S30, M1, M5, M15, M30, H1, H4, D, W, M
    const { data } = await this.client.get(`/instruments/${instrument}/candles`, {
      params: { granularity, count, price: 'M' },
    });
    return data.candles || [];
  }

  async getLatestPrice(instrument: string): Promise<{ bid: number; ask: number; mid: number }> {
    const { data } = await this.client.get(`/instruments/${instrument}/pricing`, {
      params: { includeHomeConversions: false },
    });
    const price = data.prices[0];
    const bid = parseFloat(price.bids[0].price);
    const ask = parseFloat(price.asks[0].price);
    return { bid, ask, mid: (bid + ask) / 2 };
  }

  async getInstruments(instruments?: string[]): Promise<any[]> {
    const { data } = await this.client.get('/instruments', {
      params: instruments ? { instruments: instruments.join(',') } : {},
    });
    return data.instruments || [];
  }

  // ============ STREAMING ============

  async streamPrices(instruments: string[]): Promise<void> {
    const url = `${this.streamUrl}/accounts/${this.accountId}/pricing/stream?instruments=${instruments.join(',')}`;
    console.log(`📡 Streaming OANDA prices for: ${instruments.join(', ')}`);

    // In production, this would use a streaming HTTP connection
    // For now, we simulate with polling
    const poll = async () => {
      for (const instrument of instruments) {
        try {
          const price = await this.getLatestPrice(instrument);
          this.emit('price', { instrument, ...price, timestamp: Date.now() });
        } catch (e) {
          console.error(`OANDA price error for ${instrument}:`, e);
        }
      }
    };

    await poll();
    // In production: use EventSource or fetch streaming
  }

  // ============ TRADES ============

  async listTrades(state?: 'OPEN' | 'CLOSED' | 'ALL'): Promise<any[]> {
    const { data } = await this.client.get(`/accounts/${this.accountId}/trades`, {
      params: state ? { state } : {},
    });
    return data.trades || [];
  }

  async closeTrade(tradeId: string, units?: number): Promise<void> {
    await this.client.put(`/accounts/${this.accountId}/trades/${tradeId}/close`, units ? { units: String(units) } : {});
    this.emit('tradeClosed', tradeId);
  }
}
