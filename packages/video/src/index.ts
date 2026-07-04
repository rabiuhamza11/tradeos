// TradeOS — Video Analytics Package
// Real-time chart analysis via computer vision and screen capture

import { EventEmitter } from 'events';

export interface ChartAnalysis {
  symbol: string;
  timeframe: string;
  patterns: ChartPattern[];
  supportLevels: number[];
  resistanceLevels: number[];
  trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
  trendStrength: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  timestamp: number;
}

export interface ChartPattern {
  type: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  reliability: number;
  description: string;
}

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export class VideoAnalytics extends EventEmitter {
  private isCapturing = false;
  private captureInterval: NodeJS.Timeout | null = null;
  private analysisHistory: ChartAnalysis[] = [];

  // ============ CHART ANALYSIS ============

  async analyzeChart(candles: CandleData[], symbol: string, timeframe: string): Promise<ChartAnalysis> {
    const patterns = this.detectPatterns(candles);
    const { support, resistance } = this.findLevels(candles);
    const trend = this.determineTrend(candles);
    const trendStrength = this.calculateTrendStrength(candles);
    const recommendation = this.generateRecommendation(patterns, trend, trendStrength);
    const confidence = this.calculateConfidence(patterns, trendStrength);

    const analysis: ChartAnalysis = {
      symbol,
      timeframe,
      patterns,
      supportLevels: support,
      resistanceLevels: resistance,
      trend,
      trendStrength,
      recommendation,
      confidence,
      timestamp: Date.now(),
    };

    this.analysisHistory.push(analysis);
    this.emit('analysis', analysis);

    return analysis;
  }

  // ============ PATTERN DETECTION ============

  private detectPatterns(candles: CandleData[]): ChartPattern[] {
    const patterns: ChartPattern[] = [];

    if (candles.length < 5) return patterns;

    // Doji (indecision)
    const lastCandle = candles[candles.length - 1];
    const body = Math.abs(lastCandle.close - lastCandle.open);
    const range = lastCandle.high - lastCandle.low;
    if (range > 0 && body / range < 0.1) {
      patterns.push({
        type: 'Doji',
        direction: 'neutral',
        reliability: 60,
        description: 'Indecision in the market — potential reversal ahead',
      });
    }

    // Hammer (bullish reversal)
    if (body / range < 0.3 && (lastCandle.low - Math.min(lastCandle.open, lastCandle.close)) > body * 2) {
      patterns.push({
        type: 'Hammer',
        direction: 'bullish',
        reliability: 70,
        description: 'Bullish reversal pattern — buyers stepping in at lower levels',
      });
    }

    // Shooting Star (bearish reversal)
    if (body / range < 0.3 && (lastCandle.high - Math.max(lastCandle.open, lastCandle.close)) > body * 2) {
      patterns.push({
        type: 'Shooting Star',
        direction: 'bearish',
        reliability: 68,
        description: 'Bearish reversal pattern — sellers rejecting higher prices',
      });
    }

    // Bullish Engulfing
    if (candles.length >= 2) {
      const prev = candles[candles.length - 2];
      const curr = candles[candles.length - 1];
      if (prev.close < prev.open && curr.close > curr.open && curr.close > prev.open && curr.open < prev.close) {
        patterns.push({
          type: 'Bullish Engulfing',
          direction: 'bullish',
          reliability: 75,
          description: 'Strong bullish reversal — current candle engulfs previous bearish candle',
        });
      }
    }

    // Bearish Engulfing
    if (candles.length >= 2) {
      const prev = candles[candles.length - 2];
      const curr = candles[candles.length - 1];
      if (prev.close > prev.open && curr.close < curr.open && curr.open > prev.close && curr.close < prev.open) {
        patterns.push({
          type: 'Bearish Engulfing',
          direction: 'bearish',
          reliability: 75,
          description: 'Strong bearish reversal — current candle engulfs previous bullish candle',
        });
      }
    }

    // Three White Soldiers (strong bullish)
    if (candles.length >= 3) {
      const last3 = candles.slice(-3);
      if (last3.every((c) => c.close > c.open) && last3[2].close > last3[1].close && last3[1].close > last3[0].close) {
        patterns.push({
          type: 'Three White Soldiers',
          direction: 'bullish',
          reliability: 85,
          description: 'Strong bullish momentum — three consecutive higher closes',
        });
      }
    }

    // Three Black Crows (strong bearish)
    if (candles.length >= 3) {
      const last3 = candles.slice(-3);
      if (last3.every((c) => c.close < c.open) && last3[2].close < last3[1].close && last3[1].close < last3[0].close) {
        patterns.push({
          type: 'Three Black Crows',
          direction: 'bearish',
          reliability: 85,
          description: 'Strong bearish momentum — three consecutive lower closes',
        });
      }
    }

    // Moving Average Crossover (simulated)
    if (candles.length >= 20) {
      const sma20 = this.sma(candles.slice(-20).map((c) => c.close));
      const sma50 = candles.length >= 50 ? this.sma(candles.slice(-50).map((c) => c.close)) : sma20;
      if (sma20 > sma50) {
        patterns.push({
          type: 'Golden Cross',
          direction: 'bullish',
          reliability: 80,
          description: 'SMA20 crossed above SMA50 — bullish trend confirmed',
        });
      } else if (sma20 < sma50) {
        patterns.push({
          type: 'Death Cross',
          direction: 'bearish',
          reliability: 80,
          description: 'SMA20 crossed below SMA50 — bearish trend confirmed',
        });
      }
    }

    return patterns;
  }

  // ============ SUPPORT/RESISTANCE ============

  private findLevels(candles: CandleData[]): { support: number[]; resistance: number[] } {
    const supports: number[] = [];
    const resistances: number[] = [];

    for (let i = 2; i < candles.length - 2; i++) {
      const c = candles[i];
      // Support: lower low than neighbors
      if (c.low < candles[i - 1].low && c.low < candles[i - 2].low && c.low < candles[i + 1].low && c.low < candles[i + 2].low) {
        supports.push(c.low);
      }
      // Resistance: higher high than neighbors
      if (c.high > candles[i - 1].high && c.high > candles[i - 2].high && c.high > candles[i + 1].high && c.high > candles[i + 2].high) {
        resistances.push(c.high);
      }
    }

    return {
      support: supports.slice(-3),
      resistance: resistances.slice(-3),
    };
  }

  // ============ TREND ANALYSIS ============

  private determineTrend(candles: CandleData[]): 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS' {
    if (candles.length < 10) return 'SIDEWAYS';

    const recent = candles.slice(-10);
    const highs = recent.map((c) => c.high);
    const lows = recent.map((c) => c.low);

    const higherHighs = highs.every((h, i) => i === 0 || h >= highs[i - 1]);
    const higherLows = lows.every((l, i) => i === 0 || l >= lows[i - 1]);
    const lowerHighs = highs.every((h, i) => i === 0 || h <= highs[i - 1]);
    const lowerLows = lows.every((l, i) => i === 0 || l <= lows[i - 1]);

    if (higherHighs && higherLows) return 'UPTREND';
    if (lowerHighs && lowerLows) return 'DOWNTREND';
    return 'SIDEWAYS';
  }

  private calculateTrendStrength(candles: CandleData[]): number {
    if (candles.length < 20) return 50;

    const sma20 = this.sma(candles.slice(-20).map((c) => c.close));
    const currentPrice = candles[candles.length - 1].close;
    const deviation = Math.abs((currentPrice - sma20) / sma20) * 100;

    return Math.min(100, 50 + deviation * 10);
  }

  // ============ RECOMMENDATION ============

  private generateRecommendation(patterns: ChartPattern[], trend: string, strength: number): string {
    const bullishPatterns = patterns.filter((p) => p.direction === 'bullish');
    const bearishPatterns = patterns.filter((p) => p.direction === 'bearish');

    let score = 0;

    if (trend === 'UPTREND') score += 20;
    else if (trend === 'DOWNTREND') score -= 20;

    score += bullishPatterns.reduce((s, p) => s + p.reliability / 10, 0);
    score -= bearishPatterns.reduce((s, p) => s + p.reliability / 10, 0);

    if (strength > 70) score += 10;

    if (score >= 25) return 'STRONG_BUY';
    if (score >= 10) return 'BUY';
    if (score <= -25) return 'STRONG_SELL';
    if (score <= -10) return 'SELL';
    return 'HOLD';
  }

  private calculateConfidence(patterns: ChartPattern[], trendStrength: number): number {
    if (patterns.length === 0) return 30;
    const avgReliability = patterns.reduce((s, p) => s + p.reliability, 0) / patterns.length;
    return Math.min(95, (avgReliability + trendStrength) / 2);
  }

  // ============ HELPERS ============

  private sma(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // ============ CAPTURE ============

  startCapture(symbol: string, intervalMs = 5000): void {
    this.isCapturing = true;
    console.log(`📹 Starting chart capture for ${symbol} every ${intervalMs / 1000}s`);

    this.captureInterval = setInterval(async () => {
      // In production: capture screen, use CV to detect candlesticks
      // For now: generate mock candles and analyze
      const mockCandles = this.generateMockCandles(50);
      const analysis = await this.analyzeChart(mockCandles, symbol, '1h');
      this.emit('captureAnalysis', analysis);
    }, intervalMs);
  }

  stopCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    this.isCapturing = false;
    console.log('📹 Chart capture stopped');
  }

  private generateMockCandles(count: number): CandleData[] {
    const candles: CandleData[] = [];
    let price = 65000;

    for (let i = 0; i < count; i++) {
      const open = price;
      const change = (Math.random() - 0.48) * 500;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;
      const volume = Math.random() * 100 + 10;

      candles.push({ open, high, low, close, volume, timestamp: Date.now() - (count - i) * 3600000 });
      price = close;
    }

    return candles;
  }

  // ============ HISTORY ============

  getAnalysisHistory(limit = 20): ChartAnalysis[] {
    return this.analysisHistory.slice(-limit).reverse();
  }

  isCapturingActive(): boolean {
    return this.isCapturing;
  }
}
