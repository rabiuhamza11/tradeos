import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(dto: { email: string; password: string; name?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerifyToken = uuidv4();

    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name, emailVerifyToken },
      select: { id: true, email: true, name: true, role: true, kycStatus: true, createdAt: true },
    });

    return {
      user,
      accessToken: this.signToken(user.id, user.email, user.role),
      refreshToken: await this.issueRefreshToken(user.id),
    };
  }

  async login(dto: { email: string; password: string; twoFactorCode?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash || '');
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) throw new UnauthorizedException('2FA code required');
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: dto.twoFactorCode,
        window: 1,
      });
      if (!verified) throw new UnauthorizedException('Invalid 2FA code');
    }

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, twoFactorEnabled: user.twoFactorEnabled, kycStatus: user.kycStatus },
      accessToken: this.signToken(user.id, user.email, user.role),
      refreshToken: await this.issueRefreshToken(user.id),
    };
  }

  async refresh(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) throw new UnauthorizedException('Invalid refresh token');
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return { accessToken: this.signToken(user.id, user.email, user.role), refreshToken: await this.issueRefreshToken(user.id) };
  }

  async logout(token: string) {
    await this.prisma.refreshToken.updateMany({ where: { token, revoked: false }, data: { revoked: true } });
    return { message: 'Logged out' };
  }

  async enable2FA(userId: string) {
    const secret = speakeasy.generateSecret({ name: `TradeOS` });
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret.base32, twoFactorEnabled: true } });
    return { secret: secret.base32, qrUrl: secret.otpauth_url };
  }

  async disable2FA(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: null, twoFactorEnabled: false } });
    return { message: '2FA disabled' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If email exists, reset link sent' };
    const token = uuidv4();
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordResetToken: token, passwordResetExpires: new Date(Date.now() + 3600000) } });
    return { message: 'Reset link sent', resetToken: token };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } } });
    if (!user) throw new NotFoundException('Invalid or expired token');
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 12), passwordResetToken: null, passwordResetExpires: null } });
    return { message: 'Password reset successfully' };
  }

  private signToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign({ sub: userId, email, role });
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    await this.prisma.refreshToken.create({ data: { token, userId, expiresAt: new Date(Date.now() + 30 * 86400000) } });
    return token;
  }
}
