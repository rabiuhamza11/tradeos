import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { ExchangeModule } from './common/exchange.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TradingModule } from './trading/trading.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { MarketsModule } from './markets/markets.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { StreamModule } from './stream/stream.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ExchangeModule,
    AuthModule, UsersModule, TradingModule, PortfoliosModule,
    MarketsModule, WatchlistModule, AnalyticsModule,
    StreamModule,
  ],
})
export class AppModule {}
