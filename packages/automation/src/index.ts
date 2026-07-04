// TradeOS Automation — Workflow automation, scheduled tasks, triggers
export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  enabled: boolean;
  lastRun?: Date;
}

export interface AutomationTrigger {
  type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'TIME' | 'SCHEDULE' | 'PNL_THRESHOLD' | 'NEWS_KEYWORD' | 'VOLUME_SPIKE';
  params: Record<string, any>;
}

export interface AutomationAction {
  type: 'BUY' | 'SELL' | 'CLOSE_POSITION' | 'SET_ALERT' | 'SEND_NOTIFICATION' | 'REBALANCE' | 'EXECUTE_STRATEGY';
  params: Record<string, any>;
}

export class AutomationEngine {
  private rules: Map<string, AutomationRule> = new Map();

  create(name: string, trigger: AutomationTrigger, action: AutomationAction): string {
    const id = `auto_${Date.now()}`;
    this.rules.set(id, { id, name, trigger, action, enabled: true });
    console.log(`🤖 Automation created: ${name}`);
    return id;
  }

  async evaluate(marketData: Record<string, any>): Promise<{ ruleId: string; action: AutomationAction }[]> {
    const triggered: { ruleId: string; action: AutomationAction }[] = [];

    for (const [id, rule] of this.rules) {
      if (!rule.enabled) continue;
      const shouldFire = this.checkTrigger(rule.trigger, marketData);
      if (shouldFire) {
        triggered.push({ ruleId: id, action: rule.action });
        await this.rules.set(id, { ...rule, lastRun: new Date() });
      }
    }

    return triggered;
  }

  private checkTrigger(trigger: AutomationTrigger, data: Record<string, any>): boolean {
    switch (trigger.type) {
      case 'PRICE_ABOVE': {
        const sym = trigger.params.symbol;
        return data[sym] && data[sym].price > trigger.params.price;
      }
      case 'PRICE_BELOW': {
        const sym = trigger.params.symbol;
        return data[sym] && data[sym].price < trigger.params.price;
      }
      case 'VOLUME_SPIKE': {
        const sym = trigger.params.symbol;
        return data[sym] && data[sym].volume > trigger.params.threshold;
      }
      default: return false;
    }
  }

  toggle(id: string): void {
    const r = this.rules.get(id);
    if (r) r.enabled = !r.enabled;
  }

  remove(id: string): void { this.rules.delete(id); }
  getAll(): AutomationRule[] { return Array.from(this.rules.values()); }
}

export { AutomationEngine };
