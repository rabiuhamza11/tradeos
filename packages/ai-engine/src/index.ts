// TradeOS AI Engine — 6 specialized trading agents
// Each agent has its own strategy, risk profile, and decision logic

export type AgentType = 'scalper' | 'swing' | 'arbitrage' | 'risk_manager' | 'sentiment' | 'rebalancer';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  strategy: string;
  riskLevel: RiskLevel;
  isActive: boolean;
  config: {
    maxPositions: number;
    maxRiskPerTrade: number;
    timeframe: string;
    indicators: string[];
  };
}

export interface Signal {
  agentType: AgentType;
  symbol: string;
  exchange: string;
  side: 'BUY' | 'SELL';
  strength: number; // 0-100
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  reason: string;
  timestamp: number;
}

export interface AgentExecution {
  id: string;
  agentType: AgentType;
  signals: Signal[];
  pnl: number;
  tradesExecuted: number;
  startedAt: number;
  completedAt: number;
  duration: number;
}

// ============ AGENT DEFINITIONS ============

export const AGENTS: Record<AgentType, AgentConfig> = {
  scalper: {
    id: 'agent-scalper', name: 'Scalper Agent', type: 'scalper',
    description: 'High-frequency micro-profit trading',
    strategy: 'scalping', riskLevel: 'MEDIUM', isActive: true,
    config: { maxPositions: 10, maxRiskPerTrade: 0.005, timeframe: '1m', indicators: ['RSI', 'VWAP', 'Volume'] },
  },
  swing: {
    id: 'agent-swing', name: 'Swing Agent', type: 'swing',
    description: 'Multi-day trend capture',
    strategy: 'swing', riskLevel: 'MEDIUM', isActive: true,
    config: { maxPositions: 5, maxRiskPerTrade: 0.02, timeframe: '4h', indicators: ['EMA', 'MACD', 'Support/Resistance'] },
  },
  arbitrage: {
    id: 'agent-arb', name: 'Arbitrage Agent', type: 'arbitrage',
    description: 'Cross-exchange price gap exploitation',
    strategy: 'arbitrage', riskLevel: 'LOW', isActive: true,
    config: { maxPositions: 3, maxRiskPerTrade: 0.01, timeframe: '1s', indicators: ['Spread', 'OrderBook'] },
  },
  risk_manager: {
    id: 'agent-risk', name: 'Risk Manager', type: 'risk_manager',
    description: 'Position sizing and exposure limits',
    strategy: 'risk_management', riskLevel: 'LOW', isActive: true,
    config: { maxPositions: 0, maxRiskPerTrade: 0, timeframe: '1h', indicators: ['VaR', 'Sharpe', 'Drawdown'] },
  },
  sentiment: {
    id: 'agent-sentiment', name: 'Sentiment Agent', type: 'sentiment',
    description: 'News and social sentiment analysis',
    strategy: 'sentiment', riskLevel: 'HIGH', isActive: false,
    config: { maxPositions: 5, maxRiskPerTrade: 0.03, timeframe: '1h', indicators: ['News', 'Twitter', 'Reddit'] },
  },
  rebalancer: {
    id: 'agent-rebal', name: 'Portfolio Rebalancer', type: 'rebalancer',
    description: 'Auto-rebalance portfolio allocations',
    strategy: 'rebalancing', riskLevel: 'LOW', isActive: false,
    config: { maxPositions: 10, maxRiskPerTrade: 0.01, timeframe: '1d', indicators: ['Allocation', 'Correlation'] },
  },
};

// ============ AI ENGINE ============

export class AIEngine {
  private agents: Map<AgentType, AgentConfig> = new Map();
  private executions: AgentExecution[] = [];
  private activeSignals: Signal[] = [];

  constructor() {
    for (const [type, config] of Object.entries(AGENTS)) {
      this.agents.set(type as AgentType, config);
    }
  }

  getAgent(type: AgentType): AgentConfig | null {
    return this.agents.get(type) || null;
  }

  getActiveAgents(): AgentConfig[] {
    return Array.from(this.agents.values()).filter((a) => a.isActive);
  }

  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  toggleAgent(type: AgentType, active: boolean): void {
    const agent = this.agents.get(type);
    if (agent) {
      agent.isActive = active;
      console.log(`${active ? '▶️' : '⏸️'} Agent ${agent.name} ${active ? 'activated' : 'paused'}`);
    }
  }

  // Generate trading signals for a symbol
  async generateSignals(symbol: string, exchange: string, currentPrice: number): Promise<Signal[]> {
    const signals: Signal[] = [];
    const activeAgents = this.getActiveAgents();

    for (const agent of activeAgents) {
      if (agent.type === 'risk_manager') continue; // Risk manager doesn't generate buy/sell signals

      const signal = this.analyzeMarket(agent, symbol, exchange, currentPrice);
      if (signal && signal.strength > 50) {
        signals.push(signal);
      }
    }

    this.activeSignals = [...this.activeSignals, ...signals];
    return signals;
  }

