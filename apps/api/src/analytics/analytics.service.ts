import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const [portfolios, orders, trades, positions, alerts, strategies] = await Promise.all([
      this.prisma.portfolio.findMany({ where: { userId }, select: { id: true, name: true, totalValue: true } }),
      this.prisma.order.count({ where: { userId } }),
      this.prisma.trade.count({ where: { userId } }),
      this.prisma.position.findMany({ where: { userId, status: 'OPEN' }, select: { symbol: true, unrealizedPnL: true, marketValue: true } }),
      this.prisma.alert.count({ where: { userId, isActive: true } }),
      this.prisma.strategy.count({ where: { userId, status: 'ACTIVE' } }),
    ]);

    const totalValue = portfolios.reduce((s, p) => s + Number(p.totalValue), 0);
    const totalPnL = positions.reduce((s, p) => s + Number(p.unrealizedPnL), 0);
    const topPositions = [...positions].sort((a, b) => Math.abs(Number(b.marketValue)) - Math.abs(Number(a.marketValue))).slice(0, 5);

    return {
      totalPortfolioValue: totalValue,
      totalUnrealizedPnL: totalPnL,
      openPositions: positions.length,
      totalOrders: orders,
      totalTrades: trades,
      activeAlerts: alerts,
      activeStrategies: strategies,
      topPositions,
    };
  }

  async getTradeAnalytics(userId: string) {
    const trades = await this.prisma.trade.findMany({ where: { userId }, orderBy: { executedAt: 'asc' } });

    // Monthly P&L breakdown
    const monthly: Record<string, { pnl: number; trades: number }> = {};
    for (const t of trades) {
      const month = t.executedAt.toISOString().substring(0, 7);
      if (!monthly[month]) monthly[month] = { pnl: 0, trades: 0 };
      monthly[month].trades++;
      if (t.side === 'SELL') {
        monthly[month].pnl += Number(t.value) - Number(t.fee);
      }
    }

    // Asset distribution
    const byAsset: Record<string, number> = {};
    for (const t of trades) {
      const type = t.assetType;
      byAsset[type] = (byAsset[type] || 0) + Number(t.value);
    }

    // Average trade size
    const avgTradeSize = trades.length > 0 ? trades.reduce((s, t) => s + Number(t.value), 0) / trades.length : 0;

    return {
      monthlyPnL: Object.entries(monthly).map(([month, data]) => ({ month, ...data })),
      assetDistribution: Object.entries(byAsset).map(([type, value]) => ({ type, value })),
      avgTradeSize,
      totalTrades: trades.length,
      totalFees: trades.reduce((s, t) => s + Number(t.fee), 0),
    };
  }

  async getRiskMetrics(userId: string) {
    const positions = await this.prisma.position.findMany({ where: { userId, status: 'OPEN' } });
    
    const totalExposure = positions.reduce((s, p) => s + Number(p.marketValue), 0);
    const maxPosition = positions.length > 0 ? Math.max(...positions.map(p => Number(p.marketValue))) : 0;
    const concentrationRisk = totalExposure > 0 ? (maxPosition / totalExposure) * 100 : 0;
    
    // Simplified Sharpe ratio (would need historical returns in production)
    const returns = positions.map(p => Number(p.unrealizedPnL) / Number(p.marketValue || 1));
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 1 ? Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / returns.length) : 0;
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    return {
      totalExposure,
      maxPositionSize: maxPosition,
      concentrationRisk: Math.round(concentrationRisk * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      openPositions: positions.length,
      riskLevel: concentrationRisk > 50 ? 'HIGH' : concentrationRisk > 25 ? 'MEDIUM' : 'LOW',
    };
  }
}
