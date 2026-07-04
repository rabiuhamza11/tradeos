import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EncryptionService } from '../../packages/cybersecurity/src';

@Injectable()
export class ExchangeService implements OnModuleInit {
  private encryption = new EncryptionService();
  private adapters: Map<string, any> = new Map();
  private isTestnet: boolean;

  constructor(private prisma: PrismaService) {
    this.isTestnet = process.env.EXCHANGE_TESTNET === 'true' || !process.env.EXCHANGE_LIVE;
  }

  async onModuleInit() {
    // Auto-load credentials from env vars on startup
    const { createExchangeManager } = require('../../../packages/exchange-adapters/src');
    const manager = createExchangeManager(this.isTestnet);
    this.adapters.set('manager', manager);
    console.log(`✅ Exchange manager initialized (${this.isTestnet ? 'TESTNET' : 'LIVE'})`);
    console.log(`   Connected: ${manager.getConnectedExchanges().join(', ') || 'none — add API keys'}`);
  }

  // ============ CREDENTIAL MANAGEMENT ============

  async addCredentials(userId: string, exchange: string, apiKey: string, apiSecret: string, passphrase?: string): Promise<void> {
    const encKey = process.env.ENCRYPTION_KEY || 'tradeos-encryption-key-32c';
    const existing = await this.prisma.apiKey.findFirst({ where: { userId, exchange } });

    if (existing) {
      await this.prisma.apiKey.update({
        where: { id: existing.id },
        data: {
          keyHash: this.encryption.hash(apiKey),
          keyPrefix: apiKey.substring(0, 8),
          secretHash: this.encryption.encrypt(apiSecret, encKey),
        },
      });
    } else {
      await this.prisma.apiKey.create({
        data: {
          userId,
          name: `${exchange} API Key`,
          exchange,
          keyHash: this.encryption.hash(apiKey),
          keyPrefix: apiKey.substring(0, 8),
          secretHash: this.encryption.encrypt(apiSecret, encKey),
          permissions: ['trade', 'read'],
          isActive: true,
        },
      });
    }

    // Hot-reload the adapter
    await this.loadUserAdapters(userId);
  }

  async removeCredentials(userId: string, exchange: string): Promise<void> {
    await this.prisma.apiKey.updateMany({
      where: { userId, exchange, isActive: true },
      data: { isActive: false },
    });
  }

  private async loadUserAdapters(userId: string): Promise<void> {
    const keys = await this.prisma.apiKey.findMany({ where: { userId, isActive: true } });
    const { createExchangeManager } = require('../../../packages/exchange-adapters/src');
    const manager = createExchangeManager(this.isTestnet);
    const encKey = process.env.ENCRYPTION_KEY || 'tradeos-encryption-key-32c';

    for (const key of keys) {
      const secret = this.encryption.decrypt(key.secretHash, encKey);
      manager.setCredentials(key.exchange as any, { apiKey: key.keyPrefix, apiSecret: secret });
    }

    this.adapters.set(`user_${userId}`, manager);
  }

  getManager(userId?: string): any {
    if (userId && this.adapters.has(`user_${userId}`)) {
      return this.adapters.get(`user_${userId}`);
    }
    return this.adapters.get('manager');
  }

  // ============ MARKET DATA ============

  async getTicker(symbol: string, assetType: string): Promise<any> {
    const manager = this.getManager();
    if (!manager.hasCredentials(manager.getExchangeForAsset(assetType))) {
      // Fallback to simulated data if no exchange configured
      return this.simulatedTicker(symbol);
    }
    return manager.getTicker(symbol, assetType);
  }

  async getCandles(symbol: string, assetType: string, interval: string, limit?: number): Promise<any[]> {
    const manager = this.getManager();
    const exchange = manager.getExchangeForAsset(assetType);
    if (!manager.hasCredentials(exchange)) {
      return this.simulatedCandles(symbol, limit || 100);
    }
    return manager.getCandles(symbol, assetType, interval, limit);
  }

  // ============ TRADING ============

  async placeOrder(userId: string, order: any, assetType: string): Promise<any> {
    await this.loadUserAdapters(userId);
    const manager = this.getManager(userId);
    const exchange = manager.getExchangeForAsset(assetType);

    if (!manager.hasCredentials(exchange)) {
      throw new Error(`${exchange} API keys not configured. Add them in Settings > API Keys.`);
    }

    return manager.placeOrder(order, assetType);
  }

  async cancelOrder(userId: string, orderId: string, symbol: string, assetType: string): Promise<boolean> {
    await this.loadUserAdapters(userId);
    const manager = this.getManager(userId);
    return manager.cancelOrder(orderId, symbol, assetType);
  }

  async getOrderStatus(userId: string, orderId: string, symbol: string, assetType: string): Promise<any> {
    await this.loadUserAdapters(userId);
    const manager = this.getManager(userId);
    return manager.getOrderStatus(orderId, symbol, assetType);
  }

  // ============ ACCOUNT ============

  async getBalances(userId: string, exchange?: string): Promise<any> {
    await this.loadUserAdapters(userId);
    const manager = this.getManager(userId);
    if (exchange) return manager.getBalances(exchange);
    return manager.getAllBalances();
  }

  async getPositions(userId: string, exchange?: string): Promise<any> {
    await this.loadUserAdapters(userId);
    const manager = this.getManager(userId);
    if (exchange) return manager.getPositions(exchange);
    return manager.getAllPositions();
  }

  async testConnection(userId: string, exchange: string): Promise<boolean> {
    await this.loadUserAdapters(userId);
    const manager = this.getManager(userId);
    return manager.testConnection(exchange as any);
  }

  async testAllConnections(userId: string): Promise<Record<string, boolean>> {
    await this.loadUserAdapters(userId);
    const manager = this.getManager(userId);
    return manager.testAllConnections();
  }

  getConnectedExchanges(userId?: string): string[] {
    const manager = this.getManager(userId);
    return manager.getConnectedExchanges();
  }

  // ============ FALLBACK (simulated data when no API keys) ============

  private simulatedTicker(symbol: string): any {
    const basePrices: Record<string, number> = {
      BTC: 65432, ETH: 3521, SOL: 178, AAPL: 195, TSLA: 251,
      GOOGL: 175, MSFT: 421, EURUSD: 1.084, GBPUSD: 1.271, XAU: 2352,
    };
    const base = basePrices[symbol.toUpperCase()] || 100;
    const variance = (Math.random() - 0.5) * 0.02;
    const price = base * (1 + variance);
    return {
      symbol, price, bid: price * 0.999, ask: price * 1.001,
      high24h: base * 1.02, low24h: base * 0.98, volume24h: 1000000,
      changePct24h: variance, timestamp: Date.now(),
    };
  }

  private simulatedCandles(symbol: string, limit: number): any[] {
    const basePrices: Record<string, number> = { BTC: 65432, ETH: 3521, AAPL: 195, TSLA: 251 };
    const base = basePrices[symbol.toUpperCase()] || 100;
    const candles: any[] = [];
    let prevClose = base;
    for (let i = limit - 1; i >= 0; i--) {
      const open = prevClose;
      const vol = (Math.random() - 0.5) * 0.01;
      const close = open * (1 + vol);
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);
      candles.push({ timestamp: Date.now() - i * 3600000, open, high, low, close, volume: Math.floor(Math.random() * 1000000) });
      prevClose = close;
    }
    return candles;
  }
}
