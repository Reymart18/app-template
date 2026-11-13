import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';

@Injectable()
export class LocalAdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LocalAdminSeedService.name);

  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'production' || process.env.SEED_LOCAL_ADMIN === 'false') {
      return;
    }

    const userCount = await this.usersRepository.count();
    if (userCount > 0) {
      return;
    }

    const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
    const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@pvhai.local';
    const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

    await this.usersRepository.save({
      username,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin',
    });

    this.logger.log(`Created local dummy administrator "${username}".`);
  }
}
