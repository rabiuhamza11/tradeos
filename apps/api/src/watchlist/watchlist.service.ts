import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class WatchlistService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, name: string) {
    return this.prisma.watchlist.create({ data: { userId, name } });
  }

  async findAll(userId: string) {
    return this.prisma.watchlist.findMany({ where: { userId }, include: { items: true } });
  }

  async addSymbol(userId: string, watchlistId: string, symbol: string, assetType: string) {
    const wl = await this.prisma.watchlist.findFirst({ where: { id: watchlistId, userId } });
    if (!wl) throw new NotFoundException('Watchlist not found');
    return this.prisma.watchlistItem.create({ data: { watchlistId, symbol, assetType: assetType as any } });
  }

  async removeSymbol(userId: string, watchlistId: string, itemId: string) {
    return this.prisma.watchlistItem.delete({ where: { id: itemId } });
  }

  async remove(userId: string, id: string) {
    return this.prisma.watchlist.delete({ where: { id } });
  }
}
