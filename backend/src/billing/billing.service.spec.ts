import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { BillingService } from './billing.service.js';

describe('BillingService', () => {
  it('creates monthly bills using sqm multiplied by the entered rate', async () => {
    const members = [
      { id: 1, block: '1', lot: '1', sqmSize: '150.00', principal: '13600.00', interest: '1200.00', penalty: '50.00', registeredOwners: 'Owner 1' },
      { id: 2, block: '1', lot: '2', sqmSize: '100.50', principal: '500.00', interest: '25.00', penalty: '10.00', registeredOwners: 'Owner 2' },
    ];
    const created: unknown[] = [];
    const manager = {
      find: vi.fn()
        .mockResolvedValueOnce(members)
        .mockResolvedValueOnce([]),
      create: vi.fn((_entity, values) => values),
      save: vi.fn((_entity, values) => {
        if (Array.isArray(values)) created.push(...values);
        return values;
      }),
    };
    const dataSource = { transaction: vi.fn(async (callback) => callback(manager)) };
    const service = new BillingService({ find: vi.fn() } as never, dataSource as never);

    const result = await service.generateMonthlyBilling({ billingMonth: '2026-11', rate: '3' });

    expect(result).toEqual({
      billingMonth: '2026-11',
      rate: '3.00',
      created: 2,
      skippedExisting: 0,
      skippedMissingSqm: 0,
    });
    expect(created).toEqual([
      expect.objectContaining({ billingMonth: '2026-11', rate: '3.00', amount: '450.00', principal: '450.00', interest: '0.00', penalty: '0.00', previousPrincipal: '13600.00', previousInterest: '1200.00', previousPenalty: '50.00', member: members[0] }),
      expect.objectContaining({ billingMonth: '2026-11', rate: '3.00', amount: '301.50', principal: '301.50', interest: '0.00', penalty: '0.00', previousPrincipal: '500.00', previousInterest: '25.00', previousPenalty: '10.00', member: members[1] }),
    ]);
    expect(members[0].principal).toBe('14050.00');
    expect(members[1].principal).toBe('801.50');
  });

  it('skips members already billed for the selected month', async () => {
    const members = [
      { id: 1, block: '1', lot: '1', sqmSize: '150.00' },
      { id: 2, block: '1', lot: '2', sqmSize: '100.00' },
    ];
    const manager = {
      find: vi.fn()
        .mockResolvedValueOnce(members)
        .mockResolvedValueOnce([{ member: { id: 1 } }]),
      create: vi.fn((_entity, values) => values),
      save: vi.fn((_entity, values) => values),
    };
    const dataSource = { transaction: vi.fn(async (callback) => callback(manager)) };
    const service = new BillingService({ find: vi.fn() } as never, dataSource as never);

    const result = await service.generateMonthlyBilling({ billingMonth: '2026-11', rate: '5' });

    expect(result.skippedExisting).toBe(1);
    expect(result.created).toBe(1);
    expect(manager.save).toHaveBeenCalledWith(expect.anything(), [
      expect.objectContaining({ amount: '500.00' }),
    ]);
  });

  it('rejects invalid billing months and rates', async () => {
    const service = new BillingService({ find: vi.fn() } as never, {} as never);

    await expect(service.generateMonthlyBilling({ billingMonth: 'November 2026', rate: '5' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.generateMonthlyBilling({ billingMonth: '2026-11', rate: '0' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