  private analyzeMarket(agent: AgentConfig, symbol: string, exchange: string, price: number): Signal | null {
    // Simulate market analysis (in production, this would use real indicators + ML models)
    const strength = Math.floor(Math.random() * 100);
    const isBullish = Math.random() > 0.4;
    const riskPct = agent.config.maxRiskPerTrade;

    const entryPrice = price;
    const targetPrice = isBullish
      ? price * (1 + riskPct * 3)
      : price * (1 - riskPct * 3);
    const stopLoss = isBullish
      ? price * (1 - riskPct)
      : price * (1 + riskPct);

    const reasons: Record<AgentType, string> = {
      scalper: `RSI oversold/overbought detected on 1m chart. Volume spike confirmed.`,
      swing: `EMA crossover on 4h. MACD histogram expanding. Trend continuation likely.`,
      arbitrage: `Price spread detected between ${exchange} and secondary exchange. Profit opportunity.`,
      risk_manager: `Risk assessment complete. Adjusting position sizes.`,
      sentiment: `Sentiment score: ${strength > 60 ? 'Bullish' : 'Bearish'} based on news + social analysis.`,
      rebalancer: `Portfolio drift detected. Rebalancing to target allocation.`,
    };

    return {
      agentType: agent.type,
      symbol,
      exchange,
      side: isBullish ? 'BUY' : 'SELL',
      strength,
      entryPrice,
      targetPrice,
      stopLoss,
      reason: reasons[agent.type],
      timestamp: Date.now(),
    };
  }

  // Execute an agent cycle
  async runAgent(agentType: AgentType, symbols: string[]): Promise<AgentExecution> {
    const agent = this.getAgent(agentType);
    if (!agent) throw new Error(`Agent not found: ${agentType}`);

    const startTime = Date.now();
    const signals: Signal[] = [];

    for (const symbol of symbols) {
      const price = this.getMockPrice(symbol);
      const signal = await this.generateSignals(symbol, agent.config.indicators.length > 0 ? 'binance' : 'binance', price);
      signals.push(...signal);
    }

    const execution: AgentExecution = {
      id: `exec-${Date.now()}`,
      agentType,
      signals,
      pnl: signals.length * (Math.random() - 0.3) * 500,
      tradesExecuted: signals.filter((s) => s.strength > 70).length,
      startedAt: startTime,
      completedAt: Date.now(),
      duration: Date.now() - startTime,
    };

    this.executions.push(execution);
    console.log(`🤖 ${agent.name} executed: ${signals.length} signals, ${execution.tradesExecuted} trades, P&L: $${execution.pnl.toFixed(2)}`);
    return execution;
  }

  // Risk manager: assess portfolio risk
  assessRisk(positions: { symbol: string; value: number; pnl: number }[]): {
    totalExposure: number;
    riskScore: number;
    recommendations: string[];
  } {
    const totalValue = positions.reduce((s, p) => s + p.value, 0);
    const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);
    const maxPosition = Math.max(...positions.map((p) => p.value));
    const concentration = (maxPosition / totalValue) * 100;

    const recommendations: string[] = [];
    let riskScore = 0;

    if (concentration > 40) {
      riskScore += 30;
      recommendations.push(`High concentration risk: largest position is ${concentration.toFixed(1)}% of portfolio. Consider diversifying.`);
    }
    if (totalPnl < 0) {
      riskScore += 20;
      recommendations.push('Portfolio is in negative territory. Consider reducing exposure.');
    }
    if (positions.length < 3) {
      riskScore += 15;
      recommendations.push('Low diversification. Add positions in different asset classes.');
    }
    if (riskScore < 10) {
      recommendations.push('Risk levels are within acceptable range.');
    }

    return {
      totalExposure: totalValue,
      riskScore: Math.min(riskScore, 100),
      recommendations,
    };
  }

  getExecutionHistory(agentType?: AgentType): AgentExecution[] {
    if (agentType) return this.executions.filter((e) => e.agentType === agentType);
    return this.executions;
  }

  getActiveSignals(): Signal[] {
    return this.activeSignals;
  }

  private getMockPrice(symbol: string): number {
    const prices: Record<string, number> = {
      BTC: 65432, ETH: 3521, SOL: 142, AAPL: 214, TSLA: 248,
      EURUSD: 1.0842, ADA: 0.45, AVAX: 28.5,
    };
    return prices[symbol] || 100;
  }
}

// ============ EXPORTS ============

export { AIEngine, AGENTS };
export type { AgentConfig, Signal, AgentExecution, AgentType, RiskLevel };
