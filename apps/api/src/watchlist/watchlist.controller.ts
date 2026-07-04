import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Watchlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('watchlist')
export class WatchlistController {
  constructor(private svc: WatchlistService) {}

  @Post() async create(@Req() req: any, @Body('name') name: string) { return this.svc.create(req.user.id, name); }
  @Get() async findAll(@Req() req: any) { return this.svc.findAll(req.user.id); }
  @Post(':id/add') async add(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.addSymbol(req.user.id, id, dto.symbol, dto.assetType); }
  @Delete(':id/:itemId') async removeItem(@Param('itemId') itemId: string) { return this.svc.removeSymbol('', '', itemId); }
  @Delete(':id') async remove(@Param('id') id: string) { return this.svc.remove('', id); }
}
