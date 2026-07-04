// TradeOS — Unified Exchange Adapter Index
// Single entry point to access all 5 exchange adapters

export { BinanceAdapter } from './binance';
export { BinanceFuturesAdapter } from './binance-futures';
export { CoinbaseAdapter } from './coinbase';
export { AlpacaAdapter } from './alpaca';
export { OandaAdapter } from './oanda';

// WebSocket streams
export { BinanceWS } from './binance-ws';
export { CoinbaseWS } from './coinbase-ws';

// Types
export type { ExchangeConfig, OrderRequest, OrderResult, Balance, Ticker } from './types';
export type { Candle, OrderBook } from './binance-ws';
export type { AlpacaOrder, AlpacaPosition, AlpacaAccount } from './alpaca';
export type { OandaOrder, OandaPosition, OandaAccount, OandaCandle } from './oanda';

// ============ EXCHANGE FACTORY ============

import { BinanceAdapter } from './binance';
import { BinanceFuturesAdapter } from './binance-futures';
import { CoinbaseAdapter } from './coinbase';
import { AlpacaAdapter } from './alpaca';
import { OandaAdapter } from './oanda';
import { ExchangeConfig } from './types';

export type ExchangeName = 'binance' | 'binance_futures' | 'coinbase' | 'alpaca' | 'oanda';

export class ExchangeFactory {
  static create(name: ExchangeName, config: ExchangeConfig) {
    switch (name) {
      case 'binance':
        return new BinanceAdapter(config.apiKey, config.apiSecret, config.testnet);
      case 'binance_futures':
        return new BinanceFuturesAdapter(config.apiKey, config.apiSecret, config.testnet);
      case 'coinbase':
        return new CoinbaseAdapter(config.apiKey, config.apiSecret, config.passphrase, config.testnet);
      case 'alpaca':
        return new AlpacaAdapter(config.apiKey, config.apiSecret, config.testnet);
      case 'oanda':
        return new OandaAdapter(config.apiKey, config.accountId, config.testnet);
      default:
        throw new Error(`Unknown exchange: ${name}`);
    }
  }

  static getSupportedExchanges(): ExchangeName[] {
    return ['binance', 'binance_futures', 'coinbase', 'alpaca', 'oanda'];
  }

  static getExchangeInfo(name: ExchangeName): { name: string; assetType: string; features: string[] } {
    const info: Record<ExchangeName, { name: string; assetType: string; features: string[] }> = {
      binance: { name: 'Binance Spot', assetType: 'Crypto', features: ['spot', 'ws-ticker', 'ws-kline', 'ws-depth', 'ws-trade'] },
      binance_futures: { name: 'Binance Futures', assetType: 'Crypto Futures', features: ['futures', 'leverage', 'ws-ticker', 'ws-kline', 'ws-depth'] },
      coinbase: { name: 'Coinbase Advanced', assetType: 'Crypto', features: ['spot', 'ws-ticker', 'ws-trade', 'ws-heartbeat'] },
      alpaca: { name: 'Alpaca Markets', assetType: 'US Stocks', features: ['stocks', 'etfs', 'ws-trade-updates', 'ws-account-updates', 'fractional-shares'] },
      oanda: { name: 'OANDA', assetType: 'Forex/CFD', features: ['forex', 'cfd', 'commodities', 'streaming-prices', 'multi-account'] },
    };
    return info[name];
  }
}
