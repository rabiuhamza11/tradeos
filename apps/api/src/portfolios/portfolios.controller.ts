import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PortfoliosService } from './portfolios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Portfolios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portfolios')
export class PortfoliosController {
  constructor(private svc: PortfoliosService) {}

  @Post() async create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.user.id, dto); }
  @Get() async findAll(@Req() req: any) { return this.svc.findAll(req.user.id); }
  @Get(':id') async findOne(@Req() req: any, @Param('id') id: string) { return this.svc.findOne(req.user.id, id); }
  @Get(':id/positions') async positions(@Req() req: any, @Param('id') id: string) { return this.svc.getPositions(req.user.id, id); }
  @Get(':id/performance') async performance(@Req() req: any, @Param('id') id: string) { return this.svc.getPerformance(req.user.id, id); }
  @Patch(':id') async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.user.id, id, dto); }
  @Delete(':id') async remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(req.user.id, id); }
}
