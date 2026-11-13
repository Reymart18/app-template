import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from './auth.config.js';

interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  validate(payload: JwtPayload) {
    if (payload.role !== 'admin') {
      throw new ForbiddenException('Administrator access is required.');
    }

    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };
  }
}
