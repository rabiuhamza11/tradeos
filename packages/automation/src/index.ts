// TradeOS — Automation Package
// Strategy automation, scheduled trading, and rule-based execution

import { EventEmitter } from 'events';

export type AutomationType = 'scheduled' | 'condition' | 'rebalance' | 'dca' | 'grid';
export type AutomationStatus = 'active' | 'paused' | 'completed' | 'failed';

export interface AutomationRule {
  id: string;
  name: string;
  type: AutomationType;
  status: AutomationStatus;
  userId: string;
  config: any;
  trigger: AutomationTrigger;
  action: AutomationAction;
  lastRun?: number;
  nextRun?: number;
  runCount: number;
  successCount: number;
  failCount: number;
  createdAt: number;
}

export interface AutomationTrigger {
  type: 'time' | 'price' | 'indicator' | 'portfolio' | 'event';
  conditions: TriggerCondition[];
}

export interface TriggerCondition {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'crosses_above' | 'crosses_below' | 'change_pct';
  value: number;
  timeframe?: string;
}

export interface AutomationAction {
  type: 'place_order' | 'close_position' | 'rebalance' | 'notify' | 'stop_trading' | 'move_stoploss';
  params: Record<string, any>;
}

export class AutomationEngine extends EventEmitter {
  private rules: Map<string, AutomationRule> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private priceCache: Map<string, number> = new Map();

  // ============ RULE MANAGEMENT ============

  createRule(rule: Omit<AutomationRule, 'id' | 'status' | 'runCount' | 'successCount' | 'failCount' | 'createdAt'>): AutomationRule {
    const automation: AutomationRule = {
      ...rule,
      id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      status: 'active',
      runCount: 0,
      successCount: 0,
      failCount: 0,
      createdAt: Date.now(),
    };

    this.rules.set(automation.id, automation);
    this.scheduleRule(automation);
    this.emit('ruleCreated', automation);
    console.log(`✅ Automation rule created: ${automation.name} (${automation.type})`);

    return automation;
  }

  updateRule(id: string, updates: Partial<AutomationRule>): AutomationRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;

    const updated = { ...rule, ...updates };
    this.rules.set(id, updated);

    // Reschedule if trigger changed
    if (updates.trigger) {
      this.cancelSchedule(id);
      this.scheduleRule(updated);
    }

