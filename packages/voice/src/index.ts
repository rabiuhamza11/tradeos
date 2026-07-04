// TradeOS — Voice Interface Package
// Voice commands for hands-free trading and market queries

import { EventEmitter } from 'events';

export type VoiceCommandType = 'trade' | 'query' | 'portfolio' | 'alert' | 'navigation' | 'agent';

export interface VoiceCommand {
  id: string;
  type: VoiceCommandType;
  rawText: string;
  parsed: ParsedCommand;
  confidence: number;
  timestamp: number;
}

export interface ParsedCommand {
  intent: string;
  entities: Record<string, string | number>;
  action: string;
  params?: Record<string, any>;
}

export interface VoiceConfig {
  language: string;
  wakeWord: string;
  continuous: boolean;
  interimResults: boolean;
}

export class VoiceInterface extends EventEmitter {
  private config: VoiceConfig;
  private isListening = false;
  private commands: VoiceCommand[] = [];
  private wakeWordDetected = false;

  constructor(config?: Partial<VoiceConfig>) {
    super();
    this.config = {
      language: 'en-US',
      wakeWord: 'TradeOS',
      continuous: true,
      interimResults: true,
      ...config,
    };
  }

  // ============ LISTENING ============

  startListening(): void {
    this.isListening = true;
    this.emit('listeningStarted');
    console.log(`🎤 Voice interface active (wake word: "${this.config.wakeWord}")`);
  }

  stopListening(): void {
    this.isListening = false;
    this.wakeWordDetected = false;
    this.emit('listeningStopped');
  }

  isActivelyListening(): boolean {
    return this.isListening;
  }

  // ============ COMMAND PARSING ============

  parseCommand(text: string): VoiceCommand {
    const lower = text.toLowerCase().trim();
    const parsed = this.extractIntent(lower);
    const type = this.determineType(parsed.intent);

    const command: VoiceCommand = {
      id: `voice-${Date.now()}`,
      type,
      rawText: text,
      parsed,
      confidence: this.calculateConfidence(lower, parsed),
      timestamp: Date.now(),
    };

    this.commands.push(command);
    this.emit('command', command);
    this.executeCommand(command);

    return command;
  }

  private extractIntent(text: string): ParsedCommand {
    // Trading commands
    if (text.match(/(buy|purchase|long)\s+(\d+\.?\d*)\s+(btc|eth|sol|ada|avax|dot|aapl|tsla)/)) {
      const match = text.match(/(buy|purchase|long)\s+(\d+\.?\d*)\s+([a-z]+)/);
      return {
        intent: 'place_order',
        entities: { side: 'BUY', quantity: parseFloat(match![2]), symbol: match![3].toUpperCase() },
        action: 'place_order',
        params: { side: 'BUY', type: 'MARKET' },
      };
    }

    if (text.match(/(sell|short)\s+(\d+\.?\d*)\s+(btc|eth|sol|ada|avax|dot|aapl|tsla)/)) {
      const match = text.match(/(sell|short)\s+(\d+\.?\d*)\s+([a-z]+)/);
      return {
        intent: 'place_order',
        entities: { side: 'SELL', quantity: parseFloat(match![2]), symbol: match![3].toUpperCase() },
        action: 'place_order',
        params: { side: 'SELL', type: 'MARKET' },
      };
    }

    // Cancel command
    if (text.includes('cancel') && text.includes('order')) {
      return { intent: 'cancel_order', entities: {}, action: 'cancel_order' };
    }

    // Query commands
    if (text.match(/(what.*price|price of|how much is|quote)/)) {
      const match = text.match(/(btc|eth|sol|ada|avax|aapl|tsla|eurusd)/);
      return {
        intent: 'query_price',
        entities: { symbol: match ? match[0].toUpperCase() : 'BTC' },
        action: 'query_price',
      };
    }

    // Portfolio queries
    if (text.match(/(portfolio|balance|holdings|positions|p.*l|pnl)/)) {
      return { intent: 'query_portfolio', entities: {}, action: 'query_portfolio' };
    }

    // Alert commands
    if (text.match(/(alert|notify|warn).*(above|below|over|under)/)) {
      const priceMatch = text.match(/\$?(\d+\.?\d*)/);
      const symbolMatch = text.match(/(btc|eth|sol|aapl|tsla)/);
      const direction = text.includes('above') || text.includes('over') ? 'above' : 'below';
      return {
        intent: 'set_alert',
        entities: {
          symbol: symbolMatch ? symbolMatch[0].toUpperCase() : 'BTC',
          direction,
          price: priceMatch ? parseFloat(priceMatch[1]) : 0,
        },
        action: 'set_alert',
      };
    }

    // Agent commands
    if (text.match(/(start|activate|enable).*(agent|bot|ai|scalper|swing)/)) {
      const agentMatch = text.match(/(scalper|swing|arbitrage|sentiment|rebalancer|risk)/);
      return {
        intent: 'start_agent',
        entities: { agent: agentMatch ? agentMatch[0] : 'scalper' },
        action: 'start_agent',
      };
    }

    if (text.match(/(stop|pause|disable).*(agent|bot|ai|scalper|swing)/)) {
      const agentMatch = text.match(/(scalper|swing|arbitrage|sentiment|rebalancer|risk)/);
      return {
        intent: 'stop_agent',
        entities: { agent: agentMatch ? agentMatch[0] : 'scalper' },
        action: 'stop_agent',
      };
    }

    // Navigation
    if (text.match(/(go to|open|show|navigate).*(market|trade|portfolio|analytic|setting|ai)/)) {
      const pageMatch = text.match(/(market|trade|portfolio|analytic|setting|ai)/);
      return {
        intent: 'navigate',
        entities: { page: pageMatch ? pageMatch[0] : 'markets' },
        action: 'navigate',
      };
    }

    // Help
    if (text.match(/(help|what can you do|commands)/)) {
      return { intent: 'help', entities: {}, action: 'help' };
    }

    return { intent: 'unknown', entities: {}, action: 'none' };
  }

