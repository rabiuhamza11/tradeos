// TradeOS Video — Market visualizations, chart rendering, screen recordings
export interface ChartConfig { symbol: string; interval: string; indicators: string[]; theme: 'dark' | 'light'; }

export class ChartRenderer {
  static candlestick(candles: any[], config?: Partial<ChartConfig>): any {
    return {
      type: 'candlestick',
      data: candles.map(c => ({ x: c.timestamp, o: c.open, h: c.high, l: c.low, c: c.close })),
      config: { theme: config?.theme || 'dark', indicators: config?.indicators || ['SMA20', 'RSI'] },
    };
  }

  static lineChart(data: { x: number; y: number }[], label: string): any {
    return { type: 'line', label, data, color: '#7C3AED' };
  }

  static portfolioPie(allocations: { label: string; value: number }[]): any {
    return { type: 'pie', data: allocations, colors: ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'] };
  }

  static equityCurve(curve: { date: string; value: number }[]): any {
    return { type: 'area', data: curve.map((p, i) => ({ x: i, y: p.value })), color: '#10B981' };
  }
}

export class MarketVisualizer {
  static heatmap(symbols: { symbol: string; changePct: number }[]): any {
    return {
      type: 'heatmap',
      data: symbols.map(s => ({ label: s.symbol, value: s.changePct, color: s.changePct > 0 ? '#10B981' : '#EF4444' })),
    };
  }

  static depthChart(orderBook: { bids: [number, number][]; asks: [number, number][] }): any {
    return {
      type: 'depth',
      bids: orderBook.bids.map(([p, q]) => ({ x: p, y: q })),
      asks: orderBook.asks.map(([p, q]) => ({ x: p, y: q })),
    };
  }
}

export { ChartRenderer, MarketVisualizer };