    this.emit('ruleUpdated', updated);
    return updated;
  }

  deleteRule(id: string): boolean {
    this.cancelSchedule(id);
    const deleted = this.rules.delete(id);
    if (deleted) this.emit('ruleDeleted', id);
    return deleted;
  }

  pauseRule(id: string): void {
    const rule = this.rules.get(id);
    if (rule) {
      rule.status = 'paused';
      this.cancelSchedule(id);
      this.emit('rulePaused', id);
    }
  }

  resumeRule(id: string): void {
    const rule = this.rules.get(id);
    if (rule && rule.status === 'paused') {
      rule.status = 'active';
      this.scheduleRule(rule);
      this.emit('ruleResumed', id);
    }
  }

  getRules(userId?: string): AutomationRule[] {
    const rules = Array.from(this.rules.values());
    if (userId) return rules.filter((r) => r.userId === userId);
    return rules;
  }

  getActiveRules(userId?: string): AutomationRule[] {
    return this.getRules(userId).filter((r) => r.status === 'active');
  }

  // ============ SCHEDULING ============

  private scheduleRule(rule: AutomationRule): void {
    if (rule.status !== 'active') return;

    switch (rule.trigger.type) {
      case 'time':
        this.scheduleTimeRule(rule);
        break;
      case 'price':
        this.schedulePriceRule(rule);
        break;
      case 'indicator':
        this.scheduleIndicatorRule(rule);
        break;
      case 'portfolio':
        this.schedulePortfolioRule(rule);
        break;
      case 'event':
        // Event-based rules are triggered externally
        break;
    }
  }

  private scheduleTimeRule(rule: AutomationRule): void {
    const config = rule.config;
    const interval = config.intervalMs || 60000; // Default 1 min

    const timer = setInterval(async () => {
      await this.executeRule(rule.id);
    }, interval);

    this.intervals.set(rule.id, timer);
  }

  private schedulePriceRule(rule: AutomationRule): void {
    const interval = 5000; // Check prices every 5 seconds

    const timer = setInterval(async () => {
      for (const condition of rule.trigger.conditions) {
        const currentPrice = this.priceCache.get(condition.field) || 0;
        if (this.evaluateCondition(condition, currentPrice)) {
          await this.executeRule(rule.id);
          break;
        }
      }
    }, interval);

    this.intervals.set(rule.id, timer);
  }

  private scheduleIndicatorRule(rule: AutomationRule): void {
    const interval = 15000; // Check indicators every 15 seconds

    const timer = setInterval(async () => {
      // In production: fetch actual indicator values
      for (const condition of rule.trigger.conditions) {
        const value = Math.random() * 100; // Mock indicator value
        if (this.evaluateCondition(condition, value)) {
          await this.executeRule(rule.id);
          break;
        }
      }
    }, interval);

    this.intervals.set(rule.id, timer);
  }

  private schedulePortfolioRule(rule: AutomationRule): void {
    const interval = 30000; // Check portfolio every 30 seconds

    const timer = setInterval(async () => {
      // In production: fetch actual portfolio metrics
      for (const condition of rule.trigger.conditions) {
        const value = Math.random() * 100; // Mock portfolio metric
        if (this.evaluateCondition(condition, value)) {
          await this.executeRule(rule.id);
          break;
        }
      }
    }, interval);

    this.intervals.set(rule.id, timer);
  }

  // ============ EXECUTION ============

  private async executeRule(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule || rule.status !== 'active') return;

    rule.lastRun = Date.now();
    rule.runCount++;
    this.emit('ruleExecuting', rule);

    console.log(`🤖 Executing automation: ${rule.name}`);

    try {
      switch (rule.action.type) {
        case 'place_order':
          this.emit('placeOrder', { rule, params: rule.action.params });
          break;
        case 'close_position':
          this.emit('closePosition', { rule, params: rule.action.params });
          break;
        case 'rebalance':
          this.emit('rebalance', { rule, params: rule.action.params });
          break;
        case 'notify':
          this.emit('notify', { rule, params: rule.action.params });
          break;
        case 'stop_trading':
          this.emit('stopTrading', { rule });
          this.pauseRule(ruleId);
          break;
        case 'move_stoploss':
          this.emit('moveStopLoss', { rule, params: rule.action.params });
          break;
      }

      rule.successCount++;
      this.emit('ruleSucceeded', rule);
    } catch (error: any) {
      rule.failCount++;
      rule.status = 'failed';
      this.emit('ruleFailed', { rule, error: error.message });
      console.error(`❌ Automation failed: ${rule.name} — ${error.message}`);
    }
  }

  // ============ CONDITION EVALUATION ============

  private evaluateCondition(condition: TriggerCondition, currentValue: number): boolean {
    switch (condition.operator) {
      case 'gt': return currentValue > condition.value;
      case 'gte': return currentValue >= condition.value;
      case 'lt': return currentValue < condition.value;
      case 'lte': return currentValue <= condition.value;
      case 'eq': return currentValue === condition.value;
      case 'crosses_above': return currentValue > condition.value; // Simplified
      case 'crosses_below': return currentValue < condition.value; // Simplified
      case 'change_pct': return Math.abs(currentValue - condition.value) / condition.value * 100 > 5;
      default: return false;
    }
  }

  // ============ PRICE UPDATES ============

  updatePrice(symbol: string, price: number): void {
    this.priceCache.set(symbol, price);
  }

  // ============ DCA (Dollar Cost Averaging) ============

  createDCA(params: {
    userId: string;
    symbol: string;
    exchange: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
  }): AutomationRule {
    const intervalMs = {
      daily: 86400000,
      weekly: 604800000,
      monthly: 2592000000,
    }[params.frequency];

    return this.createRule({
      name: `DCA — ${params.symbol} ${params.frequency}`,
      type: 'dca',
      userId: params.userId,
      config: { ...params, intervalMs },
      trigger: { type: 'time', conditions: [{ field: 'time', operator: 'gt', value: intervalMs }] },
      action: {
        type: 'place_order',
        params: { symbol: params.symbol, exchange: params.exchange, side: 'BUY', type: 'MARKET', amount: params.amount },
      },
    });
  }

  // ============ GRID TRADING ============

  createGrid(params: {
    userId: string;
    symbol: string;
    exchange: string;
    upperLimit: number;
    lowerLimit: number;
    grids: number;
    totalInvestment: number;
  }): AutomationRule {
    const gridSpacing = (params.upperLimit - params.lowerLimit) / params.grids;
    const orderAmount = params.totalInvestment / params.grids;

    return this.createRule({
      name: `Grid — ${params.symbol} (${params.grids} levels)`,
      type: 'grid',
      userId: params.userId,
      config: { ...params, gridSpacing, orderAmount },
      trigger: { type: 'price', conditions: [{ field: params.symbol, operator: 'change_pct', value: gridSpacing }] },
      action: {
        type: 'place_order',
        params: { symbol: params.symbol, exchange: params.exchange, amount: orderAmount },
      },
    });
  }

  // ============ CLEANUP ============

  private cancelSchedule(ruleId: string): void {
    const timer = this.intervals.get(ruleId);
    if (timer) {
      clearInterval(timer);
      this.intervals.delete(ruleId);
    }
  }

  destroy(): void {
    for (const [id] of this.intervals) {
      this.cancelSchedule(id);
    }
    this.rules.clear();
  }

  // ============ STATS ============

  getStats(userId?: string): {
    total: number;
    active: number;
    paused: number;
    totalRuns: number;
    successRate: number;
  } {
    const rules = this.getRules(userId);
    const totalRuns = rules.reduce((s, r) => s + r.runCount, 0);
    const totalSuccess = rules.reduce((s, r) => s + r.successCount, 0);

    return {
      total: rules.length,
      active: rules.filter((r) => r.status === 'active').length,
      paused: rules.filter((r) => r.status === 'paused').length,
      totalRuns,
      successRate: totalRuns > 0 ? (totalSuccess / totalRuns) * 100 : 0,
    };
  }
}
