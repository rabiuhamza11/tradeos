// TradeOS Exchange Adapters — Unified interface for multiple exchanges
import { ExchangeAdapter, ExchangeCredentials, Ticker, Candle, OrderRequest, OrderResponse, AccountBalance, PositionInfo } from './types';
import { BinanceAdapter } from './binance';
import { BinanceFuturesAdapter } from './binance-futures';
import { CoinbaseAdapter } from './coinbase';
import { AlpacaAdapter } from './alpaca';
import { OANDAAdapter } from './oanda';
import { StreamManager, BinanceStream, CoinbaseStream } from './websocket';

export type ExchangeName = 'binance' | 'binance_futures' | 'coinbase' | 'alpaca' | 'oanda';

// Asset type → Exchange routing
const ASSET_ROUTING: Record<string, ExchangeName> = {
  CRYPTO: 'binance',
  STOCK: 'alpaca',
  ETF: 'alpaca',
  FOREX: 'oanda',
  COMMODITY: 'oanda',
  OPTION: 'alpaca',
  FUTURE: 'binance_futures',
  BOND: 'alpaca',
};

export class ExchangeManager {
  private adapters: Map<ExchangeName, ExchangeAdapter> = new Map();
  private credentials: Map<ExchangeName, ExchangeCredentials> = new Map();
  private isTestnet: boolean;
  private streamManager: StreamManager | null = null;

  constructor(isTestnet: boolean = false) {
    this.isTestnet = isTestnet;
  }

  // ============ CREDENTIAL MANAGEMENT ============

  setCredentials(exchange: ExchangeName, credentials: ExchangeCredentials): void {
    this.credentials.set(exchange, credentials);
    this.createAdapter(exchange);
    console.log(`✅ ${exchange} credentials configured`);
  }

  hasCredentials(exchange: ExchangeName): boolean {
    return this.credentials.has(exchange);
  }

  getConnectedExchanges(): ExchangeName[] {
    return Array.from(this.adapters.keys());
  }

  // ============ ADAPTER CREATION ============

  private createAdapter(exchange: ExchangeName): ExchangeAdapter | null {
    const creds = this.credentials.get(exchange);
    if (!creds) return null;

    let adapter: ExchangeAdapter;
    switch (exchange) {
      case 'binance': adapter = new BinanceAdapter(creds, this.isTestnet); break;
      case 'binance_futures': adapter = new BinanceFuturesAdapter(creds, this.isTestnet); break;
      case 'coinbase': adapter = new CoinbaseAdapter(creds, this.isTestnet); break;
      case 'alpaca': adapter = new AlpacaAdapter(creds, this.isTestnet); break;
      case 'oanda': adapter = new OANDAAdapter(creds, this.isTestnet); break;
      default: return null;
    }

    this.adapters.set(exchange, adapter);
    return adapter;
  }

  getAdapter(exchange: ExchangeName): ExchangeAdapter | null {
    return this.adapters.get(exchange) || null;
  }

  getAdapterForAsset(assetType: string): ExchangeAdapter | null {
    const exchange = ASSET_ROUTING[assetType] || 'binance';
    return this.getAdapter(exchange);
  }

  getExchangeForAsset(assetType: string): ExchangeName {
    return ASSET_ROUTING[assetType] || 'binance';
  }

  // ============ WEBSOCKET STREAMING ============

  getStreamManager(): StreamManager {
    if (!this.streamManager) {
      this.streamManager = new StreamManager(this.isTestnet);
      this.streamManager.start();
    }
    return this.streamManager;
  }

  startStreaming(): StreamManager {
    return this.getStreamManager();
  }

  stopStreaming(): void {
    if (this.streamManager) {
      this.streamManager.stop();
      this.streamManager = null;
    }
  }

  // ============ UNIFIED MARKET DATA ============

  async getTicker(symbol: string, assetType: string): Promise<Ticker> {
    const adapter = this.getAdapterForAsset(assetType);
    if (!adapter) throw new Error(`No exchange configured for ${assetType}`);
    return adapter.getTicker(symbol);
  }

  async getCandles(symbol: string, assetType: string, interval: string, limit?: number): Promise<Candle[]> {
    const adapter = this.getAdapterForAsset(assetType);
    if (!adapter) throw new Error(`No exchange configured for ${assetType}`);
    return adapter.getCandles(symbol, interval, limit);
  }

  async getOrderBook(symbol: string, assetType: string, depth?: number): Promise<{ bids: [number, number][]; asks: [number, number][] }> {
    const adapter = this.getAdapterForAsset(assetType);
    if (!adapter) throw new Error(`No exchange configured for ${assetType}`);
    return adapter.getOrderBook(symbol, depth);
  }

  // ============ UNIFIED TRADING ============

