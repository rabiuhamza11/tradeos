// TradeOS AI Engine — Market analysis, predictions, and trading intelligence

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  high: number;
  low: number;
  candles?: Candle[];
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AIAnalysis {
  symbol: string;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number; // 0-100
  indicators: TechnicalIndicators;
  prediction: PricePrediction;
  sentiment: SentimentAnalysis;
  recommendation: string;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: { line: number; signal: number; histogram: number };
  sma20: number;
  sma50: number;
  ema12: number;
  bollinger: { upper: number; middle: number; lower: number };
  atr: number;
  stochastic: { k: number; d: number };
}

export interface PricePrediction {
  direction: 'UP' | 'DOWN' | 'FLAT';
  targetPrice: number;
  timeframe: string;
  probability: number;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sources: string[];
  newsCount: number;
}

// ============ TECHNICAL ANALYSIS ============

export class TechnicalAnalysis {
  static RSI(candles: Candle[], period: number = 14): number {
    if (candles.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = candles.length - period; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change > 0) gains += change; else losses -= change;
    }
    const rs = gains / (losses || 1);
    return 100 - (100 / (1 + rs));
  }

  static SMA(candles: Candle[], period: number): number {
    if (candles.length < period) return 0;
    const slice = candles.slice(-period);
    return slice.reduce((s, c) => s + c.close, 0) / period;
  }

  static EMA(candles: Candle[], period: number): number {
    if (candles.length < period) return 0;
    const k = 2 / (period + 1);
    let ema = candles[0].close;
    for (let i = 1; i < candles.length; i++) {
      ema = candles[i].close * k + ema * (1 - k);
    }
    return ema;
  }

  static MACD(candles: Candle[]): { line: number; signal: number; histogram: number } {
    const ema12 = this.EMA(candles, 12);
    const ema26 = this.EMA(candles, 26);
    const line = ema12 - ema26;
    // Simplified signal line
    const signal = line * 0.9;
    return { line, signal, histogram: line - signal };
  }

  static BollingerBands(candles: Candle[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } {
    const sma = this.SMA(candles, period);
    const slice = candles.slice(-period);
    const variance = slice.reduce((s, c) => s + Math.pow(c.close - sma, 2), 0) / period;
    const sd = Math.sqrt(variance);
    return { upper: sma + sd * stdDev, middle: sma, lower: sma - sd * stdDev };
  }

  static ATR(candles: Candle[], period: number = 14): number {
    if (candles.length < period + 1) return 0;
    let sum = 0;
    for (let i = candles.length - period; i < candles.length; i++) {
      const tr = Math.max(candles[i].high - candles[i].low, Math.abs(candles[i].high - candles[i - 1].close), Math.abs(candles[i].low - candles[i - 1].close));
      sum += tr;
    }
    return sum / period;
  }

  static Stochastic(candles: Candle[], period: number = 14): { k: number; d: number } {
    if (candles.length < period) return { k: 50, d: 50 };
    const slice = candles.slice(-period);
    const highest = Math.max(...slice.map(c => c.high));
    const lowest = Math.min(...slice.map(c => c.low));
    const currentClose = slice[slice.length - 1].close;
    const k = ((currentClose - lowest) / (highest - lowest || 1)) * 100;
    const d = k * 0.8; // Simplified
    return { k, d };
  }

  static analyzeAll(candles: Candle[]): TechnicalIndicators {
    return {
      rsi: this.RSI(candles),
      macd: this.MACD(candles),
      sma20: this.SMA(candles, 20),
      sma50: this.SMA(candles, 50),
      ema12: this.EMA(candles, 12),
      bollinger: this.BollingerBands(candles),
      atr: this.ATR(candles),
      stochastic: this.Stochastic(candles),
    };
  }
}

// ============ AI PREDICTOR ============

