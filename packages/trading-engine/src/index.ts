// TradeOS Trading Engine — Core order execution, position management, and strategy runner

export interface OrderRequest {
  symbol: string;
  assetType: AssetType;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: TimeInForce;
  portfolioId: string;
}

export interface ExecutionResult {
  orderId: string;
  status: 'FILLED' | 'PARTIALLY_FILLED' | 'PENDING' | 'REJECTED';
  filledQty: number;
  avgFillPrice: number;
  fees: number;
  timestamp: number;
}

export enum AssetType { STOCK = 'STOCK', CRYPTO = 'CRYPTO', FOREX = 'FOREX', COMMODITY = 'COMMODITY', ETF = 'ETF', BOND = 'BOND', OPTION = 'OPTION', FUTURE = 'FUTURE' }
export enum OrderSide { BUY = 'BUY', SELL = 'SELL' }
export enum OrderType { MARKET = 'MARKET', LIMIT = 'LIMIT', STOP = 'STOP', STOP_LIMIT = 'STOP_LIMIT', TRAILING_STOP = 'TRAILING_STOP', BRACKET = 'BRACKET' }
export enum TimeInForce { GTC = 'GTC', IOC = 'IOC', FOK = 'FOK', DAY = 'DAY', GTT = 'GTT' }

// ============ ORDER MANAGER ============

export class OrderManager {
  private pendingOrders: Map<string, OrderRequest> = new Map();

  submit(order: OrderRequest): string {
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.pendingOrders.set(orderId, order);
    return orderId;
  }

  cancel(orderId: string): boolean {
    return this.pendingOrders.delete(orderId);
  }

  getPending(): OrderRequest[] {
    return Array.from(this.pendingOrders.values());
  }
}

// ============ POSITION MANAGER ============

export interface Position {
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  side: 'LONG' | 'SHORT';
}

export class PositionManager {
  private positions: Map<string, Position> = new Map();

  openOrUpdate(symbol: string, side: 'LONG' | 'SHORT', qty: number, price: number): Position {
    const existing = this.positions.get(symbol);
    if (existing) {
      if (side === 'LONG') {
        const newQty = existing.quantity + qty;
        const newAvg = (existing.avgEntryPrice * existing.quantity + price * qty) / newQty;
        const updated = { ...existing, quantity: newQty, avgEntryPrice: newAvg, currentPrice: price, marketValue: newQty * price, unrealizedPnL: (price - newAvg) * newQty };
        this.positions.set(symbol, updated);
        return updated;
      } else {
        const remaining = existing.quantity - qty;
        if (remaining <= 0) {
          const realized = (price - existing.avgEntryPrice) * existing.quantity;
          this.positions.delete(symbol);
          return { ...existing, quantity: 0, realizedPnL: existing.realizedPnL + realized, marketValue: 0, unrealizedPnL: 0 };
        }
        const realized = (price - existing.avgEntryPrice) * qty;
        const updated = { ...existing, quantity: remaining, currentPrice: price, marketValue: remaining * price, realizedPnL: existing.realizedPnL + realized, unrealizedPnL: (price - existing.avgEntryPrice) * remaining };
        this.positions.set(symbol, updated);
        return updated;
      }
    }
    const pos: Position = { symbol, quantity: qty, avgEntryPrice: price, currentPrice: price, marketValue: qty * price, unrealizedPnL: 0, realizedPnL: 0, side };
    this.positions.set(symbol, pos);
    return pos;
  }

  close(symbol: string, price: number): Position | null {
    const pos = this.positions.get(symbol);
    if (!pos) return null;
    const realized = (price - pos.avgEntryPrice) * pos.quantity;
    this.positions.delete(symbol);
    return { ...pos, realizedPnL: pos.realizedPnL + realized, quantity: 0, marketValue: 0, unrealizedPnL: 0 };
  }

