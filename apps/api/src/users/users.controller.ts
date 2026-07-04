import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get('profile') async profile(@Req() req: any) { return this.svc.getProfile(req.user.id); }
  @Put('profile') async update(@Req() req: any, @Body() dto: any) { return this.svc.updateProfile(req.user.id, dto); }
  @Post('kyc') async kyc(@Req() req: any, @Body() dto: any) { return this.svc.submitKyc(req.user.id, dto); }

  // Exchange API Key Management
  @Get('api-keys') async apiKeys(@Req() req: any) { return this.svc.getApiKeys(req.user.id); }
  @Post('api-keys') async addApiKey(@Req() req: any, @Body() dto: any) { return this.svc.addApiKey(req.user.id, dto); }
  @Delete('api-keys/:exchange') async removeApiKey(@Req() req: any, @Param('exchange') exchange: string) { return this.svc.removeApiKey(req.user.id, exchange); }
  @Post('api-keys/test') async testExchanges(@Req() req: any) { return this.svc.testExchanges(req.user.id); }
  @Get('exchange/balances') async exchangeBalances(@Req() req: any) { return this.svc.getExchangeBalances(req.user.id); }
  @Get('exchange/positions') async exchangePositions(@Req() req: any) { return this.svc.getExchangePositions(req.user.id); }
}
