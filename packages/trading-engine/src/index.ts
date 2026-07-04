// TradeOS Trading Engine — Core order execution and routing
// Handles order validation, risk checks, and multi-exchange routing

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type OrderStatus = 'PENDING' | 'SUBMITTED' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface OrderRequest {
  id: string;
  symbol: string;
  exchange: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  portfolioId: string;
  userId: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'GTD';
  expiresAt?: Date;
}

export interface OrderResult {
  orderId: string;
  exchangeOrderId?: string;
  status: OrderStatus;
  filledQty: number;
  avgFillPrice?: number;
  totalCost?: number;
  fee?: number;
  error?: string;
  timestamp: number;
}

export interface RiskConfig {
  maxPositionSize: number;       // Max $ per position
  maxPortfolioExposure: number;  // Max % of portfolio invested
  maxSingleTradeRisk: number;    // Max % risk per trade
  maxDailyLoss: number;          // Max $ daily loss
  maxOpenPositions: number;      // Max concurrent positions
  allowedExchanges: string[];
}

// ============ TRADING ENGINE ============

export class TradingEngine {
  private orders: Map<string, OrderRequest> = new Map();
  private fills: Map<string, OrderResult> = new Map();
  private riskConfig: RiskConfig;
  private dailyPnL: number = 0;
  private openPositionCount: number = 0;

  constructor(riskConfig?: Partial<RiskConfig>) {
    this.riskConfig = {
      maxPositionSize: 50000,
      maxPortfolioExposure: 0.80,
      maxSingleTradeRisk: 0.02,
      maxDailyLoss: 5000,
      maxOpenPositions: 20,
      allowedExchanges: ['binance', 'binance_futures', 'coinbase', 'alpaca', 'oanda'],
      ...riskConfig,
    };
  }

  // ============ ORDER VALIDATION ============

  validateOrder(order: OrderRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check exchange
    if (!this.riskConfig.allowedExchanges.includes(order.exchange)) {
      errors.push(`Exchange not allowed: ${order.exchange}`);
    }

    // Check quantity
    if (order.quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    // Check price for limit orders
    if (order.type === 'LIMIT' || order.type === 'STOP_LIMIT') {
      if (!order.price || order.price <= 0) {
        errors.push('Limit orders require a valid price');
      }
    }

    // Check stop price
    if (order.type === 'STOP' || order.type === 'STOP_LIMIT') {
      if (!order.stopPrice || order.stopPrice <= 0) {
        errors.push('Stop orders require a stop price');
      }
    }

    // Risk checks
    const estimatedCost = order.quantity * (order.price || this.getMarketPrice(order.symbol));

    if (estimatedCost > this.riskConfig.maxPositionSize) {
      errors.push(`Position size $${estimatedCost.toFixed(2)} exceeds max $${this.riskConfig.maxPositionSize}`);
    }

    if (this.openPositionCount >= this.riskConfig.maxOpenPositions) {
      errors.push(`Max open positions (${this.riskConfig.maxOpenPositions}) reached`);
    }

    if (this.dailyPnL <= -this.riskConfig.maxDailyLoss) {
      errors.push(`Daily loss limit ($${this.riskConfig.maxDailyLoss}) reached — trading halted`);
    }

    return { valid: errors.length === 0, errors };
  }

  // ============ ORDER EXECUTION ============

  async executeOrder(order: OrderRequest): Promise<OrderResult> {
    // Validate
    const validation = this.validateOrder(order);
    if (!validation.valid) {
      return {
        orderId: order.id,
        status: 'REJECTED',
        filledQty: 0,
        error: validation.errors.join('; '),
        timestamp: Date.now(),
      };
    }

    this.orders.set(order.id, order);

    // Simulate exchange submission
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

    // Simulate fill (in production, this would poll the exchange API)
    const fillPrice = order.type === 'MARKET'
      ? this.getMarketPrice(order.symbol)
      : order.price || this.getMarketPrice(order.symbol);

    const filledQty = order.quantity;
    const totalCost = filledQty * fillPrice;
    const fee = totalCost * this.getFeeRate(order.exchange);

    const result: OrderResult = {
      orderId: order.id,
      exchangeOrderId: `EX-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      status: 'FILLED',
      filledQty,
      avgFillPrice: fillPrice,
      totalCost,
      fee,
      timestamp: Date.now(),
    };

    this.fills.set(order.id, result);
    this.openPositionCount++;
    console.log(`✅ Order filled: ${order.side} ${filledQty} ${order.symbol} @ $${fillPrice} (fee: $${fee.toFixed(2)})`);

    return result;
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    const order = this.orders.get(orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const fill = this.fills.get(orderId);
    if (fill && fill.status === 'FILLED') {
      return { success: false, message: 'Cannot cancel filled order' };
    }

    this.orders.delete(orderId);
    return { success: true, message: 'Order cancelled' };
  }

  // ============ POSITION MANAGEMENT ============

  closePosition(symbol: string, exchange: string): OrderResult | null {
    // In production, this would create a counter-order to close the position
    const fill = Array.from(this.fills.values()).find(
      (f) => f.avgFillPrice !== undefined
    );
    return fill || null;
  }

  // ============ RISK MANAGEMENT ============

  updateRiskConfig(config: Partial<RiskConfig>): void {
    this.riskConfig = { ...this.riskConfig, ...config };
    console.log('⚠️ Risk config updated:', config);
  }

  getRiskMetrics(): {
    dailyPnL: number;
    openPositions: number;
    maxPositions: number;
    exposure: number;
    maxExposure: number;
  } {
    return {
      dailyPnL: this.dailyPnL,
      openPositions: this.openPositionCount,
      maxPositions: this.riskConfig.maxOpenPositions,
      exposure: 0, // Would calculate from actual portfolio
      maxExposure: this.riskConfig.maxPortfolioExposure,
    };
  }

  // ============ HELPERS ============

  private getMarketPrice(symbol: string): number {
    const prices: Record<string, number> = {
      BTC: 65432, ETH: 3521, SOL: 142, AAPL: 214, TSLA: 248,
      EURUSD: 1.0842, XAU: 2387, ADA: 0.45, AVAX: 28.5, DOT: 6.2,
    };
    return prices[symbol] || 100;
  }

  private getFeeRate(exchange: string): number {
    const fees: Record<string, number> = {
      binance: 0.001,      // 0.1%
      binance_futures: 0.0004, // 0.04%
      coinbase: 0.006,     // 0.6%
      alpaca: 0.0,         // Commission-free
      oanda: 0.0001,       // Spread-based
    };
    return fees[exchange] || 0.001;
  }

  // ============ ORDER HISTORY ============

  getOrderHistory(userId?: string): OrderRequest[] {
    const orders = Array.from(this.orders.values());
    if (userId) return orders.filter((o) => o.userId === userId);
    return orders;
  }

  getFills(orderId?: string): OrderResult[] {
    if (orderId) {
      const fill = this.fills.get(orderId);
      return fill ? [fill] : [];
    }
    return Array.from(this.fills.values());
  }
}

// ============ EXPORTS ============

export { TradingEngine };
export type { OrderRequest, OrderResult, RiskConfig, OrderSide, OrderType, OrderStatus };
