// TradeOS — Blockchain Analytics Package
// On-chain data analysis for crypto trading signals

import axios, { AxiosInstance } from 'axios';

export interface OnChainMetrics {
  symbol: string;
  activeAddresses: number;
  transactionVolume: number;
  whaleMovements: WhaleTransaction[];
  exchangeFlows: ExchangeFlow;
  networkHashRate?: number;
  mintingRate?: number;
  burnRate?: number;
  timestamp: number;
}

export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  symbol: string;
  usdValue: number;
  timestamp: number;
  isExchangeTransfer: boolean;
  exchange?: string;
}

export interface ExchangeFlow {
  inflow: number;   // USD flowing into exchanges
  outflow: number;  // USD flowing out of exchanges
  netFlow: number;  // Positive = accumulation, Negative = distribution
}

export interface DefiMetrics {
  protocol: string;
  tvl: number;
  volume24h: number;
  fees24h: number;
  users24h: number;
  tokenPrice: number;
  priceChange24h: number;
}

export class BlockchainAnalytics {
  private etherscanClient: AxiosInstance;
  private etherscanKey: string;
  private defillamaUrl = 'https://api.llama.fi';
  private geckoUrl = 'https://api.coingecko.com/api/v3';

  constructor(etherscanKey?: string) {
    this.etherscanKey = etherscanKey || '';
    this.etherscanClient = axios.create({
      baseURL: 'https://api.etherscan.io/api',
      params: { apikey: etherscanKey },
    });
  }

  // ============ ON-CHAIN METRICS ============

  async getOnChainMetrics(symbol: string): Promise<OnChainMetrics> {
    // In production: query Etherscan, Glassnode, or Nansen APIs
    const metrics: OnChainMetrics = {
      symbol,
      activeAddresses: Math.floor(Math.random() * 500000) + 100000,
      transactionVolume: Math.random() * 5000000000,
      whaleMovements: this.generateMockWhales(symbol),
      exchangeFlows: {
        inflow: Math.random() * 500000000,
        outflow: Math.random() * 500000000,
        netFlow: 0,
      },
      timestamp: Date.now(),
    };
    metrics.exchangeFlows.netFlow = metrics.exchangeFlows.outflow - metrics.exchangeFlows.inflow;
    return metrics;
  }

  private generateMockWhales(symbol: string): WhaleTransaction[] {
    const exchanges = ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bitfinex'];
    const whales: WhaleTransaction[] = [];

    for (let i = 0; i < 5; i++) {
      const isToExchange = Math.random() > 0.5;
      const value = Math.random() * 1000;
      const prices: Record<string, number> = { BTC: 65432, ETH: 3521, SOL: 142 };
      const price = prices[symbol] || 100;

      whales.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        value,
        symbol,
        usdValue: value * price,
        timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        isExchangeTransfer: Math.random() > 0.5,
        exchange: Math.random() > 0.5 ? exchanges[Math.floor(Math.random() * exchanges.length)] : undefined,
      });
    }

    return whales;
  }

  // ============ WHALE TRACKING ============

  async getWhaleTransactions(symbol: string, limit = 20): Promise<WhaleTransaction[]> {
    return this.generateMockWhales(symbol).slice(0, limit);
  }

  async getExchangeFlows(symbol: string): Promise<ExchangeFlow> {
    const metrics = await this.getOnChainMetrics(symbol);
    return metrics.exchangeFlows;
  }

  // ============ DEFI METRICS ============

  async getDefiMetrics(protocol: string): Promise<DefiMetrics> {
    // In production: query DefiLlama API
    return {
      protocol,
      tvl: Math.random() * 10000000000,
      volume24h: Math.random() * 500000000,
      fees24h: Math.random() * 50000000,
      users24h: Math.floor(Math.random() * 100000),
      tokenPrice: Math.random() * 100,
      priceChange24h: (Math.random() - 0.5) * 20,
    };
  }

  async getTopDefiProtocols(limit = 10): Promise<DefiMetrics[]> {
    const protocols = ['Uniswap', 'Aave', 'Lido', 'MakerDAO', 'Curve', 'Compound', 'PancakeSwap', 'GMX'];
    const results: DefiMetrics[] = [];

    for (let i = 0; i < Math.min(limit, protocols.length); i++) {
      results.push(await this.getDefiMetrics(protocols[i]));
    }

    return results.sort((a, b) => b.tvl - a.tvl);
  }

  // ============ SIGNAL GENERATION ============

  async getOnChainSignal(symbol: string): Promise<{
    signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    score: number;
    reasons: string[];
  }> {
    const metrics = await this.getOnChainMetrics(symbol);
    let score = 50;
    const reasons: string[] = [];

    // Exchange flow analysis
    if (metrics.exchangeFlows.netFlow > 0) {
      score += 15;
      reasons.push(`Net outflow from exchanges ($${(metrics.exchangeFlows.netFlow / 1e6).toFixed(1)}M) — accumulation signal`);
    } else {
      score -= 10;
      reasons.push(`Net inflow to exchanges ($${(Math.abs(metrics.exchangeFlows.netFlow) / 1e6).toFixed(1)}M) — potential selling pressure`);
    }

    // Active addresses trend
    if (metrics.activeAddresses > 300000) {
      score += 10;
      reasons.push(`High active addresses (${metrics.activeAddresses.toLocaleString()}) — strong network activity`);
    }

    // Whale movements
    const exchangeTransfers = metrics.whaleMovements.filter((w) => w.isExchangeTransfer);
    const toExchange = exchangeTransfers.filter((w) => w.exchange).length;
    if (toExchange > 2) {
      score -= 15;
      reasons.push(`${toExchange} whale transfers to exchanges — possible dump incoming`);
    } else {
      score += 10;
      reasons.push(`Low whale-to-exchange activity — holders accumulating`);
    }

    score = Math.max(0, Math.min(100, score));
    const signal = score >= 65 ? 'BULLISH' : score <= 35 ? 'BEARISH' : 'NEUTRAL';

    return { signal, score, reasons };
  }

  // ============ ETHEREUM SPECIFIC ============

  async getGasPrice(): Promise<{ slow: number; standard: number; fast: number }> {
    if (!this.etherscanKey) {
      return { slow: 15, standard: 25, fast: 35 };
    }

    try {
      const { data } = await this.etherscanClient.get('', { params: { module: 'gastracker', action: 'gasoracle' } });
      return {
        slow: parseFloat(data.result.SafeGasPrice),
        standard: parseFloat(data.result.ProposeGasPrice),
        fast: parseFloat(data.result.FastGasPrice),
      };
    } catch {
      return { slow: 15, standard: 25, fast: 35 };
    }
  }

  async getEthSupply(): Promise<number> {
    if (!this.etherscanKey) return 120000000;

    try {
      const { data } = await this.etherscanClient.get('', { params: { module: 'stats', action: 'ethsupply' } });
      return parseInt(data.result) / 1e18;
    } catch {
      return 120000000;
    }
  }
}
