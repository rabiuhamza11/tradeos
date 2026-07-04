import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PortfoliosService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: { name: string; description?: string; currency?: string }) {
    return this.prisma.portfolio.create({
      data: { userId, name: dto.name, description: dto.description, currency: dto.currency || 'USD', totalValue: 0, cashBalance: 100000 },
    });
  }

  async findAll(userId: string) {
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      include: { _count: { select: { positions: true, trades: true } }, positions: { where: { status: 'OPEN' } } },
    });
    return portfolios.map(p => ({
      ...p,
      openPositions: p.positions.length,
      totalValue: Number(p.totalValue),
      cashBalance: Number(p.cashBalance),
    }));
  }

  async findOne(userId: string, id: string) {
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id, userId },
      include: { positions: { where: { status: 'OPEN' }, orderBy: { marketValue: 'desc' } }, allocations: true },
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return portfolio;
  }

  async getPositions(userId: string, portfolioId: string) {
    return this.prisma.position.findMany({
      where: { userId, portfolioId, status: 'OPEN' },
      orderBy: { marketValue: 'desc' },
    });
  }

  async getPerformance(userId: string, portfolioId: string) {
    const trades = await this.prisma.trade.findMany({ where: { userId, portfolioId }, orderBy: { executedAt: 'asc' } });
    const positions = await this.prisma.position.findMany({ where: { userId, portfolioId, status: 'OPEN' } });
    
    const totalUnrealized = positions.reduce((s, p) => s + Number(p.unrealizedPnL), 0);
    const totalRealized = positions.reduce((s, p) => s + Number(p.realizedPnL), 0);
    const totalFees = trades.reduce((s, t) => s + Number(t.fee), 0);
    const totalValue = positions.reduce((s, p) => s + Number(p.marketValue), 0);
    
    return {
      totalValue,
      unrealizedPnL: totalUnrealized,
      realizedPnL: totalRealized,
      totalFees,
      netPnL: totalUnrealized + totalRealized - totalFees,
      totalTrades: trades.length,
      winRate: this.calculateWinRate(trades),
    };
  }

  async update(userId: string, id: string, dto: { name?: string; description?: string; isPublic?: boolean }) {
    const portfolio = await this.prisma.portfolio.findFirst({ where: { id, userId } });
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return this.prisma.portfolio.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const portfolio = await this.prisma.portfolio.findFirst({ where: { id, userId } });
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    await this.prisma.portfolio.delete({ where: { id } });
    return { message: 'Portfolio deleted' };
  }

  private calculateWinRate(trades: any[]): number {
    if (trades.length === 0) return 0;
    const sells = trades.filter(t => t.side === 'SELL');
    if (sells.length === 0) return 0;
    // Simplified win rate calculation
    return Math.round((sells.length / trades.length) * 100);
  }
}
