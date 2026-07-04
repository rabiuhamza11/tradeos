// TradeOS Voice — Voice commands and TTS for hands-free trading
export interface VoiceCommand { intent: string; symbol?: string; quantity?: number; action?: string; }

export class VoiceProcessor {
  parseCommand(text: string): VoiceCommand {
    const lower = text.toLowerCase().trim();
    
    if (lower.includes('buy')) {
      const symbolMatch = lower.match(/(?:buy|purchase)\s+(\d+\.?\d*)\s+([a-z]+)/i);
      if (symbolMatch) return { intent: 'BUY', quantity: parseFloat(symbolMatch[1]), symbol: symbolMatch[2].toUpperCase() };
      return { intent: 'BUY', action: 'buy' };
    }
    if (lower.includes('sell')) {
      const symbolMatch = lower.match(/(?:sell)\s+(\d+\.?\d*)\s+([a-z]+)/i);
      if (symbolMatch) return { intent: 'SELL', quantity: parseFloat(symbolMatch[1]), symbol: symbolMatch[2].toUpperCase() };
      return { intent: 'SELL', action: 'sell' };
    }
    if (lower.includes('portfolio') || lower.includes('balance')) return { intent: 'GET_PORTFOLIO' };
    if (lower.includes('price')) {
      const sym = lower.match(/price\s+(?:of\s+)?([a-z]+)/i);
      return { intent: 'GET_PRICE', symbol: sym?.[1]?.toUpperCase() };
    }
    if (lower.includes('alert')) return { intent: 'SET_ALERT' };
    return { intent: 'UNKNOWN', action: lower };
  }

  formatResponse(data: any): string {
    if (data.signal) return `${data.symbol} signal: ${data.signal}. Confidence: ${data.confidence}%. ${data.recommendation}`;
    if (data.totalValue !== undefined) return `Your portfolio is worth $${data.totalValue.toFixed(2)} with ${data.openPositions} open positions.`;
    if (data.price) return `${data.symbol} is currently trading at $${data.price}`;
    return JSON.stringify(data);
  }
}

export class TTSProvider {
  speak(text: string, opts?: { rate?: number; pitch?: number }): { text: string; ssml: string } {
    const ssml = `<speak><prosody rate="${opts?.rate || '1.0'}" pitch="${opts?.pitch || 'medium'}">${text}</prosody></speak>`;
    return { text, ssml };
  }
}

export { VoiceProcessor, TTSProvider };
