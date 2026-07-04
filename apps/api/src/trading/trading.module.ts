import { Module } from '@nestjs/common';
import { ExchangeModule } from '../common/exchange.module';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';

@Module({
  imports: [ExchangeModule],
  providers: [TradingService],
  controllers: [TradingController],
})
export class TradingModule {}
