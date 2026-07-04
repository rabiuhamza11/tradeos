import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ExchangeService } from '../common/exchange.service';

@Injectable()
export class TradingService {
  constructor(
    private prisma: PrismaService,
    private exchangeService: ExchangeService,
  ) {}

  async executeOrder(userId: string, dto: { symbol: string; assetType: string; side: string; type: string; quantity: number; price?: number; stopPrice?: number; portfolioId: string }) {
    const portfolio = await this.prisma.portfolio.findFirst({ where: { id: dto.portfolioId, userId } });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    // Create order record
    const order = await this.prisma.order.create({
      data: {
        userId, portfolioId: dto.portfolioId, symbol: dto.symbol,
        assetType: dto.assetType as any, side: dto.side as any, type: dto.type as any,
        quantity: dto.quantity, price: dto.price, stopPrice: dto.stopPrice,
        status: 'PENDING',
      },
    });

    // Route to real exchange
    try {
      const exchangeOrder = await this.exchangeService.placeOrder(userId, {
        symbol: dto.symbol,
        side: dto.side as 'BUY' | 'SELL',
        type: dto.type as any,
        quantity: dto.quantity,
        price: dto.price,
        stopPrice: dto.stopPrice,
        timeInForce: 'GTC' as any,
        clientOrderId: `tradeos_${order.id}`,
      }, dto.assetType);

      // Update order with exchange response
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: exchangeOrder.status === 'FILLED' ? 'FILLED' : 'PENDING',
          filledQuantity: exchangeOrder.filledQuantity,
          exchange: this.exchangeService.getManager(userId).getExchangeForAsset(dto.assetType),
          executedAt: exchangeOrder.status === 'FILLED' ? new Date(exchangeOrder.createdAt) : null,
        },
      });

      // If filled, create trade record and update position
      if (exchangeOrder.status === 'FILLED' && exchangeOrder.avgFillPrice > 0) {
        const fee = exchangeOrder.fees || (dto.quantity * exchangeOrder.avgFillPrice * 0.001);

        const trade = await this.prisma.trade.create({
          data: {
            userId, portfolioId: dto.portfolioId, orderId: order.id,
            symbol: dto.symbol, assetType: dto.assetType as any,
            side: dto.side as any, quantity: dto.quantity,
            price: exchangeOrder.avgFillPrice,
            value: dto.quantity * exchangeOrder.avgFillPrice,
            fee,
            exchange: this.exchangeService.getManager(userId).getExchangeForAsset(dto.assetType),
          },
        });

        // Update position
        await this.updatePosition(userId, dto.portfolioId, dto.symbol, dto.assetType, dto.side, dto.quantity, exchangeOrder.avgFillPrice);
        await this.updatePortfolioValue(dto.portfolioId);

        return { order, trade, exchangeOrder, message: `Order filled on ${exchangeOrder.exchangeOrderId}` };
      }

      return { order, exchangeOrder, message: 'Order placed on exchange — waiting for fill' };
    } catch (error) {
      // Mark order as rejected if exchange fails
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'REJECTED', error: error.message },
      });
      throw new BadRequestException(`Exchange error: ${error.message}`);
    }
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'FILLED') throw new BadRequestException('Cannot cancel filled order');

    // Cancel on exchange
    if (order.exchange) {
      await this.exchangeService.cancelOrder(userId, orderId, order.symbol, order.assetType);
    }

    return this.prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
  }

  async getOrderHistory(userId: string, page = 1, limit = 20) {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getTradeHistory(userId: string, page = 1, limit = 20) {
    const [trades, total] = await Promise.all([
      this.prisma.trade.findMany({ where: { userId }, orderBy: { executedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.trade.count({ where: { userId } }),
    ]);
    return { data: trades, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // ============ EXCHANGE STATUS ============

  async getExchangeStatus(userId: string) {
    const connected = this.exchangeService.getConnectedExchanges(userId);
    const testResults = await this.exchangeService.testAllConnections(userId);
    return { connected, testResults, isTestnet: process.env.EXCHANGE_TESTNET !== 'false' };
  }

  async getExchangeBalances(userId: string, exchange?: string) {
    return this.exchangeService.getBalances(userId, exchange);
  }

  async getExchangePositions(userId: string, exchange?: string) {
    return this.exchangeService.getPositions(userId, exchange);
  }

  // ============ POSITION MANAGEMENT ============

  private async updatePosition(userId: string, portfolioId: string, symbol: string, assetType: string, side: string, quantity: number, price: number) {
    const existing = await this.prisma.position.findFirst({ where: { userId, portfolioId, symbol, status: 'OPEN' } });

    if (existing) {
      if (side === 'BUY') {
        const newQty = Number(existing.quantity) + quantity;
        const newAvg = (Number(existing.avgEntryPrice) * Number(existing.quantity) + price * quantity) / newQty;
        await this.prisma.position.update({ where: { id: existing.id }, data: { quantity: newQty, avgEntryPrice: newAvg, currentPrice: price, marketValue: newQty * price } });
      } else {
        const remaining = Number(existing.quantity) - quantity;
        if (remaining <= 0) {
          const realizedPnL = (price - Number(existing.avgEntryPrice)) * Number(existing.quantity);
          await this.prisma.position.update({ where: { id: existing.id }, data: { status: 'CLOSED', realizedPnL, closedAt: new Date(), quantity: 0 } });
        } else {
          const realizedPnL = Number(existing.realizedPnL) + (price - Number(existing.avgEntryPrice)) * quantity;
          await this.prisma.position.update({ where: { id: existing.id }, data: { quantity: remaining, currentPrice: price, marketValue: remaining * price, realizedPnL } });
        }
      }
    } else if (side === 'BUY') {
      await this.prisma.position.create({
        data: { userId, portfolioId, symbol, name: symbol, assetType: assetType as any,
          quantity, avgEntryPrice: price, currentPrice: price, marketValue: quantity * price,
          unrealizedPnL: 0, realizedPnL: 0, side: 'LONG', status: 'OPEN' },
      });
    }
  }

  private async updatePortfolioValue(portfolioId: string) {
    const positions = await this.prisma.position.findMany({ where: { portfolioId, status: 'OPEN' } });
    const totalValue = positions.reduce((sum, p) => sum + Number(p.marketValue), 0);
    await this.prisma.portfolio.update({ where: { id: portfolioId }, data: { totalValue } });
  }
}