  private determineType(intent: string): VoiceCommandType {
    const typeMap: Record<string, VoiceCommandType> = {
      place_order: 'trade',
      cancel_order: 'trade',
      query_price: 'query',
      query_portfolio: 'portfolio',
      set_alert: 'alert',
      start_agent: 'agent',
      stop_agent: 'agent',
      navigate: 'navigation',
      help: 'query',
      unknown: 'query',
    };
    return typeMap[intent] || 'query';
  }

  private calculateConfidence(text: string, parsed: ParsedCommand): number {
    if (parsed.intent === 'unknown') return 0.2;
    let confidence = 0.7;

    // Higher confidence if entities are present
    if (Object.keys(parsed.entities).length > 0) confidence += 0.2;
    if (Object.keys(parsed.entities).length > 2) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  // ============ EXECUTION ============

  private executeCommand(command: VoiceCommand): void {
    const { action, entities } = command.parsed;

    switch (action) {
      case 'place_order':
        this.emit('placeOrder', {
          symbol: entities.symbol,
          side: entities.side,
          quantity: entities.quantity,
          type: 'MARKET',
        });
        console.log(`🎤 Voice: ${entities.side} ${entities.quantity} ${entities.symbol}`);
        break;

      case 'cancel_order':
        this.emit('cancelOrder', {});
        break;

      case 'query_price':
        this.emit('queryPrice', { symbol: entities.symbol });
        console.log(`🎤 Voice: Querying ${entities.symbol} price`);
        break;

      case 'query_portfolio':
        this.emit('queryPortfolio', {});
        break;

      case 'set_alert':
        this.emit('setAlert', { symbol: entities.symbol, direction: entities.direction, price: entities.price });
        break;

      case 'start_agent':
        this.emit('startAgent', { agent: entities.agent });
        break;

      case 'stop_agent':
        this.emit('stopAgent', { agent: entities.agent });
        break;

      case 'navigate':
        this.emit('navigate', { page: entities.page });
        break;

      case 'help':
        this.emit('help', {});
        break;
    }
  }

  // ============ WAKE WORD ============

  processAudioInput(text: string): VoiceCommand | null {
    const lower = text.toLowerCase();

    // Check for wake word
    if (!this.wakeWordDetected) {
      if (lower.includes(this.config.wakeWord.toLowerCase())) {
        this.wakeWordDetected = true;
        this.emit('wakeWordDetected');
        const commandText = lower.replace(this.config.wakeWord.toLowerCase(), '').trim();
        if (commandText) return this.parseCommand(commandText);
        return null;
      }
      return null;
    }

    // If wake word already detected, process command
    this.wakeWordDetected = false;
    return this.parseCommand(text);
  }

  // ============ TEXT TO SPEECH ============

  speak(text: string): void {
    // In production: use TTS API (Google, Amazon, Azure)
    console.log(`🔊 TTS: ${text}`);
    this.emit('speak', text);
  }

  // ============ HISTORY ============

  getCommandHistory(limit = 20): VoiceCommand[] {
    return this.commands.slice(-limit).reverse();
  }

  clearHistory(): void {
    this.commands = [];
  }

  // ============ HELP ============

  getHelpText(): string {
    return `Voice commands:
- "Buy 0.01 BTC" — Place a market buy order
- "Sell 2 ETH" — Place a market sell order
- "Cancel order" — Cancel pending order
- "What's the price of BTC?" — Get current price
- "Show my portfolio" — View portfolio summary
- "Alert me when BTC goes above $70000" — Set price alert
- "Start scalper agent" — Activate an AI agent
- "Stop swing agent" — Pause an AI agent
- "Go to analytics" — Navigate to a page
- "Help" — Show this help message`;
  }
}
