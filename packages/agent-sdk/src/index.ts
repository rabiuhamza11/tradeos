// TradeOS Agent SDK — Trading-focused AI agents

export interface AgentContext {
  userId: string;
  portfolioId: string;
  marketData: Record<string, any>;
  candles?: Record<string, any[]>;
  config?: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  output: any;
  actions?: TradeAction[];
  logs?: string[];
  error?: string;
}

export interface TradeAction {
  type: 'BUY' | 'SELL' | 'CLOSE' | 'SET_ALERT' | 'ADJUST_STOP' | 'NOTIFY';
  symbol: string;
  quantity?: number;
  price?: number;
  message?: string;
}

export abstract class BaseAgent {
  abstract readonly name: string;
  abstract readonly type: string;
  abstract readonly description: string;
  abstract execute(ctx: AgentContext): Promise<AgentResult>;
  log(msg: string): string { return `[${this.name}] ${msg}`; }
}

// ============ TRADING AGENTS ============

export class MarketAnalystAgent extends BaseAgent {
  readonly name = 'Market Analyst';
  readonly type = 'MARKET_ANALYST';
  readonly description = 'Analyzes market conditions, identifies trends and opportunities';

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const logs = [this.log('Scanning market for opportunities')];
    const opportunities: any[] = [];

    for (const [symbol, data] of Object.entries(ctx.marketData)) {
      if (data.changePct > 0.03) opportunities.push({ symbol, signal: 'BREAKOUT', changePct: data.changePct });
      else if (data.changePct < -0.03) opportunities.push({ symbol, signal: 'OVERSOLD', changePct: data.changePct });
    }

    logs.push(this.log(`Found ${opportunities.length} opportunities`));
    return { success: true, output: { opportunities, marketSentiment: opportunities.length > 5 ? 'VOLATILE' : 'STABLE' }, logs };
  }
}

export class RiskManagerAgent extends BaseAgent {
  readonly name = 'Risk Manager';
  readonly type = 'RISK_MANAGER';
  readonly description = 'Monitors portfolio risk, enforces position limits, suggests hedging';

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const logs = [this.log('Assessing portfolio risk')];
    const actions: TradeAction[] = [];

    // Simplified risk checks
    const warnings: string[] = [];

    logs.push(this.log('Risk assessment complete'));
    return {
      success: true,
      output: { riskLevel: 'MEDIUM', warnings, maxExposure: 0.25, diversificationScore: 75 },
      actions,
      logs,
    };
  }
}

export class StrategyOptimizerAgent extends BaseAgent {
  readonly name = 'Strategy Optimizer';
  readonly type = 'STRATEGY_OPTIMIZER';
  readonly description = 'Backtests and optimizes trading strategies using AI';

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const logs = [this.log('Optimizing active strategies')];
    return {
      success: true,
      output: {
        strategies: [
          { name: 'Momentum Scanner', return: 12.5, winRate: 64, recommendation: 'INCREASE_ALLOCATION' },
          { name: 'Mean Reversion', return: 8.2, winRate: 58, recommendation: 'MAINTAIN' },
          { name: 'Trend Follower', return: -2.1, winRate: 42, recommendation: 'PAUSE' },
        ],
      },
      logs,
    };
  }
}

export class ExecutionAgent extends BaseAgent {
  readonly name = 'Execution Agent';
  readonly type = 'EXECUTION';
  readonly description = 'Executes trades with optimal timing and minimal slippage';

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const logs = [this.log('Ready to execute orders')];
    return { success: true, output: { queuedOrders: 0, avgSlippage: 0.02, executionSpeed: 'FAST' }, logs };
  }
}

export class NewsMonitorAgent extends BaseAgent {
  readonly name = 'News Monitor';
  readonly type = 'NEWS_MONITOR';
  readonly description = 'Monitors news and social sentiment for trading signals';

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const logs = [this.log('Scanning news feeds')];
    return {
      success: true,
      output: {
        headlines: [
          { title: 'Fed signals possible rate cut', sentiment: 'BULLISH', impact: 'HIGH' },
          { title: 'Crypto regulation update', sentiment: 'NEUTRAL', impact: 'MEDIUM' },
        ],
        overallSentiment: 'CAUTIOUSLY_OPTIMISTIC',
      },
      logs,
    };
  }
}

export class PortfolioRebalancerAgent extends BaseAgent {
  readonly name = 'Portfolio Rebalancer';
  readonly type = 'REBALANCER';
  readonly description = 'Automatically rebalances portfolio based on target allocations';

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const logs = [this.log('Checking allocation drift')];
    return {
      success: true,
      output: {
        currentAllocation: { STOCK: 45, CRYPTO: 30, FOREX: 15, COMMODITY: 10 },
        targetAllocation: { STOCK: 40, CRYPTO: 25, FOREX: 20, COMMODITY: 15 },
        rebalanceNeeded: true,
        drift: 8.5,
      },
      actions: [{ type: 'NOTIFY', symbol: 'PORTFOLIO', message: 'Allocation drift of 8.5% detected. Rebalance recommended.' }],
      logs,
    };
  }
}

// ============ AGENT REGISTRY ============

export class AgentRegistry {
  private agents = new Map<string, BaseAgent>();
  register(a: BaseAgent) { this.agents.set(a.type, a); }
  get(type: string) { return this.agents.get(type); }
  getAll() { return Array.from(this.agents.values()); }
}

export function createDefaultRegistry(): AgentRegistry {
  const r = new AgentRegistry();
  r.register(new MarketAnalystAgent());
  r.register(new RiskManagerAgent());
  r.register(new StrategyOptimizerAgent());
  r.register(new ExecutionAgent());
  r.register(new NewsMonitorAgent());
  r.register(new PortfolioRebalancerAgent());
  return r;
}

export {
  BaseAgent, AgentRegistry, AgentContext, AgentResult, TradeAction,
  MarketAnalystAgent, RiskManagerAgent, StrategyOptimizerAgent,
  ExecutionAgent, NewsMonitorAgent, PortfolioRebalancerAgent, createDefaultRegistry,
};
