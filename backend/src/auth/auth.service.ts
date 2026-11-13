import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(identifier?: string, password?: string) {
    const normalizedIdentifier = typeof identifier === 'string' ? identifier.trim() : '';

    if (!normalizedIdentifier || typeof password !== 'string' || !password) {
      throw new UnauthorizedException('Username/email and password are required.');
    }

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.username = :identifier OR user.email = :identifier', { identifier: normalizedIdentifier })
      .getOne();

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid username/email or password.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}
