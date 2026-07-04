import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ExchangeService } from '../common/exchange.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private exchangeService: ExchangeService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatarUrl: true, role: true, kycStatus: true, twoFactorEnabled: true, emailVerified: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: { name?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId }, data: dto,
      select: { id: true, email: true, name: true, avatarUrl: true, role: true },
    });
  }

  async submitKyc(userId: string, kycData: any) {
    return this.prisma.user.update({ where: { id: userId }, data: { kycData, kycStatus: 'PENDING' } });
  }

  // ============ EXCHANGE API KEYS ============

  async getApiKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: { id: true, name: true, exchange: true, keyPrefix: true, permissions: true, isActive: true, lastUsedAt: true, createdAt: true },
    });
  }

  async addApiKey(userId: string, dto: { exchange: string; apiKey: string; apiSecret: string; passphrase?: string }) {
    await this.exchangeService.addCredentials(userId, dto.exchange, dto.apiKey, dto.apiSecret, dto.passphrase);
    // Verify connection
    const connected = await this.exchangeService.testConnection(userId, dto.exchange);
    return { exchange: dto.exchange, connected, message: connected ? 'API key verified and saved' : 'API key saved but connection test failed' };
  }

  async removeApiKey(userId: string, exchange: string) {
    await this.exchangeService.removeCredentials(userId, exchange);
    return { message: `API key for ${exchange} removed` };
  }

  async testExchanges(userId: string) {
    const results = await this.exchangeService.testAllConnections(userId);
    const connected = this.exchangeService.getConnectedExchanges(userId);
    return { connected, results };
  }

  async getExchangeBalances(userId: string) {
    return this.exchangeService.getBalances(userId);
  }

  async getExchangePositions(userId: string) {
    return this.exchangeService.getPositions(userId);
  }
}
