import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register') async register(@Body() dto: any) { return this.authService.register(dto); }
  @Post('login') async login(@Body() dto: any) { return this.authService.login(dto); }
  @Post('refresh') async refresh(@Body('refreshToken') token: string) { return this.authService.refresh(token); }
  @Post('logout') async logout(@Body('refreshToken') token: string) { return this.authService.logout(token); }
  @Post('password/reset-request') async requestReset(@Body('email') email: string) { return this.authService.requestPasswordReset(email); }
  @Post('password/reset') async resetPassword(@Body() dto: any) { return this.authService.resetPassword(dto.token, dto.password); }

  @Post('2fa/enable')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async enable2FA(@Req() req: any) { return this.authService.enable2FA(req.user.id); }

  @Post('2fa/disable')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async disable2FA(@Req() req: any) { return this.authService.disable2FA(req.user.id); }
}
