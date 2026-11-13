import { describe, expect, it, vi } from 'vitest';
import { Member } from '../members/member.entity.js';
import { AdjustmentsService } from './adjustments.service.js';

function createService(member: Member) {
  const adjustmentRepository = { find: vi.fn() };
  const memberRepository = { findOne: vi.fn().mockResolvedValue(member) };
  const manager = {
    findOne: vi.fn().mockResolvedValue(member),
    save: vi.fn(async (entityOrValue, value) => value ?? entityOrValue),
    create: vi.fn((_entity, value) => value),
    remove: vi.fn(),
  };
  const dataSource = {
    transaction: vi.fn(async (callback) => callback(manager)),
  };
  return {
    service: new AdjustmentsService(adjustmentRepository as never, memberRepository as never, dataSource as never),
    manager,
  };
}

describe('AdjustmentsService', () => {
  it('applies signed component changes and records the admin identity', async () => {
    const member = { id: 1, block: '1', lot: '1', registeredOwners: 'Sample Owner', principal: '100.00', interest: '20.00', penalty: '5.00' } as Member;
    const { service, manager } = createService(member);

    const result = await service.createAdjustment({
      blockLot: '1/1',
      adjustmentDate: '2026-11-13',
      principal: '25.00',
      interest: '-5.00',
      penalty: '',
      reason: 'Corrected billing',
    }, { id: 7, username: 'useradmin' });

    expect(member.principal).toBe('125.00');
    expect(member.interest).toBe('15.00');
    expect(manager.save).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(2);
    expect(result[0].createdByUsername).toBe('useradmin');
    expect(result[0].amount).toBe('25.00');
  });

  it('allows a signed adjustment to make a balance negative', async () => {
    const member = { id: 1, block: '1', lot: '1', registeredOwners: 'Sample Owner', principal: '100.00', interest: '20.00', penalty: '5.00' } as Member;
    const { service, manager } = createService(member);

    await expect(service.createAdjustment({
      blockLot: '1/1',
      adjustmentDate: '2026-11-13',
      principal: '',
      interest: '',
      penalty: '-6.00',
      reason: 'Authorized correction',
    }, { id: 7, username: 'useradmin' })).resolves.toHaveLength(1);

    expect(member.penalty).toBe('-1.00');
    expect(manager.save).toHaveBeenCalledTimes(2);
  });

  it('deletes an adjustment and reverses its balance effect', async () => {
    const member = { id: 1, block: '1', lot: '1', registeredOwners: 'Sample Owner', principal: '10.00', interest: '20.00', penalty: '5.00' } as Member;
    const { service, manager } = createService(member);
    manager.findOne
      .mockResolvedValueOnce({ id: 3, component: 'principal', direction: 'increase', amount: '25.00', member })
      .mockResolvedValueOnce(member);

    await expect(service.deleteAdjustment('3')).resolves.toEqual({ id: 3 });

    expect(member.principal).toBe('-15.00');
    expect(manager.remove).toHaveBeenCalledTimes(1);
  });
});