  async placeOrder(order: OrderRequest, assetType: string): Promise<OrderResponse> {
    const exchange = this.getExchangeForAsset(assetType);
    const adapter = this.getAdapter(exchange);
    if (!adapter) throw new Error(`${exchange} not configured. Please add API keys in Settings.`);
    console.log(`📤 Routing order to ${exchange}: ${order.side} ${order.quantity} ${order.symbol}`);
    return adapter.placeOrder(order);
  }

  async cancelOrder(orderId: string, symbol: string, assetType: string): Promise<boolean> {
    const adapter = this.getAdapterForAsset(assetType);
    if (!adapter) throw new Error(`No exchange configured for ${assetType}`);
    return adapter.cancelOrder(orderId, symbol);
  }

  async getOrderStatus(orderId: string, symbol: string, assetType: string): Promise<OrderResponse> {
    const adapter = this.getAdapterForAsset(assetType);
    if (!adapter) throw new Error(`No exchange configured for ${assetType}`);
    return adapter.getOrderStatus(orderId, symbol);
  }

  // ============ UNIFIED ACCOUNT DATA ============

  async getBalances(exchange: ExchangeName): Promise<AccountBalance[]> {
    const adapter = this.getAdapter(exchange);
    if (!adapter) throw new Error(`${exchange} not configured`);
    return adapter.getBalances();
  }

  async getPositions(exchange: ExchangeName): Promise<PositionInfo[]> {
    const adapter = this.getAdapter(exchange);
    if (!adapter) throw new Error(`${exchange} not configured`);
    return adapter.getPositions();
  }

  async getAllBalances(): Promise<Record<string, AccountBalance[]>> {
    const result: Record<string, AccountBalance[]> = {};
    for (const [name, adapter] of this.adapters) {
      try { result[name] = await adapter.getBalances(); } catch (e) { console.error(`Failed to get balances from ${name}:`, e); }
    }
    return result;
  }

  async getAllPositions(): Promise<Record<string, PositionInfo[]>> {
    const result: Record<string, PositionInfo[]> = {};
    for (const [name, adapter] of this.adapters) {
      try { result[name] = await adapter.getPositions(); } catch (e) { console.error(`Failed to get positions from ${name}:`, e); }
    }
    return result;
  }

  // ============ CONNECTION TESTING ============

  async testAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [name, adapter] of this.adapters) {
      try { results[name] = await adapter.testConnection(); } catch { results[name] = false; }
    }
    return results;
  }

  async testConnection(exchange: ExchangeName): Promise<boolean> {
    const adapter = this.getAdapter(exchange);
    if (!adapter) return false;
    return adapter.testConnection();
  }

  // ============ ENVIRONMENT ============

  setTestnet(isTestnet: boolean): void {
    this.isTestnet = isTestnet;
    for (const [name] of this.adapters) { this.createAdapter(name); }
  }

  getTestnet(): boolean { return this.isTestnet; }
}

// ============ FACTORY ============

export function createExchangeManager(isTestnet: boolean = true): ExchangeManager {
  const manager = new ExchangeManager(isTestnet);

  if (process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET) {
    manager.setCredentials('binance', { apiKey: process.env.BINANCE_API_KEY, apiSecret: process.env.BINANCE_API_SECRET });
  }

  if (process.env.BINANCE_FUTURES_API_KEY && process.env.BINANCE_FUTURES_API_SECRET) {
    manager.setCredentials('binance_futures', { apiKey: process.env.BINANCE_FUTURES_API_KEY, apiSecret: process.env.BINANCE_FUTURES_API_SECRET });
  }

  if (process.env.COINBASE_API_KEY && process.env.COINBASE_API_SECRET) {
    manager.setCredentials('coinbase', { apiKey: process.env.COINBASE_API_KEY, apiSecret: process.env.COINBASE_API_SECRET, passphrase: process.env.COINBASE_PASSPHRASE });
  }

  if (process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET) {
    manager.setCredentials('alpaca', { apiKey: process.env.ALPACA_API_KEY, apiSecret: process.env.ALPACA_API_SECRET });
  }

  if (process.env.OANDA_API_KEY && process.env.OANDA_ACCOUNT_ID) {
    manager.setCredentials('oanda', { apiKey: process.env.OANDA_API_KEY, apiSecret: '', passphrase: process.env.OANDA_ACCOUNT_ID });
  }

  return manager;
}

// ============ EXPORTS ============

export {
  ExchangeManager, ExchangeAdapter, ExchangeCredentials,
  Ticker, Candle, OrderRequest, OrderResponse,
  AccountBalance, PositionInfo,
  BinanceAdapter, BinanceFuturesAdapter, CoinbaseAdapter, AlpacaAdapter, OANDAAdapter,
  StreamManager, BinanceStream, CoinbaseStream,
  createExchangeManager, ASSET_ROUTING,
};