export class AIPredictor {
  static predict(candles: Candle[], indicators: TechnicalIndicators): PricePrediction {
    const currentPrice = candles[candles.length - 1]?.close || 0;
    let bullishSignals = 0;
    let bearishSignals = 0;

    if (indicators.rsi < 30) bullishSignals++;
    else if (indicators.rsi > 70) bearishSignals++;

    if (indicators.macd.histogram > 0) bullishSignals++;
    else if (indicators.macd.histogram < 0) bearishSignals++;

    if (indicators.sma20 > indicators.sma50) bullishSignals++;
    else bearishSignals++;

    if (indicators.stochastic.k < 20) bullishSignals++;
    else if (indicators.stochastic.k > 80) bearishSignals++;

    const direction = bullishSignals > bearishSignals ? 'UP' : bearishSignals > bullishSignals ? 'DOWN' : 'FLAT';
    const probability = Math.round((Math.max(bullishSignals, bearishSignals) / (bullishSignals + bearishSignals || 1)) * 100);
    const targetPrice = direction === 'UP' ? currentPrice * 1.05 : direction === 'DOWN' ? currentPrice * 0.95 : currentPrice;

    return { direction, targetPrice, timeframe: '24h', probability };
  }

  static generateSignal(indicators: TechnicalIndicators, prediction: PricePrediction): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' {
    let score = 0;
    if (indicators.rsi < 30) score += 2;
    else if (indicators.rsi < 45) score += 1;
    else if (indicators.rsi > 70) score -= 2;
    else if (indicators.rsi > 55) score -= 1;

    if (indicators.macd.histogram > 0) score += 1;
    else score -= 1;

    if (prediction.direction === 'UP') score += 1;
    else if (prediction.direction === 'DOWN') score -= 1;

    if (score >= 3) return 'STRONG_BUY';
    if (score >= 1) return 'BUY';
    if (score <= -3) return 'STRONG_SELL';
    if (score <= -1) return 'SELL';
    return 'HOLD';
  }
}

// ============ SENTIMENT ANALYZER ============

export class SentimentAnalyzer {
  static analyze(symbol: string, newsItems: { title: string; source: string }[]): SentimentAnalysis {
    const positiveWords = ['surge', 'rally', 'gain', 'bullish', 'upgrade', 'beat', 'strong', 'growth', 'outperform', 'breakthrough'];
    const negativeWords = ['crash', 'plunge', 'bearish', 'downgrade', 'miss', 'weak', 'decline', 'sell-off', 'fear', 'risk'];

    let score = 0;
    const sources: string[] = [];

    for (const news of newsItems) {
      const lower = news.title.toLowerCase();
      positiveWords.forEach(w => { if (lower.includes(w)) score += 0.1; });
      negativeWords.forEach(w => { if (lower.includes(w)) score -= 0.1; });
      sources.push(news.source);
    }

    score = Math.max(-1, Math.min(1, score));
    const label = score > 0.2 ? 'BULLISH' : score < -0.2 ? 'BEARISH' : 'NEUTRAL';

    return { score, label, sources, newsCount: newsItems.length };
  }
}

// ============ FULL ANALYSIS ============

export async function analyzeMarket(data: MarketData, candles: Candle[], news: { title: string; source: string }[] = []): Promise<AIAnalysis> {
  const indicators = TechnicalAnalysis.analyzeAll(candles);
  const prediction = AIPredictor.predict(candles, indicators);
  const signal = AIPredictor.generateSignal(indicators, prediction);
  const sentiment = SentimentAnalyzer.analyze(data.symbol, news);

  const recommendations: Record<string, string> = {
    STRONG_BUY: `${data.symbol} shows strong bullish signals. RSI: ${indicators.rsi.toFixed(0)}, MACD positive. Consider entering a long position.`,
    BUY: `${data.symbol} is trending positive. Good entry opportunity with manageable risk.`,
    HOLD: `${data.symbol} is neutral. Wait for clearer signals before entering.`,
    SELL: `${data.symbol} shows bearish indicators. Consider reducing position or entering short.`,
    STRONG_SELL: `${data.symbol} is strongly bearish. RSI: ${indicators.rsi.toFixed(0)}, MACD negative. Consider exiting long positions.`,
  };

  return {
    symbol: data.symbol,
    signal,
    confidence: prediction.probability,
    indicators,
    prediction,
    sentiment,
    recommendation: recommendations[signal],
  };
}

export { TechnicalAnalysis, AIPredictor, SentimentAnalyzer, analyzeMarket };
