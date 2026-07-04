import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TradingService } from './trading.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Trading')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trading')
export class TradingController {
  constructor(private tradingService: TradingService) {}

  @Post('order')
  async placeOrder(@Req() req: any, @Body() dto: any) {
    return this.tradingService.executeOrder(req.user.id, dto);
  }

  @Delete('order/:id')
  async cancelOrder(@Req() req: any, @Param('id') id: string) {
    return this.tradingService.cancelOrder(req.user.id, id);
  }

  @Get('orders')
  async orderHistory(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.tradingService.getOrderHistory(req.user.id, Number(page), Number(limit));
  }

  @Get('trades')
  async tradeHistory(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.tradingService.getTradeHistory(req.user.id, Number(page), Number(limit));
  }

  @Get('exchanges/status')
  async exchangeStatus(@Req() req: any) {
    return this.tradingService.getExchangeStatus(req.user.id);
  }

  @Get('exchanges/balances')
  async exchangeBalances(@Req() req: any, @Query('exchange') exchange?: string) {
    return this.tradingService.getExchangeBalances(req.user.id, exchange);
  }

  @Get('exchanges/positions')
  async exchangePositions(@Req() req: any, @Query('exchange') exchange?: string) {
    return this.tradingService.getExchangePositions(req.user.id, exchange);
  }
}
