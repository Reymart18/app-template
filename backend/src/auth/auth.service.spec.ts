import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const queryBuilder = {
    addSelect: vi.fn(),
    where: vi.fn(),
    getOne: vi.fn(),
  };
  const usersRepository = {
    createQueryBuilder: vi.fn(),
  };
  const jwtService = {
    signAsync: vi.fn(),
  } as unknown as JwtService;
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    authService = new AuthService(usersRepository as never, jwtService);
  });

  it('returns a token for a valid administrator login', async () => {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 4);
    queryBuilder.getOne.mockResolvedValue({
      id: 1,
      username: 'admin',
      email: 'admin@pvhai.local',
      passwordHash,
      role: 'admin',
    });
    vi.mocked(jwtService.signAsync).mockResolvedValue('test-token');

    await expect(authService.login('admin', 'ChangeMe123!')).resolves.toEqual({
      accessToken: 'test-token',
      user: { id: 1, username: 'admin', email: 'admin@pvhai.local', role: 'admin' },
    });
  });

  it('rejects an invalid login', async () => {
    queryBuilder.getOne.mockResolvedValue(null);

    await expect(authService.login('admin', 'incorrect')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