  updatePrice(symbol: string, newPrice: number): void {
    const pos = this.positions.get(symbol);
    if (pos) {
      pos.currentPrice = newPrice;
      pos.marketValue = pos.quantity * newPrice;
      pos.unrealizedPnL = (newPrice - pos.avgEntryPrice) * pos.quantity;
    }
  }

  getAll(): Position[] { return Array.from(this.positions.values()); }
  getTotalValue(): number { return this.positions.values().reduce((s, p) => s + p.marketValue, 0); }
  getTotalPnL(): number { return this.positions.values().reduce((s, p) => s + p.unrealizedPnL + p.realizedPnL, 0); }
}

// ============ STRATEGY RUNNER ============

export interface StrategyConfig {
  name: string;
  type: 'TREND_FOLLOWING' | 'MEAN_REVERSION' | 'MOMENTUM' | 'SCALPING' | 'SWING' | 'AI_PREDICTION';
  symbols: string[];
  maxPositions: number;
  riskPerTrade: number; // % of portfolio
  stopLossPct?: number;
  takeProfitPct?: number;
  enabled: boolean;
}

export class StrategyRunner {
  private strategies: Map<string, StrategyConfig> = new Map();

  register(config: StrategyConfig): string {
    const id = `strat_${Date.now()}`;
    this.strategies.set(id, { ...config, enabled: true });
    console.log(`📊 Strategy registered: ${config.name} (${config.type})`);
    return id;
  }

  async evaluate(id: string, marketData: Record<string, any>): Promise<OrderRequest[]> {
    const strat = this.strategies.get(id);
    if (!strat || !strat.enabled) return [];

    const orders: OrderRequest[] = [];
    for (const symbol of strat.symbols) {
      const data = marketData[symbol];
      if (!data) continue;

      // Simplified strategy logic — in production, use real indicators
      if (strat.type === 'TREND_FOLLOWING' && data.changePct > 0.02) {
        orders.push({ symbol, assetType: AssetType.CRYPTO, side: OrderSide.BUY, type: OrderType.MARKET, quantity: 1, portfolioId: 'default' });
      } else if (strat.type === 'MEAN_REVERSION' && data.changePct < -0.02) {
        orders.push({ symbol, assetType: AssetType.CRYPTO, side: OrderSide.BUY, type: OrderType.MARKET, quantity: 1, portfolioId: 'default' });
      } else if (strat.type === 'MOMENTUM' && data.volume > 1000000) {
        orders.push({ symbol, assetType: AssetType.STOCK, side: data.changePct > 0 ? OrderSide.BUY : OrderSide.SELL, type: OrderType.MARKET, quantity: 1, portfolioId: 'default' });
      }
    }
    return orders;
  }

  pause(id: string): void {
    const s = this.strategies.get(id);
    if (s) s.enabled = false;
  }

  resume(id: string): void {
    const s = this.strategies.get(id);
    if (s) s.enabled = true;
  }

  getAll(): StrategyConfig[] { return Array.from(this.strategies.values()); }
}

// ============ RISK MANAGER ============

export class RiskManager {
  checkOrder(order: OrderRequest, portfolioValue: number, currentExposure: number): { allowed: boolean; reason?: string } {
    const orderValue = (order.price || 0) * order.quantity;
    const maxExposure = portfolioValue * 0.25; // Max 25% per position
    if (orderValue > maxExposure) return { allowed: false, reason: 'Order exceeds max position size (25% of portfolio)' };
    if (currentExposure + orderValue > portfolioValue * 2) return { allowed: false, reason: 'Total exposure exceeds 2x portfolio value' };
    return { allowed: true };
  }

  calculatePositionSize(portfolioValue: number, entryPrice: number, stopLoss: number, riskPct: number = 1): number {
    const riskAmount = portfolioValue * (riskPct / 100);
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    return riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
  }
}

export { OrderManager, PositionManager, StrategyRunner, RiskManager };
