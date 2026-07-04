import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'tradeos-secret-change-me',
    });
  }
  async validate(payload: any) {
    if (!payload.sub) throw new UnauthorizedException('Invalid token');
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
