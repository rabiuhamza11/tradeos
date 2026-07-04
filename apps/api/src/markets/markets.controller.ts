import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MarketsService } from './markets.service';

@ApiTags('Markets')
@Controller('markets')
export class MarketsController {
  constructor(private svc: MarketsService) {}

  @Get() async quotes() { return this.svc.getQuotes(); }
  @Get('movers') async movers() { return this.svc.getMarketMovers(); }
  @Get('search') async search(@Query('q') q: string) { return this.svc.search(q); }
  @Get(':symbol') async quote(@Param('symbol') s: string) { return this.svc.getQuote(s); }
  @Get(':symbol/candles') async candles(@Param('symbol') s: string, @Query('interval') i: string, @Query('limit') l: number) {
    return this.svc.getCandles(s, i, l);
  }
}
