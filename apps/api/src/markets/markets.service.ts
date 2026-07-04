import { Injectable } from '@nestjs/common';
import { ExchangeService } from '../common/exchange.service';

@Injectable()
export class MarketsService {
  constructor(private exchangeService: ExchangeService) {}

  async getQuotes() {
    // Try to fetch real data from connected exchanges
    const symbols = [
      { symbol: 'BTCUSDT', assetType: 'CRYPTO', display: 'BTC' },
      { symbol: 'ETHUSDT', assetType: 'CRYPTO', display: 'ETH' },
      { symbol: 'SOLUSDT', assetType: 'CRYPTO', display: 'SOL' },
      { symbol: 'AAPL', assetType: 'STOCK', display: 'AAPL' },
      { symbol: 'TSLA', assetType: 'STOCK', display: 'TSLA' },
      { symbol: 'GOOGL', assetType: 'STOCK', display: 'GOOGL' },
      { symbol: 'MSFT', assetType: 'STOCK', display: 'MSFT' },
      { symbol: 'EUR_USD', assetType: 'FOREX', display: 'EURUSD' },
      { symbol: 'GBP_USD', assetType: 'FOREX', display: 'GBPUSD' },
      { symbol: 'XAU_USD', assetType: 'COMMODITY', display: 'XAU' },
    ];

    const tickers: any[] = [];
    for (const s of symbols) {
      try {
        const ticker = await this.exchangeService.getTicker(s.symbol, s.assetType);
        tickers.push({
          symbol: s.display,
          name: this.getDisplayName(s.display),
          price: ticker.price,
          change: ticker.changePct24h * ticker.price,
          changePct: ticker.changePct24h,
          volume: ticker.volume24h,
          bid: ticker.bid,
          ask: ticker.ask,
          high: ticker.high24h,
          low: ticker.low24h,
          type: s.assetType,
          timestamp: ticker.timestamp,
        });
      } catch {
        // Fallback to simulated data
        tickers.push(this.simulatedQuote(s.display, s.assetType));
      }
    }
    return tickers;
  }

  async getQuote(symbol: string) {
    const assetType = this.guessAssetType(symbol);
    const exchangeSymbol = this.toExchangeSymbol(symbol, assetType);
    try {
      const ticker = await this.exchangeService.getTicker(exchangeSymbol, assetType);
      return {
        symbol, name: this.getDisplayName(symbol), price: ticker.price,
        bid: ticker.bid, ask: ticker.ask, high: ticker.high24h, low: ticker.low24h,
        volume: ticker.volume24h, changePct: ticker.changePct24h, type: assetType,
      };
    } catch {
      return this.simulatedQuote(symbol, assetType);
    }
  }

  async getCandles(symbol: string, interval: string = '1h', limit: number = 100) {
    const assetType = this.guessAssetType(symbol);
    const exchangeSymbol = this.toExchangeSymbol(symbol, assetType);
    try {
      const candles = await this.exchangeService.getCandles(exchangeSymbol, assetType, interval, limit);
      return { symbol, interval, candles };
    } catch {
      // Fallback
      const basePrices: Record<string, number> = { BTC: 65432, ETH: 3521, AAPL: 195, TSLA: 251, EURUSD: 1.084, XAU: 2352 };
      const base = basePrices[symbol.toUpperCase()] || 100;
      const candles: any[] = [];
      let prevClose = base;
      const intervalMs: Record<string, number> = { '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000, '1d': 86400000 };
      const ms = intervalMs[interval] || 3600000;
      for (let i = limit - 1; i >= 0; i--) {
        const open = prevClose;
        const vol = (Math.random() - 0.5) * 0.01;
        const close = open * (1 + vol);
        const high = Math.max(open, close) * (1 + Math.random() * 0.005);
        const low = Math.min(open, close) * (1 - Math.random() * 0.005);
        candles.push({ timestamp: Date.now() - i * ms, open, high, low, close, volume: Math.floor(Math.random() * 1000000) });
        prevClose = close;
      }
      return { symbol, interval, candles };
    }
  }

  async getMarketMovers() {
    const all = await this.getQuotes();
    const gainers = [...all].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
    const losers = [...all].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
    const mostActive = [...all].sort((a, b) => b.volume - a.volume).slice(0, 5);
    return { gainers, losers, mostActive };
  }

  async search(query: string) {
    const all = await this.getQuotes();
    const q = query.toUpperCase();
    return all.filter(d => d.symbol.includes(q) || d.name.toUpperCase().includes(q));
  }

  // ============ HELPERS ============

  private guessAssetType(symbol: string): string {
    const crypto = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'LINK', 'BNB', 'XRP'];
    const forex = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'];
    const commodities = ['XAU', 'XAG', 'WTI', 'NG'];
    const s = symbol.toUpperCase();
    if (crypto.includes(s)) return 'CRYPTO';
    if (forex.includes(s)) return 'FOREX';
    if (commodities.includes(s)) return 'COMMODITY';
    return 'STOCK';
  }

  private toExchangeSymbol(symbol: string, assetType: string): string {
    if (assetType === 'CRYPTO') return `${symbol}USDT`;
    if (assetType === 'FOREX') return symbol.length === 6 ? `${symbol.slice(0, 3)}_${symbol.slice(3)}` : symbol;
    return symbol;
  }

  private getDisplayName(symbol: string): string {
    const names: Record<string, string> = {
      BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', ADA: 'Cardano', DOT: 'Polkadot',
      AAPL: 'Apple Inc.', TSLA: 'Tesla Inc.', GOOGL: 'Alphabet Inc.', MSFT: 'Microsoft Corp.',
      EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD', XAU: 'Gold',
    };
    return names[symbol.toUpperCase()] || symbol;
  }

  private simulatedQuote(symbol: string, type: string): any {
    const basePrices: Record<string, number> = {
      BTC: 65432, ETH: 3521, SOL: 178, AAPL: 195, TSLA: 251,
      GOOGL: 175, MSFT: 421, EURUSD: 1.084, GBPUSD: 1.271, XAU: 2352,
    };
    const base = basePrices[symbol.toUpperCase()] || 100;
    const variance = (Math.random() - 0.5) * 0.02;
    const price = base * (1 + variance);
    return {
      symbol, name: this.getDisplayName(symbol), price,
      change: price * variance, changePct: variance,
      volume: 1000000, bid: price * 0.999, ask: price * 1.001,
      high: base * 1.02, low: base * 0.98, type,
    };
  }
}
