import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private svc: AnalyticsService) {}

  @Get('dashboard') async dashboard(@Req() req: any) { return this.svc.getDashboard(req.user.id); }
  @Get('trades') async trades(@Req() req: any) { return this.svc.getTradeAnalytics(req.user.id); }
  @Get('risk') async risk(@Req() req: any) { return this.svc.getRiskMetrics(req.user.id); }
}
