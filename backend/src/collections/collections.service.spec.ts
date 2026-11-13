import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CollectionsService } from './collections.service.js';

describe('CollectionsService', () => {
  it('creates a collection linked to the exact member', async () => {
    const member = { id: 7, block: '1', lot: '1', registeredOwners: 'Sample Owner', principal: '1000.00', interest: '200.00', penalty: '50.00' };
    const collection = {
      id: 12,
      collectionDate: '2026-11-04',
      referenceNumber: 'OR-0001',
      amount: '1500.00',
      discountPercentage: '0.00',
      discountAmount: '0.00',
      netAmount: '1500.00',
      paymentCategory: 'Association dues',
      paymentType: 'Cash',
      remarks: null,
    };
    const membersRepository = {
      findOne: vi.fn().mockResolvedValue(member),
    };
    const collectionsRepository = {
      create: vi.fn().mockReturnValue(collection),
      save: vi.fn().mockResolvedValue(collection),
      findOne: vi.fn().mockResolvedValue(null),
    };
    const manager = {
      findOne: vi.fn().mockResolvedValue(member),
      save: vi.fn().mockResolvedValue(collection),
      create: vi.fn().mockImplementation((_entity, values) => values),
    };
    const dataSource = { transaction: vi.fn(async (callback) => callback(manager)) };
    const service = new CollectionsService(collectionsRepository as never, membersRepository as never, dataSource as never);

    const result = await service.createCollection({
      blockLot: '1/1',
      collectionDate: '2026-11-04',
      referenceNumber: 'OR-0001',
      amount: '1500',
      paymentCategory: 'Association dues',
      paymentType: 'Cash',
    });

    expect(membersRepository.findOne).toHaveBeenCalledWith({ where: { block: '1', lot: '1' } });
    expect(manager.create).toHaveBeenCalledWith(expect.anything(), {
      member,
      collectionDate: '2026-11-04',
      referenceNumber: 'OR-0001',
      amount: '1500.00',
      discountPercentage: '0.00',
      discountAmount: '0.00',
      netAmount: '1500.00',
      appliedPenalty: '50.00',
      appliedInterest: '200.00',
      appliedPrincipal: '1250.00',
      paymentCategory: 'Association dues',
      paymentType: 'Cash',
      remarks: null,
    });
    expect(result.member).toEqual({ id: 7, block: '1', lot: '1', registeredOwners: 'Sample Owner' });
  });

  it('rejects a collection when the member does not exist', async () => {
    const membersRepository = { findOne: vi.fn().mockResolvedValue(null) };
    const collectionsRepository = { create: vi.fn(), save: vi.fn(), findOne: vi.fn().mockResolvedValue(null) };
    const service = new CollectionsService(collectionsRepository as never, membersRepository as never, undefined as never);

    await expect(
      service.createCollection({
        blockLot: '9/9',
        collectionDate: '2026-11-04',
        referenceNumber: 'OR-0009',
        amount: '100',
        paymentCategory: 'Association dues',
        paymentType: 'Cash',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid amounts before querying the member', async () => {
    const membersRepository = { findOne: vi.fn() };
    const collectionsRepository = { create: vi.fn(), save: vi.fn(), findOne: vi.fn().mockResolvedValue(null) };
    const service = new CollectionsService(collectionsRepository as never, membersRepository as never, undefined as never);

    await expect(
      service.createCollection({
        blockLot: '1/1',
        collectionDate: '2026-11-04',
        referenceNumber: 'OR-0001',
        amount: '-1',
        paymentCategory: 'Association dues',
        paymentType: 'Cash',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(membersRepository.findOne).not.toHaveBeenCalled();
  });
});
